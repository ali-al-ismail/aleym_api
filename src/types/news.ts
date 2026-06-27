


export interface SimpleNews {
    id: string;
    source: string;
    title: string;
    uri: string | null;
    has_content: boolean;
    summary: string | null;
    first_fetched_at: number;
    last_fetched_at: number;
    published_at: number | null;
    updated_at: number | null;
    is_read: boolean;
}

export interface News {
    id: string;
    source: string;
    title: string;
    uri: string | null;
    summary: string | null;
    content: string | null;
    first_fetched_at: number;
    last_fetched_at: number;
    published_at: number | null;
    updated_at: number | null;
    is_read: boolean;
}
