import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  getNewsWithFilter,
  getNews,
  setNewsRead,
  DEFAULT_FILTER,
} from "../commands/news";
import { NewsCard, NewsSheet } from "@/components/news-card";
import { Loader2 } from "lucide-react";
import type { News, SimpleNews } from "../types/news";
import { Header } from "@/components/header";
import { useSources } from "@/hooks/sourcehooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCategories } from "@/hooks/categoryhooks";
import { useLabels } from "@/hooks/labelhooks";
const PAGE_LIMIT = 50;
//type View = "grid" | "list";

// TODO: i dont know if the infinite scrolling works reliably just yet
// TODO: make sure virtualization is reliable
export function NewsPage() {
  const queryClient = useQueryClient();
  const { data: sources } = useSources();
  const { data: categories } = useCategories();
  const { data: labels } = useLabels();

  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // const [view, setView] = useState<View>("grid"); // TODO: USE LOCAL STORAGE TO REMEMBER PREFERENCE LATER

  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      text: debouncedSearch.trim() || null,
    }));
  }, [debouncedSearch]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["news", filter],
    queryFn: async ({ pageParam }) => {
      return getNewsWithFilter(
        {
          ...filter,
          before: pageParam,
        },
        PAGE_LIMIT,
      );
    },
    staleTime: 60000, // probably not ideal but we do invalidate the cache if the news change so it might be fine
    gcTime: 30 * 60000,
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage: SimpleNews[]) => {
      if (lastPage.length < PAGE_LIMIT) return undefined;
      return lastPage[lastPage.length - 1].first_fetched_at - 1;
    },
  });

  // hopefully improves performance
  const articles = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data?.pages]);

  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // set up for virtualization
  const columns = width >= 1536 ? 3 : width >= 768 ? 2 : 1;
  const rows = useMemo(() => {
    const r = [];

    for (let i = 0; i < articles.length; i += columns) {
      r.push(articles.slice(i, i + columns));
    }

    return r;
  }, [articles, columns]);
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizar = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 271,
    overscan: 3,
  });

  const items = virtualizar.getVirtualItems();
  const lastVirtualRow = items[items.length - 1];
  useEffect(() => {
    if (
      lastVirtualRow &&
      lastVirtualRow.index >= rows.length - 3 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    lastVirtualRow?.index,
    rows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // get selected article
  const { data: selectedArticle, isLoading: articleLoading } = useQuery({
    queryKey: ["article", selectedId],
    queryFn: () => getNews(selectedId!),
    enabled: selectedId !== null,
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: markAsRead } = useMutation({
    mutationFn: (id: string) => setNewsRead([id], true),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ["news"],
      });

      await queryClient.cancelQueries({
        queryKey: ["article", id],
      });

      const previousNews = queryClient.getQueriesData<
        InfiniteData<SimpleNews[]>
      >({
        queryKey: ["news"],
      });

      const previousArticle = queryClient.getQueryData<News>(["article", id]);
      queryClient.setQueryData<News>(["article", id], (old) =>
        old
          ? {
              ...old,
              is_read: true,
            }
          : old,
      );
      queryClient.setQueriesData<InfiniteData<SimpleNews[]>>(
        {
          queryKey: ["news"],
        },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((article) =>
                article.id === id
                  ? {
                      ...article,
                      is_read: true,
                    }
                  : article,
              ),
            ),
          };
        },
      );

      return {
        previousNews,
        previousArticle,
      };
    },

    onError: (_err, id, context) => {
      context?.previousNews?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });

      if (context?.previousArticle) {
        queryClient.setQueryData(["article", id], context.previousArticle);
      }
    },

    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({
        queryKey: ["article", id],
      });
    },
  });
  // mark read on cklick
  // maybe merge this with handlecardclick if I figure out how
  useEffect(() => {
    if (!selectedArticle) return;
    if (selectedArticle.is_read) return;

    markAsRead(selectedArticle.id);
  }, [selectedArticle, markAsRead]);

  const handleCardClick = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  useEffect(() => {
    parentRef.current?.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [filter]);

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header
          searchText={searchText}
          onSearchChange={setSearchText}
          filter={filter}
          setFilter={setFilter}
          categories={categories}
          sources={sources}
          labels={labels}
        />

        <div ref={parentRef} className="flex-1 min-h-0 overflow-auto">
          {isLoading && !data && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full text-destructive">
              Failed to load news: {error.message}
            </div>
          )}
          {data && articles.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No articles matched your filters.
            </div>
          )}

          {data && (
            <div
              style={{
                height: virtualizar.getTotalSize(),
                position: "relative",
              }}
            >
              {items.map((virtualRow) => {
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

              {isFetchingNextPage && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Loader2 className="animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <NewsSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);

          if (!open) {
            setTimeout(() => {
              setSelectedId(null);
            }, 300);
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
    </>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
