import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useSubscription } from "@/hooks/useSubscription";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { Tables } from "@/integrations/supabase/types";
import {
  Scale, CalendarDays, Truck, User, MapPin, ArrowRight,
  SlidersHorizontal, Lock, WifiOff,
} from "lucide-react";

type Carga = Tables<"cargas">;

const chips = ["Todos", "Soja", "Milho", "Algodão", "Café", "Trigo", "Feijão", "Arroz"];
const PAGE_SIZE = 20;

const fetchCargas = async ({ pageParam = 0 }: { pageParam?: number }) => {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error } = await supabase
    .from("cargas")
    .select("*")
    .eq("status", "disponivel")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { items: (data ?? []) as Carga[], page: pageParam };
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—";

const MotoristaFretes = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { isPro } = useSubscription();

  const [activeChip, setActiveChip] = useState("Todos");
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const [origemFilter, setOrigemFilter] = useState("");
  const [minVal, setMinVal] = useState("");
  const [maxVal, setMaxVal] = useState("");

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["cargas-disponiveis"],
    queryFn: fetchCargas,
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.items.length === PAGE_SIZE ? lastPage.page + 1 : undefined,
  });

  // Realtime → invalidate cache
  useEffect(() => {
    const channel = supabase
      .channel("motorista-cargas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cargas" }, () => {
        queryClient.invalidateQueries({ queryKey: ["cargas-disponiveis"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
  const { scrollRef, onTouchStart, onTouchMove, onTouchEnd, pullIndicator } =
    usePullToRefresh(handleRefresh);

  // All cargas flat
  const allCargas = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  // Client-side filtering (chips + advanced)
  const filtered = useMemo(() => {
    let list = allCargas;
    if (activeChip !== "Todos") {
      list = list.filter((c) =>
        c.tipo_grao.toLowerCase().includes(activeChip.toLowerCase())
      );
    }
    if (origemFilter) {
      const q = origemFilter.toLowerCase();
      list = list.filter(
        (c) => c.origem.toLowerCase().includes(q) || c.destino.toLowerCase().includes(q)
      );
    }
    if (minVal) list = list.filter((c) => Number(c.valor) >= Number(minVal));
    if (maxVal) list = list.filter((c) => Number(c.valor) <= Number(maxVal));
    return list;
  }, [allCargas, activeChip, origemFilter, minVal, maxVal]);

  const advFiltersCount = [origemFilter, minVal, maxVal].filter(Boolean).length;
  const clearAdvFilters = () => {
    setOrigemFilter("");
    setMinVal("");
    setMaxVal("");
    setShowAdvFilters(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 200 &&
      !isFetchingNextPage &&
      hasNextPage
    ) {
      fetchNextPage();
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="rounded-b-3xl px-5 lg:px-8 pt-3 pb-6 flex-shrink-0 animate-fade-in gradient-hero relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center max-w-5xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] lg:text-xs text-white/35 font-medium tracking-widest uppercase mb-0.5">
                GrãoHub
              </p>
              {!isOnline && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/80 text-white">
                  <WifiOff size={10} /> Offline
                </span>
              )}
            </div>
            <h1 className="text-[22px] lg:text-3xl font-extrabold text-white tracking-tight">
              Fretes Disponíveis
            </h1>
            <p className="text-[13px] lg:text-sm text-white/40 mt-0.5">
              {filtered.length} fretes encontrados
            </p>
          </div>
          <button
            onClick={() => navigate("/perfil")}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center border border-white/10 cursor-pointer overflow-hidden lg:hidden"
            aria-label="Perfil"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-white/60" />
            )}
          </button>
        </div>
      </div>

      {/* Chips */}
      <div className="flex gap-2 px-4 lg:px-8 py-3.5 overflow-x-auto phone-scroll flex-shrink-0">
        <div className="flex gap-2 max-w-5xl mx-auto w-full items-center">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setActiveChip(c)}
              className={`inline-flex items-center px-4 py-2 rounded-full text-[12px] lg:text-sm font-semibold cursor-pointer transition-all whitespace-nowrap border min-h-[36px] ${
                activeChip === c
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-border text-muted-foreground hover:border-primary/20"
              }`}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => {
              if (!isPro) {
                navigate("/planos");
                return;
              }
              setShowAdvFilters(!showAdvFilters);
            }}
            className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border border-border bg-card hover:border-primary/20 transition-colors"
          >
            {isPro ? (
              <SlidersHorizontal size={14} className="text-muted-foreground" />
            ) : (
              <Lock size={14} className="text-muted-foreground" />
            )}
            {advFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
                {advFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvFilters && isPro && (
        <div className="px-4 lg:px-8 py-3 bg-card border-b border-border animate-slide-up">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-bold text-foreground">Filtros Avançados</span>
              <button
                onClick={clearAdvFilters}
                className="text-[12px] text-primary font-medium bg-transparent border-none cursor-pointer p-0"
              >
                Limpar
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                placeholder="Região / Cidade"
                value={origemFilter}
                onChange={(e) => setOrigemFilter(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <input
                type="number"
                placeholder="Valor mín."
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <input
                type="number"
                placeholder="Valor máx."
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto phone-scroll px-4 lg:px-8 pb-6"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onScroll={handleScroll}
      >
        {pullIndicator}
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 skeleton-shimmer" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                <Truck size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                Nenhum frete disponível
              </h3>
              <p className="text-sm text-muted-foreground">
                Volte mais tarde para ver novos fretes na sua região
              </p>
            </div>
          ) : (
            <div className="animate-slide-up grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map((f) => (
                <button
                  key={f.id}
                  onClick={() => navigate(`/fretes/${f.id}`)}
                  className="w-full bg-card rounded-2xl p-4 lg:p-5 cursor-pointer text-left shadow-card-soft active:scale-[0.99] hover:shadow-float hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[15px] lg:text-base font-bold text-foreground block">
                        {f.tipo_grao}
                      </span>
                      <div className="flex items-center gap-1.5 text-[13px] lg:text-sm text-muted-foreground mt-1">
                        <MapPin size={12} className="text-primary/50" />
                        <span>{f.origem}</span>
                        <ArrowRight size={10} className="text-primary/30" />
                        <span>{f.destino}</span>
                      </div>
                    </div>
                    <span className="text-[18px] lg:text-xl font-extrabold text-primary">
                      R${Number(f.valor).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg font-medium">
                      <Scale size={11} /> {f.quantidade}t
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg font-medium">
                      <CalendarDays size={11} /> {fmtDate(f.data_coleta)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg font-medium">
                      <Truck size={11} /> {f.veiculo}
                    </span>
                  </div>
                </button>
              ))}
              {isFetchingNextPage && (
                <div className="col-span-full flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MotoristaFretes;
