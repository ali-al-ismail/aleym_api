import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { useQuery } from "@tanstack/react-query";

export function useAppInfo() {
  return useQuery({
    queryKey: ["app-info"],
    queryFn: async () => {
      const [version, [buildDate, hash]] = await Promise.all([
        getVersion(),
        invoke<[string, string]>("get_build_info"),
      ]);
      return { version, buildDate, hash };
    },
    staleTime: Infinity, 
    gcTime: Infinity,    
})
}