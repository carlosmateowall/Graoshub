import { Search, Shield, Truck, User, ChevronDown, ChevronUp, Ban, CheckCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import type { Tables } from "@/integrations/supabase/types";

type UserRole = Tables<"user_roles">;

interface Props {
  toast: (msg: string) => void;
}

const roleBadge = (role: string) => {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    admin: { label: "Admin", cls: "bg-destructive/10 text-destructive", icon: <Shield size={12} /> },
    motorista: { label: "Motorista", cls: "bg-accent/15 text-accent-foreground", icon: <Truck size={12} /> },
    contratante: { label: "Contratante", cls: "bg-primary/10 text-primary", icon: <User size={12} /> },
  };
  const r = map[role] ?? map.contratante;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${r.cls}`}>
      {r.icon} {r.label}
    </span>
  );
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

const AdminUsers = ({ toast }: Props) => {
  const {
    profiles,
    search,
    setSearch,
    loading,
    isSearching,
    expandedId,
    setExpandedId,
    actionLoading,
    handleBan,
    handleUnban,
    getRoles,
    isBanned,
    isAdmin,
  } = useAdminUsers({ toast });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-4">
        {isSearching ? (
          <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : (
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, cidade ou telefone..."
          className="pl-9 h-11 rounded-xl"
        />
      </div>

      <p className="text-xs text-muted-foreground mb-3">{profiles.length} usuário(s)</p>

      <div className="space-y-2">
        {profiles.map((p) => {
          const userRoles = getRoles(p.id);
          const expanded = expandedId === p.id;
          const banned = isBanned(p.id);
          const admin = isAdmin(p.id);

          return (
            <div
              key={p.id}
              className={`bg-card rounded-2xl border overflow-hidden ${banned ? "border-destructive/40" : "border-border"} card-shadow`}
            >
              <button
                onClick={() => setExpandedId(expanded ? null : p.id)}
                className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none cursor-pointer text-left"
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User size={18} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{p.nome || "Sem nome"}</p>
                    {banned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">
                        <Ban size={10} /> Bloqueado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {userRoles.map((r: UserRole) => (
                      <span key={r.role}>{roleBadge(r.role)}</span>
                    ))}
                    {p.cidade && <span className="text-[11px] text-muted-foreground">· {p.cidade}</span>}
                  </div>
                </div>
                {expanded ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </button>

              {expanded && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-border">
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Telefone</p>
                      <p className="font-semibold text-foreground">{p.telefone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cidade</p>
                      <p className="font-semibold text-foreground">{p.cidade || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cadastro</p>
                      <p className="font-semibold text-foreground">{formatDate(p.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ID</p>
                      <p className="font-semibold text-foreground truncate text-[10px]">{p.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  {!admin && (
                    <div className="mt-3 pt-3 border-t border-border">
                      {banned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-2 text-xs"
                          disabled={actionLoading === p.id}
                          onClick={() => handleUnban(p.id)}
                        >
                          <CheckCircle size={14} />
                          {actionLoading === p.id ? "Desbloqueando..." : "Desbloquear Usuário"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full gap-2 text-xs"
                          disabled={actionLoading === p.id}
                          onClick={() => handleBan(p.id)}
                        >
                          <Ban size={14} />
                          {actionLoading === p.id ? "Bloqueando..." : "Bloquear Usuário"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {profiles.length === 0 && (
          <div className="text-center py-10">
            <User size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
