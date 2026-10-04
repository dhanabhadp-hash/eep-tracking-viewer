import { eq } from "drizzle-orm";
import { sheetEdits } from "@db/schema";
import { getDb } from "./connection";

export async function findAllEdits() {
  return getDb().select().from(sheetEdits);
}

export async function upsertEdit(input: {
  rowId: number;
  projectNo?: string;
  contractNo?: string;
  note?: string;
}) {
  const db = getDb();
  await db
    .insert(sheetEdits)
    .values({
      rowId: input.rowId,
      projectNo: input.projectNo ?? null,
      contractNo: input.contractNo ?? null,
      note: input.note ?? null,
    })
    .onDuplicateKeyUpdate({
      set: {
        projectNo: input.projectNo ?? null,
        contractNo: input.contractNo ?? null,
        note: input.note ?? null,
      },
    });
  return db.select().from(sheetEdits).where(eq(sheetEdits.rowId, input.rowId));
}
