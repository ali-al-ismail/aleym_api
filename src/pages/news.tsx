import { NewsCard } from "@/components/news-card";

export function NewsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 mx-4 ">
      <NewsCard
        date_published={1782311249}
        title="title"
        summary="summary"
        source="source"
        is_read={true}
      />
      <NewsCard
        date_published={1782311249}
        title="title"
        summary="summary"
        source="source"
        is_read={true}
      />
      <NewsCard
        date_published={1782311249}
        title="title thats slightly longer"
        summary="summary thats so very kinda longer than sort of expected its just rambling on and on and on and on and it wont stop why wont it stop please stop its too long"
        source="source"
        is_read={false}
      />
      <NewsCard
        date_published={1782311249}
        title="title thats even more than slightly longer than usual"
        summary="summary thats so very kinda short"
        source="source"
        is_read={true}
      />
      <NewsCard
        date_published={1782311249}
        title="title"
        summary="summary"
        source="source"
        is_read={true}
      />
    </div>
  );
}
