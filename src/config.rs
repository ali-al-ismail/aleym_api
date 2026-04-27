// this files houses configs that require a restart to change
use serde::{Deserialize, Serialize};
use std::{fs::read_to_string, path::PathBuf};

// config structure
#[derive(Deserialize, Serialize, Default)]
#[serde(default)]
pub struct Config {
	pub network: Network,
	pub paths: Paths,
}

#[derive(Deserialize, Serialize)]
#[serde(default)]
pub struct Network {
	pub port: u16,
	pub host: String,
}

#[derive(Deserialize, Serialize)]
#[serde(default)]
pub struct Paths {
	pub db_file: PathBuf,
}

impl Default for Network {
	fn default() -> Self {
		Self {
			port: 3000,
			host: "127.0.0.1".into(),
		}
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

// TODO: function that writes a default config
impl Config {
	pub fn load() -> Self {
		let c_path = dirs::config_dir();
		let c_file = c_path
			.map(|mut path| {
				path.push("aleym");
				std::fs::create_dir_all(&path).ok();
				path.push("server.toml");
				path
			})
			.unwrap_or_else(|| PathBuf::from("server.toml"));

		if !c_file.exists() {
			let default_toml = toml::to_string(&Config::default()).unwrap_or_default();
			std::fs::write(&c_file, default_toml).ok();
		}

		// TODO: need to log error types, eg. file not found, no read permissions etc
		match read_to_string(c_file) {
			Ok(content) => toml::from_str(&content).unwrap_or_else(|_| Config::default()),
			Err(_) => Config::default(),
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn test_default_config() {
		let config = Config::default();
		assert_eq!(config.network.port, 3000);
		assert_eq!(config.network.host, "127.0.0.1");
		//assert_eq!(config.paths.db_file, PathBuf::from("aleym.db"));
	}

	#[test]
	fn test_partial_config() {
		let toml_str = r#"
			[network]
			port = 9080

			[paths]
			db_file = "custom.db"
		"#;

		let config: Config = toml::from_str(toml_str).unwrap();
		assert_eq!(config.network.port, 9080);
		assert_eq!(config.network.host, "127.0.0.1");
		assert_eq!(config.paths.db_file, PathBuf::from("custom.db"));
	}
}
