use crate::AppState;
use crate::handlers::BackendError;
use aleym_core::Representative;
use aleym_core::db::ActiveValue::{NotSet, Set};
use aleym_core::db::StorageError;
use aleym_core::db::uuid::Uuid;
use aleym_core::inform::Parameters as InformantType;
use aleym_core::net::InterfaceType;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct Source {
	pub id: Uuid,
	pub parent_directory: Uuid,
	pub informant: InformantType,
	pub interface: InterfaceType,
	//pub network_parameters: Option<serde_json::Value> I think this is unused and there doesn't seem to be an interface for it
	pub name: String,
	pub description: Option<String>,
	pub icon_uri: Option<String>,
	pub logo_uri: Option<String>,
	pub custom_id: Option<String>,
	pub is_enabled: bool,
	pub provided_ttl: Option<i32>,
}

#[tauri::command]
pub async fn add_source(
	state: State<'_, AppState>,
	name: String,
	description: Option<String>,
	network: InterfaceType,
	informant: InformantType,
) -> Result<Uuid, BackendError> {
	let root = get_root_directory(&state.repr).await?;
	let uuid = state
		.repr
		.storage
		.add_source(root, informant, network, name, description, true)
		.await?;
	Ok(uuid)
}

#[tauri::command]
pub async fn get_source(state: State<'_, AppState>, id: Uuid) -> Result<Source, BackendError> {
	let source_model = state.repr.storage.get_source(id).await?;
	Ok(Source {
		id: source_model.id,
		parent_directory: source_model.parent_directory,
		informant: serde_json::from_value(source_model.informant_parameters)
			.map_err(StorageError::InvalidJsonParameters)?,
		interface: InterfaceType::try_from(source_model.network)?,
		name: source_model.name,
		description: source_model.description,
		icon_uri: source_model.icon_uri,
		logo_uri: source_model.logo_uri,
		custom_id: source_model.custom_id,
		is_enabled: source_model.is_enabled,
		provided_ttl: source_model.provided_ttl,
	})
}

#[tauri::command]
pub async fn edit_source(
	state: State<'_, AppState>,
	id: Uuid,
	network: Option<InterfaceType>,
	name: Option<String>,
	description: Option<Option<String>>,
	is_enabled: Option<bool>,
) -> Result<(), BackendError> {
	let network = network.map_or(NotSet, Set);
	let name = name.map_or(NotSet, Set);
	let description = description.map_or(NotSet, Set);
	let is_enabled = is_enabled.map_or(NotSet, Set);

	state
		.repr
		.storage
		.edit_source(id, NotSet, network, name, description, is_enabled)
		.await?;
	Ok(())
}
#[tauri::command]
pub async fn delete_source(state: State<'_, AppState>, id: Uuid) -> Result<(), BackendError> {
	state.repr.storage.delete_source(id).await?;
	Ok(())
}

#[tauri::command]
pub async fn get_all_sources(
	state: State<'_, AppState>,
	is_enabled: Option<bool>,
) -> Result<Vec<Source>, BackendError> {
	let sources = state
		.repr
		.storage
		.get_all_sources(is_enabled)
		.await?
		.into_iter()
		.map(|source_model| -> Result<Source, BackendError> {
			Ok(Source {
				id: source_model.id,
				parent_directory: source_model.parent_directory,
				informant: serde_json::from_value(source_model.informant_parameters)
					.map_err(StorageError::InvalidJsonParameters)?,
				interface: InterfaceType::try_from(source_model.network)?,
				name: source_model.name,
				description: source_model.description,
				icon_uri: source_model.icon_uri,
				logo_uri: source_model.logo_uri,
				custom_id: source_model.custom_id,
				is_enabled: source_model.is_enabled,
				provided_ttl: source_model.provided_ttl,
			})
		})
		.collect::<Result<Vec<Source>, BackendError>>()?;
	Ok(sources)
}

#[tauri::command]
pub async fn get_sources_by_category(state: State<'_, AppState>, category: Uuid) -> Result<Vec<Source>, BackendError> {
	let sources = state
		.repr
		.storage
		.get_sources_by_category(category)
		.await?
		.into_iter()
		.map(|source_model| -> Result<Source, BackendError> {
			Ok(Source {
				id: source_model.id,
				parent_directory: source_model.parent_directory,
				informant: serde_json::from_value(source_model.informant_parameters)
					.map_err(StorageError::InvalidJsonParameters)?,
				interface: InterfaceType::try_from(source_model.network)?,
				name: source_model.name,
				description: source_model.description,
				icon_uri: source_model.icon_uri,
				logo_uri: source_model.logo_uri,
				custom_id: source_model.custom_id,
				is_enabled: source_model.is_enabled,
				provided_ttl: source_model.provided_ttl,
			})
		})
		.collect::<Result<Vec<Source>, BackendError>>()?;
	Ok(sources)
}

/*
#[tauri::command]
pub async fn get_sources_by_parent_directory(){}
*/

async fn get_root_directory(repr: &Representative) -> Result<Uuid, BackendError> {
	let uuid = repr.storage.get_all_directories().await?.pop().unwrap().id;
	Ok(uuid)
}
