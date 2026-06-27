
import { getAllNewsLabels } from "@/commands/labels";
import { Label } from "@/types/labels";
import { QueryClient, useQuery } from "@tanstack/react-query";

export const LABEL_QUERY_KEY = ["labels"] as const;

export type LabelsResult = {
  list: Label[];
  byId: Map<string, Label>;
};

export function useLabels() {
  return useQuery<Label[], Error, LabelsResult>({
    queryKey: LABEL_QUERY_KEY,
    queryFn: () => getAllNewsLabels(),
    staleTime: Infinity,
    gcTime: Infinity,
    select: (labels) => ({
      list: labels,
      byId: new Map<string, Label>(
        labels.map((label) => [label.id, label]),
      ),
    }),
  });
}

export function invalidateLabels(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: LABEL_QUERY_KEY,
  });
}

export function getLabelName(
  labels: LabelsResult | undefined,
  id: string,
) {
  return labels?.byId.get(id);
}