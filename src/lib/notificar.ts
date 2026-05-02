import { supabase } from "@/integrations/supabase/client";

export async function notificar(params: {
  user_id: string;
  titulo: string;
  mensagem: string;
  url?: string;
}) {
  const { user_id, titulo, mensagem, url } = params;

  await supabase.from("notificacoes").insert({ user_id, titulo, mensagem, lida: false, url: url ?? null });

  // Push best-effort — não bloqueia nem propaga erro
  supabase.functions
    .invoke("send-push", { body: { user_id, title: titulo, body: mensagem, url: url ?? "/" } })
    .catch(() => {});
}
