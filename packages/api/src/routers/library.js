import { protectedProcedure, router } from "../index";
import { listLibraryProducts } from "../services/catalog";
export const libraryRouter = router({
    listMine: protectedProcedure.query(({ ctx }) => listLibraryProducts(ctx.session.user.id)),
});
