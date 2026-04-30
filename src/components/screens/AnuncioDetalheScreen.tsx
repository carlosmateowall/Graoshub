import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAppLayout } from "@/hooks/useAppLayout";
import { ArrowLeft, MapPin, User, Wheat, Flag, Ban, Heart } from "lucide-react";
import { friendlyError } from "@/lib/friendlyError";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type Anuncio = Tables<"anuncios">;

interface SellerProfile { nome: string; telefone: string | null; cidade: string | null; }

const reportReasons = [
  "Conteúdo impróprio", "Preço falso ou enganoso", "Golpe / fraude", "Produto proibido", "Outro",
];

const AnuncioDetalheScreen = () => {
  const navigate = useNavigate();
  const { id: anuncioId } = useParams<{ id: string }>();
  const { toast } = useAppLayout();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState<"anuncio" | "usuario">("anuncio");
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!anuncioId) return;
    const load = async () => {
      const { data } = await supabase.from("anuncios").select("*").eq("id", anuncioId).single();
      if (data) {
        setAnuncio(data);
        const { data: profile } = await supabase.from("profiles").select("nome, telefone, cidade").eq("id", data.user_id).single();
        if (profile) setSeller(profile as SellerProfile);
      }
      if (user) {
        const { data: fav } = await supabase.from("favoritos").select("id").eq("user_id", user.id).eq("anuncio_id", anuncioId).maybeSingle();
        if (fav) setIsFavorited(true);
      }
      setLoading(false);
    };
    load();
  }, [anuncioId, user]);

  const toggleFavorite = async () => {
    if (!user || !anuncioId || !online) { toast("Sem conexão"); return; }
    setTogglingFav(true);
    if (isFavorited) {
      await supabase.from("favoritos").delete().eq("user_id", user.id).eq("anuncio_id", anuncioId);
      setIsFavorited(false);
      toast("Removido dos favoritos");
    } else {
      await supabase.from("favoritos").insert({ user_id: user.id, anuncio_id: anuncioId });
      setIsFavorited(true);
      toast("Adicionado aos favoritos ❤️");
    }
    setTogglingFav(false);
  };

  const handleReport = async () => {
    if (!user || !anuncio || !selectedReason) { toast("Selecione um motivo"); return; }
    if (!online) { toast("Sem conexão"); return; }
    setReporting(true);
    const targetId = reportType === "anuncio" ? anuncio.id : anuncio.user_id;
    const { error } = await supabase.from("denuncias").insert({
      reporter_id: user.id, tipo: reportType, target_id: targetId,
      motivo: selectedReason, descricao: reportDesc.trim(),
    });
    if (!error && reportType === "usuario") {
      await supabase.from("bloqueios").insert({ user_id: user.id, blocked_user_id: anuncio.user_id });
    }
    setReporting(false);
    if (error) toast(friendlyError(error.message));
    else {
      toast(reportType === "anuncio" ? "Anúncio denunciado. Obrigado!" : "Usuário bloqueado e denunciado.");
      setShowReportDialog(false); setSelectedReason(""); setReportDesc("");
    }
  };

  const openReport = (type: "anuncio" | "usuario") => {
    setReportType(type); setSelectedReason(""); setReportDesc(""); setShowReportDialog(true);
  };

  const unitLabel: Record<string, string> = { saca: "/ saca", ton: "/ ton", litro: "/ L", unid: "/ unid", arroba: "/ @" };

  if (loading || !anuncio) {
    return (
      <div className="absolute inset-0 bg-background flex items-center justify-center">
        <div className="flex flex-col gap-3 w-full px-6">
          <div className="h-48 skeleton-shimmer" />
          <div className="h-20 skeleton-shimmer" />
          <div className="h-16 skeleton-shimmer" />
        </div>
      </div>
    );
  }

  const whatsappLink = seller?.telefone
    ? `https://wa.me/55${seller.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Tenho interesse no anúncio "${anuncio.nome}" no GrãoHub.`)}`
    : null;

  const isOwnListing = user && anuncio.user_id === user.id;

  return (
    <div className="absolute inset-0 bg-background overflow-y-auto phone-scroll">
      <div className="w-full h-56 overflow-hidden relative bg-muted">
        {anuncio.imagem_url ? (
          <img src={anuncio.imagem_url} alt={anuncio.nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent/5">
            <Wheat size={48} className="text-accent/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-14 left-5 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border-none cursor-pointer min-h-[44px]" aria-label="Voltar">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="absolute top-14 right-5 flex gap-2">
          {!isOwnListing && (
            <>
              <button onClick={toggleFavorite} disabled={togglingFav} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border-none cursor-pointer min-h-[44px]" aria-label="Favoritar">
                <Heart size={16} className={isFavorited ? "text-destructive fill-destructive" : "text-white"} />
              </button>
              <button onClick={() => openReport("anuncio")} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border-none cursor-pointer min-h-[44px]" aria-label="Reportar">
                <Flag size={16} className="text-white" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-5 pt-5 pb-28">
        <span className="text-[11px] font-bold text-accent uppercase tracking-wider">{anuncio.categoria}</span>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight mt-1 mb-1">{anuncio.nome}</h1>
        {anuncio.localizacao && (
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-4">
            <MapPin size={12} /> {anuncio.localizacao}
          </div>
        )}

        <div className="bg-card rounded-2xl p-5 shadow-card-soft mb-5">
          <span className="text-[28px] font-extrabold text-primary">
            R${Number(anuncio.preco).toLocaleString("pt-BR")}
          </span>
          <span className="text-[14px] text-muted-foreground ml-1">{unitLabel[anuncio.unidade || "ton"] || `/ ${anuncio.unidade}`}</span>
          {anuncio.quantidade && anuncio.quantidade > 0 && (
            <p className="text-[13px] text-muted-foreground mt-1">Disponível: {anuncio.quantidade} {anuncio.unidade || "ton"}</p>
          )}
        </div>

        {anuncio.descricao && (
          <div className="mb-5">
            <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Descrição</h3>
            <p className="text-[14px] text-foreground leading-relaxed">{anuncio.descricao}</p>
          </div>
        )}

        {seller && (
          <div className="bg-card rounded-2xl p-4 shadow-card-soft mb-4">
            <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Anunciante</h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/8 flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-[15px] font-bold text-foreground block">{seller.nome}</span>
                {seller.cidade && <span className="text-[13px] text-muted-foreground">{seller.cidade}</span>}
              </div>
            </div>
          </div>
        )}

        {!isOwnListing && (
          <button onClick={() => openReport("usuario")}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 border border-border/50 rounded-xl text-[13px] font-medium cursor-pointer bg-transparent text-muted-foreground min-h-[48px] hover:bg-muted/30 transition-colors">
            <Ban size={14} /> Bloquear Usuário
          </button>
        )}

        {whatsappLink ? (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 h-12 border-none rounded-xl text-[15px] font-bold cursor-pointer text-white active:scale-[0.98] transition-all no-underline shadow-md min-h-[52px]"
            style={{ background: "linear-gradient(135deg, hsl(142 70% 40%), hsl(142 70% 34%))" }}>
            💬 Tenho Interesse — WhatsApp
          </a>
        ) : (
          <button onClick={() => toast("Vendedor não cadastrou telefone")}
            className="w-full h-12 border-2 border-border/50 rounded-xl text-[14px] font-medium cursor-pointer bg-transparent text-muted-foreground min-h-[52px]">
            Telefone não disponível
          </button>
        )}
      </div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {reportType === "anuncio" ? "Reportar Anúncio" : "Bloquear e Denunciar Usuário"}
            </DialogTitle>
            <DialogDescription>
              {reportType === "anuncio"
                ? "Selecione o motivo da denúncia. Nossa equipe analisará em até 48h."
                : "Este usuário será denunciado e seus anúncios não aparecerão mais para você."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            {reportReasons.map((reason) => (
              <button key={reason} onClick={() => setSelectedReason(reason)}
                className={`w-full text-left px-4 py-3 rounded-xl border cursor-pointer transition-all text-[14px] font-medium min-h-[48px] ${selectedReason === reason ? "border-primary bg-primary/5 text-foreground" : "border-border/50 bg-card text-muted-foreground"}`}>
                {reason}
              </button>
            ))}
            <textarea placeholder="Detalhes adicionais (opcional)" value={reportDesc} onChange={(e) => setReportDesc(e.target.value)}
              className="w-full px-4 py-3 border border-border/50 rounded-xl text-[14px] text-foreground bg-card outline-none resize-none focus:ring-2 focus:ring-primary/10 focus:border-primary/50 mt-1 placeholder:text-muted-foreground/40 shadow-sm"
              rows={2} maxLength={300} />
          </div>
          <div className="flex gap-3 mt-3">
            <button onClick={() => setShowReportDialog(false)} className="flex-1 py-3 rounded-xl bg-card text-foreground font-semibold cursor-pointer text-[14px] min-h-[48px] shadow-sm border-none">Cancelar</button>
            <button onClick={handleReport} disabled={!selectedReason || reporting} className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold border-none cursor-pointer text-[14px] disabled:opacity-50 min-h-[48px]">
              {reporting ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnuncioDetalheScreen;
