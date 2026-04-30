import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, Percent, CheckCircle } from "lucide-react";

interface Props {
  toast: (msg: string) => void;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const shortId = (id: string) => id.slice(0, 8);

export default function AdminFinanceiro({ toast }: Props) {
  const qc = useQueryClient();

  const { data: comissoes, isLoading } = useQuery({
    queryKey: ["admin-comissoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comissoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"comissoes">[];
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("comissoes")
        .update({ status: "pago" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-comissoes"] });
      toast("Comissão marcada como paga.");
    },
    onError: () => toast("Erro ao atualizar comissão."),
  });

  const totalPago = comissoes
    ?.filter((c) => c.status === "pago")
    .reduce((s, c) => s + Number(c.valor), 0) ?? 0;

  const totalPendente = comissoes
    ?.filter((c) => c.status === "pendente")
    .reduce((s, c) => s + Number(c.valor), 0) ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Líquida (Paga)
            </CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold tracking-tight">{fmt(totalPago)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Receber (Pendente)
            </CardTitle>
            <div className="rounded-md bg-amber-500/10 p-2">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold tracking-tight">{fmt(totalPendente)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Plataforma
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-2">
              <Percent className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold tracking-tight">4.0%</p>
            <p className="text-xs text-muted-foreground mt-1">Padrão por Frete</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receitas / Comissões</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Frete</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes && comissoes.length > 0 ? (
                comissoes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">
                      {shortId(c.frete_id)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {fmt(Number(c.valor))}
                    </TableCell>
                    <TableCell>{Number(c.percentual)}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "pago" ? "default" : "secondary"}
                        className={
                          c.status === "pago"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }
                      >
                        {c.status === "pago" ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status === "pendente" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          disabled={markPaid.isPending}
                          onClick={() => markPaid.mutate(c.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Pago
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma comissão registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
