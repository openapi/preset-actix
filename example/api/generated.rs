/// File auto generated by npmjs.com/actix-openapi-preset
pub mod api {

    pub struct AccessoAppInternalApi {
        api: actix_swagger::Api,
    }

    pub fn create() -> AccessoAppInternalApi {
        AccessoAppInternalApi { api: actix_swagger::Api::new() }
    }

    impl actix_web::dev::HttpServiceFactory for AccessoAppInternalApi {
        fn register(self, config: &mut actix_web::dev::AppService) {
            self.api.register(config);
        }
    }


    impl AccessoAppInternalApi {

        pub fn bind_oauth_authorize_request<F, T, R>(mut self, handler: F) -> Self
        where
            F: actix_web::dev::Factory<T, R, actix_swagger::Answer<'static, super::paths::oauth_authorize_request::Response>>,
            T: actix_web::FromRequest + 'static,
            R: std::future::Future<Output = actix_swagger::Answer<'static, super::paths::oauth_authorize_request::Response>>
                + 'static,
        {
            self.api = self
                .api
                .bind("/oauth/authorize".to_owned(), actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_access_recovery_send_email<F, T, R>(mut self, handler: F) -> Self
        where
            F: actix_web::dev::Factory<T, R, actix_swagger::Answer<'static, super::paths::access_recovery_send_email::Response>>,
            T: actix_web::FromRequest + 'static,
            R: std::future::Future<Output = actix_swagger::Answer<'static, super::paths::access_recovery_send_email::Response>>
                + 'static,
        {
            self.api = self
                .api
                .bind("/access-recovery/send-email".to_owned(), actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_access_recovery_set_password<F, T, R>(mut self, handler: F) -> Self
        where
            F: actix_web::dev::Factory<T, R, actix_swagger::Answer<'static, super::paths::access_recovery_set_password::Response>>,
            T: actix_web::FromRequest + 'static,
            R: std::future::Future<Output = actix_swagger::Answer<'static, super::paths::access_recovery_set_password::Response>>
                + 'static,
        {
            self.api = self
                .api
                .bind("/access-recovery/set-password".to_owned(), actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_register_request<F, T, R>(mut self, handler: F) -> Self
        where
            F: actix_web::dev::Factory<T, R, actix_swagger::Answer<'static, super::paths::register_request::Response>>,
            T: actix_web::FromRequest + 'static,
            R: std::future::Future<Output = actix_swagger::Answer<'static, super::paths::register_request::Response>>
                + 'static,
        {
            self.api = self
                .api
                .bind("/register/request".to_owned(), actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_register_confirmation<F, T, R>(mut self, handler: F) -> Self
        where
            F: actix_web::dev::Factory<T, R, actix_swagger::Answer<'static, super::paths::register_confirmation::Response>>,
            T: actix_web::FromRequest + 'static,
            R: std::future::Future<Output = actix_swagger::Answer<'static, super::paths::register_confirmation::Response>>
                + 'static,
        {
            self.api = self
                .api
                .bind("/register/confirmation".to_owned(), actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_session_create<F, T, R>(mut self, handler: F) -> Self
        where
            F: actix_web::dev::Factory<T, R, actix_swagger::Answer<'static, super::paths::session_create::Response>>,
            T: actix_web::FromRequest + 'static,
            R: std::future::Future<Output = actix_swagger::Answer<'static, super::paths::session_create::Response>>
                + 'static,
        {
            self.api = self
                .api
                .bind("/session/create".to_owned(), actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_session_get<F, T, R>(mut self, handler: F) -> Self
        where
            F: actix_web::dev::Factory<T, R, actix_swagger::Answer<'static, super::paths::session_get::Response>>,
            T: actix_web::FromRequest + 'static,
            R: std::future::Future<Output = actix_swagger::Answer<'static, super::paths::session_get::Response>>
                + 'static,
        {
            self.api = self
                .api
                .bind("/session/get".to_owned(), actix_swagger::Method::POST, handler);
            self
        }

        pub fn bind_session_delete<F, T, R>(mut self, handler: F) -> Self
        where
            F: actix_web::dev::Factory<T, R, actix_swagger::Answer<'static, super::paths::session_delete::Response>>,
            T: actix_web::FromRequest + 'static,
            R: std::future::Future<Output = actix_swagger::Answer<'static, super::paths::session_delete::Response>>
                + 'static,
        {
            self.api = self
                .api
                .bind("/session/delete".to_owned(), actix_swagger::Method::POST, handler);
            self
        }

    }


}

pub mod paths {
    use super::components::responses;
    pub mod oauth_authorize_request {
        use super::responses;
        use actix_swagger::ContentType;
        use actix_web::http::StatusCode;
        use serde::Serialize;

        pub type Answer = actix_swagger::Answer<'static, Response>;

        #[derive(Debug, Serialize)]
        #[serde(untagged)]
        pub enum Response {
            Ok(responses::OAuthAuthorizeDone),
            BadRequest(responses::OAuthAuthorizeRequestFailure),
            InternalServerError
        }

        impl Response {
            #[inline]
            pub fn answer<'a>(self) -> actix_swagger::Answer<'a, Self> {
                let status = match self {
                    Self::Ok(_) => StatusCode::OK,
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                };

                let content_type = match self {
                    Self::Ok(_) => Some(ContentType::Json),
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
                };

                actix_swagger::Answer::new(self)
                    .status(status)
                    .content_type(content_type)
            }
        }
    }

    pub mod access_recovery_send_email {
        use super::responses;
        use actix_swagger::ContentType;
        use actix_web::http::StatusCode;
        use serde::Serialize;

        pub type Answer = actix_swagger::Answer<'static, Response>;

        #[derive(Debug, Serialize)]
        #[serde(untagged)]
        pub enum Response {
            Ok,
            BadRequest(responses::AccessRecoverySendEmailFailure),
            InternalServerError
        }

        impl Response {
            #[inline]
            pub fn answer<'a>(self) -> actix_swagger::Answer<'a, Self> {
                let status = match self {
                    Self::Ok => StatusCode::OK,
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                };

                let content_type = match self {
                    Self::Ok => None,
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
                };

                actix_swagger::Answer::new(self)
                    .status(status)
                    .content_type(content_type)
            }
        }
    }

    pub mod access_recovery_set_password {
        use super::responses;
        use actix_swagger::ContentType;
        use actix_web::http::StatusCode;
        use serde::Serialize;

        pub type Answer = actix_swagger::Answer<'static, Response>;

        #[derive(Debug, Serialize)]
        #[serde(untagged)]
        pub enum Response {
            Ok,
            BadRequest(responses::AccessRecoverySetPasswordFailure),
            InternalServerError
        }

        impl Response {
            #[inline]
            pub fn answer<'a>(self) -> actix_swagger::Answer<'a, Self> {
                let status = match self {
                    Self::Ok => StatusCode::OK,
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                };

                let content_type = match self {
                    Self::Ok => None,
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
                };

                actix_swagger::Answer::new(self)
                    .status(status)
                    .content_type(content_type)
            }
        }
    }

    pub mod register_request {
        use super::responses;
        use actix_swagger::ContentType;
        use actix_web::http::StatusCode;
        use serde::Serialize;

        pub type Answer = actix_swagger::Answer<'static, Response>;

        #[derive(Debug, Serialize)]
        #[serde(untagged)]
        pub enum Response {
            Created(responses::RegistrationRequestCreated),
            BadRequest(responses::RegisterFailed),
            InternalServerError
        }

        impl Response {
            #[inline]
            pub fn answer<'a>(self) -> actix_swagger::Answer<'a, Self> {
                let status = match self {
                    Self::Created(_) => StatusCode::CREATED,
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                };

                let content_type = match self {
                    Self::Created(_) => Some(ContentType::Json),
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
                };

                actix_swagger::Answer::new(self)
                    .status(status)
                    .content_type(content_type)
            }
        }
    }

    pub mod register_confirmation {
        use super::responses;
        use actix_swagger::ContentType;
        use actix_web::http::StatusCode;
        use serde::Serialize;

        pub type Answer = actix_swagger::Answer<'static, Response>;

        #[derive(Debug, Serialize)]
        #[serde(untagged)]
        pub enum Response {
            Created,
            BadRequest(responses::RegisterConfirmationFailed),
            InternalServerError
        }

        impl Response {
            #[inline]
            pub fn answer<'a>(self) -> actix_swagger::Answer<'a, Self> {
                let status = match self {
                    Self::Created => StatusCode::CREATED,
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                };

                let content_type = match self {
                    Self::Created => None,
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
                };

                actix_swagger::Answer::new(self)
                    .status(status)
                    .content_type(content_type)
            }
        }
    }

    pub mod session_create {
        use super::responses;
        use actix_swagger::ContentType;
        use actix_web::http::StatusCode;
        use serde::Serialize;

        pub type Answer = actix_swagger::Answer<'static, Response>;

        #[derive(Debug, Serialize)]
        #[serde(untagged)]
        pub enum Response {
            Created(responses::SessionCreateSucceeded),
            BadRequest(responses::SessionCreateFailed),
            InternalServerError
        }

        impl Response {
            #[inline]
            pub fn answer<'a>(self) -> actix_swagger::Answer<'a, Self> {
                let status = match self {
                    Self::Created(_) => StatusCode::CREATED,
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                };

                let content_type = match self {
                    Self::Created(_) => Some(ContentType::Json),
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::InternalServerError => None
                };

                actix_swagger::Answer::new(self)
                    .status(status)
                    .content_type(content_type)
            }
        }
    }

    pub mod session_get {
        use super::responses;
        use actix_swagger::ContentType;
        use actix_web::http::StatusCode;
        use serde::Serialize;

        pub type Answer = actix_swagger::Answer<'static, Response>;

        #[derive(Debug, Serialize)]
        #[serde(untagged)]
        pub enum Response {
            Ok(responses::SessionGetSuccess),
            Unauthorized,
            InternalServerError
        }

        impl Response {
            #[inline]
            pub fn answer<'a>(self) -> actix_swagger::Answer<'a, Self> {
                let status = match self {
                    Self::Ok(_) => StatusCode::OK,
                    Self::Unauthorized => StatusCode::UNAUTHORIZED,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                };

                let content_type = match self {
                    Self::Ok(_) => Some(ContentType::Json),
                    Self::Unauthorized => None,
                    Self::InternalServerError => None
                };

                actix_swagger::Answer::new(self)
                    .status(status)
                    .content_type(content_type)
            }
        }
    }

    pub mod session_delete {
        use super::responses;
        use actix_swagger::ContentType;
        use actix_web::http::StatusCode;
        use serde::Serialize;

        pub type Answer = actix_swagger::Answer<'static, Response>;

        #[derive(Debug, Serialize)]
        #[serde(untagged)]
        pub enum Response {
            Ok,
            BadRequest(responses::SessionDeleteFailure),
            Unauthorized,
            InternalServerError
        }

        impl Response {
            #[inline]
            pub fn answer<'a>(self) -> actix_swagger::Answer<'a, Self> {
                let status = match self {
                    Self::Ok => StatusCode::OK,
                    Self::BadRequest(_) => StatusCode::BAD_REQUEST,
                    Self::Unauthorized => StatusCode::UNAUTHORIZED,
                    Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR
                };

                let content_type = match self {
                    Self::Ok => None,
                    Self::BadRequest(_) => Some(ContentType::Json),
                    Self::Unauthorized => None,
                    Self::InternalServerError => None
                };

                actix_swagger::Answer::new(self)
                    .status(status)
                    .content_type(content_type)
            }
        }
    }

}

pub mod components {

    pub mod responses {

    }

    pub mod request_bodies {

    }

    pub mod schemas {
        use serde::{Deserialize, Serialize};
        use super as components;

        pub type SessionUserList = std::vec::Vec<string>;

        pub type SessionUserRefList = std::vec::Vec<components::schemas::SessionUser>;

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
            #[serde(rename = "SessionUser")]
            pub session_user: components::schemas::SessionUserEnumeration,
        }

    }

}
