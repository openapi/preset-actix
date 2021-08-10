import { FilesApi, Method, PresetConstructor, status } from 'openapi';
import { OpenAPIV3 } from 'openapi-types';
import * as changeCase from 'change-case';

interface Options {
  fileName?: string;
}

class Components {
  private extras = new Set<string>();
  private components = new Map<string, string>();

  addExtra(extra: string) {
    this.extras.add(extra);
  }

  addComponent(name: string, component: string) {
    this.components.set(name, component);
  }

  hasItems() {
    return this.components.size !== 0;
  }

  build(): string {
    return [...this.extras, ...this.components.values()].join('');
  }
}

const preset: PresetConstructor<Options> = ({ fileName = 'generated.rs' } = {}, internal) => {
  const parameters = new Components();
  const schemas = new Components();

  function addHeader(name: string, header: string) {
    parameters.addExtra(HeaderExtractor);
    const struct = changeCase.pascalCase(name);
    parameters.addComponent(struct, headerStructure(struct, header));
  }

  function traverseSchema(name: string, schema: OpenAPIV3.SchemaObject): string {
    schemas.addExtra(SchemasExtra);

    if (isSchemaArray(schema)) {
      schemas.addExtra(UseParentComponents);
      const itemsType = internal.isRef(schema.items)
        ? refToRust(schema.items.$ref)
        : traverseSchema(`${name}_Item`, schema.items);

      schemas.addComponent(name, vec(name, itemsType));
    } else if (isSchemaNonArray(schema)) {
      let component = '';

      if (schema.type === 'string' && schema.enum) {
        component = enumeration(
          name,
          new Set(schema.enum),
          '#[derive(Debug, Serialize, Deserialize)]',
        );
      } else if (schema.type === 'object' && schema.properties) {
        const fields = new Map<string, string>();
        for (const [propName, type] of Object.entries(schema.properties)) {
          const optional = schema.required?.includes(propName) ?? false;
          const realType = internal.isRef(type)
            ? (schemas.addExtra(UseParentComponents), refToRust(type.$ref))
            : traverseSchema(`${name}_${propName}`, type);
          const content = optional ? `Option<${realType}>` : realType;

          fields.set(name, content);
        }
        component = struct(name, fields, DeriveSerde);
      } else {
        return typeToRust(schema.type ?? 'object');
      }

      schemas.addComponent(name, component);
    }
    return `components::schemas::${changeCase.pascalCase(name)}`;
  }

  const apiPaths = new Map<string, { api: string; path: string }>();

  return {
    name: 'openapi-preset-actix',

    onParameter(name: string, parameter: OpenAPIV3.ParameterObject) {
      if (parameter.in === 'header') {
        addHeader(name, parameter.name);
      }
    },

    onSchema(name: string, schema: OpenAPIV3.SchemaObject) {
      traverseSchema(name, schema);
    },

    onOperation(pattern: string, method: Method, operation: OpenAPIV3.OperationObject) {
      const operationId = operation.operationId ?? pattern;
      const moduleName = changeCase.snakeCase(operationId);

      const responses = Object.entries(operation.responses ?? {}).map(([code, refOrResponse]) => {
        const response = internal.isRef(refOrResponse)
          ? (internal.resolveRef(refOrResponse.$ref) as OpenAPIV3.ResponseObject)
          : refOrResponse;

        const name = internal.isRef(refOrResponse)
          ? refOrResponse.$ref.split('/').pop()!
          : `${changeCase.pascalCase(operationId)}${changeCase.pascalCase(
              status[Number(code) as keyof typeof status]?.code ?? code,
            )}`;
        const contentType = response.content?.['application/json'] ? 'json' : undefined;

        return { code: parseInt(code, 10), contentType, name };
      });

      apiPaths.set(moduleName, {
        api: pathBind(operationId, pattern, method),
        path: pathModule(operationId, responses),
      });
    },

    build(files: FilesApi) {
      const chunks = [];

      chunks.push(
        mod(
          'api',
          apiStruct(
            internal.root().info.title,
            Array.from(apiPaths.values())
              .map((a) => a.api)
              .join(''),
          ),
        ),
      );

      chunks.push(
        mod(
          'paths',
          'use super::components::responses;' +
            Array.from(apiPaths.values())
              .map((a) => a.path)
              .join(''),
        ),
      );

      const components = new Set<string>();

      if (parameters.hasItems()) {
        components.add(mod('parameters', parameters.build()));
      }

      if (true) {
        components.add(mod('responses', [].join('')));
      }

      if (true) {
        components.add(mod('request_bodies', [].join('')));
      }

      if (schemas.hasItems()) {
        components.add(mod('schemas', schemas.build()));
      }

      if (components.size) {
        chunks.push(mod('components', Array.from(components).join('')));
      }

      files.addFile(
        fileName,
        '/// File auto generated by npmjs.com/actix-openapi-preset' + chunks.join(''),
      );
    },
  };
};

