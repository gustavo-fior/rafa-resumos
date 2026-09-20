"use server";

import { TRPCClientError } from "@trpc/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  grantAdminCookie,
  isAdminAuthed,
  revokeAdminCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { getServerTrpc } from "@/utils/trpc-server";

export async function loginAdminAction(
  _state: { error?: string } | null,
  formData: FormData
) {
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    return { error: "Senha incorreta." };
  }

  await grantAdminCookie();
  redirect("/admin");
}

export async function logoutAdminAction() {
  await revokeAdminCookie();
  redirect("/admin");
}

export async function resetFinanceStatsAction(password: string) {
  if (!(await isAdminAuthed())) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  if (!verifyAdminPassword(password)) {
    return { error: "Senha incorreta." };
  }

  try {
    const trpc = await getServerTrpc();
    await trpc.admin.resetFinance.mutate();
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) {
    return {
      error:
        error instanceof TRPCClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao apagar pedidos e liberações.",
    };
  }
}

export async function syncNotionAction() {
  if (!(await isAdminAuthed())) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  try {
    const trpc = await getServerTrpc();
    const result = await trpc.admin.syncNotion.mutate();
    revalidatePath("/admin");
    revalidatePath("/");
    return { durationMs: result.durationMs, ok: true as const };
  } catch (error) {
    return {
      error:
        error instanceof TRPCClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao sincronizar com o Notion.",
    };
  }
}

export async function deleteProductAction(productId: string) {
  if (!(await isAdminAuthed())) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  try {
    const trpc = await getServerTrpc();
    const result = await trpc.admin.deleteProduct.mutate({ productId });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true as const, title: result.title };
  } catch (error) {
    return {
      error:
        error instanceof TRPCClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao excluir o resumo.",
    };
  }
}

export async function restoreProductAction(notionPageId: string) {
  if (!(await isAdminAuthed())) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  try {
    const trpc = await getServerTrpc();
    await trpc.admin.restoreProduct.mutate({ notionPageId });
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) {
    return {
      error:
        error instanceof TRPCClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao restaurar o resumo.",
    };
  }
}
