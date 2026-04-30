import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Truck, Package, ShoppingCart, Send, FileDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AdminData {
  total_users: number;
  total_fretes_mes: number;
  total_fretes: number;
  volume_fretes: number;
  total_cargas: number;
  total_anuncios: number;
  total_armazens: number;
}

interface Props { toast: (msg: string) => void; }

const AdminDashboard = ({ toast }: Props) => {
  const [stats, setStats] = useState<AdminData | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    supabase.rpc("get_admin_stats").then(({ data }) => {
      if (data) setStats(data as unknown as AdminData);
    });
  }, []);

  const fmt = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");

  const kpiItems = [
    { label: "Usuários", value: stats?.total_users ?? "—", icon: Users, color: "text-primary" },
    { label: "Fretes (mês)", value: stats?.total_fretes_mes ?? "—", icon: Truck, color: "text-success" },
    { label: "Carga", value: stats?.total_cargas ?? "—", icon: Package, color: "text-accent" },
    { label: "Anúncios", value: stats?.total_anuncios ?? "—", icon: ShoppingCart, color: "text-info" },
  ];

  const handleBroadcast = useCallback(async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) {
      toast("Preencha título e mensagem");
      return;
    }
    setSending(true);
    try {
      // Get all user IDs
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id");
      if (pErr || !profiles) {
        toast("Erro ao buscar usuários");
        setSending(false);
        return;
      }

      // Insert a notification for each user
      const rows = profiles.map((p) => ({
        user_id: p.id,
        titulo: broadcastTitle.trim(),
        mensagem: broadcastMsg.trim(),
      }));

      const { error } = await supabase.from("notificacoes").insert(rows);
      if (error) {
        toast("Erro ao enviar comunicado");
      } else {
        toast(`Comunicado enviado para ${profiles.length} usuários!`);
        setShowBroadcast(false);
        setBroadcastTitle("");
        setBroadcastMsg("");
      }
    } catch {
      toast("Erro ao enviar comunicado");
    }
    setSending(false);
  }, [broadcastTitle, broadcastMsg, toast]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      // Fetch profiles and roles
      const [pRes, rRes, fRes] = await Promise.all([
        supabase.from("profiles").select("id, nome, telefone, cidade, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("fretes").select("id, status, created_at, motorista_id, carga_id"),
      ]);

      const profiles = pRes.data || [];
      const roles = rRes.data || [];
      const fretes = fRes.data || [];

      // Build CSV
      const roleMap = new Map<string, string>();
      roles.forEach((r) => {
        const existing = roleMap.get(r.user_id);
        roleMap.set(r.user_id, existing ? `${existing}/${r.role}` : r.role);
      });

      const fretesCountMap = new Map<string, number>();
      fretes.forEach((f) => {
        fretesCountMap.set(f.motorista_id, (fretesCountMap.get(f.motorista_id) || 0) + 1);
      });

      let csv = "Nome,Telefone,Cidade,Role,Fretes,Cadastro\n";
      profiles.forEach((p) => {
        const role = roleMap.get(p.id) || "—";
        const fCount = fretesCountMap.get(p.id) || 0;
        const date = new Date(p.created_at).toLocaleDateString("pt-BR");
        csv += `"${p.nome || ""}","${p.telefone || ""}","${p.cidade || ""}","${role}","${fCount}","${date}"\n`;
      });

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `graohub-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Relatório exportado com sucesso!");
    } catch {
      toast("Erro ao exportar relatório");
    }
    setExporting(false);
  }, [toast]);

  return (
    <div>
      {/* Revenue card - real data */}
      <div className="rounded-2xl p-5 mb-5 gradient-hero text-primary-foreground">
        <p className="text-[11px] text-primary-foreground/40 font-bold tracking-widest uppercase">Volume Total de Fretes</p>
        <p className="text-[32px] font-extrabold text-accent mt-1">{stats ? fmt(stats.volume_fretes) : "—"}</p>
        <p className="text-xs text-primary-foreground/40 mt-0.5">
          {stats ? `${stats.total_users} usuários · ${stats.total_fretes} fretes` : "Carregando..."}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        {kpiItems.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-3.5 shadow-card-soft">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <s.icon size={16} className={s.color} />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
            <span className="text-xl font-extrabold text-foreground">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-card rounded-2xl overflow-hidden shadow-card-soft">
        <button
          onClick={() => setShowBroadcast(true)}
          className="w-full flex items-center gap-3.5 py-4 px-4 cursor-pointer text-left bg-transparent border-none hover:bg-muted/30 transition-colors min-h-[56px]"
        >
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Send size={18} className="text-foreground/60" />
          </div>
          <span className="text-[14px] font-medium text-foreground">Enviar Comunicado</span>
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center gap-3.5 py-4 px-4 cursor-pointer text-left bg-transparent border-none hover:bg-muted/30 transition-colors min-h-[56px] border-t border-border disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <FileDown size={18} className="text-foreground/60" />
          </div>
          <span className="text-[14px] font-medium text-foreground">
            {exporting ? "Exportando..." : "Exportar Relatório"}
          </span>
        </button>
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent className="max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Enviar Comunicado</DialogTitle>
            <DialogDescription>
              A notificação será enviada para todos os usuários cadastrados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <input
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="Título da notificação"
              maxLength={100}
              className="w-full px-4 py-3 border border-input rounded-xl text-[14px] text-foreground bg-card outline-none focus:ring-2 focus:ring-ring/10 placeholder:text-muted-foreground/40"
            />
            <textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Mensagem do comunicado..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-input rounded-xl text-[14px] text-foreground bg-card outline-none resize-none focus:ring-2 focus:ring-ring/10 placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => setShowBroadcast(false)}
              className="flex-1 py-3 rounded-xl border border-border bg-card text-foreground font-semibold cursor-pointer text-[14px] min-h-[48px]"
            >
              Cancelar
            </button>
            <button
              onClick={handleBroadcast}
              disabled={!broadcastTitle.trim() || !broadcastMsg.trim() || sending}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold border-none cursor-pointer text-[14px] disabled:opacity-50 min-h-[48px]"
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