const HeaderExtractor = `
#[derive(Debug, Clone, serde::Serialize)]
struct ParseHeaderError {
  error: String,
  message: String,
}

fn extract_header(req: &actix_web::HttpRequest, name: String) -> Result<String, ParseHeaderError> {
  let header_error = ParseHeaderError {
      error: "header_required".to_string(),
      message: format!("header '{}' is required", name),
  };

  let header = req.headers().get(name).ok_or(header_error.clone())?;
  let value = header.to_str().map_err(|_| header_error)?.to_string();
  Ok(value)
}
`;

function headerStructure(name: string, header: string): string {
  return `
pub struct ${name}(pub String);

impl actix_web::FromRequest for ${name} {
    type Config = ();
    type Error = actix_web::Error;
    type Future = futures::future::Ready<Result<Self, Self::Error>>;

    #[inline]
    fn from_request(req: &actix_web::HttpRequest, _: &mut actix_web::dev::Payload) -> Self::Future {
        match extract_header(&req, "${header}".to_string()) {
            Ok(value) => futures::future::ok(${name}(value)),
            Err(reason) => match serde_json::to_string(&reason) {
                Ok(json) => futures::future::err(actix_web::error::ErrorBadRequest(json)),
                Err(error) => {
                    futures::future::err(actix_web::error::ErrorInternalServerError(error))
                }
            },
        }
    }
}
`;
}

function apiStruct(apiName: string, methods: string): string {
  const struct = changeCase.pascalCase(apiName);
  return `
pub struct ${struct} {
    api: actix_swagger::Api,
}

pub fn create() -> ${struct} {
    ${struct} { api: actix_swagger::Api::new() }
}

impl actix_web::dev::HttpServiceFactory for ${struct} {
    fn register(self, config: &mut actix_web::dev::AppService) {
        self.api.register(config);
    }
}

${impl(struct, methods)}
`;
}

function pathBind(operationId: string, path: string, method: string): string {
  const snake = changeCase.snakeCase(operationId);
  return `
pub fn bind_${snake}<F, T, R>(mut self, handler: F) -> Self
where
    F: actix_web::dev::Factory<T, R, actix_swagger::Answer<'static, super::paths::${snake}::Response>>,
    T: actix_web::FromRequest + 'static,
    R: std::future::Future<Output = actix_swagger::Answer<'static, super::paths::${snake}::Response>>
        + 'static,
{
    self.api = self
        .api
        .bind("${path}".to_owned(), actix_swagger::Method::${method.toUpperCase()}, handler);
    self
}
`;
}

