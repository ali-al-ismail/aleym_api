use axum::{extract::Json, extract::Path};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Category {
	name: String,
}

pub async fn get_categories() -> &'static str {
	"GET /categories"
}

pub async fn create_category(Json(payload): Json<Category>) -> String {
	format!("CREATE Category: {}", payload.name)
}
pub async fn update_category(Path(id): Path<u32>, Json(payload): Json<Category>) -> String {
	format!("UPDATE Category ID: {id}, Payload: {}", payload.name)
}

pub async fn delete_category(Path(id): Path<u32>) -> String {
	format!("DELETE Category ID: {id}")
}
