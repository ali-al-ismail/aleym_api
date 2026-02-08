use axum::routing::{get, post, put, delete};
use tower_http::services::{ServeDir, ServeFile};   

pub fn build() -> axum::Router {

    let source_routes = axum::Router::new()
        .route("/sources", get(|| async { "sources" }))
        .route("/sources/{id}", get(|| async { "source id" }));

    let categories_routes = axum::Router::new()
        .route("/categories", get(|| async { "categories" }))
        .route("/categories", post(|| async { "create category" }))
        .route("/categories/{id}", put(|| async { "category id" }))
        .route("/categories/{id}", delete(|| async { "delete category" }));

    let articles_routes = axum::Router::new()
        .route("/articles", get(|| async { "articles" }))
        .route("/articles/{id}", get(|| async { "article id" }));



    axum::Router::new()
    // api routes
    .nest("/api", source_routes)
    .nest("/api", categories_routes)
    .nest("/api", articles_routes)

    // static react files
    .fallback_service(ServeDir::new("web/dist").not_found_service(ServeFile::new("web/dist/index.html")))
}