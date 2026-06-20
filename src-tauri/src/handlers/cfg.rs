use crate::{config::Config, handlers::BackendError};

#[tauri::command]
pub async fn get_config() -> Result<Config, BackendError> {
	let cfg = Config::load();
	Ok(cfg)
}
// need to properly look at this later, most likely has cases where it fails and gives an exception
#[tauri::command]
pub async fn update_config(config: Config) -> Result<(), BackendError> {
	config.save();
	Ok(())
}
