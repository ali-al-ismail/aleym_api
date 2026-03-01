// this files houses configs that require a restart to change
use serde::{Deserialize, Serialize};
use std::fs::read_to_string;

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
	pub db_file: String,
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
			db_file: "aleym.db".into(),
		}
	}
}

// TODO: function that writes a default config
impl Config {
	pub fn load() -> Self {
		let c_file = "server.toml"; // TODO: maybe make a function that gets the file based on os

		// TODO: need to log error types, eg. file not found, no read permissions etc
		match read_to_string(c_file) {
			Ok(content) => toml::from_str(&content).unwrap_or_else(|_| Config::default()),
			Err(_) => Config::default(),
		}
	}
}
