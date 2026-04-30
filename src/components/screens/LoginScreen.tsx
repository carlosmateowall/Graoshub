import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyError } from "@/lib/friendlyError";
import { ArrowLeft, Mail, Lock, Wheat } from "lucide-react";
import { toast } from "sonner";

const LoginScreen = () => {
  const navigate = useNavigate();
  const { signIn, resetPassword } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { toast("Preencha e-mail e senha"); return; }
    setLoading(true);
    const { error, role } = await signIn(email, password);
    setLoading(false);
    if (error) { toast(friendlyError(error)); return; }
    const userRole = role ?? "contratante";
    if (userRole === "admin") navigate("/admin");
    else if (userRole === "motorista") navigate("/fretes");
    else navigate("/painel");
  };

  const handleForgotPassword = async () => {
    if (!email) { toast("Digite seu e-mail primeiro"); return; }
    if (resetLoading) return;
    setResetLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) toast(friendlyError(error));
      else toast("E-mail de recuperação enviado!");
    } catch {
      toast("Erro de conexão. Tente novamente.");
    }
    setTimeout(() => setResetLoading(false), 10000);
  };

  const inputClass = "w-full h-12 pl-11 pr-4 rounded-xl text-[14px] text-foreground bg-card border border-border/50 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 shadow-sm";

  return (
    <div className="absolute inset-0 bg-background overflow-y-auto phone-scroll">
      <div className="px-6 pt-14 pb-10 min-h-full flex flex-col">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-6 hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <Wheat size={20} className="text-accent" />
          </div>
          <span className="text-xl font-extrabold text-foreground tracking-tight">GrãoHub</span>
        </div>

        <h1 className="text-[28px] font-extrabold text-foreground tracking-tight leading-[1.15] mb-1">Bem-vindo de volta</h1>
        <p className="text-[14px] text-muted-foreground mb-8">Entre na sua conta GrãoHub</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
        </div>

        <div className="text-right mt-3 mb-8">
          <span className="text-[13px] text-primary font-semibold cursor-pointer hover:underline" onClick={handleForgotPassword}>Esqueci minha senha</span>
        </div>

        <button onClick={handleLogin} disabled={loading} className="w-full h-12 border-none rounded-xl text-[15px] font-bold cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 bg-primary text-primary-foreground shadow-md hover:opacity-90">
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="text-center mt-auto pt-8">
          <span className="text-[13px] text-muted-foreground">Não tem conta? </span>
          <span className="text-[13px] text-primary font-bold cursor-pointer hover:underline" onClick={() => navigate("/cadastro")}>Criar agora</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
