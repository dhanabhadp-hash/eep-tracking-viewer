import Papa from "papaparse";

export const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1X8pKX6sXhld4aIZFTfQfgv0LpaAMYdO5xKXi9Mw4zI0/gviz/tq?tqx=out:csv&sheet=Data";

/** Columns that are codes/IDs — keep as strings even though they look numeric */
const CODE_COLUMNS = new Set([
  "GPU",
  "TPU",
  "รหัสบริษัท",
  "TAX ID",
  "เลขที่โครงการ",
  "PO",
  "เลขคุมสัญญา",
  "เลขที่บิล",
  "Helper",
]);

/** Key columns a real data row must have at least one of (filters out summary/junk rows) */
const KEY_COLUMNS = ["เลขที่โครงการ", "PO", "ชื่อเวชภัณฑ์"];

/** Columns hidden from the table UI (values remain available for KPIs/search) */
export const HIDDEN_COLUMNS = new Set([
  "CompaDrugs",
  "คำนวนราคารวม",
  "sumproduct",
  "Helper",
  "คำนวนราคา11",
  "คอลัมน์ 2",
]);

/** Fields editable from the web app — stored in the app database keyed by Row ID */
export const EDITABLE_KEYS = ["เลขที่โครงการ", "เลขคุมสัญญา", "Note"] as const;

export type SheetRow = Record<string, string | number | null> & { __row: number };

function inferValue(key: string, raw: string): string | number | null {
  const s = raw.trim();
  if (s === "") return null;
  if (CODE_COLUMNS.has(key)) return s;
  const n = Number(s.replace(/,/g, ""));
  if (!Number.isNaN(n) && /^-?[\d,.]+%?$/.test(s)) {
    return s.endsWith("%") ? n / 100 : n;
  }
  return s;
}

/** Convert array-of-arrays (row 1 = headers) into array-of-objects */
export function rowsToObjects(rows: string[][]): SheetRow[] {
  if (rows.length < 2) return [];
  const seen = new Map<string, number>();
  const headers = rows[0].map((h, i) => {
    let name = h.trim() || `col_${i}`;
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count > 0) name = `${name}_${count + 1}`;
    return name;
  });
  return rows
    .slice(1)
    .map((r, idx) => {
      const obj: SheetRow = { __row: idx + 2 };
      headers.forEach((h, i) => {
        obj[h] = inferValue(h, r[i] ?? "");
      });
      return obj;
    })
    .filter((o) => Object.values(o).some((v) => v !== null && v !== undefined))
    .filter((o) => KEY_COLUMNS.some((k) => o[k] !== null && o[k] !== undefined));
}

export async function fetchSheetRows(url: string = SHEET_CSV_URL): Promise<SheetRow[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ดึงข้อมูลชีตไม่สำเร็จ (HTTP ${res.status})`);
  const csv = await res.text();
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error("อ่านข้อมูล CSV จากชีตไม่สำเร็จ");
  }
  return rowsToObjects(parsed.data);
}
