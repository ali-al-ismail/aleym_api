import { invoke } from "@tauri-apps/api/core";
import { Source, InterfaceType } from "@/types/sources";

/*
pub async fn add_source(
	state: State<'_, AppState>,
	name: String,
	description: Option<String>,
	network: InterfaceType,
	informant: InformantType,
) -> Result<Uuid, BackendError> {

pub async fn get_source(state: State<'_, AppState>, id: Uuid) -> Result<Source, BackendError> {


pub async fn edit_source(
	state: State<'_, AppState>,
	id: Uuid,
	network: Option<InterfaceType>,
	name: Option<String>,
	description: Option<Option<String>>,
	is_enabled: Option<bool>,
) -> Result<(), BackendError> {

pub async fn delete_source(state: State<'_, AppState>, id: Uuid) -> Result<(), BackendError> {
pub async fn get_all_sources(
	state: State<'_, AppState>,
	is_enabled: Option<bool>,
) -> Result<Vec<Source>, BackendError> {

pub async fn get_sources_by_category(state: State<'_, AppState>, category: Uuid) -> Result<Vec<Source>, BackendError> {*/

export async function getAllSources(isEnabled?: boolean): Promise<Source[]> {
    return invoke<Source[]>("get_all_sources", {isEnabled});
}