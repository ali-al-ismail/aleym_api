use crate::appstate::AppState;
use aleym_core::db::uuid::Uuid;
use aleym_core::net::InterfaceType;
use axum::{
	Json,
	extract::{Path, State},
	http::StatusCode,
};
use sea_orm::ActiveValue::Set;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Serialize, Deserialize)]
pub struct Source {
	pub id: Uuid,
	pub parent_directory: Uuid,
	pub name: String,
	pub description: Option<String>,
	pub icon_uri: Option<String>,
	pub logo_uri: Option<String>,
	pub custom_id: Option<String>,
	pub is_enabled: bool,
}

#[derive(Serialize, Deserialize)]
pub struct CreateSource {
	pub name: String,
	pub description: Option<String>,
	pub network: NetworkType,
	//pub informant_type: InformantType, -- currently InformantType from aleym_core is private
	pub informant_type: i8,
}

#[derive(Serialize, Deserialize)]
pub struct EditSource {
	pub name: String,
	pub description: Option<String>,
	pub network: NetworkType,
	pub is_enabled: bool,
}

#[derive(Serialize, Deserialize)]
pub enum InformantType {
	TestPlaceholder = 0,
}

#[derive(Serialize, Deserialize)]
pub enum NetworkType {
	Clear = 1,
	Tor = 2,
}

// this function doesn't work
pub async fn create_source(State(state): State<Arc<AppState>>, Json(payload): Json<CreateSource>) -> StatusCode {
	let root_dir_uuid = get_root_dir(&state).await;

	/* state.repr.storage.add_source(
		root_dir_uuid,
		0i8, // bricked cause the informant type is private
		payload.network.into(),
		payload.name,
		payload.description,
		true,
	); */

	StatusCode::CREATED
}
pub async fn update_source(
	State(state): State<Arc<AppState>>,
	Path(id): Path<Uuid>,
	Json(payload): Json<EditSource>,
) -> StatusCode {
	let root_dir_uuid = get_root_dir(&state).await;

	state
		.repr
		.storage
		.edit_source(
			id,
			Set(root_dir_uuid),
			Set(payload.network.into()),
			Set(payload.name),
			Set(payload.description),
			Set(payload.is_enabled),
		)
		.await
		.unwrap();
	StatusCode::OK
}

pub async fn get_sources(State(state): State<Arc<AppState>>) -> Json<Vec<Source>> {
	let sources = state
		.repr
		.storage
		.get_all_sources()
		.await
		.unwrap()
		.into_iter()
		.map(|src| Source {
			id: src.id,
			parent_directory: src.parent_directory,
			name: src.name,
			description: src.description,
			icon_uri: src.icon_uri,
			logo_uri: src.logo_uri,
			custom_id: src.custom_id,
			is_enabled: src.is_enabled,
		})
		.collect();
	Json(sources)
}

pub async fn get_source_by_id(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> Json<Source> {
	let src = state.repr.storage.get_source(id).await.unwrap();
	Json(Source {
		id: src.id,
		parent_directory: src.parent_directory,
		name: src.name,
		description: src.description,
		icon_uri: src.icon_uri,
		logo_uri: src.logo_uri,
		custom_id: src.custom_id,
		is_enabled: src.is_enabled,
	})
}

pub async fn get_source_categories() {}

pub async fn get_sources_by_category() {}

pub async fn delete_source(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> StatusCode {
	state.repr.storage.delete_source(id).await.unwrap();
	StatusCode::OK
}

async fn get_root_dir(state: &AppState) -> Uuid {
	// WARNING: since we only have one directory we just get the id of the only one available, if in the future we add more directories this will break
	state
		.repr
		.storage
		.get_root_directories()
		.await
		.unwrap()
		.pop()
		.unwrap()
		.id
}

pub async fn link_source_to_category(
	State(state): State<Arc<AppState>>,
	Path((source_id, category_id)): Path<(Uuid, Uuid)>,
) -> StatusCode {
	state
		.repr
		.storage
		.assign_category_to_source(source_id, category_id)
		.await
		.unwrap();
	StatusCode::OK
}

pub async fn unlink_source_to_category(
	State(state): State<Arc<AppState>>,
	Path(source_id): Path<Uuid>,
	Path(category_id): Path<Uuid>,
) -> StatusCode {
	state
		.repr
		.storage
		.unassign_category_from_source(source_id, category_id)
		.await
		.unwrap();
	StatusCode::OK
}

impl From<NetworkType> for InterfaceType {
	fn from(value: NetworkType) -> Self {
		match value {
			NetworkType::Clear => InterfaceType::Clear,
			NetworkType::Tor => InterfaceType::Tor,
		}
	}
}
