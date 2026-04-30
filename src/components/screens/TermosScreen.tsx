import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";


const TermosScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background overflow-y-auto phone-scroll">
      <div className="px-5 pt-14 pb-28">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-8 hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>
        <h1 className="text-[24px] font-extrabold text-foreground tracking-tight mb-6">Termos de Uso</h1>
        <div className="text-[14px] leading-[1.7] text-foreground/80 space-y-5">
          <p className="text-xs text-muted-foreground">Última atualização: 14 de março de 2026</p>
          {[
            { title: "1. Aceitação dos Termos", text: "Ao acessar e utilizar o aplicativo GrãoHub, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não utilize o aplicativo." },
            { title: "2. Descrição do Serviço", text: "O GrãoHub é uma plataforma digital que conecta contratantes de frete de grãos a motoristas disponíveis para transporte. O GrãoHub atua como intermediador tecnológico, não sendo parte direta nas negociações de frete." },
            { title: "3. Cadastro e Conta", text: "Para utilizar o GrãoHub, você deve criar uma conta fornecendo informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta." },
            { title: "4. Responsabilidades do Usuário", text: "Os usuários se comprometem a: (a) fornecer informações precisas sobre cargas e veículos; (b) cumprir as obrigações acordadas nos fretes; (c) não utilizar a plataforma para atividades ilícitas; (d) manter documentação de transporte em dia." },
            { title: "5. Marketplace", text: "O marketplace permite a compra e venda de insumos agrícolas entre usuários. O GrãoHub não se responsabiliza pela qualidade dos produtos anunciados, cabendo aos usuários a verificação prévia." },
            { title: "6. Limitação de Responsabilidade", text: "O GrãoHub não se responsabiliza por danos diretos ou indiretos decorrentes do uso da plataforma, incluindo perdas de carga, atrasos no transporte ou falhas de comunicação entre as partes." },
            { title: "7. Conteúdo Proibido no Marketplace", text: "É estritamente proibido publicar no marketplace: (a) produtos falsificados ou adulterados; (b) substâncias ilegais ou controladas; (c) conteúdo que viole direitos de propriedade intelectual; (d) informações falsas ou enganosas sobre produtos; (e) material ofensivo, discriminatório ou que incite violência. Anúncios em violação serão removidos e a conta poderá ser suspensa." },
            { title: "8. Moderação e Denúncias", text: "O GrãoHub mantém um sistema de denúncias para que usuários reportem conteúdo inadequado. Nossa equipe analisa cada denúncia em até 48 horas. Usuários que violarem repetidamente estas regras terão suas contas suspensas permanentemente." },
            { title: "9. Modificações", text: "Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas através do aplicativo." },
            { title: "10. Contato", text: "Para dúvidas sobre estes termos, entre em contato pelo e-mail: suporte@graohub.com.br" },
          ].map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-foreground mb-2">{section.title}</h2>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
        <div className="mt-8">
          <button onClick={() => navigate("/privacidade")} className="w-full py-3.5 rounded-xl border border-border bg-card text-sm font-semibold text-primary cursor-pointer hover:bg-muted/30 transition-colors min-h-[48px]">Ver Política de Privacidade →</button>
        </div>
      </div>
    </div>
  );
};

export default TermosScreen;
