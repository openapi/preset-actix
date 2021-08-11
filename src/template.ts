import * as changeCase from 'change-case';
import { status } from 'openapi';

// language=Rust
export const HeaderExtractor = `
#[derive(Debug, Clone, ::serde::Serialize)]
struct ParseHeaderError {
  error: String,
  message: String,
}

fn extract_header(req: &::actix_web::HttpRequest, name: ::std::string::String) -> ::std::result::Result<::std::string::String, ParseHeaderError> {
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
  // language=Rust
  return `
pub struct ${name}(pub String);

impl ::actix_web::FromRequest for ${name} {
    type Config = ();
    type Error = ::actix_web::Error;
    type Future = ::futures::future::Ready<::std::result::Result<Self, Self::Error>>;

    #[inline]
    fn from_request(req: &::actix_web::HttpRequest, _: &mut ::actix_web::dev::Payload) -> Self::Future {
        match extract_header(&req, "${header}".to_string()) {
            Ok(value) => ::futures::future::ok(${name}(value)),
            Err(reason) => match ::serde_json::to_string(&reason) {
                Ok(json) => ::futures::future::err(::actix_web::error::ErrorBadRequest(json)),
                Err(error) => {
                    ::futures::future::err(::actix_web::error::ErrorInternalServerError(error))
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
    api: ::actix_swagger::Api,
}

pub fn create() -> ${struct} {
    ${struct} { api: ::actix_swagger::Api::new() }
}

impl ::actix_web::dev::HttpServiceFactory for ${struct} {
    fn register(self, config: &mut ::actix_web::dev::AppService) {
        self.api.register(config);
    }
}

${impl(struct, methods)}
`;
}

export function pathBind(operationId: string, path: string, method: string): string {
  const snake = changeCase.snakeCase(operationId);

  // language=Rust
  return `
pub fn bind_${snake}<F, T, R>(mut self, handler: F) -> Self
where
    F: ::actix_web::dev::Handler<T, R>,
    T: ::actix_web::FromRequest + 'static,
    R: ::std::future::Future<
            Output = ::std::result::Result<
                super::paths::${snake}::Response,
                super::paths::${snake}::Error,
            >,
        > + 'static,
{
    self.api = self
        .api
        .bind("${path}".to_owned(), ::actix_swagger::Method::${method.toUpperCase()}, handler);
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

  const okVariants = variants.filter(({ code }) => code >= 200 && code < 400);
  const errVariants = variants.filter(({ code }) => code >= 400 && code < 700);

  const responseVariants = okVariants
    .map((variant) => {
      const content = variant.contentType ? `(responses::${variant.name})` : '';
      const name = changeCase.pascalCase(variant.upper);
      return `${name}${content}`;
    })
    .join(',\n');

  const responseMatchers = okVariants
    .map((variant) => {
      // Response::Ok(r) => HttpResponse::build(StatusCode::OK).json(r),
      // Response::Ok => HttpResponse::build(StatusCode::OK).finish(),
      const hasContent = Boolean(variant.contentType);

      const tpl = hasContent
        ? 'Response::<Status>(body) => ::actix_web::HttpResponse::build(StatusCode::<STATUS>).json(body)'
        : 'Response::<Status> => ::actix_web::HttpResponse::build(StatusCode::<STATUS>).finish()';

      return tpl
        .replace('<Status>', changeCase.pascalCase(variant.upper))
        .replace('<STATUS>', variant.upper);
    })
    .join(',\n');

  const errorVariants = errVariants
    .map((variant) => {
      const content = variant.contentType
        ? `responses::${variant.name}`
        : `#[serde(skip)] ::eyre::Report`;
      const isTransparent = variant.contentType || variant.code === 500;
      const errorDerive = isTransparent
        ? `#[error(transparent)]\n`
        : `#[error("${changeCase.sentenceCase(variant.name)}")]\n`;
      const name = changeCase.pascalCase(variant.upper);
      const inference = variant.code === 500 ? 'from' : 'source'; // to handle `error?;`
      return `${errorDerive}${name}(#[${inference}] ${content})`;
    })
    .join(',\n');

  const errorStatusMatchers = errVariants
    .map((variant) => {
      const name = changeCase.pascalCase(variant.upper);
      return `Self::${name}(_) => StatusCode::${variant.upper}`;
    })
    .join(',\n');

  const contentTypeMatcher = errVariants
    .map((variant) => {
      const content = variant.contentType ? `Some(ContentType::Json)` : 'None';
      const name = changeCase.pascalCase(variant.upper);
      return `Self::${name}(_) => ${content}`;
    })
    .join(',\n');

  const specialization =
    errVariants.length === 1 && errVariants[0].code === 500
      ? ''
      : // language=Rust
        `
fn error_response(&self) -> ::actix_web::HttpResponse {
    let content_type = match self {
        ${tabulate(contentTypeMatcher, 2, true)}
    };
    
    let mut res = &mut ::actix_web::HttpResponse::build(self.status_code());
    if let Some(content_type) = content_type {
        res = res.content_type(content_type.to_string());

        match content_type {
            ContentType::Json => res.json(self),
            ContentType::FormData => res.body(serde_plain::to_string(self).unwrap()),
        }
    } else {
        ::actix_web::HttpResponse::InternalServerError().finish()
    }
}`.trim();

  // language=Rust
  return `
pub mod ${moduleName} {
    use super::responses;
    use ::actix_swagger::ContentType;
    use ::actix_web::http::StatusCode;

    #[derive(Debug, ::serde::Serialize)]
    #[serde(untagged)]
    pub enum Response { 
        ${tabulate(responseVariants, 2, true)}
    }
    
    impl ::actix_web::Responder for Response {
        fn respond_to(self, _: &::actix_web::HttpRequest) -> ::actix_web::HttpResponse {
            match self { 
                ${tabulate(responseMatchers, 4, true)}
            }
        }
    }

    #[derive(Debug, ::serde::Serialize, ::thiserror::Error)]
    #[serde(untagged)]
    pub enum Error {
        ${tabulate(errorVariants, 2, true)}
    }
    
    impl ::actix_web::ResponseError for Error {
        fn status_code(&self) -> StatusCode {
            match self { 
                ${tabulate(errorStatusMatchers, 4, true)}
            }
        }
        ${specialization ? tabulate(specialization, 2, true) : ''}
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

// language=Rust
export const SchemasExtra = `use serde::{Deserialize, Serialize};
`;

export const DeriveSerde = `#[derive(Debug, Serialize, Deserialize)]`;
// language=Rust
export const UseParentComponents = `use super::super::components;
`;

export function struct(
  name: string,
  fields: Map<string, { content: string; skipSerialize: boolean }>,
  derive = '',
) {
  const structName = changeCase.pascalCase(name);
  const lines = [];
  for (const [property, { content: type, skipSerialize }] of fields.entries()) {
    const snakeName = changeCase.snakeCase(property);
    if (snakeName !== property) {
      lines.push(`#[serde(rename = "${property}")]`);
    }
    if (skipSerialize) {
      lines.push(`#[serde(skip_serializing_if = "::std::option::Option::is_none")]`);
    }
    lines.push(`pub ${snakeName}: ${type},\n`);
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
    lines.push(`${pascalName},\n`);
  }

  return `
${derive}
pub enum ${enumName} {
${lines.map((i) => tabulate(i)).join('\n')}
}
`;
}

export function vec(itemsType: string) {
  return `::std::vec::Vec<${itemsType}>`;
}

export function pubType(name: string, contentType: string) {
  const typeName = changeCase.pascalCase(name);
  return `
pub type ${typeName} = ${contentType};
 `;
}

export function webJson(path: string) {
  return `::actix_web::web::Json<${path}>`;
}

export function keyVal() {
  return `::std::collections::HashMap<::std::string::String, ::serde_json::value::Value>`;
}

export function typeToRust(type: string, format?: string, nullable = false): string {
  if (nullable) return `::std::option::Option<${typeToRust(type, format)}>`;

  switch (type) {
    case 'integer':
      switch (format) {
        case 'int32':
          return 'i32';
        case 'int64':
          return 'i64';
        default:
          return 'i32';
      }
    case 'number':
      switch (format) {
        case 'float':
          return 'f32';
        case 'double':
          return 'f64';
        default:
          return 'f32';
      }
    case 'string':
      switch (format) {
        case 'date':
          return '::chrono::Date<::chrono::Utc>';
        case 'date-time':
          return '::chrono::DateTime<::chrono::Utc>';
        case 'uuid':
          return '::uuid::Uuid';
        case 'byte':
          return '::std::string::String';
        case 'binary':
          return '::std::vec::Vec<u8>';
        default:
          return '::std::string::String';
      }
    case 'boolean':
      return 'bool';
  }
  return '::serde_json::value::Value';
}

function tabulate(content: string, count = 1, noFirst = false): string {
  const prefix = Array.from({ length: count }, () => `    `).join('');
  const prefixed = content.replace(/^./gm, (s) => `${prefix}${s}`);
  if (noFirst) {
    return prefixed.trimStart();
  }
  return prefixed;
}
