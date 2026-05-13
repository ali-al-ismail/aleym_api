use crate::{
	api::{ApiResponse, internal_error},
	appstate::AppState,
};
use aleym_core::db::ActiveValue::{NotSet, Set};
use aleym_core::db::uuid::Uuid;
use axum::{
	extract::{Json, Path, State},
	http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Serialize, Deserialize)]
pub struct Category {
	pub id: Uuid,
	pub name: String,
	pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateCategory {
	pub name: String,
	pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct EditCategory {
	pub name: String,
	pub description: Option<Option<String>>,
}
/// Retrieves all source categories
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Returns a Json list of all categories (id, name, description) |
/// | `500 Internal Server Error` | Failed to retrieve categories |
pub async fn get_categories(State(state): State<Arc<AppState>>) -> ApiResponse<Json<Vec<Category>>> {
	let categories = state
		.repr
		.storage
		.get_all_categories()
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

/// Creates a new source category
///
/// # Request Body
/// ```json
/// {
/// "name": "category name",
/// "description": "category description"
/// }
/// ```
/// `name` field must be unique
///
/// `description` is optional
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `201 Created`| Returns the UUID of the created category |
/// | `500 Internal Server Error` | Returned by any potential failure, eg. category with name already exists
pub async fn create_category(
	State(state): State<Arc<AppState>>,
	Json(payload): Json<CreateCategory>,
) -> ApiResponse<(StatusCode, Json<Uuid>)> {
	let uuid = state
		.repr
		.storage
		.create_source_category(payload.name, payload.description)
		.await
		.map_err(internal_error)?; // aleym_core's error handling is vague so we can't know exactly if there's a unique conflict etc
	Ok((StatusCode::CREATED, Json(uuid)))
}

/// Updates an existing source category
///
/// # Path Parameters
/// - `id` - UUID of the category to update
///
/// # Request Body
/// ```json
/// {
///     "name": "new category name",
///     "description": "new category description"
/// }
/// ```
/// `name` is required, `description` is optional - supply with `null` to clear description
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Category updated successfully |
/// | `500 Internal Server Error` | Failed to update category |
pub async fn update_category(
	State(state): State<Arc<AppState>>,
	Path(id): Path<Uuid>,
	Json(payload): Json<EditCategory>,
) -> ApiResponse<StatusCode> {
	state
		.repr
		.storage
		.edit_source_category(
			id,
			Set(payload.name),
			match payload.description {
				Some(Some(desc)) => Set(Some(desc)),
				Some(None) => Set(None),
				None => NotSet,
			},
		)
		.await
		.map_err(internal_error)?;
	Ok(StatusCode::OK)
}

/// Deletes an existing source category
///
/// # Path Parameters
/// - `id` - UUID of the category to delete
///
/// # Response
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Category deleted successfully |
/// | `500 Internal Server Error` | Failed to delete category |
pub async fn delete_category(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> ApiResponse<StatusCode> {
	state
		.repr
		.storage
		.delete_source_category(id)
		.await
		.map_err(internal_error)?;
	Ok(StatusCode::OK)
}
