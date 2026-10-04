import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";

/**
 * Edits made from the web app, keyed by the Google Sheets row number (Row ID).
 * The rowId matches the physical row in the "Data" sheet so edits always
 * target the correct line.
 */
export const sheetEdits = mysqlTable("sheet_edits", {
  id: serial("id").primaryKey(),
  /** Physical row number in the Google Sheet (Row ID / Key Column) */
  rowId: int("row_id").notNull().unique(),
  projectNo: varchar("project_no", { length: 100 }),
  contractNo: varchar("contract_no", { length: 100 }),
  note: text("note"),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type SheetEdit = typeof sheetEdits.$inferSelect;
export type NewSheetEdit = typeof sheetEdits.$inferInsert;
