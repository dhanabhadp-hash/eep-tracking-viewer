import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { findAllEdits, upsertEdit } from "./queries/sheetEdits";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  edits: createRouter({
    list: publicQuery.query(() => findAllEdits()),
    upsert: publicQuery
      .input(
        z.object({
          rowId: z.number().int().positive(),
          projectNo: z.string().trim().max(100).optional(),
          contractNo: z.string().trim().max(100).optional(),
          note: z.string().trim().max(2000).optional(),
        })
      )
      .mutation(({ input }) => upsertEdit(input)),
  }),
});

export type AppRouter = typeof appRouter;
