import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchBar } from "./search-bar";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, EllipsisVertical } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { useCallback, useState } from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { DEFAULT_FILTER, NewsSearchFilter, SortOrder } from "@/commands/news";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { SourcesResult } from "@/hooks/sourcehooks";
import { CategoriesResult } from "@/hooks/categoryhooks";
import { LabelsResult } from "@/hooks/labelhooks";

type HeaderProps = {
  searchText: string;
  onSearchChange: (value: string) => void;
  filter: NewsSearchFilter;
  setFilter: React.Dispatch<React.SetStateAction<NewsSearchFilter>>;
  sources?: SourcesResult;
  categories?: CategoriesResult;
  labels?: LabelsResult;
};
// split into 3 divs left, center, right
export function Header({
  searchText,
  onSearchChange,
  filter,
  setFilter,
  sources,
  categories,
  labels,
}: HeaderProps) {
  return (
    <header className="bg-background/80 z-10 backdrop-blur sticky top-0 flex h-(--header-height) shrink-0 items-center gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      {/*left div*/}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
      </div>
      {/*center div*/}
      <div className="flex min-w-0 flex-1 justify-center items-center gap-2">
        <SearchBar
          value={searchText}
          onChange={onSearchChange}
          className="w-full max-w-md"
        />

        <AdvancedSearchButton
          filter={filter}
          setFilter={setFilter}
          sources={sources}
          categories={categories}
          labels={labels}
        />
      </div>
      {/*right div*/}
      <div className="flex items-center gap-2"></div>
    </header>
  );
}

export function AdvancedSearchButton({
  filter,
  setFilter,
  sources,
  categories,
  labels,
}: {
  filter: NewsSearchFilter;
  setFilter: React.Dispatch<React.SetStateAction<NewsSearchFilter>>;
  sources?: SourcesResult;
  categories?: CategoriesResult;
  labels?: LabelsResult;
}) {
  const [open, setOpen] = useState(false);

  const updateFilter = useCallback(
    (updates: Partial<NewsSearchFilter>) => {
      setFilter((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [setFilter],
  );

  const toggleSource = (id: string) => {
    const current = filter.source_id ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    updateFilter({ source_id: next.length ? next : null, category_id: null });
  };

  const toggleCategory = (id: string) => {
    const current = filter.category_id ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    updateFilter({ category_id: next.length ? next : null, source_id: null });
  };

  const toggleLabel = (label: string) => {
    const current = filter.labels ?? [];
    const next = current.includes(label)
      ? current.filter((x) => x !== label)
      : [...current, label];
    updateFilter({ labels: next.length ? next : null });
  };

  const clearFilters = () => setFilter(DEFAULT_FILTER);

  const hasActiveFilters =
    filter.text ||
    filter.after ||
    filter.before ||
    filter.source_id?.length ||
    filter.category_id?.length ||
    filter.labels?.length ||
    (filter.is_read !== null && filter.is_read !== undefined);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="icon"
          className="relative shrink-0"
        >
          <EllipsisVertical className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] max-h-[70vh] overflow-y-auto p-0"
        align="end"
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-popover z-10">
          <h4 className="font-semibold text-sm">Filters</h4>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="divide-y">
          {/* sources  */}
          {sources?.list && (
            <Collapsible>
              <CollapsibleTrigger className="group flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sources
                  </p>

                  {(filter.source_id?.length ?? 0) > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                      {filter.source_id!.length}
                    </span>
                  )}
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {sources.list.map((source) => (
                    <Button
                      key={source.id}
                      variant={
                        filter.source_id?.includes(source.id)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleSource(source.id)}
                      disabled={(filter.category_id?.length ?? 0) > 0}
                    >
                      {source.name}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* categories */}
          {categories?.list && (
            <Collapsible>
              <CollapsibleTrigger className="group flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Categories
                  </p>
                  {(filter.category_id?.length ?? 0) > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                      {filter.category_id!.length}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {categories.list.map((category) => (
                    <Button
                      key={category.id}
                      variant={
                        filter.category_id?.includes(category.id)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleCategory(category.id)}
                      disabled={(filter.source_id?.length ?? 0) > 0}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* date range TODO: doesnt work properly right now */}
          <Collapsible>
            <CollapsibleTrigger className="group flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Date Range
                </p>
                {(filter.after || filter.before) && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                    {[filter.after && "after", filter.before && "before"]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-3 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">After</p>
                  <Calendar
                    mode="single"
                    selected={filter.after ? new Date(filter.after) : undefined}
                    onSelect={(date) =>
                      updateFilter({
                        after: date ? Math.floor(date.getTime() / 1000) : null,
                      })
                    }
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Before</p>
                  <Calendar
                    mode="single"
                    selected={
                      filter.before ? new Date(filter.before) : undefined
                    }
                    onSelect={(date) =>
                      updateFilter({
                        before: date ? Math.floor(date.getTime() / 1000) : null,
                      })
                    }
                    className="rounded-md border"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* labels  */}
          {labels?.list && (
            <Collapsible>
              <CollapsibleTrigger className="group flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Labels
                  </p>
                  {(filter.labels?.length ?? 0) > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                      {filter.labels!.length}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {labels.list.map((label) => (
                      <Button
                        key={label.id}
                        variant={
                          filter.labels?.includes(label.id)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleLabel(label.id)}
                      >
                        {label.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          {/* sort order */}
          <div className="px-4 py-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sort
            </p>
            <RadioGroup
              value={filter.sort_order ?? "Descending"}
              onValueChange={(value) =>
                updateFilter({ sort_order: value as SortOrder })
              }
              className="flex gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="Descending" id="descending" />
                <Label
                  htmlFor="descending"
                  className="text-sm font-normal cursor-pointer"
                >
                  Newest first
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="Ascending" id="ascending" />
                <Label
                  htmlFor="ascending"
                  className="text-sm font-normal cursor-pointer"
                >
                  Oldest first
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* read status */}
          <div className="px-4 py-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </p>
            <RadioGroup
              value={
                filter.is_read === null || filter.is_read === undefined
                  ? "all"
                  : filter.is_read
                    ? "read"
                    : "unread"
              }
              onValueChange={(value) =>
                updateFilter({
                  is_read: value === "all" ? null : value === "read",
                })
              }
              className="flex gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="all" id="all" />
                <Label
                  htmlFor="all"
                  className="text-sm font-normal cursor-pointer"
                >
                  Any
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="unread" id="unread" />
                <Label
                  htmlFor="unread"
                  className="text-sm font-normal cursor-pointer"
                >
                  Unread
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="read" id="read" />
                <Label
                  htmlFor="read"
                  className="text-sm font-normal cursor-pointer"
                >
                  Read
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
