/// File auto generated by npmjs.com/openapi-preset-actix
pub mod api {

    pub struct AccessoAppInternalApi {
        api: ::actix_swagger::Api,
    }

    pub fn create() -> AccessoAppInternalApi {
        AccessoAppInternalApi { api: ::actix_swagger::Api::new() }
    }

    impl ::actix_web::dev::HttpServiceFactory for AccessoAppInternalApi {
        fn register(self, config: &mut ::actix_web::dev::AppService) {
            self.api.register(config);
        }
    }


    impl AccessoAppInternalApi {

        pub fn bind_oauth_authorize_request<F, T, R>(mut self, handler: F) -> Self
        where
            F: ::actix_web::dev::Handler<T, R>,
            T: ::actix_web::FromRequest + 'static,
            R: ::std::future::Future<
                    Output = ::std::result::Result<
                        super::paths::oauth_authorize_request::Response,
                        super::paths::oauth_authorize_request::Error,
                    >,
                > + 'static,
        {
            self.api = self
                .api
                .bind("/oauth/authorize".to_owned(), ::actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_access_recovery_send_email<F, T, R>(mut self, handler: F) -> Self
        where
            F: ::actix_web::dev::Handler<T, R>,
            T: ::actix_web::FromRequest + 'static,
            R: ::std::future::Future<
                    Output = ::std::result::Result<
                        super::paths::access_recovery_send_email::Response,
                        super::paths::access_recovery_send_email::Error,
                    >,
                > + 'static,
        {
            self.api = self
                .api
                .bind("/access-recovery/send-email".to_owned(), ::actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_access_recovery_set_password<F, T, R>(mut self, handler: F) -> Self
        where
            F: ::actix_web::dev::Handler<T, R>,
            T: ::actix_web::FromRequest + 'static,
            R: ::std::future::Future<
                    Output = ::std::result::Result<
                        super::paths::access_recovery_set_password::Response,
                        super::paths::access_recovery_set_password::Error,
                    >,
                > + 'static,
        {
            self.api = self
                .api
                .bind("/access-recovery/set-password".to_owned(), ::actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_register_request<F, T, R>(mut self, handler: F) -> Self
        where
            F: ::actix_web::dev::Handler<T, R>,
            T: ::actix_web::FromRequest + 'static,
            R: ::std::future::Future<
                    Output = ::std::result::Result<
                        super::paths::register_request::Response,
                        super::paths::register_request::Error,
                    >,
                > + 'static,
        {
            self.api = self
                .api
                .bind("/register/request".to_owned(), ::actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_register_confirmation<F, T, R>(mut self, handler: F) -> Self
        where
            F: ::actix_web::dev::Handler<T, R>,
            T: ::actix_web::FromRequest + 'static,
            R: ::std::future::Future<
                    Output = ::std::result::Result<
                        super::paths::register_confirmation::Response,
                        super::paths::register_confirmation::Error,
                    >,
                > + 'static,
        {
            self.api = self
                .api
                .bind("/register/confirmation".to_owned(), ::actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_session_create<F, T, R>(mut self, handler: F) -> Self
        where
            F: ::actix_web::dev::Handler<T, R>,
            T: ::actix_web::FromRequest + 'static,
            R: ::std::future::Future<
                    Output = ::std::result::Result<
                        super::paths::session_create::Response,
                        super::paths::session_create::Error,
                    >,
                > + 'static,
        {
            self.api = self
                .api
                .bind("/session/create".to_owned(), ::actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_session_get<F, T, R>(mut self, handler: F) -> Self
        where
            F: ::actix_web::dev::Handler<T, R>,
            T: ::actix_web::FromRequest + 'static,
            R: ::std::future::Future<
                    Output = ::std::result::Result<
                        super::paths::session_get::Response,
                        super::paths::session_get::Error,
                    >,
                > + 'static,
        {
            self.api = self
                .api
                .bind("/session/get".to_owned(), ::actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_session_delete<F, T, R>(mut self, handler: F) -> Self
        where
            F: ::actix_web::dev::Handler<T, R>,
            T: ::actix_web::FromRequest + 'static,
            R: ::std::future::Future<
                    Output = ::std::result::Result<
                        super::paths::session_delete::Response,
                        super::paths::session_delete::Error,
                    >,
                > + 'static,
        {
            self.api = self
                .api
                .bind("/session/delete".to_owned(), ::actix_swagger::Method::POST, handler);
            self
        }

    }


}

pub mod paths {
    use super::components::responses;
    pub mod oauth_authorize_request {
        use super::responses;
        use ::actix_swagger::ContentType;
        use ::actix_web::http::StatusCode;

        #[derive(Debug, ::serde::Serialize)]
        #[serde(untagged)]
        pub enum Response { 
            Ok(responses::OAuthAuthorizeDone)
        }
        
        impl ::actix_web::Responder for Response {
            fn respond_to(self, _: &::actix_web::HttpRequest) -> ::actix_web::HttpResponse {
                match self { 
                    Response::Ok(body) => ::actix_web::HttpResponse::build(StatusCode::OK).json(body)
                }
            }
        }

        #[derive(Debug, ::serde::Serialize, ::thiserror::Error)]
        pub enum Error {
            BadRequest(#[source] responses::OAuthAuthorizeRequestFailure),
            InternalServerError(#[from] #[serde(skip)] ::eyre::Report)
        }
        
        impl ::actix_web::ResponseError for Error {
            fn status_code(&self) -> StatusCode {
                match self { 
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                }
            }
            fn error_response(&self) -> ::actix_web::HttpResponse {
                let content_type = match self {
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
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
            }
        }
    }

    pub mod access_recovery_send_email {
        use super::responses;
        use ::actix_swagger::ContentType;
        use ::actix_web::http::StatusCode;

        #[derive(Debug, ::serde::Serialize)]
        #[serde(untagged)]
        pub enum Response { 
            Ok
        }
        
        impl ::actix_web::Responder for Response {
            fn respond_to(self, _: &::actix_web::HttpRequest) -> ::actix_web::HttpResponse {
                match self { 
                    Response::Ok => ::actix_web::HttpResponse::build(StatusCode::OK).finish()
                }
            }
        }

        #[derive(Debug, ::serde::Serialize, ::thiserror::Error)]
        pub enum Error {
            BadRequest(#[source] responses::AccessRecoverySendEmailFailure),
            InternalServerError(#[from] #[serde(skip)] ::eyre::Report)
        }
        
        impl ::actix_web::ResponseError for Error {
            fn status_code(&self) -> StatusCode {
                match self { 
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                }
            }
            fn error_response(&self) -> ::actix_web::HttpResponse {
                let content_type = match self {
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
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
            }
        }
    }

    pub mod access_recovery_set_password {
        use super::responses;
        use ::actix_swagger::ContentType;
        use ::actix_web::http::StatusCode;

        #[derive(Debug, ::serde::Serialize)]
        #[serde(untagged)]
        pub enum Response { 
            Ok
        }
        
        impl ::actix_web::Responder for Response {
            fn respond_to(self, _: &::actix_web::HttpRequest) -> ::actix_web::HttpResponse {
                match self { 
                    Response::Ok => ::actix_web::HttpResponse::build(StatusCode::OK).finish()
                }
            }
        }

        #[derive(Debug, ::serde::Serialize, ::thiserror::Error)]
        pub enum Error {
            BadRequest(#[source] responses::AccessRecoverySetPasswordFailure),
            InternalServerError(#[from] #[serde(skip)] ::eyre::Report)
        }
        
        impl ::actix_web::ResponseError for Error {
            fn status_code(&self) -> StatusCode {
                match self { 
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                }
            }
            fn error_response(&self) -> ::actix_web::HttpResponse {
                let content_type = match self {
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
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
            }
        }
    }

    pub mod register_request {
        use super::responses;
        use ::actix_swagger::ContentType;
        use ::actix_web::http::StatusCode;

        #[derive(Debug, ::serde::Serialize)]
        #[serde(untagged)]
        pub enum Response { 
            Created(responses::RegistrationRequestCreated)
        }
        
        impl ::actix_web::Responder for Response {
            fn respond_to(self, _: &::actix_web::HttpRequest) -> ::actix_web::HttpResponse {
                match self { 
                    Response::Created(body) => ::actix_web::HttpResponse::build(StatusCode::CREATED).json(body)
                }
            }
        }

        #[derive(Debug, ::serde::Serialize, ::thiserror::Error)]
        pub enum Error {
            BadRequest(#[source] responses::RegisterFailed),
            InternalServerError(#[from] #[serde(skip)] ::eyre::Report)
        }
        
        impl ::actix_web::ResponseError for Error {
            fn status_code(&self) -> StatusCode {
                match self { 
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                }
            }
            fn error_response(&self) -> ::actix_web::HttpResponse {
                let content_type = match self {
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
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
            }
        }
    }

    pub mod register_confirmation {
        use super::responses;
        use ::actix_swagger::ContentType;
        use ::actix_web::http::StatusCode;

        #[derive(Debug, ::serde::Serialize)]
        #[serde(untagged)]
        pub enum Response { 
            Created
        }
        
        impl ::actix_web::Responder for Response {
            fn respond_to(self, _: &::actix_web::HttpRequest) -> ::actix_web::HttpResponse {
                match self { 
                    Response::Created => ::actix_web::HttpResponse::build(StatusCode::CREATED).finish()
                }
            }
        }

        #[derive(Debug, ::serde::Serialize, ::thiserror::Error)]
        pub enum Error {
            BadRequest(#[source] responses::RegisterConfirmationFailed),
            InternalServerError(#[from] #[serde(skip)] ::eyre::Report)
        }
        
        impl ::actix_web::ResponseError for Error {
            fn status_code(&self) -> StatusCode {
                match self { 
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                }
            }
            fn error_response(&self) -> ::actix_web::HttpResponse {
                let content_type = match self {
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
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
            }
        }
    }

    pub mod session_create {
        use super::responses;
        use ::actix_swagger::ContentType;
        use ::actix_web::http::StatusCode;

        #[derive(Debug, ::serde::Serialize)]
        #[serde(untagged)]
        pub enum Response { 
            Created(responses::SessionCreateSucceeded)
        }
        
        impl ::actix_web::Responder for Response {
            fn respond_to(self, _: &::actix_web::HttpRequest) -> ::actix_web::HttpResponse {
                match self { 
                    Response::Created(body) => ::actix_web::HttpResponse::build(StatusCode::CREATED).json(body)
                }
            }
        }

        #[derive(Debug, ::serde::Serialize, ::thiserror::Error)]
        pub enum Error {
            BadRequest(#[source] responses::SessionCreateFailed),
            InternalServerError(#[from] #[serde(skip)] ::eyre::Report)
        }
        
        impl ::actix_web::ResponseError for Error {
            fn status_code(&self) -> StatusCode {
                match self { 
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                }
            }
            fn error_response(&self) -> ::actix_web::HttpResponse {
                let content_type = match self {
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
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
            }
        }
    }

    pub mod session_get {
        use super::responses;
        use ::actix_swagger::ContentType;
        use ::actix_web::http::StatusCode;

        #[derive(Debug, ::serde::Serialize)]
        #[serde(untagged)]
        pub enum Response { 
            Ok(responses::SessionGetSuccess)
        }
        
        impl ::actix_web::Responder for Response {
            fn respond_to(self, _: &::actix_web::HttpRequest) -> ::actix_web::HttpResponse {
                match self { 
                    Response::Ok(body) => ::actix_web::HttpResponse::build(StatusCode::OK).json(body)
                }
            }
        }

        #[derive(Debug, ::serde::Serialize, ::thiserror::Error)]
        pub enum Error {
            InternalServerError(#[from] #[serde(skip)] ::eyre::Report)
        }
        
        impl ::actix_web::ResponseError for Error {
            fn status_code(&self) -> StatusCode {
                match self { 
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                }
            }
            
        }
    }

    pub mod session_delete {
        use super::responses;
        use ::actix_swagger::ContentType;
        use ::actix_web::http::StatusCode;

        #[derive(Debug, ::serde::Serialize)]
        #[serde(untagged)]
        pub enum Response { 
            Ok
        }
        
        impl ::actix_web::Responder for Response {
            fn respond_to(self, _: &::actix_web::HttpRequest) -> ::actix_web::HttpResponse {
                match self { 
                    Response::Ok => ::actix_web::HttpResponse::build(StatusCode::OK).finish()
                }
            }
        }

        #[derive(Debug, ::serde::Serialize, ::thiserror::Error)]
        pub enum Error {
            BadRequest(#[source] responses::SessionDeleteFailure),
            Unauthorized(#[source] #[serde(skip)] ::eyre::Report),
            InternalServerError(#[from] #[serde(skip)] ::eyre::Report)
        }
        
        impl ::actix_web::ResponseError for Error {
            fn status_code(&self) -> StatusCode {
                match self { 
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::Unauthorized => StatusCode::UNAUTHORIZED,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                }
            }
            fn error_response(&self) -> ::actix_web::HttpResponse {
                let content_type = match self {
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::Unauthorized => None,
                    Self::InternalServerError => None
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
            }
        }
    }

}

pub mod components {

    pub mod responses {

    }

    pub mod request_bodies {
        use super::schemas as schemas;
        pub type OAuthAuthorize = ::actix_web::web::Json<schemas::OAuthAuthorizeRequestBody>;
         
        pub type Register = ::actix_web::web::Json<schemas::RegisterRequestBody>;
         
        pub type AccessRecoverySendEmail = ::actix_web::web::Json<schemas::AccessRecoverySendEmailRequestBody>;
         
        pub type AccessRecoverySetPassword = ::actix_web::web::Json<schemas::AccessRecoverySetPasswordRequestBody>;
         
        pub type RegisterConfirmation = ::actix_web::web::Json<schemas::RegisterConfirmationRequestBody>;
         
        pub type SessionCreate = ::actix_web::web::Json<schemas::SessionCreateRequestBody>;
         
        pub type SessionDelete = ::actix_web::web::Json<schemas::SessionDeleteRequestBody>;
         
    }

    pub mod schemas {
        use serde::{Deserialize, Serialize};
        use super as components;

        #[derive(Debug, Serialize, Deserialize)]
        pub enum OAuthAuthorizeRequestBodyResponseType {
            #[serde(rename = "code")]
            Code,

        }

        #[derive(Debug, Serialize, Deserialize)]
        pub struct OAuthAuthorizeRequestBody {
            #[serde(rename = "responseType")]
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub response_type: ::std::option::Option<components::schemas::OAuthAuthorizeRequestBodyResponseType>,

            #[serde(rename = "clientId")]
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub client_id: ::std::option::Option<::uuid::Uuid>,

            #[serde(rename = "redirectUri")]
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub redirect_uri: ::std::option::Option<::std::string::String>,

            pub scope: ::std::string::String,

            pub state: ::std::string::String,

        }

        #[derive(Debug, Serialize, Deserialize)]
        pub struct RegisterRequestBody {
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub email: ::std::option::Option<::std::string::String>,

        }

        #[derive(Debug, Serialize, Deserialize)]
        pub struct AccessRecoverySendEmailRequestBody {
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub email: ::std::option::Option<::std::string::String>,

        }

        #[derive(Debug, Serialize, Deserialize)]
        pub struct AccessRecoverySetPasswordRequestBody {
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub password: ::std::option::Option<::std::string::String>,

            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub code: ::std::option::Option<::std::string::String>,

        }

        #[derive(Debug, Serialize, Deserialize)]
        pub struct RegisterConfirmationRequestBody {
            #[serde(rename = "confirmationCode")]
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub confirmation_code: ::std::option::Option<::std::string::String>,

            #[serde(rename = "firstName")]
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub first_name: ::std::option::Option<::std::string::String>,

            #[serde(rename = "lastName")]
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub last_name: ::std::option::Option<::std::string::String>,

            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub password: ::std::option::Option<::std::string::String>,

        }

        #[derive(Debug, Serialize, Deserialize)]
        pub struct SessionCreateRequestBody {
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub email: ::std::option::Option<::std::string::String>,

            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub password: ::std::option::Option<::std::string::String>,

        }

        #[derive(Debug, Serialize, Deserialize)]
        pub struct SessionDeleteRequestBody {
            #[serde(rename = "deleteAllSessions")]
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub delete_all_sessions: ::std::option::Option<bool>,

        }

        pub type Demo = ::std::vec::Vec<components::schemas::SessionUser>;
         
        #[derive(Debug, Serialize, Deserialize)]
        pub enum AnotherEnum {
            #[serde(rename = "first")]
            First,

            #[serde(rename = "second")]
            Second,

            #[serde(rename = "another_way")]
            AnotherWay,

            #[serde(rename = "do_you_really_need_IT")]
            DoYouReallyNeedIt,

            RandomThing,

        }

        pub type Stringfy = ::std::string::String;
         
        pub type UidExampleYo = ::std::option::Option<::uuid::Uuid>;
         
        pub type NestIntoArray = ::std::vec::Vec<::std::option::Option<::uuid::Uuid>>;
         
        pub type NestedArraysItem = ::std::vec::Vec<::std::option::Option<::chrono::DateTime<::chrono::Utc>>>;
         
        pub type NestedArrays = ::std::vec::Vec<components::schemas::NestedArraysItem>;
         
        pub type Wonder = ::std::collections::HashMap<::std::string::String, ::serde_json::value::Value>;
         
        pub type DateIsIt = ::chrono::DateTime<::chrono::Utc>;
         
        pub type SessionUserList = ::std::vec::Vec<::std::string::String>;
         
        pub type SessionUserRefList = ::std::vec::Vec<components::schemas::SessionUser>;
         
        #[derive(Debug, Serialize, Deserialize)]
        pub enum SessionUserEnumeration {
            First,

            Second,

            #[serde(rename = "third")]
            Third,

            #[serde(rename = "the-latest")]
            TheLatest,

        }

        #[derive(Debug, Serialize, Deserialize)]
        pub struct SessionUser {
            #[serde(rename = "firstName")]
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub first_name: ::std::option::Option<::std::string::String>,

            #[serde(rename = "lastName")]
            #[serde(skip_serializing_if = "::std::option::Option::is_none")]
            pub last_name: ::std::option::Option<::std::string::String>,

            pub list: components::schemas::SessionUserList,

            #[serde(rename = "refList")]
            pub ref_list: components::schemas::SessionUserRefList,

            pub enumeration: components::schemas::SessionUserEnumeration,

        }

    }

}