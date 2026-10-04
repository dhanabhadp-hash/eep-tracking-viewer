import { useEffect, useState } from "react";
import { Save, Loader2, Hash } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { trpc } from "@/providers/trpc";
import { HIDDEN_COLUMNS, type SheetRow } from "@/lib/sheet";
import type { EditMap } from "@/hooks/useEdits";

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString("th-TH", { maximumFractionDigits: 2 });
  return String(v);
}

export function DetailDialog({
  row,
  editMap,
  open,
  onOpenChange,
}: {
  row: SheetRow | null;
  editMap: EditMap;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const upsert = trpc.edits.upsert.useMutation({
    onSuccess: () => {
      utils.edits.list.invalidate();
      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
    },
    onError: (err) => toast.error(`บันทึกไม่สำเร็จ: ${err.message}`),
  });

  const [projectNo, setProjectNo] = useState("");
  const [contractNo, setContractNo] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (row) {
      setProjectNo(fmt(row["เลขที่โครงการ"]).replace(/^—$/, ""));
      setContractNo(fmt(row["เลขคุมสัญญา"]).replace(/^—$/, ""));
      setNote(fmt(row["Note"]).replace(/^—$/, ""));
    }
  }, [row]);

  if (!row) return null;

  const hasEdit = editMap.has(row.__row);
  const displayKeys = Object.keys(row).filter(
    (k) =>
      k !== "__row" &&
      !HIDDEN_COLUMNS.has(k) &&
      !["เลขที่โครงการ", "เลขคุมสัญญา", "Note"].includes(k)
  );

  const handleSave = () => {
    upsert.mutate({
      rowId: row.__row,
      projectNo: projectNo || undefined,
      contractNo: contractNo || undefined,
      note: note || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            รายละเอียดรายการ
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
              <Hash className="h-3 w-3" />
              Row ID: {row.__row}
            </span>
          </DialogTitle>
          <DialogDescription>
            แถวที่ {row.__row} ใน Google Sheets (Data)
            {hasEdit && " · รายการนี้มีข้อมูลที่แก้ไขจากระบบ"}
          </DialogDescription>
        </DialogHeader>

        {/* Editable section */}
        <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4">
          <p className="mb-3 text-sm font-semibold text-sky-800">
            ✏️ ข้อมูลที่บันทึกจากระบบ (จัดเก็บในฐานข้อมูล ผูกกับ Row ID {row.__row})
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">เลขที่โครงการ</span>
              <input
                value={projectNo}
                onChange={(e) => setProjectNo(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">เลขคุมสัญญา</span>
              <input
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">NOTE</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
          </div>
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {upsert.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            บันทึกข้อมูล
          </button>
        </div>

        {/* All fields */}
        <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {displayKeys.map((k) => (
            <div key={k} className="border-b border-slate-100 py-1.5">
              <p className="text-xs text-slate-500">{k}</p>
              <p className="text-sm font-medium text-slate-800">{fmt(row[k])}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
