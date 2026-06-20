use aleym_core::{Error as CoreError, db::StorageError, inform::InformantError, net::NetworkError};
use serde::Serialize;
pub mod categories;
pub mod cfg;
pub mod feedback;
pub mod labels;
pub mod news;
pub mod sources;

#[derive(Debug, thiserror::Error, Serialize)]
pub enum BackendError {
	// Storage Errors
	#[error("database error: {0}")]
	Database(String), // i would've liked to expand this further by accessing the DbErr inside but unfortunately it's not exposed by aleym_core
	#[error("invalid weights sum")]
	InvalidWeightsSum,
	#[error("invalid percentage: {0}")]
	InvalidPercentage(i8),
	#[error("provided Json does not match the required structure: {0}")]
	InvalidJsonParameters(String),
	#[error("storage error: {0}")]
	Storage(String), // collapse the rest into a general type

	// Network Errors
	#[error("network error: {0}")]
	Network(String), // might expand this later, for now just a general type

	// Informant Errors
	#[error("invalid informant parameters: {0}")]
	InvalidInformantParameters(String),
	#[error("rss parsing error: {0}")]
	RssParsingError(String),
	#[error("telegram parsing error: {0}")]
	TelegramParsingError(String),
	#[error("informant error: {0}")]
	Informant(String), // general type

	#[error("core error: {0}")]
	Internal(String), // super general type to catch any other errors
}

impl From<StorageError> for BackendError {
	fn from(err: StorageError) -> Self {
		match err {
			StorageError::DatabaseError(db_err) => BackendError::Database(db_err.to_string()),
			StorageError::InvalidWeightsSum => BackendError::InvalidWeightsSum,
			StorageError::InvalidPercentageNumber(n) => BackendError::InvalidPercentage(n),
			StorageError::InvalidJsonParameters(srd_err) => BackendError::InvalidJsonParameters(srd_err.to_string()),
			other => BackendError::Storage(other.to_string()),
		}
	}
}

impl From<NetworkError> for BackendError {
	fn from(err: NetworkError) -> Self {
		BackendError::Network(err.to_string())
	}
}

impl From<InformantError> for BackendError {
	fn from(err: InformantError) -> Self {
		match err {
			InformantError::InvalidInformantParameters(e) => BackendError::InvalidInformantParameters(e.to_string()),
			InformantError::NetworkError(net_err) => net_err.into(),
			InformantError::TelegramWebUndefiedFormat => BackendError::TelegramParsingError(err.to_string()),
			InformantError::FeedRsParsingError(_) => BackendError::RssParsingError(err.to_string()),
			other => BackendError::Informant(other.to_string()),
		}
	}
}

impl From<CoreError> for BackendError {
	fn from(err: CoreError) -> Self {
		match err {
			CoreError::StorageError(e) => e.into(),
			CoreError::NetworkError(e) => e.into(),
			CoreError::InformantError(e) => e.into(),
			// didnt do shceduler errors since i dont really know what they are
			other => BackendError::Internal(other.to_string()),
		}
	}
}
