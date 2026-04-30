import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type UserRole = Tables<"user_roles">;
type BannedUser = Tables<"banned_users">;

interface UseAdminUsersOptions {
  toast: (msg: string) => void;
}

export function useAdminUsers({ toast }: UseAdminUsersOptions) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const load = useCallback(async (searchTerm: string, isInitial: boolean) => {
    if (isInitial) setLoading(true);
    else setIsSearching(true);

    let profileQuery = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (searchTerm.trim()) {
      profileQuery = profileQuery.or(
        `nome.ilike.%${searchTerm}%,cidade.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`
      );
    }

    const [pRes, rRes, bRes] = await Promise.all([
      profileQuery,
      supabase.from("user_roles").select("id, user_id, role"),
      supabase.from("banned_users").select("id, user_id, banned_by, reason, created_at"),
    ]);

    if (pRes.error || rRes.error || bRes.error) {
      toast("Erro ao carregar usuários");
    } else {
      setProfiles(pRes.data);
      setRoles(rRes.data as UserRole[]);
      setBannedUsers(bRes.data);
    }

    setLoading(false);
    setIsSearching(false);
  }, [toast]);

  // Initial load
  useEffect(() => {
    load("", true);
  }, [load]);

  // Debounced search
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      load(debouncedSearch, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const getRoles = useCallback(
    (userId: string) => roles.filter((r) => r.user_id === userId),
    [roles]
  );

  const isBanned = useCallback(
    (userId: string) => bannedUsers.some((b) => b.user_id === userId),
    [bannedUsers]
  );

  const isAdmin = useCallback(
    (userId: string) => roles.some((r) => r.user_id === userId && r.role === "admin"),
    [roles]
  );

  const handleBan = useCallback(async (userId: string) => {
    setActionLoading(userId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast("Sessão expirada");
      setActionLoading(null);
      return;
    }

    const { error } = await supabase.from("banned_users").insert({
      user_id: userId,
      banned_by: user.id,
      reason: "Bloqueado pelo admin",
    });

    if (error) {
      toast("Erro ao bloquear usuário");
    } else {
      setBannedUsers((prev) => [
        ...prev,
        { id: crypto.randomUUID(), user_id: userId, banned_by: user.id, reason: "Bloqueado pelo admin", created_at: new Date().toISOString() },
      ]);
      toast("Usuário bloqueado com sucesso");
    }
    setActionLoading(null);
  }, [toast]);

  const handleUnban = useCallback(async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase.from("banned_users").delete().eq("user_id", userId);

    if (error) {
      toast("Erro ao desbloquear usuário");
    } else {
      setBannedUsers((prev) => prev.filter((b) => b.user_id !== userId));
      toast("Usuário desbloqueado com sucesso");
    }
    setActionLoading(null);
  }, [toast]);

  return {
    profiles,
    roles,
    bannedUsers,
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
  };
}
