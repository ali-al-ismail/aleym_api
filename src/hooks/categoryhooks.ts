import { getAllCategories } from "@/commands/categories";
import { Category } from "@/types/categories";
import { QueryClient, useQuery } from "@tanstack/react-query";

export const CATEGORY_QUERY_KEY = ["categories"] as const;

export type CategoriesResult = {
  list: Category[];
  byId: Map<string, Category>;
};

export function useCategories() {
  return useQuery<Category[], Error, CategoriesResult>({
    queryKey: CATEGORY_QUERY_KEY,
    queryFn: () => getAllCategories(),
    staleTime: Infinity,
    gcTime: Infinity,
    select: (categories) => ({
      list: categories,
      byId: new Map<string, Category>(
        categories.map((category) => [category.id, category]),
      ),
    }),
  });
}

export function invalidateCategories(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: CATEGORY_QUERY_KEY,
  });
}

export function getCategoryName(
  categories: CategoriesResult | undefined,
  id: string,
) {
  return categories?.byId.get(id);
}