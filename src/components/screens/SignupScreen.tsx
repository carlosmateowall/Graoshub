import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyError";
import { ArrowLeft, User as UserIcon, Mail, Lock, Wheat, Truck } from "lucide-react";
import type { UserRole } from "@/types/app";

const SignupScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  
  const defaultRole = (searchParams.get("role") as UserRole) || "contratante";
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!nome.trim() || !email.trim() || !password) { toast("Preencha todos os campos"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { toast("E-mail inválido"); return; }
    if (password.length < 8) { toast("Senha deve ter no mínimo 8 caracteres"); return; }
    setLoading(true);
    const { error } = await signUp(email, password, nome, role);
    setLoading(false);
    if (error) toast(friendlyError(error));
    else { toast("Conta criada! Verifique seu e-mail."); navigate("/login"); }
  };

  const inputClass = "w-full h-12 pl-11 pr-4 rounded-xl text-[14px] text-foreground bg-card border border-border/50 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 shadow-sm";

  return (
    <div className="absolute inset-0 bg-background overflow-y-auto phone-scroll">
      <div className="px-6 pt-14 pb-10">
        <button onClick={() => navigate("/selecionar-perfil")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-6 hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>

        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight leading-[1.15] mb-1.5">Criar sua conta</h1>
        <p className="text-[14px] text-muted-foreground mb-8">Cadastre-se no GrãoHub</p>

        <div className="flex gap-1.5 mb-8">
          <div className="h-1 rounded-full flex-1 bg-primary" />
          <div className="h-1 rounded-full flex-1 bg-border" />
          <div className="h-1 rounded-full flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Nome completo</label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input className={inputClass} value={nome} onChange={e => setNome(e.target.value)} placeholder="João da Silva" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@email.com" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input className={inputClass} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Tipo de perfil</label>
            <div className="flex gap-3">
              <button onClick={() => setRole("contratante")} className={`flex-1 h-[52px] rounded-xl text-[13px] font-semibold border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${role === "contratante" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card text-muted-foreground border-border"}`}>
                <Wheat size={16} /> Contratante
              </button>
              <button onClick={() => setRole("motorista")} className={`flex-1 h-[52px] rounded-xl text-[13px] font-semibold border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${role === "motorista" ? "bg-accent text-accent-foreground border-accent shadow-md" : "bg-card text-muted-foreground border-border"}`}>
                <Truck size={16} /> Motorista
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleSignup} disabled={loading} className="w-full h-12 mt-8 border-none rounded-xl text-[15px] font-bold cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 bg-primary text-primary-foreground shadow-md hover:opacity-90">
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <div className="text-center mt-4">
          <span className="text-[11px] text-muted-foreground">Ao criar conta, aceita os </span>
          <span className="text-[11px] text-primary font-semibold cursor-pointer hover:underline" onClick={() => navigate("/termos")}>Termos</span>
          <span className="text-[11px] text-muted-foreground"> e </span>
          <span className="text-[11px] text-primary font-semibold cursor-pointer hover:underline" onClick={() => navigate("/privacidade")}>Privacidade</span>
        </div>

        <div className="text-center mt-6">
          <span className="text-[13px] text-muted-foreground">Já tem conta? </span>
          <span className="text-[13px] text-primary font-bold cursor-pointer hover:underline" onClick={() => navigate("/login")}>Fazer login</span>
        </div>
      </div>
    </div>
  );
};

export default SignupScreen;
