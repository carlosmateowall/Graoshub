import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";


const PrivacidadeScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background overflow-y-auto phone-scroll">
      <div className="px-5 pt-14 pb-28">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-8 hover:text-primary transition-colors min-h-[48px]">
          <ArrowLeft size={18} /> Voltar
        </button>
        <h1 className="text-[24px] font-extrabold text-foreground tracking-tight mb-6">Política de Privacidade</h1>
        <div className="text-[14px] leading-[1.7] text-foreground/80 space-y-5">
          <p className="text-xs text-muted-foreground">Última atualização: 14 de março de 2026</p>
          {[
            { title: "1. Dados Coletados", text: "Coletamos os seguintes dados pessoais: nome completo, e-mail, telefone, cidade, foto de perfil e informações relacionadas às operações de frete (origem, destino, tipo de carga, valores)." },
            { title: "2. Uso dos Dados", text: "Seus dados são utilizados para: (a) identificação e autenticação na plataforma; (b) conexão entre contratantes e motoristas; (c) registro de operações de frete; (d) comunicação sobre o serviço; (e) melhoria da experiência do usuário." },
            { title: "3. Armazenamento", text: "Os dados são armazenados em servidores seguros com criptografia. Utilizamos o Supabase como provedor de infraestrutura, que segue padrões internacionais de segurança (SOC 2 Type II)." },
            { title: "4. Compartilhamento", text: "Seus dados pessoais não são vendidos a terceiros. Informações de perfil (nome e cidade) são visíveis para outros usuários da plataforma para facilitar as transações de frete." },
            { title: "5. Direitos do Usuário (LGPD)", text: "Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a: (a) acessar seus dados; (b) corrigir dados incorretos; (c) solicitar exclusão da conta; (d) revogar consentimento; (e) portabilidade dos dados." },
            { title: "6. Cookies e Rastreamento", text: "O aplicativo utiliza cookies essenciais para funcionamento da autenticação. Não utilizamos cookies de rastreamento publicitário." },
            { title: "7. Segurança", text: "Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito (TLS) e em repouso, controle de acesso baseado em funções (RLS) e autenticação segura." },
            { title: "8. Contato do DPO", text: "Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato com nosso Encarregado de Proteção de Dados: privacidade@graohub.com.br" },
          ].map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-foreground mb-2">{section.title}</h2>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacidadeScreen;
