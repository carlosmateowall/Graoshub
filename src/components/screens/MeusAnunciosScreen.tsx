import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { friendlyError } from "@/lib/friendlyError";
import { ArrowLeft, Plus, ShoppingCart, Trash2, Wheat, Sparkles } from "lucide-react";
import { BOOST_PRODUCT } from "@/lib/stripe";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type Anuncio = Pick<Tables<"anuncios">, "id" | "nome" | "preco" | "categoria" | "imagem_url" | "quantidade" | "unidade" | "destaque_ate">;

const MeusAnunciosScreen = () => {
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const { user } = useAuth();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [boostingId, setBoostingId] = useState<string | null>(null);

  const handleBoost = async (anuncioId: string) => {
    setBoostingId(anuncioId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast("Faça login primeiro."); return; }
      const { data, error } = await supabase.functions.invoke("create-boost-payment", {
        body: { anuncioId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast(err.message || "Erro ao criar pagamento");
    } finally { setBoostingId(null); }
  };

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("anuncios").select("id, nome, preco, categoria, imagem_url, quantidade, unidade, destaque_ate").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setAnuncios(data);
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("anuncios").delete().eq("id", deleteId);
    if (error) { toast(friendlyError(error.message)); } else { toast("Anúncio removido"); setAnuncios((prev) => prev.filter((a) => a.id !== deleteId)); }
    setDeleteId(null);
  };

  const fmtVal = (n: number) => `R$${n.toLocaleString("pt-BR")}`;

  return (
    <div className="absolute inset-0 bg-background overflow-y-auto phone-scroll">
      <div className="px-5 pt-14 pb-28">
        <button onClick={() => navigate("/perfil")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-6 hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-extrabold text-foreground tracking-tight">Meus Anúncios</h1>
            <p className="text-sm text-muted-foreground">{anuncios.length} anúncio{anuncios.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => navigate("/marketplace/anunciar")} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold border-none cursor-pointer flex items-center gap-1.5 min-h-[40px] shadow-md hover:opacity-90 active:scale-[0.98] transition-all">
            <Plus size={14} /> Novo
          </button>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">{[1, 2].map(i => <div key={i} className="h-[80px] skeleton-shimmer" />)}</div>
        ) : anuncios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/8 flex items-center justify-center mb-4"><ShoppingCart size={32} className="text-accent" /></div>
            <h3 className="text-lg font-bold text-foreground mb-1">Nenhum anúncio</h3>
            <p className="text-sm text-muted-foreground mb-6">Publique seu primeiro produto no marketplace</p>
            <button onClick={() => navigate("/marketplace/anunciar")} className="px-6 py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer bg-accent text-accent-foreground shadow-md hover:opacity-90 active:scale-[0.98] transition-all">
              Criar Anúncio
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {anuncios.map((a) => (
              <div key={a.id} className="bg-card rounded-2xl p-3 shadow-card-soft flex gap-3 items-center hover:shadow-float hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                  {a.imagem_url ? <img src={a.imagem_url} alt={a.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-accent/5"><Wheat size={20} className="text-accent/40" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-semibold text-foreground truncate block">{a.nome}</span>
                  <span className="text-[11px] text-muted-foreground block">{a.categoria} · {a.quantidade}{a.unidade || "ton"}</span>
                  <span className="text-[14px] font-extrabold text-primary block">{fmtVal(a.preco)}</span>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {a.destaque_ate && new Date(a.destaque_ate) > new Date() ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-1 rounded-lg bg-accent/15 text-accent-foreground"><Sparkles size={10} /> Ativo</span>
                  ) : (
                    <button onClick={() => handleBoost(a.id)} disabled={boostingId === a.id} className="h-10 px-3 rounded-xl bg-accent/10 flex items-center gap-1 border-none cursor-pointer text-[11px] font-bold text-accent-foreground disabled:opacity-50" aria-label="Destacar anúncio">
                      <Sparkles size={12} /> R${BOOST_PRODUCT.amount}
                    </button>
                  )}
                  <button onClick={() => setDeleteId(a.id)} className="w-10 h-10 rounded-xl bg-destructive/8 flex items-center justify-center border-none cursor-pointer" aria-label="Excluir anúncio">
                    <Trash2 size={16} className="text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-destructive">Excluir Anúncio</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-lg bg-card text-foreground font-semibold cursor-pointer shadow-sm border-none">Cancelar</button>
            <button onClick={handleDelete} className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-semibold border-none cursor-pointer">Excluir</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeusAnunciosScreen;
