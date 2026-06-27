import { invoke } from "@tauri-apps/api/core";
import type { Config } from "../types/cfg";

export async function getConfig(): Promise<Config> {
  return invoke<Config>("get_config");
}

export async function updateConfig(config: Config): Promise<void> {
  return invoke("update_config", { config });
}


