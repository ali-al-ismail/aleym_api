use crate::api::{ApiResponse, internal_error};
use crate::{api::categories::Category, appstate::AppState};
use aleym_core::net::{InterfaceType, NetworkError};
use aleym_core::{db::uuid::Uuid, inform::Parameters};
use axum::{
	Json,
	extract::{Path, State},
	http::StatusCode,
};
use sea_orm::ActiveValue::{NotSet, Set};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Serialize, Deserialize)]
pub struct Source {
	pub id: Uuid,
	pub parent_directory: Uuid,
	pub informant: i8,
	pub networktype: NetworkType,
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
	pub informant: Parameters,
}

#[derive(Serialize, Deserialize)]
pub struct EditSource {
	pub name: String,
	pub description: Option<String>,
	pub network: NetworkType,
	pub is_enabled: bool,
}

#[derive(Serialize, Deserialize)]
pub enum NetworkType {
	Clear = 1,
	Tor = 2,
}

/// Creates a new source
///
/// # Request Body
/// ```json
/// {
///     "name": "source name",
///     "description": "source description",
///     "network": "Clear",
///     "informant": { "FeedRs": { "feed_url": "https://example.com/feed.rss" } }
/// }
/// ```
/// `name` is required
///
/// `description` is optional
///
/// `network` is required, must be `"Clear"` or `"Tor"`
///
/// `informant` is required, must be a valid informant type with its parameters
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `201 Created` | Returns the UUID of the created source |
/// | `500 Internal Server Error` | Failed to create source |
pub async fn create_source(
	State(state): State<Arc<AppState>>,
	Json(payload): Json<CreateSource>,
) -> ApiResponse<(StatusCode, Json<Uuid>)> {
	let root_dir_uuid = get_root_dir(&state).await;

	let uuid = state
		.repr
		.storage
		.add_source(
			root_dir_uuid,
			payload.informant,
			payload.network.into(),
			payload.name,
			payload.description,
			true,
		)
		.await
		.map_err(internal_error)?;

	Ok((StatusCode::CREATED, Json(uuid)))
}

/// Updates an existing source
///
/// # Path Parameters
/// - `id` - UUID of the source to update
///
/// # Request Body
/// ```json
/// {
///     "name": "new source name",
///     "description": "new source description",
///     "network": "Clear",
///     "is_enabled": true
/// }
/// ```
/// All fields are required
///
/// `description` can be `null` to clear it
///
/// `network` must be `"Clear"` or `"Tor"`
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Source updated successfully |
/// | `500 Internal Server Error` | Failed to update source |
pub async fn update_source(
	State(state): State<Arc<AppState>>,
	Path(id): Path<Uuid>,
	Json(payload): Json<EditSource>,
) -> ApiResponse<StatusCode> {
	state
		.repr
		.storage
		.edit_source(
			id,
			NotSet,
			Set(payload.network.into()),
			Set(payload.name),
			Set(payload.description),
			Set(payload.is_enabled),
		)
		.await
		.map_err(internal_error)?;
	Ok(StatusCode::OK)
}
/// Retrieves all sources
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Returns a json list of all sources(id, parent_dir, informant, networktype, name, ... ) |
/// | `500 Internal Server Error` | Failed to retrieve sources or unknown network type encountered |
pub async fn get_sources(State(state): State<Arc<AppState>>) -> ApiResponse<Json<Vec<Source>>> {
	let sources = state
		.repr
		.storage
		.get_all_sources(None)
		.await
		.map_err(internal_error)?
		.into_iter()
		.map(|src| {
			Ok::<Source, (StatusCode, String)>(Source {
				id: src.id,
				parent_directory: src.parent_directory,
				networktype: src.network.try_into().map_err(internal_error)?,
				informant: src.informant,
				name: src.name,
				description: src.description,
				icon_uri: src.icon_uri,
				logo_uri: src.logo_uri,
				custom_id: src.custom_id,
				is_enabled: src.is_enabled,
			})
		})
		.collect::<Result<Vec<_>, _>>()?;
	Ok(Json(sources))
}

