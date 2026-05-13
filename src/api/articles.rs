use crate::{
	api::{ApiResponse, internal_error},
	appstate::AppState,
};
use aleym_core::db::{
	BySourceDirectory, BySources, NewsFilter, SortOrder, TIME_MAX, TIME_MIN, time::OffsetDateTime, uuid::Uuid,
};
use axum::{
	Json,
	extract::{Path, State},
};
use axum_extra::extract::Query;
use serde::{Deserialize, Serialize};
use std::{sync::Arc, vec};

#[derive(Serialize, Deserialize)]
pub struct SimpleArticle {
	pub id: Uuid,
	pub source: Uuid,
	pub title: String,
	pub uri: Option<String>,
	pub summary: Option<String>,
	pub has_content: bool,
	pub first_fetched_at: i64,
	pub last_fetched_at: i64,
	pub published_at: Option<i64>,
	pub is_read: bool,
}

#[derive(Serialize, Deserialize)]
pub struct Article {
	pub id: Uuid,
	pub source: Uuid,
	pub title: String,
	pub uri: Option<String>,
	pub summary: Option<String>,
	pub content: Option<String>,
	pub first_fetched_at: i64,
	pub last_fetched_at: i64,
	pub published_at: Option<i64>,
	pub is_read: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SortOrderQuery {
	Asc,
	Desc,
}

#[derive(Deserialize)]
pub struct ArticleQuery {
	pub limit: Option<u64>,
	pub after: Option<i64>,
	pub before: Option<i64>,
	pub sort_order: Option<SortOrderQuery>,
	pub source_id: Option<Vec<Uuid>>,
	pub category_id: Option<Vec<Uuid>>,
	pub query: Option<String>,
	pub labels: Option<Vec<Uuid>>,
	pub is_read: Option<bool>,
}

#[derive(Deserialize)]
pub struct RecommendationQuery {
	pub limit: Option<u64>,
}

#[derive(Deserialize)]
pub struct ReadFlagQuery {
	pub is_read: bool,
}

/// Retrieves a paginated list of simple articles with optional filtering and sorting
///
/// # Query Parameters
/// - `limit` - maximum number of articles to return, defaults to `50`
/// - `after` - unix timestamp, only return articles fetched after this time, defaults to the earliest possible time
/// - `before` - unix timestamp, only return articles fetched before this time, defaults to the latest possible time
/// - `sort_order` - `"asc"` or `"desc"`, defaults to `"desc"`
/// - `source_id` - UUID, filter articles by a specific source (takes priority over `category_id`)
/// - `category_id` - UUID, filter articles by a specific category
/// - `query` - string, text search query
/// - `labels` - UUID, filter articles that are tagged with the specified label
/// - `is_read` - boolean, filter articles by read/unread status
///   If neither `source_id` nor `category_id` is provided, returns all articles from the root directory.
///
/// # Response
/// The articles in the returned list are simplified and do not contain all the information of the article.
///
/// Returned articles only contains the data in fields in `SimpleArticle`
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Returns a Json list of articles matching the query |
/// | `500 Internal Server Error` | Failed to retrieve articles |
pub async fn get_articles(
	State(state): State<Arc<AppState>>,
	Query(params): Query<ArticleQuery>,
) -> ApiResponse<Json<Vec<SimpleArticle>>> {
	let cursor_after = OffsetDateTime::from_unix_timestamp(params.after.unwrap_or(TIME_MIN.unix_timestamp())).unwrap();

	let cursor_before =
		OffsetDateTime::from_unix_timestamp(params.before.unwrap_or(TIME_MAX.unix_timestamp())).unwrap();

	let limit = params.limit.unwrap_or(50);

	let sort_order = match params.sort_order.unwrap_or(SortOrderQuery::Desc) {
		SortOrderQuery::Asc => SortOrder::Ascending,
		SortOrderQuery::Desc => SortOrder::Descending,
	};

	let filter = if let Some(source_id) = params.source_id {
		NewsFilter {
			sources: Some(BySources::Identifiers(source_id)),
			text: params.query.clone(),
			labels: params.labels,
			is_read: params.is_read,
		}
	} else if let Some(category_id) = params.category_id {
		NewsFilter {
			sources: Some(BySources::Scope {
				directory: None,
				categories: Some(category_id),
			}),
			text: params.query.clone(),
			labels: params.labels,
			is_read: params.is_read,
		}
	} else {
		let root_dir_uuid = state
			.repr
			.storage
			.get_root_directories()
			.await
			.map_err(internal_error)?
			.pop()
			.unwrap()
			.id;
		NewsFilter {
			sources: Some(BySources::Scope {
				directory: Some(BySourceDirectory {
					parent_directory: root_dir_uuid,
					recursive: true,
				}),
				categories: None,
			}),
			text: params.query.clone(),
			labels: params.labels,
			is_read: params.is_read,
		}
	};

	let articles = state
		.repr
		.storage
		.get_news_with_filter(filter, sort_order, cursor_after, cursor_before, limit)
		.await
		.map_err(internal_error)?
		.into_iter()
		.map(|a| SimpleArticle {
			id: a.id,
			source: a.source,
			title: a.title,
			uri: a.uri,
			summary: a.summary,
			has_content: a.content.is_some(),
			first_fetched_at: a.first_fetched_at.unix_timestamp(),
			last_fetched_at: a.last_fetched_at.unix_timestamp(),
			published_at: a.published_at.map(|time| time.unix_timestamp()),
			is_read: a.is_read,
		})
		.collect();

	Ok(Json(articles))
}

/// Retrieves a single detailed article by its UUID
///
/// # Path Parameters
/// - `id` - UUID of the article to retrieve
///
/// # Response
/// The returned article is more detailed compared to `SimpleArticle`, contains all data in `Article fields`.
///
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Returns the full article including content |
/// | `500 Internal Server Error` | Failed to retrieve article |
pub async fn get_article_by_id(State(state): State<Arc<AppState>>, Path(id): Path<Uuid>) -> ApiResponse<Json<Article>> {
	let article = state.repr.storage.get_news(id).await.map_err(internal_error)?;
	Ok(Json(Article {
		id: article.id,
		source: article.source,
		title: article.title,
		uri: article.uri,
		summary: article.summary,
		content: article.content,
		first_fetched_at: article.first_fetched_at.unix_timestamp(),
		last_fetched_at: article.last_fetched_at.unix_timestamp(),
		published_at: article.published_at.map(|time| time.unix_timestamp()),
		is_read: article.is_read,
	}))
}

/// Retrieves a list of recommended articles
///
/// # Path Parameters
/// - `limit` - maximum number of articles to return, defaults to `50`
///
/// # Response
/// The articles in the returned list are simplified and do not contain all the information of the article.
///
/// Returned articles only contains the data in fields in `SimpleArticle`
/// | Status Code | Description |
/// |-------------|-------------|
/// | `200 OK` | Returns a Json list of recommended articles |
/// | `500 Internal Server Error` | Failed to retrieve articles |
pub async fn recommend_articles(
	State(state): State<Arc<AppState>>,
	Query(limit): Query<RecommendationQuery>,
) -> ApiResponse<Json<Vec<SimpleArticle>>> {
	let limit = limit.limit.unwrap_or(50);

	let articles = state
		.repr
		.storage
		.get_news_recommendations(
			limit,
			(limit * 4).max(100),
			&aleym_core::ml::recommendation::Config::default(),
		)
		.await
		.map_err(internal_error)?
		.into_iter()
		.map(|a| SimpleArticle {
			id: a.id,
			source: a.source,
			title: a.title,
			uri: a.uri,
			summary: a.summary,
			has_content: a.content.is_some(),
			first_fetched_at: a.first_fetched_at.unix_timestamp(),
			last_fetched_at: a.last_fetched_at.unix_timestamp(),
			published_at: a.published_at.map(|time| time.unix_timestamp()),
			is_read: a.is_read,
		})
		.collect::<Vec<SimpleArticle>>();
	Ok(Json(articles))
}

pub async fn set_read_flag(
	State(state): State<Arc<AppState>>,
	Path(id): Path<Uuid>,
	Query(is_read): Query<ReadFlagQuery>,
) -> ApiResponse<()> {
	state
		.repr
		.storage
		.set_news_read(vec![id], is_read.is_read)
		.await
		.map_err(internal_error)?;
	Ok(())
}
