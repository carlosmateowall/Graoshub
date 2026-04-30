import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { UserRole } from "@/types/app";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: { nome: string; telefone: string; avatar_url: string; cidade: string } | null;
  role: UserRole | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, nome: string, role: UserRole) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: UserRole; roles?: UserRole[] }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

async function fetchRole(userId: string): Promise<UserRole | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .single();
  return (data?.role as UserRole) ?? null;
}

async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("nome, telefone, avatar_url, cidade")
    .eq("id", userId)
    .single();
  return data;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    loading: true,
  });

  const loadUserData = useCallback(async (user: User | null, session: Session | null) => {
    if (!user) {
      setState({ user: null, session: null, profile: null, role: null, loading: false });
      return;
    }
    setState(s => ({ ...s, loading: true }));
    const [profile, role] = await Promise.all([fetchProfile(user.id), fetchRole(user.id)]);
    setState({ user, session, profile, role, loading: false });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserData(session?.user ?? null, session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserData(session?.user ?? null, session);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const signUp = async (email: string, password: string, nome: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, role },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const { data: ban } = await supabase
      .from("banned_users")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (ban) {
      await supabase.auth.signOut();
      return { error: "Sua conta foi suspensa. Entre em contato com o suporte." };
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const roleList = (roles?.map((r) => r.role) as UserRole[]) || [];
    const nonAdminRole = roleList.find((r) => r !== "admin");
    const primaryRole = nonAdminRole ?? roleList[0] ?? undefined;
    return { error: null, role: primaryRole, roles: roleList };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  const refreshProfile = async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id);
      setState((s) => ({ ...s, profile }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, resetPassword, updatePassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
