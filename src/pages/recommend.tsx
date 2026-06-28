import { getNews, getNewsRecommendations, setNewsRead } from "@/commands/news";
import { SearchlessHeader } from "@/components/header";
import { NewsCard, NewsSheet } from "@/components/news-card";
import { useLabels } from "@/hooks/labelhooks";

import { useSources } from "@/hooks/sourcehooks";
import { News, SimpleNews } from "@/types/news";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LIMIT = 50;
const CANDIDATE_LIMIT = 200;

export function RecommendPage() {
  const queryClient = useQueryClient();
  const { data: sources } = useSources();
  const { data: labels } = useLabels();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);

  const {
    data: recommendations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recommendations", LIMIT, CANDIDATE_LIMIT],
    queryFn: () => getNewsRecommendations(LIMIT, CANDIDATE_LIMIT),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: selectedArticle, isLoading: articleLoading } = useQuery({
    queryKey: ["article", selectedId],
    queryFn: () => getNews(selectedId!),
    enabled: selectedId !== null,
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: markAsRead } = useMutation({
    mutationFn: (id: string) => setNewsRead([id], true),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["article", id] });

      const previousArticle = queryClient.getQueryData<News>(["article", id]);

      queryClient.setQueryData<News>(["article", id], (old) =>
        old ? { ...old, is_read: true } : old,
      );

      queryClient.setQueryData<SimpleNews[]>(
        ["recommendations", LIMIT, CANDIDATE_LIMIT],
        (old) =>
          old?.map((article) =>
            article.id === id ? { ...article, is_read: true } : article,
          ),
      );

      return { previousArticle };
    },
    onError: (_err, id, context) => {
      if (context?.previousArticle) {
        queryClient.setQueryData(["article", id], context.previousArticle);
      }
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: ["article", id] });
    },
  });

  useEffect(() => {
    if (!selectedArticle) return;
    if (selectedArticle.is_read) return;
    markAsRead(selectedArticle.id);
  }, [selectedArticle, markAsRead]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const columns = width >= 1536 ? 3 : width >= 768 ? 2 : 1;

  const rows = useMemo(() => {
    const items = recommendations ?? [];
    const r = [];
    for (let i = 0; i < items.length; i += columns) {
      r.push(items.slice(i, i + columns));
    }
    return r;
  }, [recommendations, columns]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizar = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 271,
    overscan: 3,
  });

  const handleCardClick = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <SearchlessHeader />

      <div ref={parentRef} className="flex-1 min-h-0 overflow-auto">
        {isLoading && !recommendations && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full text-destructive">
            Failed to load recommendations: {error.message}
          </div>
        )}

        {recommendations && (
          <div
            style={{
              height: virtualizar.getTotalSize(),
              position: "relative",
            }}
          >
            {virtualizar.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index] ?? [];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 px-4 py-2"
                >
                  {row.map((article) => (
                    <NewsCard
                      key={article.id}
                      id={article.id}
                      source_name={
                        sources?.byId.get(article.source)?.name ?? null
                      }
                      title={article.title}
                      published_at={article.published_at}
                      summary={article.summary}
                      has_content={article.has_content}
                      is_read={article.is_read}
                      uri={article.uri}
                      labels={labels}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NewsSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setTimeout(() => setSelectedId(null), 300);
          }
        }}
        article={selectedArticle}
        loading={articleLoading}
        sourceName={
          selectedArticle
            ? (sources?.byId.get(selectedArticle.source)?.name ?? null)
            : null
        }
      />
    </div>
  );
}
