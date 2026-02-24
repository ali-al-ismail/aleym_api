use axum::extract::Path;

pub async fn get_sources() -> &'static str {
	"GET /sources"
}

pub async fn get_source_by_id(Path(id): Path<u32>) -> String {
	format!("GET Source ID: {id}")
}
