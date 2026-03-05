import { X } from "lucide-react";

type FeedbackToastProps = {
  type: "success" | "error";
  message: string;
  onClose: () => void;
};

export const FeedbackToast = ({ type, message, onClose }: FeedbackToastProps) => {
  return (
    <div className="fixed right-4 top-4 z-90 max-w-sm">
      <div
        role="status"
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl ${
          type === "success"
            ? "border-sucesso bg-fundo-superficie text-sucesso"
            : "border-erro bg-fundo-superficie text-erro"
        }`}
      >
        <span className="text">{message}</span>
        <button
          type="button"
          className="ml-1 rounded-lg p-1 text-texto-secundario transition hover:bg-fundo-superficie-suave hover:text-texto-principal"
          onClick={onClose}
          aria-label="Fechar mensagem"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
