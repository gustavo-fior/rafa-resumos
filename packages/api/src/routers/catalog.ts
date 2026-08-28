import { TRPCError } from "@trpc/server";
import {
  type ProductCategory,
  productCategory,
} from "@rafa-resumos/db/schema/app";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import {
  getEmergencyProductBySlug,
  getPublishedProductBySlug,
  listEmergencyProducts,
  listPublishedProducts,
  listPublishedSubjects,
} from "../services/catalog";

// Categories visitors can filter the regular catalog by. "emergencia" is
// intentionally excluded: it only exists under /emergencia.
const publicCategories = productCategory.enumValues.filter(
  (value) => value !== "emergencia"
) as [ProductCategory, ...ProductCategory[]];

export const catalogRouter = router({
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const product = await getPublishedProductBySlug(
        input.slug,
        ctx.session?.user.id
      );

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }

      return product;
    }),
  listPublished: publicProcedure
    .input(
      z
        .object({
          category: z.enum(publicCategories).optional(),
          search: z.string().trim().optional(),
          subjectSlug: z.string().trim().optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) =>
      listPublishedProducts(input, ctx.session?.user.id)
    ),
  listEmergency: publicProcedure.query(() => listEmergencyProducts()),
  getEmergencyBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const product = await getEmergencyProductBySlug(input.slug);

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }

      return product;
    }),
  listSubjects: publicProcedure
    .input(
      z
        .object({
          category: z.enum(publicCategories).optional(),
        })
        .optional()
    )
    .query(({ input }) => listPublishedSubjects(input?.category)),
});
