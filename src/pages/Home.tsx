import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, ClipboardList, PackageCheck, PackageSearch, RefreshCw, Truck } from "lucide-react";
import { useSheet } from "@/hooks/useSheet";
import { useEdits, applyEdits } from "@/hooks/useEdits";
import { MasterTable } from "@/components/MasterTable";
import { DetailDialog } from "@/components/DetailDialog";
import { AppNavbar } from "@/components/AppNavbar";
import type { SheetRow } from "@/lib/sheet";

const COLORS = ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />
    </div>
  );
}

export default function Home() {
  const { data, isLoading, isError, error, refetch, isRefetching, dataUpdatedAt } = useSheet(1);
  const { editMap } = useEdits();
  const [filteredRows, setFilteredRows] = useState<SheetRow[] | null>(null);
  const [selectedRow, setSelectedRow] = useState<SheetRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Overlay DB edits (เลขที่โครงการ / เลขคุมสัญญา / NOTE) onto sheet data
  const mergedData = useMemo(
    () => (data ?? []).map((r) => applyEdits(r, editMap)),
    [data, editMap]
  );

  const statsRows = filteredRows ?? mergedData;

  const kpis = useMemo(() => {
    const received = statsRows.filter(
      (r) => String(r["สถานะรับยา"] ?? "").toUpperCase() === "TRUE"
    ).length;
    const pending = statsRows.length - received;
    const totalValue = statsRows.reduce((s, r) => s + (Number(r["คำนวนราคารวม"]) || 0), 0);
    return [
      { label: "รายการจัดซื้อทั้งหมด", value: statsRows.length, icon: ClipboardList, color: "text-sky-600 bg-sky-50", format: "int" as const },
      { label: "รับยาจากขนส่งแล้ว", value: received, icon: PackageCheck, color: "text-emerald-600 bg-emerald-50", format: "int" as const },
      { label: "รอรับยาจากขนส่ง", value: pending, icon: Truck, color: "text-amber-600 bg-amber-50", format: "int" as const },
      { label: "มูลค่ารวม (บาท)", value: totalValue, icon: Building2, color: "text-indigo-600 bg-indigo-50", format: "money" as const },
    ];
  }, [statsRows]);

  const deliveryChart = useMemo(() => {
    const received = statsRows.filter(
      (r) => String(r["สถานะรับยา"] ?? "").toUpperCase() === "TRUE"
    ).length;
    return [
      { name: "รับยาแล้ว", value: received, color: "#10b981" },
      { name: "รอรับยา", value: statsRows.length - received, color: "#f59e0b" },
    ];
  }, [statsRows]);

  const companyChart = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of statsRows) {
      const c = String(r["บริษัท"] ?? "ไม่ระบุ");
      m.set(c, (m.get(c) ?? 0) + (Number(r["คำนวนราคารวม"]) || 0));
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [statsRows]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppNavbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {/* Page header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              e-EP Tracking Viewer
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              ระบบติดตามการจัดซื้อเวชภัณฑ์ · ห้องยา โรงพยาบาลสบปราบ
            </p>
          </div>
          <div className="flex items-center gap-3">
            {dataUpdatedAt > 0 && (
              <span className="text-xs text-slate-400">
                อัปเดตล่าสุด{" "}
                {new Date(dataUpdatedAt).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {isRefetching && " · กำลังซิงค์…"}
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              รีเฟรชข้อมูล
            </button>
          </div>
        </header>

        {isLoading ? (
          <Skeleton />
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-medium text-red-700">ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้</p>
            <p className="mt-1 text-sm text-red-500">{(error as Error)?.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg p-2 ${k.color}`}>
                      <k.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {k.format === "money"
                          ? k.value.toLocaleString("th-TH", { maximumFractionDigits: 2 })
                          : k.value.toLocaleString("th-TH")}
                      </p>
                      <p className="text-xs text-slate-500">{k.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="mb-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <PackageSearch className="h-4 w-4 text-slate-400" />
                  สถานะรับยาจากขนส่ง
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={deliveryChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {deliveryChart.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${Number(v).toLocaleString("th-TH")} รายการ`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold text-slate-700">
                  มูลค่าจัดซื้อรวมแยกตามบริษัท (Top 10)
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={companyChart} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: number) =>
                        v >= 1_000_000
                          ? `${(v / 1_000_000).toFixed(1)}M`
                          : v >= 1_000
                            ? `${(v / 1_000).toFixed(0)}K`
                            : String(v)
                      }
                    />
                    <Tooltip
                      formatter={(v) => [
                        `${Number(v).toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท`,
                        "มูลค่าจัดซื้อ",
                      ]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {companyChart.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Master table */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                รายการจัดซื้อ (Master View)
              </h2>
              <MasterTable
                data={mergedData}
                editMap={editMap}
                onViewDetail={(row) => {
                  setSelectedRow(row);
                  setDialogOpen(true);
                }}
                onFilteredRowsChange={setFilteredRows}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-4 text-center text-xs text-slate-400">
        ®TNP Developer 2027 Sobprab Pharmacy Department
      </footer>

      <DetailDialog
        row={selectedRow}
        editMap={editMap}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
