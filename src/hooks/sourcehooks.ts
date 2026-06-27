import { getAllSources } from "@/commands/sources";
import { Source } from "@/types/sources";
import { QueryClient, useQuery } from "@tanstack/react-query";

export const SOURCE_QUERY_KEY = ["sources"] as const;

export type SourcesResult = {
  list: Source[];
  byId: Map<string, Source>;
};

export function useSources() {
  return useQuery<Source[], Error, SourcesResult>({
    queryKey: SOURCE_QUERY_KEY,
    queryFn: () => getAllSources(),
    staleTime: Infinity,
    gcTime: Infinity,
    select: (sources) => ({
      list: sources,
      byId: new Map<string, Source>(
        sources.map((source) => [source.id, source]),
      ),
    }),
  });
}

export function invalidateSources(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: SOURCE_QUERY_KEY,
  });
}

export function getSourceName(
  sources: SourcesResult | undefined,
  id: string,
) {
  return sources?.byId.get(id);
}