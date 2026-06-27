export interface Network {
  tor_proxy_port: number;
}

export interface Paths {
  db_file: string;
}

export interface Scheduler {
  min_fetch_interval: number;
  max_fetch_interval: number;
  short_term_cutoff_time: number;
  long_term_cutoff_time: number;
  fetch_freshness_bias: number;
  signals_count_limit: number;
  publication_window_new_items_count_threshold: number;
}

export interface Config {
  network: Network;
  paths: Paths;
  scheduler: Scheduler;
}