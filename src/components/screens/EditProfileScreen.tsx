import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { friendlyError } from "@/lib/friendlyError";
import { ArrowLeft, Camera, User, FileUp, Clock, ShieldCheck, Loader2, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const phoneMask = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

type KycStatus = "nao_verificado" | "pendente" | "aprovado" | "rejeitado";

const KycBadge = ({ status }: { status: KycStatus }) => {
  if (status === "pendente") {
    return (
      <Badge className="bg-accent/15 text-accent border-accent/30 gap-1 text-[11px] font-semibold px-2.5 py-1">
        <Clock size={12} /> Verificação Pendente
      </Badge>
    );
  }
  if (status === "aprovado") {
    return (
      <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30 gap-1 text-[11px] font-semibold px-2.5 py-1">
        <ShieldCheck size={12} /> Motorista Verificado
      </Badge>
    );
  }
  return null;
};

interface DocUploadProps {
  label: string;
  file: File | null;
  existingUrl: string | null;
  onFileChange: (file: File | null) => void;
}

const DocUploadArea = ({ label, file, existingUrl, onFileChange }: DocUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasDoc = file || existingUrl;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return;
    onFileChange(f);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-transparent hover:bg-muted/30 ${
          hasDoc ? "border-[hsl(var(--success))]/50 bg-[hsl(var(--success))]/5" : "border-input hover:border-ring"
        }`}
      >
        {hasDoc ? (
          <>
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--success))]/10 flex items-center justify-center">
              <ShieldCheck size={20} className="text-[hsl(var(--success))]" />
            </div>
            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{file ? file.name : "Documento enviado"}</span>
            <span className="text-[11px] text-muted-foreground">Toque para trocar</span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <FileUp size={20} className="text-muted-foreground/60" />
            </div>
            <span className="text-sm font-medium text-foreground">Toque para enviar</span>
            <span className="text-[11px] text-muted-foreground">JPG, PNG ou PDF · máx 5MB</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={handleChange} className="hidden" />
    </div>
  );
};

const EditProfileScreen = () => {
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const { user, profile, refreshProfile } = useAuth();
  const [nome, setNome] = useState(profile?.nome || "");
  const [telefone, setTelefone] = useState(profile?.telefone ? phoneMask(profile.telefone) : "");
  const [cidade, setCidade] = useState(profile?.cidade || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // KYC state — loaded from DB
  const [kycStatus, setKycStatus] = useState<KycStatus>("nao_verificado");
  const [existingCnhUrl, setExistingCnhUrl] = useState<string | null>(null);
  const [existingCrlvUrl, setExistingCrlvUrl] = useState<string | null>(null);
  const [cnhFile, setCnhFile] = useState<File | null>(null);
  const [crlvFile, setCrlvFile] = useState<File | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // Load KYC status from profiles
  useEffect(() => {
    if (!user) return;
    const loadKyc = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("kyc_status, cnh_url, crlv_url")
        .eq("id", user.id)
        .single();
      if (data) {
        setKycStatus((data.kyc_status as KycStatus) || "nao_verificado");
        setExistingCnhUrl(data.cnh_url);
        setExistingCrlvUrl(data.crlv_url);
      }
    };
    loadKyc();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Imagem deve ter no máximo 2MB"); return; }
    setAvatarFile(file);
    if (avatarPreview && avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nome.trim()) errs.nome = "Nome é obrigatório";
    if (nome.trim().length > 100) errs.nome = "Máximo 100 caracteres";
    const phoneDigits = telefone.replace(/\D/g, "");
    if (phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 11)) errs.telefone = "Telefone inválido";
    if (cidade.length > 100) errs.cidade = "Máximo 100 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validate()) return;
    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url || null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (uploadError) { toast(friendlyError(uploadError.message)); setSaving(false); return; }
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
      const phoneDigits = telefone.replace(/\D/g, "");
      const { error } = await supabase.from("profiles").update({ nome: nome.trim(), telefone: phoneDigits || null, cidade: cidade.trim() || null, avatar_url }).eq("id", user.id);
      setSaving(false);
      if (error) { toast(friendlyError(error.message)); } else { await refreshProfile(); toast("Perfil atualizado!"); navigate("/perfil"); }
    } catch {
      toast("Erro de conexão. Tente novamente.");
      setSaving(false);
    }
  };

  const handleSubmitKyc = async () => {
    if (!user) return;
    if (!cnhFile || !crlvFile) {
      toast("Envie ambos os documentos para prosseguir.");
      return;
    }
    setSubmittingKyc(true);
    try {
      const cnhExt = cnhFile.name.split(".").pop() || "jpg";
      const crlvExt = crlvFile.name.split(".").pop() || "jpg";
      const cnhPath = `${user.id}/cnh.${cnhExt}`;
      const crlvPath = `${user.id}/crlv.${crlvExt}`;

      const [cnhUp, crlvUp] = await Promise.all([
        supabase.storage.from("documentos_kyc").upload(cnhPath, cnhFile, { upsert: true }),
        supabase.storage.from("documentos_kyc").upload(crlvPath, crlvFile, { upsert: true }),
      ]);

      if (cnhUp.error || crlvUp.error) {
        toast(friendlyError(cnhUp.error?.message || crlvUp.error?.message || "Erro no upload"));
        setSubmittingKyc(false);
        return;
      }

      const { error } = await supabase.from("profiles").update({
        kyc_status: "pendente",
        cnh_url: cnhPath,
        crlv_url: crlvPath,
      }).eq("id", user.id);

      if (error) {
        toast(friendlyError(error.message));
      } else {
        setKycStatus("pendente");
        toast("Documentos enviados! Em até 2 horas nosso sistema validará o seu perfil.");
      }
    } catch {
      toast("Erro de conexão. Tente novamente.");
    }
    setSubmittingKyc(false);
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-4 border rounded-xl text-[15px] text-foreground bg-card shadow-sm outline-none transition-all focus:ring-2 placeholder:text-muted-foreground/40 ${
      errors[field] ? "border-destructive focus:border-destructive focus:ring-destructive/10" : "border-border focus:border-primary focus:ring-primary/20"
    }`;

  return (
    <div className="absolute inset-0 bg-background overflow-y-auto phone-scroll">
      <div className="px-5 lg:px-8 pt-14 pb-28 lg:pb-12 max-w-2xl mx-auto">
        <button onClick={() => navigate("/perfil")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-8 hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[24px] font-extrabold text-foreground tracking-tight">Editar Perfil</h1>
          <KycBadge status={kycStatus} />
        </div>
        <p className="text-sm text-muted-foreground mb-8">Atualize suas informações pessoais</p>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <button onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center cursor-pointer p-0 relative">
            {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <User size={32} className="text-muted-foreground/40" />}
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-lg bg-primary flex items-center justify-center"><Camera size={12} className="text-primary-foreground" /></div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          <span className="text-xs text-muted-foreground mt-2">Toque para alterar a foto</span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="w-full bg-muted/50 rounded-xl p-1 mb-6">
            <TabsTrigger value="dados" className="flex-1 rounded-lg text-[13px] font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex-1 rounded-lg text-[13px] font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Verificação de Segurança
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dados Pessoais */}
          <TabsContent value="dados">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Nome completo</label>
                <input className={inputClass("nome")} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" maxLength={100} />
                {errors.nome && <span className="text-[11px] text-destructive font-medium">{errors.nome}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</label>
                <input className={inputClass("telefone")} value={telefone} onChange={(e) => setTelefone(phoneMask(e.target.value))} placeholder="(00) 00000-0000" type="tel" maxLength={16} />
                {errors.telefone && <span className="text-[11px] text-destructive font-medium">{errors.telefone}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Cidade</label>
                <input className={inputClass("cidade")} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Sorriso - MT" maxLength={100} />
                {errors.cidade && <span className="text-[11px] text-destructive font-medium">{errors.cidade}</span>}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full py-4 mt-8 border-none rounded-xl text-[15px] font-bold cursor-pointer bg-primary text-primary-foreground active:scale-[0.98] hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 shadow-md">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </TabsContent>

          {/* Tab: KYC */}
          <TabsContent value="kyc">
            <div className="rounded-xl border border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5 p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--success))]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck size={18} className="text-[hsl(var(--success))]" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-foreground mb-1">Torne-se um Motorista Verificado</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    Aumente suas chances de fechar fretes em até <span className="font-bold text-[hsl(var(--success))]">80%</span> tornando-se um Motorista Verificado. Envie seus documentos e receba o selo de confiança.
                  </p>
                </div>
              </div>
            </div>

            {kycStatus === "aprovado" ? (
              <div className="rounded-xl border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--success))]/15 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={28} className="text-[hsl(var(--success))]" />
                </div>
                <p className="text-[15px] font-bold text-foreground mb-1">Perfil Verificado!</p>
                <p className="text-[12px] text-muted-foreground">Seu selo de confiança está ativo e visível para contratantes.</p>
              </div>
            ) : kycStatus === "pendente" ? (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
                  <Clock size={28} className="text-accent" />
                </div>
                <p className="text-[15px] font-bold text-foreground mb-1">Análise em Andamento</p>
                <p className="text-[12px] text-muted-foreground">Seus documentos estão sendo validados. Você será notificado em até 2 horas.</p>
              </div>
            ) : (
              <>
                {kycStatus === "rejeitado" && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 mb-4 text-center">
                    <p className="text-[13px] font-bold text-destructive">Documentos rejeitados. Envie novamente.</p>
                  </div>
                )}
                <div className="flex flex-col gap-5 mb-6">
                  <DocUploadArea label="Foto da CNH (Frente e Verso)" file={cnhFile} existingUrl={existingCnhUrl} onFileChange={setCnhFile} />
                  <DocUploadArea label="CRLV (Documento do Veículo)" file={crlvFile} existingUrl={existingCrlvUrl} onFileChange={setCrlvFile} />
                </div>
                <button
                  onClick={handleSubmitKyc}
                  disabled={submittingKyc || !cnhFile || !crlvFile}
                  className="w-full py-4 border-none rounded-xl text-[15px] font-bold cursor-pointer bg-[hsl(var(--success))] text-primary-foreground active:scale-[0.98] transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  {submittingKyc ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando documentos...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Enviar para Análise
                    </>
                  )}
                </button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EditProfileScreen;