/// Retrieves a source by its UUID
///
/// # Path Parameters
/// - `id` - UUID of the source to retrieve
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Returns the source in Json format |
/// | `500 Internal Server Error` | Failed to retrieve source or unknown network type encountered |
pub async fn get_source_by_id(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> ApiResponse<Json<Source>> {
	let src = state.repr.storage.get_source(id).await.map_err(internal_error)?;
	Ok(Json(Source {
		id: src.id,
		parent_directory: src.parent_directory,
		networktype: src.network.try_into().map_err(internal_error)?,
		informant: src.informant,
		name: src.name,
		description: src.description,
		icon_uri: src.icon_uri,
		logo_uri: src.logo_uri,
		custom_id: src.custom_id,
		is_enabled: src.is_enabled,
	}))
}

/// Retrieves all categories assigned to a source
///
/// # Path Parameters
/// - `id` - UUID of the source
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Returns a json list of categories assigned to the source |
/// | `500 Internal Server Error` | Failed to retrieve categories |
pub async fn get_source_categories(
	State(state): State<Arc<AppState>>,
	Path(id): Path<Uuid>,
) -> ApiResponse<Json<Vec<Category>>> {
	let categories = state
		.repr
		.storage
		.get_categories_of_source(id)
		.await
		.map_err(internal_error)?
		.into_iter()
		.map(|cat| Category {
			id: cat.id,
			name: cat.name,
			description: cat.description,
		})
		.collect();
	Ok(Json(categories))
}

/// Retrieves all sources assigned to a category
///
/// # Path Parameters
/// - `id` - UUID of the category
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Returns a json list of sources assigned to the category |
/// | `500 Internal Server Error` | Failed to retrieve sources or unknown network type encountered |
pub async fn get_sources_by_category(
	State(state): State<Arc<AppState>>,
	Path(id): Path<Uuid>,
) -> ApiResponse<Json<Vec<Source>>> {
	let sources = state
		.repr
		.storage
		.get_sources_by_category(id)
		.await
		.map_err(internal_error)?
		.into_iter()
		.map(|src| {
			Ok::<Source, (StatusCode, String)>(Source {
				id: src.id,
				parent_directory: src.parent_directory,
				networktype: src.network.try_into().map_err(internal_error)?,
				informant: src.informant,
				name: src.name,
				description: src.description,
				icon_uri: src.icon_uri,
				logo_uri: src.logo_uri,
				custom_id: src.custom_id,
				is_enabled: src.is_enabled,
			})
		})
		.collect::<Result<Vec<_>, _>>()?;
	Ok(Json(sources))
}

/// Deletes a source by its UUID
///
/// # Path Parameters
/// - `id` - UUID of the source to delete
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Source deleted successfully |
/// | `500 Internal Server Error` | Failed to delete source |
pub async fn delete_source(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> ApiResponse<StatusCode> {
	state.repr.storage.delete_source(id).await.map_err(internal_error)?;
	Ok(StatusCode::OK)
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

/// Assigns a category to a source
///
/// # Path Parameters
/// - `source_id` - UUID of the source
/// - `category_id` - UUID of the category
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Category assigned successfully |
/// | `500 Internal Server Error` | Failed to assign category |
pub async fn link_source_to_category(
	State(state): State<Arc<AppState>>,
	Path((source_id, category_id)): Path<(Uuid, Uuid)>,
) -> ApiResponse<StatusCode> {
	state
		.repr
		.storage
		.assign_category_to_source(source_id, category_id)
		.await
		.map_err(internal_error)?;
	Ok(StatusCode::OK)
}

/// Removes a category assignment from a source
///
/// # Path Parameters
/// - `source_id` - UUID of the source
/// - `category_id` - UUID of the category
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Category unassigned successfully |
/// | `500 Internal Server Error` | Failed to unassign category |
pub async fn unlink_source_to_category(
	State(state): State<Arc<AppState>>,
	Path((source_id, category_id)): Path<(Uuid, Uuid)>,
) -> ApiResponse<StatusCode> {
	state
		.repr
		.storage
		.unassign_category_from_source(source_id, category_id)
		.await
		.map_err(internal_error)?;
	Ok(StatusCode::OK)
}

/// Triggers the informant to fetch news for a specific source manually
///
/// # Path Parameters
/// - `id` - UUID of the source to fetch
///
/// # Response
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Fetch triggered successfully |
/// | `500 Internal Server Error` | Failed to trigger fetch |
pub async fn manual_fetch(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> ApiResponse<StatusCode> {
	state
		.repr
		.trigger_informant_by_source(id)
		.await
		.map_err(internal_error)?;
	Ok(StatusCode::OK)
}

impl From<NetworkType> for InterfaceType {
	fn from(value: NetworkType) -> Self {
		match value {
			NetworkType::Clear => InterfaceType::Clear,
			NetworkType::Tor => InterfaceType::Tor,
		}
	}
}

impl TryFrom<i8> for NetworkType {
	type Error = NetworkError;

	fn try_from(i: i8) -> Result<Self, Self::Error> {
		match i {
			1 => Ok(NetworkType::Clear),
			2 => Ok(NetworkType::Tor),
			_ => Err(aleym_core::net::NetworkError::UnsupportedNetworkInterfaceIdentifier(i)),
		}
	}
}
