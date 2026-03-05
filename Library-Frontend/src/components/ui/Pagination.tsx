type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

export const Pagination = ({
  page,
  totalPages,
  totalCount,
  onPageChange,
}: PaginationProps) => {
  const safeTotalPages = Math.max(totalPages, 1);
  const canGoNext = page < safeTotalPages;

  return (
    <div className="mt-4 ml-3 flex items-center justify-between">
      <p className="text-sm text-texto-secundario font-bold">
        {`Página ${page} de ${safeTotalPages} • ${totalCount} registros`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-fundo-superficie px-3 py-2 text-sm font-semibold transition hover:bg-fundo-superficie-suave disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          Anterior
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-fundo-superficie px-3 py-2 text-sm font-semibold transition hover:bg-fundo-superficie-suave disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          aria-label="Próxima página"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};
