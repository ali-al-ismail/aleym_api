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

// might remove when I implement the News interface for the rust type
interface NewsCardProps {
  source: string;
  title: string;
  date_published: number;
  summary?: string | null;
  is_read: boolean;
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

export function NewsCard({
  source,
  title,
  date_published,
  summary,
  is_read,
}: NewsCardProps) {
  return (
    <div className="py-3 h-full">
      <Card
        className={cn(
          "h-full flex flex-col transition-shadow duration-200 hover:shadow-lg cursor-pointer border-l-4",
          is_read
            ? "opacity-95 text-muted-foreground border-r-transparent"
            : "border-l-primary",
        )}
      >
        <CardHeader className="pb-3">
          <div
            className={cn(
              "w-fit rounded-md border px-3 py-1 text-sm font-medium mb-2",
              is_read && "text-muted-foreground",
            )}
          >
            {source}
          </div>

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
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default text-muted-foreground">
                {formatRelativeTimestamp(date_published)}
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-sm bg-card text-card-foreground border shadow-md">
              <p>{formatAbsoluteTimestamp(date_published)}</p>
            </TooltipContent>
          </Tooltip>

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
}
