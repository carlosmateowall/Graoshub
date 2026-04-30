import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, Eye, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/friendlyError";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Profile = Tables<"profiles">;

interface Props {
  toast: (msg: string) => void;
}

const AdminKyc = ({ toast }: Props) => {
  const queryClient = useQueryClient();
  const [viewDoc, setViewDoc] = useState<{ url: string; title: string } | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["kyc-pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("kyc_status", "pendente")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ kyc_status: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["kyc-pendentes"] });
      setViewDoc(null);
      toast(status === "aprovado" ? "Motorista aprovado com sucesso!" : "Documentos rejeitados.");
    },
    onError: (err: Error) => {
      toast(friendlyError(err.message));
    },
    onSettled: () => setActionId(null),
  });

  const handleViewDoc = async (profile: Profile, type: "cnh" | "crlv") => {
    const path = type === "cnh" ? profile.cnh_url : profile.crlv_url;
    if (!path) {
      toast("Documento não enviado");
      return;
    }
    setSigningId(`${profile.id}-${type}`);
    const { data, error } = await supabase.storage
      .from("documentos_kyc")
      .createSignedUrl(path, 60);
    setSigningId(null);
    if (error || !data?.signedUrl) {
      toast("Erro ao gerar URL do documento");
      return;
    }
    setViewDoc({ url: data.signedUrl, title: type === "cnh" ? "CNH" : "CRLV" });
  };

  const handleAction = (id: string, status: "aprovado" | "rejeitado") => {
    setActionId(id);
    updateStatus.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="rounded-full bg-green-500/10 p-4">
          <ShieldCheck className="h-10 w-10 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Nenhuma análise pendente</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Todos os documentos estão verificados!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {profiles.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{p.nome || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">
                  {p.cidade || "—"} · {p.telefone || "—"} · {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  disabled={signingId === `${p.id}-cnh`}
                  onClick={() => handleViewDoc(p, "cnh")}
                >
                  {signingId === `${p.id}-cnh` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                  Ver CNH
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  disabled={signingId === `${p.id}-crlv`}
                  onClick={() => handleViewDoc(p, "crlv")}
                >
                  {signingId === `${p.id}-crlv` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                  Ver CRLV
                </Button>
                <Button
                  size="sm"
                  className="text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={actionId === p.id}
                  onClick={() => handleAction(p.id, "aprovado")}
                >
                  {actionId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs gap-1"
                  disabled={actionId === p.id}
                  onClick={() => handleAction(p.id, "rejeitado")}
                >
                  {actionId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Documento — {viewDoc?.title}</DialogTitle>
            <DialogDescription>URL temporária válida por 60 segundos.</DialogDescription>
          </DialogHeader>
          {viewDoc && (
            <img
              src={viewDoc.url}
              alt={viewDoc.title}
              className="w-full rounded-lg border object-contain max-h-[60vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminKyc;
