import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type DetailsSidePanelProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export const DetailsSidePanel = ({
  isOpen,
  title,
  onClose,
  children,
  footer,
}: DetailsSidePanelProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] overflow-hidden">
      <button
        type="button"
        aria-label="Fechar detalhes"
        className="absolute inset-0 m-0 border-0 bg-black/55 p-0"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex h-[100dvh] w-full max-w-full flex-col border-l border-borda-padrao bg-fundo-navbar-sidebar p-5 sm:w-[34rem] sm:max-w-[34rem] sm:p-7"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
          <button
            type="button"
            className="cursor-pointer rounded-xl p-2 text-texto-secundario transition hover:bg-fundo-superficie-suave hover:text-texto-principal"
            aria-label="Fechar painel"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="mt-6 flex-1 overflow-y-auto">{children}</div>

        {footer && <footer className="mt-5 border-t border-borda-padrao pt-5">{footer}</footer>}
      </aside>
    </div>
  );
};