use axum::extract::Path;

pub async fn get_articles() -> &'static str {
	"GET /articles"
}

pub async fn get_article_by_id(Path(id): Path<u32>) -> String {
	format!("GET Article ID: {id}")
}
