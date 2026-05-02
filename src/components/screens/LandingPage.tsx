import { Wheat, Truck, Package, MapPin, ShieldCheck, TrendingUp, ArrowRight, BarChart3, Store, Tractor, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-agro.jpg";
import SEO from "@/components/SEO";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleCTA = (role: string) => {
    navigate(`/cadastro?role=${role}`);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      <SEO path="/" />
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Wheat size={20} className="text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              Grão<span className="text-accent">Hub</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("como-funciona")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
              Como Funciona
            </button>
            <button onClick={() => scrollTo("marketplace")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
              Marketplace
            </button>
            <button onClick={() => scrollTo("beneficios")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
              Benefícios
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="font-semibold">
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate("/cadastro")} className="font-semibold">
              Criar Conta
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Campos de trigo com caminhão" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/40" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-36 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Wheat size={14} /> Plataforma Agro #1
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground mb-6">
              Conectando o Campo à Estrada com{" "}
              <span className="text-primary">Inteligência</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl">
              A plataforma definitiva para produtores rurais encontrarem motoristas confiáveis, e transportadores acharem as melhores cargas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => handleCTA("contratante")}
                className="text-base font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Wheat size={20} className="mr-2" />
                Sou Produtor / Armazém
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleCTA("motorista")}
                className="text-base font-bold px-8 py-6 rounded-xl border-2 border-accent text-accent-foreground bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all"
              >
                <Truck size={20} className="mr-2" />
                Sou Motorista
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>

            <div className="flex items-center gap-8 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-success" /> 100% Seguro</div>
              <div className="flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Sem taxas ocultas</div>
            </div>
          </div>

          <div className="hidden lg:block flex-1" />
        </div>
      </section>

      {/* ─── Uma Plataforma, Duas Soluções ─── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Feito para o agro</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mt-3">Uma plataforma, duas soluções</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Seja produtor ou transportador, o GrãoHub tem tudo que você precisa para operar com eficiência.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-border/50 shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-8 lg:p-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Tractor size={32} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-5">Para Produtores e Cooperativas</h3>
                <div className="flex flex-col gap-4 mb-8">
                  {["Publique cargas rapidamente", "Acompanhamento em tempo real do frete", "Acesso a motoristas avaliados", "Compre e venda insumos no Marketplace"].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => handleCTA("contratante")} className="w-full font-bold rounded-xl py-5">
                  <Wheat size={18} className="mr-2" /> Publicar Carga <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-8 lg:p-10">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                  <Truck size={32} className="text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-5">Para Transportadores</h3>
                <div className="flex flex-col gap-4 mb-8">
                  {["Encontre cargas disponíveis perto de você", "Negociação direta e transparente", "Rotas otimizadas (em breve)", "Avalie os contratantes"].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="text-accent shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={() => handleCTA("motorista")} className="w-full font-bold rounded-xl py-5 border-2 border-accent text-accent-foreground bg-accent hover:bg-accent/90">
                  <Truck size={18} className="mr-2" /> Encontrar Cargas <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Como Funciona ─── */}
      <section id="como-funciona" className="py-20 lg:py-28 bg-card">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Simples e rápido</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mt-3">Como Funciona</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Em três passos, conectamos produtores e motoristas de forma eficiente.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Package, title: "1. Publique sua Carga", desc: "Produtores cadastram tipo de grão, origem, destino e valor. Em minutos, a carga está visível para centenas de motoristas." },
              { icon: Truck, title: "2. Motoristas Encontram", desc: "Transportadores filtram cargas por região, tipo e valor. Aceitem com um clique e iniciem o transporte." },
              { icon: MapPin, title: "3. Acompanhe em Tempo Real", desc: "Acompanhe cada etapa do frete: coleta, trânsito e entrega. Comunicação direta via chat integrado." },
            ].map((step) => (
              <Card key={step.title} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                    <step.icon size={28} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Marketplace ─── */}
      <section id="marketplace" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Novo</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mt-3 mb-5">Marketplace de Insumos Agrícolas</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">Compre e venda sementes, fertilizantes, defensivos e equipamentos diretamente na plataforma. Negocie com produtores e fornecedores de todo o Brasil.</p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: Store, text: "Anuncie seus produtos em segundos" },
                  { icon: ShieldCheck, text: "Transações seguras e verificadas" },
                  { icon: BarChart3, text: "Preços competitivos do mercado" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <f.icon size={20} className="text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-10 border border-border/40">
                <div className="grid grid-cols-2 gap-4">
                  {["Soja", "Milho", "Café", "Trigo"].map((g) => (
                    <div key={g} className="bg-card rounded-2xl p-5 border border-border/50 text-center shadow-sm">
                      <Wheat size={24} className="mx-auto text-primary mb-2" />
                      <span className="text-sm font-bold text-foreground">{g}</span>
                      <p className="text-xs text-muted-foreground mt-1">Disponível</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Benefícios ─── */}
      <section id="beneficios" className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Vantagens</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold mt-3">Por Que Escolher o GrãoHub?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Para Produtores", desc: "Encontre motoristas verificados, compare preços e acompanhe suas cargas do campo ao destino." },
              { title: "Para Motoristas", desc: "Acesse centenas de cargas disponíveis, otimize suas rotas e aumente sua receita mensal." },
              { title: "Marketplace Integrado", desc: "Compre e venda insumos diretamente. Tudo em uma única plataforma." },
              { title: "Chat em Tempo Real", desc: "Comunique-se diretamente com motoristas ou produtores sem sair da plataforma." },
              { title: "Mapa de Armazéns", desc: "Localize armazéns parceiros com avaliações, capacidade e contato em um mapa interativo." },
              { title: "Planos Flexíveis", desc: "Do plano gratuito ao premium com galpão virtual. Escolha o que faz sentido para o seu negócio." },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl bg-secondary/60 border border-primary-foreground/10 p-7">
                <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                <p className="text-sm leading-relaxed text-primary-foreground/80">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Button
              size="lg"
              onClick={() => navigate("/cadastro")}
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-base font-bold px-10 py-6 rounded-xl shadow-lg"
            >
              Comece Agora — É Grátis
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wheat size={18} className="text-primary" />
            <span className="text-sm font-bold text-foreground">GrãoHub</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => navigate("/termos")} className="hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">Termos de Uso</button>
            <button onClick={() => navigate("/privacidade")} className="hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">Privacidade</button>
          </div>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} GrãoHub. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
