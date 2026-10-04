import { useMemo } from "react";
import { trpc } from "@/providers/trpc";
import type { SheetRow } from "@/lib/sheet";

export type EditMap = Map<
  number,
  { projectNo: string | null; contractNo: string | null; note: string | null }
>;

/** Fetch all DB edits and expose them as a map keyed by Row ID */
export function useEdits() {
  const query = trpc.edits.list.useQuery(undefined, { staleTime: 10_000 });
  const editMap: EditMap = useMemo(() => {
    const m: EditMap = new Map();
    for (const e of query.data ?? []) {
      m.set(e.rowId, {
        projectNo: e.projectNo,
        contractNo: e.contractNo,
        note: e.note,
      });
    }
    return m;
  }, [query.data]);
  return { editMap, ...query };
}

/** Apply DB edits over sheet values for the editable fields */
export function applyEdits(row: SheetRow, editMap: EditMap): SheetRow {
  const e = editMap.get(row.__row);
  if (!e) return row;
  return {
    ...row,
    ...(e.projectNo !== null && e.projectNo !== "" ? { เลขที่โครงการ: e.projectNo } : {}),
    ...(e.contractNo !== null && e.contractNo !== "" ? { เลขคุมสัญญา: e.contractNo } : {}),
    ...(e.note !== null && e.note !== "" ? { Note: e.note } : {}),
  };
}
