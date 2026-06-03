use crate::api::ApiResponse;
use crate::config::Config;
use axum::{Json, http::StatusCode};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct ConfigQuery {
	pub min_fetch_interval: Option<i64>,
	pub max_fetch_interval: Option<i64>,
	pub short_term_cutoff_time: Option<i64>,
	pub long_term_cutoff_time: Option<i64>,
	pub fetch_freshness_bias: Option<f32>,
	pub signals_count_limit: Option<u64>,
	pub publication_window_new_items_count_threshold: Option<i32>,
}

pub async fn get_config() -> ApiResponse<Json<ConfigQuery>> {
	let cfg = Config::load();
	Ok(Json(ConfigQuery {
		min_fetch_interval: Some(cfg.scheduler.min_fetch_interval),
		max_fetch_interval: Some(cfg.scheduler.max_fetch_interval),
		short_term_cutoff_time: Some(cfg.scheduler.short_term_cutoff_time),
		long_term_cutoff_time: Some(cfg.scheduler.long_term_cutoff_time),
		fetch_freshness_bias: Some(cfg.scheduler.fetch_freshness_bias),
		signals_count_limit: Some(cfg.scheduler.signals_count_limit),
		publication_window_new_items_count_threshold: Some(cfg.scheduler.publication_window_new_items_count_threshold),
	}))
}

pub async fn update_config(Json(payload): Json<ConfigQuery>) -> ApiResponse<StatusCode> {
	let mut cfg = Config::load();
	payload.apply_to_config(&mut cfg);
	cfg.save();
	Ok(StatusCode::OK)
}

// i added this to make it look cleaner in update_config but the underlying logic is still the same
impl ConfigQuery {
	pub fn apply_to_config(self, cfg: &mut Config) {
		if let Some(min) = self.min_fetch_interval {
			cfg.scheduler.min_fetch_interval = min;
		}
		if let Some(max) = self.max_fetch_interval {
			cfg.scheduler.max_fetch_interval = max;
		}
		if let Some(short) = self.short_term_cutoff_time {
			cfg.scheduler.short_term_cutoff_time = short;
		}
		if let Some(long) = self.long_term_cutoff_time {
			cfg.scheduler.long_term_cutoff_time = long;
		}
		if let Some(bias) = self.fetch_freshness_bias {
			cfg.scheduler.fetch_freshness_bias = bias;
		}
		if let Some(limit) = self.signals_count_limit {
			cfg.scheduler.signals_count_limit = limit;
		}
		if let Some(threshold) = self.publication_window_new_items_count_threshold {
			cfg.scheduler.publication_window_new_items_count_threshold = threshold;
		}
	}
}
