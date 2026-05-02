import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useAppLayout } from "@/hooks/useAppLayout";
import { Wheat, FlaskConical, Sprout, Droplets, ShoppingCart, Plus, Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";

const categories = [
  { icon: ShoppingCart, label: "Todos" },
  { icon: Wheat, label: "Grãos" },
  { icon: FlaskConical, label: "Defensivos" },
  { icon: Sprout, label: "Sementes" },
  { icon: Droplets, label: "Fertilizantes" },
];

interface Anuncio {
  id: string; categoria: string; nome: string; descricao: string;
  preco: number; unidade: string; quantidade: number;
  localizacao: string; imagem_url: string; created_at: string; user_id: string;
  destaque_ate: string | null;
}

const PAGE_SIZE = 20;

const Marketplace = () => {
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const [activeCat, setActiveCat] = useState("Todos");
  const [search, setSearch] = useState("");
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const loadAnuncios = useCallback(async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const [anunciosRes, bloqueiosRes] = await Promise.all([
      supabase.from("anuncios").select("*").order("destaque_ate", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).range(from, to),
      !append && user ? (supabase as any).from("bloqueios").select("blocked_user_id").eq("user_id", user.id) : Promise.resolve({ data: null }),
    ]);

    const newData = (anunciosRes.data as Anuncio[]) || [];
    if (append) {
      setAnuncios(prev => [...prev, ...newData]);
    } else {
      setAnuncios(newData);
    }
    if (bloqueiosRes.data) {
      setBlockedUsers(bloqueiosRes.data.map((b: any) => b.blocked_user_id));
    }
    setHasMore(newData.length === PAGE_SIZE);
    setPage(pageNum);
    setLoading(false);
    setLoadingMore(false);
  }, [user]);

  useEffect(() => { loadAnuncios(0); }, [user]);

  const handleRefresh = useCallback(async () => { await loadAnuncios(0); }, [loadAnuncios]);
  const { scrollRef, onTouchStart, onTouchMove, onTouchEnd, pullIndicator } = usePullToRefresh(handleRefresh);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    loadAnuncios(page + 1, true);
  };

  const catMap: Record<string, string[]> = {
    Defensivos: ["defensivos", "defensivos agrícolas"],
    Sementes: ["sementes"],
    Fertilizantes: ["fertilizantes"],
    Grãos: ["soja", "milho", "algodão", "trigo", "feijão", "arroz", "café", "cacau"],
  };

  const filtered = anuncios
    .filter(a => !blockedUsers.includes(a.user_id))
    .filter(a => activeCat === "Todos" || (catMap[activeCat]?.some(m => a.categoria.toLowerCase().includes(m)) ?? false))
    .filter(a => !search || a.nome.toLowerCase().includes(search.toLowerCase()) || a.categoria.toLowerCase().includes(search.toLowerCase()))
    .filter(a => !minPrice || Number(a.preco) >= Number(minPrice))
    .filter(a => !maxPrice || Number(a.preco) <= Number(maxPrice))
    .filter(a => !cityFilter || (a.localizacao || "").toLowerCase().includes(cityFilter.toLowerCase()));

  const activeFiltersCount = [minPrice, maxPrice, cityFilter].filter(Boolean).length;
  const clearFilters = () => { setMinPrice(""); setMaxPrice(""); setCityFilter(""); setShowFilters(false); };

  const fmtRelative = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}m`;
  };

  const unitLabel: Record<string, string> = { saca: "/ saca", ton: "/ ton", litro: "/ L", unid: "/ unid", arroba: "/ @" };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      loadMore();
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <SEO title="Marketplace de Insumos Agrícolas" description="Compre e venda grãos, sementes, defensivos e fertilizantes direto com produtores. Marketplace agrícola com os melhores preços." path="/marketplace" />
      {/* Header */}
      <div className="rounded-b-3xl px-5 lg:px-8 pt-3 pb-5 flex-shrink-0 gradient-marketplace relative overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-[22px] lg:text-3xl font-extrabold text-white tracking-tight">Marketplace</h1>
              <p className="text-[13px] lg:text-sm text-white/40">Insumos & Commodities Agrícolas</p>
            </div>
            <button onClick={() => { if (!online) { toast("Sem conexão"); return; } navigate("/marketplace/anunciar"); }} className="h-10 lg:h-11 rounded-xl flex items-center gap-1.5 px-4 lg:px-5 text-[12px] lg:text-sm font-bold cursor-pointer border border-white/15 text-white/90 min-h-[40px] hover:bg-white/10 transition-colors" style={{ background: "rgba(255,255,255,0.08)" }}>
              <Plus size={14} /> Anunciar
            </button>
          </div>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                className="w-full pl-10 pr-4 py-3 lg:py-3.5 rounded-xl text-[14px] lg:text-base text-white outline-none placeholder:text-white/30"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="Buscar grãos, insumos..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer border border-white/15 relative hover:bg-white/10 transition-colors"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <SlidersHorizontal size={16} className="text-white/70" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">{activeFiltersCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="px-4 lg:px-8 py-3 bg-card border-b border-border animate-slide-up">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] lg:text-sm font-bold text-foreground">Filtros</span>
              <button onClick={clearFilters} className="text-[12px] lg:text-sm text-primary font-medium bg-transparent border-none cursor-pointer p-0 hover:underline">Limpar</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
              <input type="number" placeholder="Preço mín." value={minPrice} onChange={e => setMinPrice(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] lg:text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
              <input type="number" placeholder="Preço máx." value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] lg:text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
              <input placeholder="Filtrar por cidade..." value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                className="col-span-2 lg:col-span-1 px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] lg:text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto phone-scroll px-4 lg:px-8 pt-4 pb-6"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onScroll={handleScroll}
      >
        {pullIndicator}
        <div className="max-w-5xl mx-auto">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto phone-scroll pb-1 mb-5">
            {categories.map((c) => (
              <button
                key={c.label}
                onClick={() => setActiveCat(c.label)}
                className={`flex-shrink-0 flex items-center gap-2 rounded-full px-4 py-2 cursor-pointer border transition-all min-h-[40px] text-[12px] lg:text-sm font-semibold hover:shadow-sm ${
                  activeCat === c.label ? "bg-accent text-accent-foreground border-accent shadow-sm" : "bg-card border-border text-muted-foreground hover:border-accent/30"
                }`}
              >
                <c.icon size={14} />
                {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 lg:h-56 skeleton-shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-accent/8 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Nenhum anúncio encontrado</h3>
              <p className="text-sm text-muted-foreground mb-6">Seja o primeiro a anunciar!</p>
              <button onClick={() => navigate("/marketplace/anunciar")} className="px-6 py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer bg-accent text-accent-foreground shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98] transition-all">
                Criar Anúncio
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                {filtered.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/marketplace/anuncio/${a.id}`)}
                    className="bg-card rounded-2xl overflow-hidden cursor-pointer shadow-card-soft active:scale-[0.98] hover:shadow-float hover:-translate-y-0.5 transition-all duration-300 text-left group"
                  >
                    <div className="h-28 lg:h-36 overflow-hidden bg-muted relative">
                      {a.imagem_url ? (
                        <img src={a.imagem_url} alt={a.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-accent/5">
                          <Wheat size={28} className="text-accent/40" />
                        </div>
                      )}
                      {a.destaque_ate && new Date(a.destaque_ate) > new Date() && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                          <Sparkles size={8} /> DESTAQUE
                        </span>
                      )}
                    </div>
                    <div className="p-3 lg:p-4">
                      <span className="text-[13px] lg:text-sm font-bold text-foreground leading-tight line-clamp-1 block">{a.nome}</span>
                      <span className="text-[11px] lg:text-xs text-muted-foreground mt-0.5 block truncate">{a.localizacao || a.categoria} · {fmtRelative(a.created_at)}</span>
                      <div className="mt-2">
                        <span className="text-[15px] lg:text-lg font-extrabold text-primary">
                          R${Number(a.preco).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[10px] lg:text-xs text-muted-foreground ml-0.5">{unitLabel[a.unidade] || `/ ${a.unidade}`}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!hasMore && filtered.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Todos os anúncios carregados</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
