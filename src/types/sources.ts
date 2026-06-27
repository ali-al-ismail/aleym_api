import { useQuery } from "@tanstack/react-query";

export interface Source {
  id: string;
  parent_directory: string;
  informant: Record<string, unknown>; // TODO: figure out a better way to do this. these get serialized into json by rust so its okay for now
  network: InterfaceType;
  name: string;
  description: string | null;
  icon_uri: string | null;
  logo_uri: string | null;
  custom_id: string | null;
  is_enabled: boolean;
  provided_ttl: number | null;
}

export type InterfaceType =
  | "TestPlaceholder"
  | "Clear"
  | "Tor";


