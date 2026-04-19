import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { getReaderProduct } from "../services/catalog";

export const readerRouter = router({
  getBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const product = await getReaderProduct(input.slug, ctx.session.user.id);

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resumo not found.",
        });
      }

      if (!product.hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this resumo yet.",
        });
      }

      return product;
    }),
});
