import { catalogRouter } from "./catalog";
import { libraryRouter } from "./library";
import { purchaseRouter } from "./purchase";
import { readerRouter } from "./reader";
import { protectedProcedure, publicProcedure, router } from "../index";

export const appRouter = router({
  catalog: catalogRouter,
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  library: libraryRouter,
  purchase: purchaseRouter,
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  reader: readerRouter,
});
export type AppRouter = typeof appRouter;
