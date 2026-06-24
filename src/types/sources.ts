export interface Source {
  id: string;
  parent_directory: string;
  //informant: InformantType;
  //interface: InterfaceType;
  name: string;
  description: string | null;
  icon_uri: string | null;
  logo_uri: string | null;
  custom_id: string | null;
  is_enabled: boolean;
  provided_ttl: number | null;
}