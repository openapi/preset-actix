import { PresetConstructor, status } from 'openapi';
import { OpenAPIV3 } from 'openapi-types';
import * as changeCase from 'change-case';

interface Options {
  fileName?: string;
}

const preset: PresetConstructor<Options> = ({ fileName = 'generated.rs' } = {}, internal) => {
  const parametersExtras = new Set<string>();
  const parameters = new Map<string, string>();

  function addHeader(name: string, header: string) {
    parametersExtras.add(HeaderExtractor);
    const struct = changeCase.pascalCase(name);
    parameters.set(struct, headerStructure(struct, header));
  }

  const apiPaths = new Map<string, { api: string; path: string }>();

  return {
    name: 'actix-openapi-preset',

    onParameter(name, parameter) {
      if (parameter.in === 'header') {
        addHeader(name, parameter.name);
      }
    },

    onOperation(pattern, method, operation) {
      const moduleName = changeCase.snakeCase(operation.operationId);
      apiPaths.set(moduleName, {
        api: pathBind(operation.operationId, pattern, method),
        path: pathModule(
          operation.operationId,
          Object.entries(operation.responses).map(([code, refOrResponse]) => {
            const response = internal.isRef(refOrResponse)
              ? (internal.resolveRef(refOrResponse.$ref) as OpenAPIV3.ResponseObject)
              : refOrResponse;

            const name = internal.isRef(refOrResponse)
              ? refOrResponse.$ref.split('/').pop()
              : `${changeCase.pascalCase(operation.operationId)}${changeCase.pascalCase(
                  status[code]?.code ?? code,
                )}`;
            const contentType = response.content?.['application/json'] ? 'json' : undefined;

            return { code: parseInt(code, 10), contentType, name };
          }),
        ),
      });
    },

    build(files) {
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

      const components = [];
      if (parameters.size) {
        components.push(mod('parameters', [...parametersExtras, ...parameters.values()].join('')));
      }

      if (components.length) {
        chunks.push(mod('components', components.join('\n')));
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
    .filter((variant) => status[variant.code])
    .map(({ code, contentType, name }) => {
      const { label, code: upper } = status[code];
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

function tabulate(content: string, count = 1): string {
  const prefix = Array.from({ length: count }, () => `    `).join('');
  return content.replace(/^./gm, (s) => `${prefix}${s}`);
}

module.exports = preset;
