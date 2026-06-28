use crate::{AppState, handlers::BackendError};
use aleym_core::db::ActiveValue::{NotSet, Set};
use aleym_core::db::uuid::Uuid;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct Label {
	pub id: Uuid,
	pub name: String,
	pub description: Option<String>,
}

#[tauri::command]
pub async fn create_news_label(
	state: State<'_, AppState>,
	name: String,
	description: Option<String>,
) -> Result<Uuid, BackendError> {
	let label_id = state.repr.storage.create_news_label(name, description).await?;
	Ok(label_id)
}

#[tauri::command]
pub async fn get_all_news_labels(state: State<'_, AppState>) -> Result<Vec<Label>, BackendError> {
	let labels = state
		.repr
		.storage
		.get_all_news_labels()
		.await?
		.into_iter()
		.map(|label_model| Label {
			id: label_model.id,
			name: label_model.name,
			description: label_model.description,
		})
		.collect();
	Ok(labels)
}

#[tauri::command]
pub async fn get_news_label(state: State<'_, AppState>, id: Uuid) -> Result<Label, BackendError> {
	let label_model = state.repr.storage.get_news_label(id).await?;
	Ok(Label {
		id: label_model.id,
		name: label_model.name,
		description: label_model.description,
	})
}

#[tauri::command]
pub async fn get_labels_of_news(state: State<'_, AppState>, id: Uuid) -> Result<Vec<Label>, BackendError> {
	let labels = state
		.repr
		.storage
		.get_labels_of_news(id)
		.await?
		.into_iter()
		.map(|label_model| Label {
			id: label_model.id,
			name: label_model.name,
			description: label_model.description,
		})
		.collect();
	Ok(labels)
}

#[tauri::command]
pub async fn delete_news_label(state: State<'_, AppState>, id: Uuid) -> Result<(), BackendError> {
	state.repr.storage.delete_news_label(id).await?;
	Ok(())
}

#[tauri::command]
pub async fn edit_news_label(
	state: State<'_, AppState>,
	id: Uuid,
	name: Option<String>,
	description: Option<String>,
) -> Result<(), BackendError> {
	let name = name.map_or(NotSet, Set);
	let description = description.map_or(NotSet, |d| Set(Some(d)));

	state.repr.storage.edit_news_label(id, name, description).await?;
	Ok(())
}

#[tauri::command]
pub async fn assign_label_to_news(
	state: State<'_, AppState>,
	source_id: Uuid,
	label_id: Uuid,
) -> Result<(), BackendError> {
	state.repr.storage.assign_label_to_news(source_id, label_id).await?;
	Ok(())
}

#[tauri::command]
pub async fn unassign_label_from_news(
	state: State<'_, AppState>,
	source_id: Uuid,
	label_id: Uuid,
) -> Result<(), BackendError> {
	state.repr.storage.unassign_label_from_news(source_id, label_id).await?;
	Ok(())
}
