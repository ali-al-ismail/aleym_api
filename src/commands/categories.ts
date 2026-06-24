import { invoke } from "@tauri-apps/api/core";
import type { Category } from "../types/categories";

export async function getCategories(): Promise<Category[]> {
  return invoke<Category[]>("get_categories");
}

export async function createCategory(
  name: string,
  description: string | null
): Promise<string> {
  return invoke<string>("create_category", { name, description });
}

export async function editCategory(
  id: string,
  name: string | null,
  description: string | null
): Promise<void> {
  return invoke("edit_category", { id, name, description });
}

export async function deleteCategory(id: string): Promise<void> {
  return invoke("delete_category", { id });
}