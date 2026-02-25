// this files houses configs that require a restart to change
use serde::{Deserialize, Serialize};
use std::fs::read_to_string;

// config structure
#[derive(Deserialize, Serialize)]
pub struct Config {
	pub port: u16,
}

impl Default for Config {
	fn default() -> Self {
		Config { port: 3000 }
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
