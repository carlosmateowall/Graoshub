import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyError } from "@/lib/friendlyError";
import { ArrowLeft, Send, User } from "lucide-react";
import { useAppLayout } from "@/hooks/useAppLayout";
import type { Tables } from "@/integrations/supabase/types";

type Mensagem = Pick<Tables<"mensagens">, "id" | "sender_id" | "texto" | "created_at">;

const ChatScreen = () => {
  const { id: freteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState("Chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!freteId || !user) return;
    const loadMessages = async () => {
      const { data } = await supabase.from("mensagens").select("id, sender_id, texto, created_at").eq("frete_id", freteId).order("created_at", { ascending: true });
      if (data) setMensagens(data);
    };
    const loadOtherName = async () => {
      const { data: frete } = await supabase.from("fretes").select("motorista_id, carga_id").eq("id", freteId).single();
      if (!frete) return;
      let otherId: string;
      if (frete.motorista_id === user.id) {
        const { data: carga } = await supabase.from("cargas").select("contratante_id").eq("id", frete.carga_id).single();
        otherId = carga?.contratante_id || "";
      } else {
        otherId = frete.motorista_id;
      }
      if (otherId) {
        const { data: profile } = await supabase.from("profiles").select("nome").eq("id", otherId).single();
        setOtherName(profile?.nome || "Chat");
      }
    };
    loadMessages();
    loadOtherName();
    const channel = supabase.channel(`chat-${freteId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens", filter: `frete_id=eq.${freteId}` }, (payload) => {
        const msg = payload.new as Mensagem;
        setMensagens((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [freteId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens]);

  const handleSend = async () => {
    if (!texto.trim() || !user || !freteId || sending) return;
    setSending(true);
    const { error } = await supabase.from("mensagens").insert({ frete_id: freteId, sender_id: user.id, texto: texto.trim() });
    if (error) toast(friendlyError(error.message));
    else setTexto("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="absolute inset-0 flex flex-col bg-background max-w-4xl mx-auto border-x border-border">
      <div className="flex items-center gap-3 px-4 pt-3 pb-3 gradient-hero flex-shrink-0">
        <button onClick={() => navigate(`/fretes/${freteId}/status`)} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center border border-primary-foreground/10 cursor-pointer" aria-label="Voltar">
          <ArrowLeft size={18} className="text-primary-foreground/70" />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <User size={16} className="text-primary-foreground/60" />
          </div>
          <span className="text-[15px] font-bold text-primary-foreground truncate">{otherName}</span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto phone-scroll px-3 py-3 space-y-2">
        {mensagens.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-10">Nenhuma mensagem ainda. Diga olá! 👋</div>
        )}
        {mensagens.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card text-foreground shadow-sm rounded-bl-md"}`}>
                <div>{msg.texto}</div>
                <div className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/60 text-right" : "text-muted-foreground text-right"}`}>{fmtTime(msg.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-end gap-2 px-3 pb-3 pt-2 border-t border-border bg-card flex-shrink-0">
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={handleKeyDown} placeholder="Mensagem..." rows={1}
          className="flex-1 resize-none rounded-2xl border border-border/50 bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/50 shadow-sm"
          style={{ maxHeight: 100 }}
        />
        <button onClick={handleSend} disabled={!texto.trim() || sending} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-none cursor-pointer disabled:opacity-40 flex-shrink-0 active:scale-95 transition-transform min-h-[40px]" aria-label="Enviar">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
