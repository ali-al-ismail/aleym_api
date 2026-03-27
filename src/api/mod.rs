use axum::http::StatusCode;

pub mod articles;
pub mod categories;
pub mod events;
pub mod sources;

pub type ApiResponse<T> = Result<T, (axum::http::StatusCode, String)>;

fn internal_error(err: impl std::error::Error) -> (StatusCode, String) {
	(StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}
