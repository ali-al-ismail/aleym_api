import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Sheet, SheetContent, SheetFooter, SheetHeader } from "./ui/sheet";
import {
  BookCheck,
  Bookmark,
  EllipsisVertical,
  ExternalLink,
} from "lucide-react";
import { News, SimpleNews } from "@/types/news";
import { Separator } from "./ui/separator";
import { memo, useMemo, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setNewsRead } from "@/commands/news";
import {
  InfiniteData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  assignLabelToNews,
  getLabelsOfNews,
  unassignLabelFromNews,
} from "@/commands/labels";
import { Label } from "@/types/labels";
import { LabelsResult } from "@/hooks/labelhooks";
// might remove when I implement the News interface for the rust type
interface NewsCardProps {
  id: string;
  title: string;
  source_name: string | null;
  published_at: number | null;
  summary?: string | null;
  has_content: boolean;
  is_read: boolean;
  uri: string | null;
  labels?: LabelsResult;
  onClick?: (id: string) => void;
}

function formatRelativeTimestamp(unixTimestamp: number): string {
  const now = Date.now();
  const articleTime = unixTimestamp * 1000;

  const diffSeconds = Math.floor((now - articleTime) / 1000);

  const minutes = Math.floor(diffSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(articleTime).toLocaleDateString();
}

function formatAbsoluteTimestamp(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const NewsCard = memo(function NewsCard({
  id,
  source_name,
  title,
  published_at,
  summary,
  is_read,
  uri,
  labels,
  onClick,
}: NewsCardProps) {
  const queryClient = useQueryClient();
  const [labelsOpen, setLabelsOpen] = useState(false);
  const { data: newsLabels } = useQuery({
    queryKey: ["news-labels", id],
    queryFn: () => getLabelsOfNews(id),
    enabled: labelsOpen,
    staleTime: 5 * 60 * 1000,
  });
  const { mutate: markAsRead } = useMutation({
    mutationFn: ({ id, is_read }: { id: string; is_read: boolean }) =>
      setNewsRead([id], is_read),

    onMutate: async ({ id, is_read }) => {
      await queryClient.cancelQueries({
        queryKey: ["news"],
      });

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
                      is_read,
                    }
                  : article,
              ),
            ),
          };
        },
      );

      queryClient.setQueryData<News>(["article", id], (old) =>
        old
          ? {
              ...old,
              is_read,
            }
          : old,
      );
    },

    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["article", id],
      });
    },
  });
  const assignedLabels = useMemo(
    () => new Set(newsLabels?.map((l) => l.id) ?? []),
    [newsLabels],
  );
  const { mutate: toggleLabel } = useMutation({
    mutationFn: ({
      newsId,
      labelId,
      assign,
    }: {
      newsId: string;
      labelId: string;
      assign: boolean;
    }) => {
      if (assign) {
        return assignLabelToNews(newsId, labelId);
      }

      return unassignLabelFromNews(newsId, labelId);
    },
    onMutate: async ({ newsId, labelId, assign }) => {
      await queryClient.cancelQueries({
        queryKey: ["news-labels", newsId],
      });

      const previousLabels = queryClient.getQueryData<Label[]>([
        "news-labels",
        newsId,
      ]);

      queryClient.setQueryData<Label[]>(["news-labels", newsId], (old = []) => {
        if (assign) {
          const label = labels?.list.find((l) => l.id === labelId);

          if (!label || old.some((l) => l.id === labelId)) {
            return old;
          }

          return [...old, label];
        }

        return old.filter((l) => l.id !== labelId);
      });

      return { previousLabels };
    },

    onError: (_err, variables, context) => {
      if (context?.previousLabels) {
        queryClient.setQueryData(
          ["news-labels", variables.newsId],
          context.previousLabels,
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["news-labels", variables.newsId],
      });
    },
  });
  return (
    <div className="py-3 h-full">
      <Card
        onClick={() => onClick?.(id)}
        className={cn(
          "relative h-full flex flex-col transition-shadow duration-200 hover:shadow-lg cursor-pointer border-l-4 group",
          is_read
            ? "opacity-95 text-muted-foreground border-l-transparent"
            : "border-l-primary",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <EllipsisVertical className="" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-40"
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuCheckboxItem
              checked={is_read}
              onCheckedChange={() => {
                markAsRead({
                  id,
                  is_read: !is_read,
                });
              }}
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            >
              <BookCheck className="mr-2" />
              Mark as read
            </DropdownMenuCheckboxItem>
            {uri && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openUrl(uri);
                }}
              >
                <ExternalLink className="mr-2" />
                Open Original
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuSub onOpenChange={setLabelsOpen}>
              <DropdownMenuSubTrigger className="flex items-center gap-2">
                <Bookmark className="mr-2" />
                Labels
                {assignedLabels.size > 0 && (
                  <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                    {assignedLabels.size}
                  </span>
                )}
              </DropdownMenuSubTrigger>

              <DropdownMenuPortal>
                <DropdownMenuSubContent className="p-3">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Assign labels
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {labels?.list.map((label) => {
                        const assigned = assignedLabels.has(label.id);

                        return (
                          <Button
                            key={label.id}
                            variant={assigned ? "default" : "outline"}
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();

                              toggleLabel({
                                newsId: id,
                                labelId: label.id,
                                assign: !assigned,
                              });
                            }}
                          >
                            {label.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        <CardHeader className="pb-3">
          {source_name ?? "No name"}

          <CardTitle
            className={cn(
              "text-xl leading-tight line-clamp-2",
              is_read ? "font-medium text-muted-foreground" : "font-bold",
            )}
          >
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1">
          {summary && (
            <p
              className={cn(
                "line-clamp-3 text-sm",
                is_read ? "text-muted-foreground/80" : "text-muted-foreground",
              )}
            >
              {summary}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-4 text-sm">
          {published_at ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default text-muted-foreground">
                  {formatRelativeTimestamp(published_at)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-sm bg-card text-card-foreground border shadow-md">
                <p>{formatAbsoluteTimestamp(published_at)}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-muted-foreground">No date</span>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                is_read ? "bg-muted-foreground/50" : "bg-primary",
              )}
            />
            <span>{is_read ? "Read" : "Unread"}</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
});

export function SkeletonCard() {
  return (
    <div className="py-3 h-full">
      <Card
        className={cn(
          "h-full flex flex-col transition-shadow duration-200 hover:shadow-lg cursor-pointer border-l-4",
        )}
      >
        <CardHeader className="pb-3">
          <Skeleton />
          <CardTitle className={cn("text-xl leading-tight line-clamp-2")}>
            <Skeleton />
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1">
          <Skeleton />
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-4 text-sm">
          <Skeleton />
        </CardFooter>
      </Card>
    </div>
  );
}

interface NewsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: News | null;
  loading: boolean;
  sourceName: string | null;
}

export function NewsSheet({
  open,
  onOpenChange,
  article,
  loading,
  sourceName,
}: NewsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className=" min-w-[85vw] lg:min-w-[70vw] xl:min-w-[65vw] max-w-none p-0 flex flex-col overflow-hidden min-h-0 duration-150"
      >
        {loading ? (
          <>
            <div className="border-b px-6 py-5 space-y-3 shrink-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-48" />
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-6 space-y-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </ScrollArea>
          </>
        ) : article ? (
          <>
            <SheetHeader className="border-b px-6 py-5 shrink-0 bg-background">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  {sourceName && (
                    <p className="text-lg text-muted-foreground mb-2">
                      {sourceName}
                    </p>
                  )}

                  <h1 className="text-2xl font-bold leading-tight break-words">
                    {article.title}
                  </h1>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    {article.published_at && (
                      <span>
                        Published:{" "}
                        {new Date(article.published_at * 1000).toLocaleString()}
                      </span>
                    )}

                    {article.updated_at != null &&
                      article.updated_at !== article.published_at && (
                        <span>
                          Last updated at:{" "}
                          {new Date(article.updated_at * 1000).toLocaleString()}
                        </span>
                      )}
                    <span>
                      Fetched:{" "}
                      {new Date(
                        article.last_fetched_at * 1000,
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {article.uri && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.uri} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Original
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 min-h-0">
              <p className="text-md text-muted-foreground px-5">Summary:</p>
              <div className="py-6 max-w-4xl mx-auto">
                {article.summary ? (
                  <blockquote className="border-l-4 pl-4 mb-8">
                    <div
                      className="prose prose-sm prose-netural dark:prose-invert max-w-none italic text-muted-foreground"
                      onClick={(e) => {
                        // makes external links open a new browser instead of opening within the webview, which basically softlocked the application
                        const target = e.target as HTMLElement;
                        const link = target.closest("a");
                        if (link?.href) {
                          e.preventDefault();
                          openUrl(link.href);
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: article.summary,
                      }}
                    />
                  </blockquote>
                ) : (
                  <p className="text-muted-foreground">No summary found.</p>
                )}
              </div>

              <div className="">
                <Separator />
                <div className="py-3 px-4">
                  {article.content ? (
                    <div
                      className="
                      prose prose-neutral dark:prose-invert max-w-none prose-img:max-w-full prose-img:h-auto"
                      dangerouslySetInnerHTML={{
                        __html: article.content,
                      }}
                    />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        This source does not provide a content field, you must
                        visit the original to see the full content.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
            <SheetFooter></SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
