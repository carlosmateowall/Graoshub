import { useNavigate } from "react-router-dom";
import { Wheat, Truck, ArrowLeft, ArrowRight } from "lucide-react";

const ProfileSelectScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 bg-background overflow-y-auto phone-scroll">
      <div className="px-6 pt-14 pb-10 min-h-full flex flex-col">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-12 hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>

        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight leading-[1.15] mb-2">Como você vai usar o GrãoHub?</h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-8">Escolha seu perfil para personalizar a experiência.</p>

        <div className="flex flex-col gap-4">
          <button onClick={() => navigate("/cadastro?role=contratante")} className="bg-card rounded-2xl p-5 border border-border cursor-pointer text-left relative overflow-hidden hover:border-primary/40 active:scale-[0.99] transition-all card-shadow-lg group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-primary/10"><Wheat size={28} className="text-primary" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-bold text-foreground mb-1.5">Contratante de Frete</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">Produtor, armazém, cooperativa ou trading. Publique cargas e contrate motoristas.</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["Produtor", "Cooperativa", "Trading"].map(tag => (
                    <span key={tag} className="text-[10px] font-semibold py-1 px-2.5 rounded-md bg-primary/8 text-primary">{tag}</span>
                  ))}
                </div>
              </div>
              <ArrowRight size={18} className="text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0 mt-4" />
            </div>
          </button>

          <button onClick={() => navigate("/cadastro?role=motorista")} className="bg-card rounded-2xl p-5 border border-border cursor-pointer text-left relative overflow-hidden hover:border-accent/40 active:scale-[0.99] transition-all card-shadow-lg group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-accent/10"><Truck size={28} className="text-accent" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-bold text-foreground mb-1.5">Motorista Autônomo</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">Veja fretes disponíveis, aceite viagens e gerencie suas corridas pelo app.</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["Autônomo", "Graneleiro", "Caçamba"].map(tag => (
                    <span key={tag} className="text-[10px] font-semibold py-1 px-2.5 rounded-md bg-accent/10 text-accent-foreground">{tag}</span>
                  ))}
                </div>
              </div>
              <ArrowRight size={18} className="text-muted-foreground/30 group-hover:text-accent transition-colors flex-shrink-0 mt-4" />
            </div>
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground leading-relaxed mt-auto pt-8">
          Ao continuar você aceita os{" "}
          <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate("/termos")}>Termos de Uso</span> e a{" "}
          <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate("/privacidade")}>Política de Privacidade</span>.
        </p>
      </div>
    </div>
  );
};

export default ProfileSelectScreen;
