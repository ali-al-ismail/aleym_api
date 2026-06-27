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
import { ExternalLink } from "lucide-react";
import { News } from "@/types/news";
import { Separator } from "./ui/separator";
import { memo } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
// might remove when I implement the News interface for the rust type
interface NewsCardProps {
  id: string;
  title: string;
  source_name: string | null;
  published_at: number | null;
  summary?: string | null;
  has_content: boolean;
  is_read: boolean;
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
  onClick,
}: NewsCardProps) {
  return (
    <div className="py-3 h-full">
      <Card
        onClick={() => onClick?.(id)}
        className={cn(
          "h-full flex flex-col transition-shadow duration-200 hover:shadow-lg cursor-pointer border-l-4",
          is_read
            ? "opacity-95 text-muted-foreground border-l-transparent"
            : "border-l-primary",
        )}
      >
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
