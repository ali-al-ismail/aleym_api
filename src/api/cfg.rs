use crate::api::ApiResponse;
use crate::config::Config;
use axum::{Json, http::StatusCode};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct ConfigQuery {
	pub min_fetch_interval: Option<i64>,
	pub max_fetch_interval: Option<i64>,
}

pub async fn get_config() -> ApiResponse<Json<ConfigQuery>> {
	let cfg = Config::load();
	Ok(Json(ConfigQuery {
		min_fetch_interval: Some(cfg.scheduler.min_fetch_interval),
		max_fetch_interval: Some(cfg.scheduler.max_fetch_interval),
	}))
}

pub async fn update_config(Json(payload): Json<ConfigQuery>) -> ApiResponse<StatusCode> {
	let mut cfg = Config::load();
	if let Some(min) = payload.min_fetch_interval {
		cfg.scheduler.min_fetch_interval = min;
	}
	if let Some(max) = payload.max_fetch_interval {
		cfg.scheduler.max_fetch_interval = max;
	}
	cfg.save();
	Ok(StatusCode::OK)
}
