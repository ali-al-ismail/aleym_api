// this files houses configs that require a restart to change
use serde::{Deserialize, Serialize};
use std::{fs::read_to_string, path::PathBuf};

// config structure
#[derive(Deserialize, Serialize, Default, Debug)]
#[serde(default)]
pub struct Config {
	pub network: Network,
	pub paths: Paths,
	pub scheduler: Scheduler,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(default)]
pub struct Network {
	pub tor_proxy_port: u16,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(default)]
pub struct Paths {
	pub db_file: PathBuf,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(default)]
pub struct Scheduler {
	pub min_fetch_interval: i64,
	pub max_fetch_interval: i64,
	pub short_term_cutoff_time: i64,
	pub long_term_cutoff_time: i64,
	pub fetch_freshness_bias: f32,
	pub signals_count_limit: u64,
	pub publication_window_new_items_count_threshold: i32,
}

impl Default for Network {
	fn default() -> Self {
		Self { tor_proxy_port: 48271 }
	}
}

impl Default for Paths {
	fn default() -> Self {
		Self {
			db_file: dirs::data_dir()
				.map(|mut path| {
					path.push("aleym");
					std::fs::create_dir_all(&path).ok();
					path.push("aleym.db");
					path
				})
				.unwrap_or_else(|| PathBuf::from("aleym.db")),
		}
	}
}

impl Default for Scheduler {
	fn default() -> Self {
		Self {
			min_fetch_interval: 900,
			max_fetch_interval: 14400,
			short_term_cutoff_time: 86400,
			long_term_cutoff_time: 2592000,
			fetch_freshness_bias: 0.2,
			signals_count_limit: 1000,
			publication_window_new_items_count_threshold: 15,
		}
	}
}

impl Config {
	fn config_path() -> PathBuf {
		dirs::config_dir()
			.map(|mut path| {
				path.push("aleym");
				std::fs::create_dir_all(&path).ok();
				path.push("server.toml");
				path
			})
			.unwrap_or_else(|| PathBuf::from("server.toml"))
	}

	#[tracing::instrument(ret, level = tracing::Level::DEBUG)]
	pub fn load() -> Self {
		let c_file = Self::config_path();
		if !c_file.exists() {
			let default = Config::default();
			tracing::warn!("No config file found, creating default at {:?}", c_file);
			match toml::to_string(&default) {
				Ok(toml_str) => {
					std::fs::write(&c_file, toml_str).ok();
				}
				Err(e) => tracing::error!("Failed to serialize default config: {e}"),
			}

			return default;
		}
		match read_to_string(&c_file) {
			Ok(content) => toml::from_str(&content).unwrap_or_else(|e| {
				tracing::warn!("Failed to parse config: {e}, using defaults");
				Config::default()
			}),
			Err(e) => {
				tracing::error!("Failed to read config file: {e}, using defaults");
				Config::default()
			}
		}
	}

	#[tracing::instrument(skip(self), level = tracing::Level::DEBUG)]
	pub fn save(&self) {
		match toml::to_string(self) {
			Ok(toml_str) => {
				if let Err(e) = std::fs::write(Self::config_path(), toml_str) {
					tracing::error!("Failed to write config file: {e}");
				}
				tracing::debug!(config = ?self);
			}
			Err(e) => tracing::error!("Failed to serialize config: {e}"),
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn test_default_config() {
		let config = Config::default();
		assert_eq!(config.network.tor_proxy_port, 48271);
		//assert_eq!(config.paths.db_file, PathBuf::from("aleym.db"));
	}

	#[test]
	fn test_partial_config() {
		let toml_str = r#"
			[network]
			tor_proxy_port = 48272

			[paths]
			db_file = "custom.db"
		"#;

		let config: Config = toml::from_str(toml_str).unwrap();
		assert_eq!(config.network.tor_proxy_port, 48272);
		assert_eq!(config.paths.db_file, PathBuf::from("custom.db"));
	}
}
