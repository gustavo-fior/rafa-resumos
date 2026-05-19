import { db } from "@rafa-resumos/db";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { adminProcedure, router } from "../index";
import { getAdminStats, listAdminUsers } from "../services/admin-stats";
import { syncNotionProducts } from "../services/notion-sync";

export const adminRouter = router({
  getStats: adminProcedure.query(async () => {
    return getAdminStats();
  }),
  listUsers: adminProcedure.query(async () => {
    return listAdminUsers();
  }),
  resetFinance: adminProcedure.mutation(async () => {
    try {
      await db.execute(
        sql`TRUNCATE TABLE "webhook_event", "entitlement", "order" RESTART IDENTITY CASCADE`,
      );
      return { ok: true as const };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Falha ao apagar pedidos e liberações.",
      });
    }
  }),
  syncNotion: adminProcedure.mutation(async () => {
    const startedAt = Date.now();
    try {
      await syncNotionProducts();
      return { durationMs: Date.now() - startedAt, ok: true as const };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Falha ao sincronizar com o Notion.",
      });
    }
  }),
});
