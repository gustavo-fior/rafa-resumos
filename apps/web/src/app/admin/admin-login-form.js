"use client";
import { Button } from "@rafa-resumos/ui/components/button";
import { Input } from "@rafa-resumos/ui/components/input";
import { Label } from "@rafa-resumos/ui/components/label";
import { Lock } from "lucide-react";
import { useActionState } from "react";
import { loginAdminAction } from "./actions";
export default function AdminLoginForm() {
    const [state, formAction, isPending] = useActionState(loginAdminAction, null);
    return (<div className="w-full">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#9b9a97]">
        <Lock className="size-3.5" strokeWidth={1.75}/>
        Área restrita
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#37352f]">
        Painel administrativo
      </h1>
      <p className="mt-1.5 text-sm text-[#787774]">
        Digite a senha para acessar as estatísticas e sincronizar o Notion.
      </p>

      <form action={formAction} className="mt-6 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium text-[#37352f]">
            Senha
          </Label>
          <Input autoFocus id="password" name="password" type="password" required/>
          {state?.error ? (<p className="text-xs text-[#eb5757]">{state.error}</p>) : null}
        </div>

        <Button type="submit" disabled={isPending} className="mt-2 w-full">
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>);
}
