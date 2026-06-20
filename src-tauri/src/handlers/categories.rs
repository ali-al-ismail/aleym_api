use crate::{AppState, handlers::BackendError};
use aleym_core::db::ActiveValue::{NotSet, Set};
use aleym_core::db::uuid::Uuid;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct Category {
	pub id: Uuid,
	pub name: String,
	pub description: Option<String>,
}

#[tauri::command]
pub async fn get_categories(state: State<'_, AppState>) -> Result<Vec<Category>, BackendError> {
	let categories = state
		.repr
		.storage
		.get_all_categories()
		.await?
		.into_iter()
		.map(|cat| Category {
			id: cat.id,
			name: cat.name,
			description: cat.description,
		})
		.collect();
	Ok(categories)
}

#[tauri::command]
pub async fn create_category(
	state: State<'_, AppState>,
	name: String,
	description: Option<String>,
) -> Result<Uuid, BackendError> {
	let category_id = state.repr.storage.create_source_category(name, description).await?;
	Ok(category_id)
}

#[tauri::command]
pub async fn edit_category(
	state: State<'_, AppState>,
	id: Uuid,
	name: Option<String>,
	description: Option<String>,
) -> Result<(), BackendError> {
	let name = match name {
		Some(name) => Set(name),
		None => NotSet,
	};
	let description = match description {
		Some(description) => Set(Some(description)),
		None => NotSet,
	};
	state.repr.storage.edit_source_category(id, name, description).await?;
	Ok(())
}

#[tauri::command]
pub async fn assign_category_to_source(
	state: State<'_, AppState>,
	source: Uuid,
	category: Uuid,
) -> Result<(), BackendError> {
	state.repr.storage.assign_category_to_source(source, category).await?;
	Ok(())
}

#[tauri::command]
pub async fn unassign_category_from_source(
	state: State<'_, AppState>,
	source: Uuid,
	category: Uuid,
) -> Result<(), BackendError> {
	state
		.repr
		.storage
		.unassign_category_from_source(source, category)
		.await?;
	Ok(())
}

#[tauri::command]
pub async fn get_categories_of_source(state: State<'_, AppState>, source: Uuid) -> Result<Vec<Category>, BackendError> {
	let categories = state
		.repr
		.storage
		.get_categories_of_source(source)
		.await?
		.into_iter()
		.map(|category_model| Category {
			id: category_model.id,
			name: category_model.name,
			description: category_model.description,
		})
		.collect();
	Ok(categories)
}

#[tauri::command]
pub async fn delete_category(state: State<'_, AppState>, id: Uuid) -> Result<(), BackendError> {
	state.repr.storage.delete_source_category(id).await?;
	Ok(())
}