function pathModule(
  operationId: string,
  responses: Array<{ code: number; contentType: string | void; name: string }>,
): string {
  const moduleName = changeCase.snakeCase(operationId);

  const variants = Object.values(responses)
    .filter((variant) => (status as any)[variant.code])
    .map(({ code, contentType, name }) => {
      const { label, code: upper } = (status as any)[code];
      return { upper, label, code, contentType, name };
    });

  const enumVariants = variants
    .map((variant) => {
      const content = variant.contentType ? `(responses::${variant.name})` : '';
      const name = changeCase.pascalCase(variant.upper);
      return `${name}${content}`;
    })
    .join(',\n');

  const statusMatchers = variants
    .map((variant) => {
      const matcher = variant.contentType ? `(_)` : '';
      const name = changeCase.pascalCase(variant.upper);
      return `Self::${name}${matcher} => StatusCode::${variant.upper}`;
    })
    .join(',\n');

  const contentTypeMatcher = variants
    .map((variant) => {
      const matcher = variant.contentType ? `(_)` : '';
      const content = variant.contentType ? `Some(ContentType::Json)` : 'None';
      const name = changeCase.pascalCase(variant.upper);
      return `Self::${name}${matcher} => ${content}`;
    })
    .join(',\n');

  return `
pub mod ${moduleName} {
    use super::responses;
    use actix_swagger::ContentType;
    use actix_web::http::StatusCode;
    use serde::Serialize;

    pub type Answer = actix_swagger::Answer<'static, Response>;

    #[derive(Debug, Serialize)]
    #[serde(untagged)]
    pub enum Response {
${tabulate(enumVariants, 2)}
    }

    impl Response {
        #[inline]
        pub fn answer<'a>(self) -> actix_swagger::Answer<'a, Self> {
            let status = match self {
${tabulate(statusMatchers, 4)}
            };

            let content_type = match self {
${tabulate(contentTypeMatcher, 4)}
            };

            actix_swagger::Answer::new(self)
                .status(status)
                .content_type(content_type)
        }
    }
}
`;
}

function mod(name: string, children: string): string {
  return `
pub mod ${name} {
${tabulate(children)}
}
`;
}

function impl(struct: string, children: string): string {
  return `
impl ${struct} {
${tabulate(children)}
}
`;
}

const SchemasExtra = `use serde::{Deserialize, Serialize};
`;

const DeriveSerde = `#[derive(Debug, Serialize, Deserialize)]`;
const UseParentComponents = `use super as components;
`;

function struct(name: string, fields: Map<string, string>, derive = '') {
  const structName = changeCase.pascalCase(name);
  const lines = [];
  for (const [property, type] of fields.entries()) {
    const snakeName = changeCase.snakeCase(property);
    if (snakeName !== property) {
      lines.push(`#[serde(rename = "${property}")]`);
    }
    lines.push(`pub ${snakeName}: ${type},`);
  }
  return `
${derive}
pub struct ${structName} {
${lines.map((i) => tabulate(i)).join('\n')}
}
`;
}

function enumeration(name: string, variants: Set<string>, derive = ''): string {
  const enumName = changeCase.pascalCase(name);
  const lines = [];

  for (const variant of variants) {
    const pascalName = changeCase.pascalCase(variant);
    if (pascalName !== variant) {
      lines.push(`#[serde(rename = "${variant}")]`);
    }
    lines.push(`${pascalName},`);
  }

  return `
${derive}
pub enum ${enumName} {
${lines.map((i) => tabulate(i)).join('\n')}
}
`;
}

function vec(name: string, itemsType: string) {
  const typeName = changeCase.pascalCase(name);
  return `
pub type ${typeName} = std::vec::Vec<${itemsType}>;
`;
}

function typeToRust(type: string): string {
  return type;
}

function tabulate(content: string, count = 1): string {
  const prefix = Array.from({ length: count }, () => `    `).join('');
  return content.replace(/^./gm, (s) => `${prefix}${s}`);
}

module.exports = preset;

function isSchemaArray(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.ArraySchemaObject {
  return schema.type === 'array' || (schema as any)['items'];
}

function isSchemaNonArray(
  schema: OpenAPIV3.SchemaObject,
): schema is OpenAPIV3.NonArraySchemaObject {
  return schema.type !== 'array' || !schema['items'];
}

function refToRust(ref: string): string {
  if (ref[0] !== '#') {
    throw new TypeError('Non local references does not supported inside openapi');
  }
  const path = ref.replace('#', '').replace(/^\//, '').replace(/\//gi, '::');
  return `${path}`;
}
