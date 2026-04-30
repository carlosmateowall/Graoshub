import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { FREE_LIMITS } from "@/lib/stripe";
import { friendlyError } from "@/lib/friendlyError";
import { ArrowLeft, Camera, CheckCircle } from "lucide-react";

const AnunciarScreen = () => {
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const { user } = useAuth();
  const [categoria, setCategoria] = useState("Soja");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [unidade, setUnidade] = useState("ton");
  const [quantidade, setQuantidade] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("Imagem deve ter no máximo 5MB"); return; }
    setImageFile(file);
    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile || !user) return "";
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("anuncio-images").upload(path, imageFile, { upsert: true });
    if (error) { toast(friendlyError(error.message)); return ""; }
    const { data } = supabase.storage.from("anuncio-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const { canPublishAnuncio } = useSubscription();
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("anuncios").select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setActiveCount(count ?? 0));
  }, [user]);

  const quotaReached = !canPublishAnuncio(activeCount);

  const handlePublicar = async () => {
    if (!user) { toast("Faça login primeiro"); return; }
    if (quotaReached) { toast(`Limite de ${FREE_LIMITS.anuncios_ativos} anúncios atingido. Assine um plano!`); navigate("/planos"); return; }
    if (!nome || !preco) { toast("Preencha nome e preço"); return; }
    setLoading(true);
    try {
      let imagemUrl = "";
      if (imageFile) imagemUrl = await uploadImage();
      const { error } = await supabase.from("anuncios").insert({
        user_id: user.id, categoria, nome: nome.trim(), descricao: descricao.trim(),
        preco: parseFloat(preco), unidade,
        quantidade: quantidade ? parseFloat(quantidade) : 0,
        localizacao: localizacao.trim(), imagem_url: imagemUrl,
      });
      if (error) toast(friendlyError(error.message));
      else setSuccess(true);
    } catch {
      toast("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-4 border border-input rounded-xl text-[15px] text-foreground bg-card outline-none focus:border-ring focus:ring-2 focus:ring-ring/10 transition-all placeholder:text-muted-foreground/40";
  const selectClass = inputClass + " appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%278%27%20viewBox=%270%200%2012%208%27%3E%3Cpath%20d=%27M1%201l5%205%205-5%27%20stroke=%27%236B7280%27%20stroke-width=%271.5%27%20fill=%27none%27%20stroke-linecap=%27round%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_14px_center] pr-9";

  if (success) {
    return (
      <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-8 text-center animate-scale-fade">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-success" />
        </div>
        <h2 className="text-[22px] font-extrabold text-foreground mb-2">Anúncio Publicado!</h2>
        <p className="text-sm text-muted-foreground mb-8">Seu anúncio já está visível no marketplace.</p>
        <button onClick={() => navigate("/marketplace")} className="px-8 py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer bg-primary text-primary-foreground shadow-md">
          Ver Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto phone-scroll bg-background">
      <div className="px-5 pt-14 pb-28">
        <button onClick={() => navigate("/marketplace")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-8">
          <ArrowLeft size={18} /> Marketplace
        </button>

        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight mb-1">Criar Anúncio</h1>
        <p className="text-[13px] text-muted-foreground mb-8">Anuncie insumos ou grãos para toda a plataforma.</p>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Categoria</label>
            <select className={selectClass} value={categoria} onChange={e => setCategoria(e.target.value)}>
              <optgroup label="Grãos & Commodities">
                <option>Soja</option><option>Milho</option><option>Algodão</option><option>Trigo</option><option>Feijão</option><option>Arroz</option><option>Café Arábica</option><option>Cacau</option>
              </optgroup>
              <optgroup label="Insumos">
                <option>Sementes</option><option>Defensivos Agrícolas</option><option>Fertilizantes</option>
              </optgroup>
              <optgroup label="Outros">
                <option>Máquinas e Equipamentos</option><option>Serviços Agrícolas</option>
              </optgroup>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Nome do Produto</label>
            <input className={inputClass} placeholder="Soja em Grão Safra 25/26" value={nome} onChange={e => setNome(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Descrição</label>
            <textarea className={inputClass + " resize-none"} rows={3} placeholder="Detalhes do produto..." value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Preço (R$)</label>
              <input className={inputClass} type="number" placeholder="135" value={preco} onChange={e => setPreco(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Unidade</label>
              <select className={selectClass} value={unidade} onChange={e => setUnidade(e.target.value)}>
                <option value="saca">/ saca</option>
                <option value="ton">/ tonelada</option>
                <option value="litro">/ litro</option>
                <option value="unid">/ unid.</option>
                <option value="arroba">/ arroba</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Quantidade disponível</label>
            <input className={inputClass} placeholder="200" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Localização</label>
            <input className={inputClass} placeholder="Cristalina, GO" value={localizacao} onChange={e => setLocalizacao(e.target.value)} />
          </div>

          {/* Image upload */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl p-4 flex gap-3.5 items-center cursor-pointer border-2 border-dashed border-accent/30 bg-accent/5 transition-all active:scale-[0.98] min-h-[72px]"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                <Camera size={24} className="text-accent" />
              </div>
            )}
            <div className="text-left">
              <span className="text-[13px] font-bold text-foreground block">{imagePreview ? "Foto selecionada ✓" : "Adicionar Foto"}</span>
              <span className="text-[11px] text-muted-foreground">{imagePreview ? "Toque para trocar" : "Anúncios com foto recebem 3x mais interesse"}</span>
            </div>
          </button>
        </div>

        <button
          onClick={handlePublicar}
          disabled={loading}
          className="w-full py-4 mt-8 border-none rounded-xl text-[15px] font-bold cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 gradient-amber text-accent-foreground shadow-lg"
          style={{ boxShadow: "0 8px 24px rgba(245,158,11,0.25)" }}
        >
          {loading ? "Publicando..." : "Publicar Anúncio"}
        </button>
      </div>
    </div>
  );
};

export default AnunciarScreen;
