use aleym_core::db::{BySourceDirectory, BySources, NewsFilter, TIME_MAX, TIME_MIN, time::OffsetDateTime, uuid::Uuid};
use ammonia::clean;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{AppState, handlers::BackendError};

// doesn't have content
#[derive(Serialize)]
pub struct SimpleNews {
	pub id: Uuid,
	pub source: Uuid,
	pub title: String,
	pub uri: Option<String>,
	pub has_content: bool,
	pub summary: Option<String>,
	pub first_fetched_at: i64,
	pub last_fetched_at: i64,
	pub published_at: Option<i64>,
	pub updated_at: Option<i64>,
	pub is_read: bool,
}

// has all the fields including content
#[derive(Serialize)]
pub struct News {
	pub id: Uuid,
	pub source: Uuid,
	pub title: String,
	pub uri: Option<String>,
	pub summary: Option<String>,
	pub content: Option<String>,
	pub first_fetched_at: i64,
	pub last_fetched_at: i64,
	pub published_at: Option<i64>,
	pub updated_at: Option<i64>,
	pub is_read: bool,
}

// considered just having all of these be arguments of get_news_with_filter, but I went with this option instead
#[derive(Deserialize)]
pub struct NewsSearchFilter {
	pub after: Option<i64>,
	pub before: Option<i64>,
	pub sort_order: Option<SortOrder>,
	pub source_id: Option<Vec<Uuid>>,
	pub category_id: Option<Vec<Uuid>>,
	pub text: Option<String>,
	pub labels: Option<Vec<Uuid>>,
	pub is_read: Option<bool>,
}

// since core doesn't have deserialiez I need my own type for it
#[derive(Deserialize)]
pub enum SortOrder {
	Ascending,
	Descending,
}

// TODO: handle unwraps cleanly
/// This function strips all from the summary and title html tags leaving pure text only
#[tauri::command]
pub async fn get_news_with_filter(
	state: State<'_, AppState>,
	filter: NewsSearchFilter,
	limit: u64,
) -> Result<Vec<SimpleNews>, BackendError> {
	let cursor_before =
		OffsetDateTime::from_unix_timestamp(filter.before.unwrap_or(TIME_MAX.unix_timestamp())).unwrap();
	let cursor_after = OffsetDateTime::from_unix_timestamp(filter.after.unwrap_or(TIME_MIN.unix_timestamp())).unwrap();
	let sort_order: aleym_core::db::SortOrder =
		filter
			.sort_order
			.map_or(aleym_core::db::SortOrder::Descending, |order| match order {
				SortOrder::Ascending => aleym_core::db::SortOrder::Ascending,
				SortOrder::Descending => aleym_core::db::SortOrder::Descending,
			});

	// construct the filter, gives precedence to source filters over category filters
	let full_filter = if let Some(source_id) = filter.source_id {
		NewsFilter {
			sources: Some(BySources::Identifiers(source_id)),
			text: filter.text.clone(),
			labels: filter.labels,
			is_read: filter.is_read,
		}
	} else if let Some(category_id) = filter.category_id {
		NewsFilter {
			sources: Some(BySources::Scope {
				directory: None,
				categories: Some(category_id),
			}),
			text: filter.text.clone(),
			labels: filter.labels,
			is_read: filter.is_read,
		}
	} else {
		let root_dir_uuid = state.repr.storage.get_root_directories().await?.pop().unwrap().id;
		NewsFilter {
			sources: Some(BySources::Scope {
				directory: Some(BySourceDirectory {
					parent_directory: root_dir_uuid,
					recursive: true,
				}),
				categories: None,
			}),
			text: filter.text.clone(),
			labels: filter.labels,
			is_read: filter.is_read,
		}
	};

	let news = state
		.repr
		.storage
		.get_news_with_filter(full_filter, sort_order, cursor_after, cursor_before, limit)
		.await?
		.into_iter()
		.map(|news_model| SimpleNews {
			id: news_model.id,
			source: news_model.source,
			title: clean_pure(&news_model.title),
			uri: news_model.uri,
			summary: news_model.summary.as_deref().map(clean_pure),
			has_content: news_model.content.is_some(),
			first_fetched_at: news_model.first_fetched_at.unix_timestamp(),
			last_fetched_at: news_model.last_fetched_at.unix_timestamp(),
			published_at: news_model.published_at.map(|time| time.unix_timestamp()),
			updated_at: news_model.updated_at.map(|time| time.unix_timestamp()),
			is_read: news_model.is_read,
		})
		.collect();
	Ok(news)
}

/// This function cleans unsafe html tags from summary and content but maintains the actual content formatting
#[tauri::command]
pub async fn get_news(state: State<'_, AppState>, id: Uuid) -> Result<News, BackendError> {
	let news_model = state.repr.storage.get_news(id).await?;
	Ok(News {
		id: news_model.id,
		source: news_model.source,
		title: clean_pure(&news_model.title),
		uri: news_model.uri,
		summary: news_model.summary.as_deref().map(clean),
		content: news_model.content.as_deref().map(clean),
		first_fetched_at: news_model.first_fetched_at.unix_timestamp(),
		last_fetched_at: news_model.last_fetched_at.unix_timestamp(),
		published_at: news_model.published_at.map(|t| t.unix_timestamp()),
		updated_at: news_model.updated_at.map(|t| t.unix_timestamp()),
		is_read: news_model.is_read,
	})
}

#[tauri::command]
pub async fn get_news_recommendations(
	state: State<'_, AppState>,
	limit: u64,
	candidates_limit: u64,
) -> Result<Vec<SimpleNews>, BackendError> {
	let mut rng: rand::rngs::StdRng = rand::make_rng();
	let news_models = state
		.repr
		.storage
		.get_news_recommendations(
			limit,
			candidates_limit,
			&aleym_core::ml::recommendation::Config::default(), // TODO: later on I will make it so users can modify their parameters
			&mut rng,                                           // tauri needs a sendable rng for async functions
		)
		.await?
		.into_iter()
		.map(|news_model| SimpleNews {
			id: news_model.id,
			source: news_model.source,
			title: news_model.title,
			uri: news_model.uri,
			summary: news_model.summary,
			has_content: news_model.content.is_some(),
			first_fetched_at: news_model.first_fetched_at.unix_timestamp(),
			last_fetched_at: news_model.last_fetched_at.unix_timestamp(),
			published_at: news_model.published_at.map(|time| time.unix_timestamp()),
			updated_at: news_model.updated_at.map(|time| time.unix_timestamp()),
			is_read: news_model.is_read,
		})
		.collect();

	Ok(news_models)
}

#[tauri::command]
pub async fn set_news_read(state: State<'_, AppState>, news: Vec<Uuid>, is_read: bool) -> Result<(), BackendError> {
	state.repr.storage.set_news_read(news, is_read).await?;
	Ok(())
}

fn clean_pure(html: &str) -> String {
	ammonia::Builder::new()
		.tags(std::collections::HashSet::new())
		.clean(html)
		.to_string()
}
