use crate::api::articles::{get_article_by_id, get_articles};
use crate::api::categories::{create_category, delete_category, get_categories, update_category};
use crate::api::sources::{get_source_by_id, get_sources};
use axum::routing::{delete, get, post, put};
use tower_http::services::{ServeDir, ServeFile};

pub fn build() -> axum::Router {
	let source_routes = axum::Router::new()
		.route("/sources", get(get_sources))
		.route("/sources/{id}", get(get_source_by_id));

	let categories_routes = axum::Router::new()
		.route("/categories", get(get_categories))
		.route("/categories", post(create_category))
		.route("/categories/{id}", put(update_category))
		.route("/categories/{id}", delete(delete_category));

	let articles_routes = axum::Router::new()
		.route("/articles", get(get_articles))
		.route("/articles/{id}", get(get_article_by_id));

	axum::Router::new()
		// api routes
		.nest("/api", source_routes)
		.nest("/api", categories_routes)
		.nest("/api", articles_routes)
		// static react files
		.fallback_service(ServeDir::new("web/dist").not_found_service(ServeFile::new("web/dist/index.html")))
}
