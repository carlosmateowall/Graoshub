import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  freteId: string;
  avaliadorId: string;
  avaliadoId: string;
  onSuccess: () => void;
}

const RatingModal = ({ open, onClose, freteId, avaliadorId, avaliadoId, onSuccess }: RatingModalProps) => {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    const { error } = await supabase.from("avaliacoes" as any).insert({
      frete_id: freteId,
      avaliador_id: avaliadorId,
      avaliado_id: avaliadoId,
      nota,
      comentario: comentario.trim(),
    });
    setSaving(false);
    if (error) {
      if (error.code === "23505") { onClose(); return; }
      console.error(error);
    } else {
      onSuccess();
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[340px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Avaliar Parceiro</DialogTitle>
          <DialogDescription>Como foi a experiência?</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 my-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setNota(star)}
              className="text-3xl bg-transparent border-none cursor-pointer p-0 transition-transform active:scale-110"
            >
              {star <= nota ? "⭐" : "☆"}
            </button>
          ))}
        </div>

        <textarea
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none outline-none focus:border-ring"
          rows={3}
          placeholder="Deixe um comentário (opcional)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={500}
        />

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold border-none cursor-pointer mt-2 disabled:opacity-50"
        >
          {saving ? "Enviando..." : "Enviar Avaliação"}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;
