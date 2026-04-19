"use server";

import { syncNotionProducts } from "@rafa-resumos/api/services/notion-sync";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  grantAdminCookie,
  isAdminAuthed,
  revokeAdminCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";

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

export async function syncNotionAction() {
  if (!(await isAdminAuthed())) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const startedAt = Date.now();

  try {
    await syncNotionProducts();
    revalidatePath("/admin");
    revalidatePath("/");
    return { durationMs: Date.now() - startedAt, ok: true as const };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Falha ao sincronizar com o Notion.",
    };
  }
}
