use crate::{
	api::{ApiResponse, internal_error},
	appstate::AppState,
};
use aleym_core::db::ActiveValue::{NotSet, Set};
use aleym_core::db::uuid::Uuid;
use axum::{
	Json,
	extract::{Path, State},
	http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize, Serialize)]
pub struct Label {
	pub id: Uuid,
	pub name: String,
	pub description: Option<String>,
}
#[derive(Deserialize, Serialize)]
pub struct CreateLabelQuery {
	pub name: String,
	pub description: Option<String>,
}
#[derive(Deserialize, Serialize)]
pub struct LabelEditQuery {
	pub name: Option<String>,
	pub description: Option<String>,
}
pub async fn create_label(
	State(state): State<Arc<AppState>>,
	Json(query): Json<CreateLabelQuery>,
) -> ApiResponse<(StatusCode, Json<Uuid>)> {
	let uuid = state
		.repr
		.storage
		.create_news_label(query.name, query.description)
		.await
		.map_err(internal_error)?;
	Ok((StatusCode::CREATED, Json(uuid)))
}
pub async fn get_labels(State(state): State<Arc<AppState>>) -> ApiResponse<Json<Vec<Label>>> {
	let labels = state
		.repr
		.storage
		.get_all_news_labels()
		.await
		.map_err(internal_error)?
		.into_iter()
		.map(|l| Label {
			id: l.id,
			name: l.name,
			description: l.description,
		})
		.collect();
	Ok(Json(labels))
}
pub async fn delete_label(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> ApiResponse<StatusCode> {
	state.repr.storage.delete_news_label(id).await.map_err(internal_error)?;
	Ok(StatusCode::OK)
}
pub async fn update_label(
	State(state): State<Arc<AppState>>,
	Path(id): Path<Uuid>,
	Json(query): Json<LabelEditQuery>,
) -> ApiResponse<StatusCode> {
	state
		.repr
		.storage
		.edit_news_label(
			id,
			query.name.map(Set).unwrap_or(NotSet),
			query.description.map(|n| Set(Some(n))).unwrap_or(NotSet),
		)
		.await
		.map_err(internal_error)?;
	Ok(StatusCode::OK)
}
