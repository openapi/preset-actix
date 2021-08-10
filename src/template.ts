import * as changeCase from 'change-case';
import { status } from 'openapi';

export const HeaderExtractor = `
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

export function headerStructure(name: string, header: string): string {
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

export function apiStruct(apiName: string, methods: string): string {
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

export function pathBind(operationId: string, path: string, method: string): string {
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

export function pathModule(
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

export function mod(name: string, children: string): string {
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

export const SchemasExtra = `use serde::{Deserialize, Serialize};
`;
export const DeriveSerde = `#[derive(Debug, Serialize, Deserialize)]`;
export const UseParentComponents = `use super as components;
`;

export function struct(name: string, fields: Map<string, string>, derive = '') {
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

export function enumeration(name: string, variants: Set<string>, derive = ''): string {
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

export function vec(name: string, itemsType: string) {
  const typeName = changeCase.pascalCase(name);
  return `
pub type ${typeName} = std::vec::Vec<${itemsType}>;
`;
}

export function typeToRust(type: string): string {
  return type;
}

function tabulate(content: string, count = 1): string {
  const prefix = Array.from({ length: count }, () => `    `).join('');
  return content.replace(/^./gm, (s) => `${prefix}${s}`);
}
