import { Fragment, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  FilterX,
  PencilLine,
} from "lucide-react";
import type { SheetRow } from "@/lib/sheet";
import type { EditMap } from "@/hooks/useEdits";

const CATEGORICAL_COLUMNS = new Set(["บริษัท", "สถานะรับยา", "สถานะตรวจรับ"]);

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString("th-TH", { maximumFractionDigits: 2 });
  return String(v);
}

function DeliveryBadge({ value }: { value: unknown }) {
  const received = String(value ?? "").toUpperCase() === "TRUE";
  return received ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
      รับยาแล้ว
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
      รอรับยา
    </span>
  );
}

export function MasterTable({
  data,
  editMap,
  onViewDetail,
  onFilteredRowsChange,
}: {
  data: SheetRow[];
  editMap: EditMap;
  onViewDetail: (row: SheetRow) => void;
  onFilteredRowsChange?: (rows: SheetRow[]) => void;
}) {
  const [searchInput, setSearchInput] = useState("");
  const globalFilter = useDebounced(searchInput);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "PO", desc: false }]);

  const columns = useMemo<ColumnDef<SheetRow>[]>(
    () => [
      {
        accessorKey: "__row",
        header: "Row ID",
        enableGlobalFilter: false,
        enableColumnFilter: false,
        cell: (info) => (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-500">
            #{String(info.getValue())}
            {editMap.has(Number(info.getValue())) && (
              <PencilLine className="h-3 w-3 text-sky-500" aria-label="มีการแก้ไขจากระบบ" />
            )}
          </span>
        ),
      },
      { accessorKey: "PO", header: "PO", cell: (i) => <span className="font-medium text-slate-800">{fmt(i.getValue())}</span> },
      { accessorKey: "วันที่ขอ", header: "วันที่ขอ", cell: (i) => fmt(i.getValue()) },
      { accessorKey: "ชื่อเวชภัณฑ์", header: "ชื่อเวชภัณฑ์", cell: (i) => fmt(i.getValue()) },
      { accessorKey: "บริษัท", header: "บริษัท", cell: (i) => fmt(i.getValue()) },
      {
        accessorKey: "จัดซื้อ",
        header: "จัดซื้อ",
        cell: (i) => (
          <span className="whitespace-nowrap">
            {fmt(i.getValue())} {fmt(i.row.original["Unit"])}
          </span>
        ),
      },
      {
        accessorKey: "สถานะรับยา",
        header: "สถานะรับยาจากขนส่ง",
        cell: (i) => <DeliveryBadge value={i.getValue()} />,
        filterFn: (row, id, value) =>
          value === undefined || value === "" ? true : String(row.getValue(id) ?? "") === String(value),
      },
      { accessorKey: "สถานะตรวจรับ", header: "สถานะตรวจรับ", cell: (i) => fmt(i.getValue()) },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        enableColumnFilter: false,
        cell: (i) => (
          <button
            onClick={() => onViewDetail(i.row.original)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-sky-700 shadow-sm hover:bg-sky-50"
          >
            <Eye className="h-3.5 w-3.5" /> รายละเอียด
          </button>
        ),
      },
    ],
    [editMap, onViewDetail]
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, columnFilters, sorting },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
    autoResetPageIndex: false,
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const sortedRows = table.getSortedRowModel().rows;

  // PO group boundaries: divider where PO changes in the current sorted order
  const poGroupStarts = useMemo(() => {
    const stats = new Map<string, { count: number; sum: number }>();
    for (const r of sortedRows) {
      const po = String(r.original["PO"] ?? "ไม่ระบุ");
      const s = stats.get(po) ?? { count: 0, sum: 0 };
      s.count += 1;
      s.sum += Number(r.original["คำนวนราคารวม"]) || 0;
      stats.set(po, s);
    }
    const starts = new Map<string, { po: string; count: number; sum: number }>();
    let prev: string | null = null;
    for (const r of sortedRows) {
      const po = String(r.original["PO"] ?? "ไม่ระบุ");
      if (po !== prev) {
        const s = stats.get(po)!;
        starts.set(r.id, { po, count: s.count, sum: s.sum });
        prev = po;
      }
    }
    return starts;
  }, [sortedRows]);

  useEffect(() => {
    onFilteredRowsChange?.(filteredRows.map((r) => r.original));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRows.length, globalFilter, columnFilters, data]);

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = filteredRows.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);
  const hasFilters = globalFilter !== "" || columnFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ค้นหา PO, ชื่อเวชภัณฑ์, บริษัท…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setSearchInput("");
              setColumnFilters([]);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <FilterX className="h-4 w-4" /> ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Table */}
      <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-slate-100">
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={`select-none whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                        header.column.getCanSort() ? "cursor-pointer hover:bg-slate-200/70" : ""
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() &&
                          (sorted === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-sky-600" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-sky-600" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                          ))}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
            {/* Per-column filter row */}
            <tr className="bg-white">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => {
                  const col = header.column;
                  if (!col.getCanFilter()) {
                    return <th key={header.id} className="border-b border-slate-200" />;
                  }
                  const key = col.id;
                  const faceted = col.getFacetedUniqueValues();
                  if (CATEGORICAL_COLUMNS.has(key) && faceted.size <= 60) {
                    const options = [...faceted.keys()]
                      .map((o) => String(o ?? ""))
                      .sort((a, b) => a.localeCompare(b, "th"));
                    return (
                      <th key={header.id} className="border-b border-slate-200 px-2 py-1.5">
                        <select
                          value={(col.getFilterValue() as string) ?? ""}
                          onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-normal text-slate-600 outline-none focus:border-sky-500"
                        >
                          <option value="">ทั้งหมด</option>
                          {options.map((o) => (
                            <option key={o} value={o}>
                              {o.toUpperCase() === "TRUE" ? "รับยาแล้ว" : o === "" ? "(ว่าง)" : o}
                            </option>
                          ))}
                        </select>
                      </th>
                    );
                  }
                  return (
                    <th key={header.id} className="border-b border-slate-200 px-2 py-1.5">
                      <input
                        value={(col.getFilterValue() as string) ?? ""}
                        onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                        placeholder="กรอง…"
                        className="w-full min-w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-normal text-slate-600 outline-none focus:border-sky-500"
                      />
                    </th>
                  );
                })
              )}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-slate-400">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา / ตัวกรอง
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const group = poGroupStarts.get(row.id);
                return (
                  <Fragment key={row.id}>
                    {group && (
                      <tr className="bg-sky-50/80">
                        <td
                          colSpan={columns.length}
                          className="border-y border-sky-200 px-4 py-1.5 text-xs font-semibold text-sky-800"
                        >
                          📦 PO {group.po} · {group.count.toLocaleString("th-TH")} รายการ ·
                          มูลค่ารวม{" "}
                          {group.sum.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท
                        </td>
                      </tr>
                    )}
                    <tr className="transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-sky-50/60">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="border-b border-slate-100 px-4 py-2.5 text-slate-700"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>
          แสดง {from.toLocaleString("th-TH")}–{to.toLocaleString("th-TH")} จาก{" "}
          {total.toLocaleString("th-TH")} รายการ
          {total !== data.length && ` (กรองจากทั้งหมด ${data.length.toLocaleString("th-TH")})`}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm shadow-sm"
          >
            {[10, 25, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} / หน้า
              </option>
            ))}
          </select>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm hover:bg-slate-50 disabled:opacity-40"
          >
            ถัดไป <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
