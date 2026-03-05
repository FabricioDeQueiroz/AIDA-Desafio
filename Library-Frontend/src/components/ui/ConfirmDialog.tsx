import { Loader2 } from "lucide-react";

type ConfirmDialogProps = {
  id: string;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
};

export const ConfirmDialog = ({
  id,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading,
  onConfirm,
}: ConfirmDialogProps) => {
  return (
    <dialog
      id={id}
      className="fixed inset-0 m-auto rounded-3xl bg-transparent p-0 backdrop:bg-black/40"
      onClick={(event) => {
        if (event.currentTarget === event.target) {
          (event.currentTarget as HTMLDialogElement).close();
        }
      }}
    >
      <div className="w-[min(92vw,28rem)] rounded-3xl border border-borda-padrao bg-fundo-superficie p-6 text-texto-principal shadow-2xl">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="py-3 text-sm text-texto-secundario">{description}</p>
        <div className="mt-2 flex justify-end">
          <form method="dialog" className="flex gap-2">
            <button
              type="submit"
              className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-texto-secundario transition hover:bg-fundo-superficie-suave"
            >
              {cancelText}
            </button>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-erro px-4 py-2 text-sm font-semibold text-texto-principal transition hover:bg-erro/70 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmText}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};
