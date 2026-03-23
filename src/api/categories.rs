use crate::appstate::AppState;
use aleym_core::db::uuid::Uuid;
use axum::{
	extract::{Json, Path, State},
	http::StatusCode,
};
use sea_orm::ActiveValue::{NotSet, Set};
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

pub async fn get_categories(State(state): State<Arc<AppState>>) -> Json<Vec<Category>> {
	let categories = state
		.repr
		.storage
		.get_all_categories()
		.await
		.unwrap()
		.into_iter()
		.map(|cat| Category {
			id: cat.id,
			name: cat.name,
			description: cat.description,
		})
		.collect();
	Json(categories)
}

pub async fn create_category(State(state): State<Arc<AppState>>, Json(payload): Json<CreateCategory>) -> StatusCode {
	state
		.repr
		.storage
		.create_source_category(payload.name, payload.description)
		.await
		.unwrap();
	StatusCode::CREATED
}

pub async fn update_category(
	State(state): State<Arc<AppState>>,
	Path(id): Path<Uuid>,
	Json(payload): Json<CreateCategory>,
) -> StatusCode {
	state
		.repr
		.storage
		.edit_source_category(
			id,
			Set(payload.name),
			match payload.description {
				Some(desc) => Set(Some(desc)),
				None => NotSet,
			},
		)
		.await
		.unwrap();
	StatusCode::OK
}

pub async fn delete_category(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> StatusCode {
	state.repr.storage.delete_source_category(id).await.unwrap();
	StatusCode::OK
}
