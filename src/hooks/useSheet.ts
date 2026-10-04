import { useQuery } from "@tanstack/react-query";
import { fetchSheetRows, SHEET_CSV_URL, type SheetRow } from "@/lib/sheet";

export function useSheet(refetchMinutes = 1) {
  return useQuery<SheetRow[]>({
    queryKey: ["sheet", SHEET_CSV_URL],
    queryFn: () => fetchSheetRows(),
    refetchInterval: refetchMinutes * 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    retry: 2,
  });
}
