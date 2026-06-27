import { invoke } from "@tauri-apps/api/core";
import type { SimpleNews, News } from "../types/news";

export type SortOrder = "Ascending" | "Descending";
export const DEFAULT_FILTER: NewsSearchFilter = {
  sort_order: "Descending",
};
export interface NewsSearchFilter {
  after?: number | null;
  before?: number | null;
  sort_order?: SortOrder | null;
  source_id?: string[] | null;
  category_id?: string[] | null;
  text?: string | null;
  labels?: string[] | null;
  is_read?: boolean | null;
}


export async function getNewsWithFilter(
  filter: NewsSearchFilter,
  limit: number,
): Promise<SimpleNews[]> {
  return await invoke<SimpleNews[]>(
    "get_news_with_filter",
    { filter, limit },
  );
}

export async function getNews(id: string): Promise<News> {
  return await invoke<News>("get_news", { id });

 
}

export async function setNewsRead(
  news: string[],
  isRead: boolean,
): Promise<void> {
  return invoke("set_news_read", { news, isRead });
}
