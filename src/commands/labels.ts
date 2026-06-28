import { invoke } from "@tauri-apps/api/core";
import type { Label } from "@/types/labels";


export async function createNewsLabel(
  name: string,
  description: string | null
): Promise<string> {
  return invoke<string>("create_news_label", { name, description });
}


export async function getAllNewsLabels(
): Promise<Label[]> {
  return invoke<Label[]>("get_all_news_labels");
}

export async function getNewsLabel(id: string
): Promise<Label> {
  return invoke<Label>("get_news_label", {id});
}

export async function getLabelsOfNews(id: string
): Promise<Label[]> {
  return invoke<Label[]>("get_labels_of_news", {id});
}

export async function deleteNewsLabel(id: string
): Promise<void> {
  return invoke<void>("delete_news_label", {id});
}

export async function editNewsLabel(id: string, name: string | null, description: string | null
): Promise<void> {
  return invoke<void>("edit_news_label", {id, name, description});
}

export async function assignLabelToNews(sourceId: string, labelId: string
): Promise<void> {
  return invoke<void>("assign_label_to_news", {sourceId, labelId});
}
export async function unassignLabelFromNews(sourceId: string, labelId: string
): Promise<void> {
  return invoke<void>("unassign_label_from_news", {sourceId, labelId});
}

