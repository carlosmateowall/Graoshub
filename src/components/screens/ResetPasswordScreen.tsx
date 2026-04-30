import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const ResetPasswordScreen = () => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async () => {
    if (password.length < 8) {
      setMessage("Senha deve ter no mínimo 8 caracteres");
      setMessageType("error");
      return;
    }
    if (password !== confirm) {
      setMessage("As senhas não coincidem");
      setMessageType("error");
      return;
    }
    const { error } = await updatePassword(password);
    if (error) {
      setMessage(error);
      setMessageType("error");
    } else {
      setMessage("Senha atualizada com sucesso! Você pode fechar esta página.");
      setMessageType("success");
    }
  };

  const inputClass = "px-4 py-[13px] border-[1.5px] border-border rounded-[10px] text-[15px] text-foreground bg-card outline-none focus:border-primary";

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <p className="text-muted-foreground">Link de recuperação inválido ou expirado.</p>
          <a href="/" className="text-primary font-semibold mt-4 inline-block">Voltar ao início</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        <div className="text-[28px] font-extrabold text-foreground tracking-[-0.8px] mb-1.5 text-center">
          Nova senha
        </div>
        <div className="text-sm text-muted-foreground mb-8 text-center">
          Digite sua nova senha para o GrãoHub
        </div>

        <div className="flex flex-col gap-1.5 mb-3.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.8px]">Nova senha</label>
          <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </div>
        <div className="flex flex-col gap-1.5 mb-6">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.8px]">Confirmar senha</label>
          <input className={inputClass} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a senha" />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 border-none rounded-lg text-[15px] font-semibold cursor-pointer bg-primary text-primary-foreground active:scale-[0.98] transition-transform"
        >
          Atualizar senha
        </button>

        {message && (
          <p className={`text-center mt-4 text-sm font-semibold ${messageType === "error" ? "text-destructive" : "text-primary"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
