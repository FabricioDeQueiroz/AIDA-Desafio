import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Eye, Loader2, Plus, RotateCcw } from "lucide-react";
import { booksApi } from "../services/booksApi";
import { loansApi } from "../services/loansApi";
import { loanSchema, type LoanFormValues } from "../schemas/forms";
import { isApiError } from "../types/api";
import { applyFieldErrors } from "../utils/formErrors";
import type { LoanGetDto, LoanStatus } from "../types/loanDtos";
import { getLoanStatusLabel } from "../types/loanDtos";
import { FeedbackToast } from "../components/ui/FeedbackToast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Pagination } from "../components/ui/Pagination";
import { DetailsSidePanel } from "../components/ui/DetailsSidePanel";

const FORM_MODAL_ID = "loan-form-modal";
const RETURN_MODAL_ID = "loan-return-modal";
const PAGE_SIZE = 6;

const loanFieldMap = {
  BorrowerName: "borrowerName",
  BookId: "bookId",
};

const panelClass =
  "rounded-3xl border border-borda-padrao bg-fundo-superficie p-6 shadow-sm";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

const openDialog = (id: string) => {
  const dialog = document.getElementById(id) as HTMLDialogElement | null;
  dialog?.showModal();
};

const closeDialog = (id: string) => {
  const dialog = document.getElementById(id) as HTMLDialogElement | null;
  dialog?.close();
};

const statusOptions: Array<{ label: string; value: "all" | LoanStatus }> = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: 1 },
  { label: "Devolvidos", value: 2 },
];

const getStatusBadgeClass = (status: LoanStatus) => {
  return status === 1
    ? "bg-info/20 text-info"
    : "bg-fundo-superficie-suave text-texto-secundario";
};

export const LoansPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | LoanStatus>("all");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [loanToReturn, setLoanToReturn] = useState<LoanGetDto | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      borrowerName: "",
      bookId: "",
    },
  });

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const loansQuery = useQuery({
    queryKey: ["loans", page, statusFilter],
    queryFn: () =>
      loansApi.list(
        page,
        PAGE_SIZE,
        statusFilter === "all" ? undefined : statusFilter,
      ),
  });

  const selectedLoanQuery = useQuery({
    queryKey: ["loan", "detail", selectedLoanId],
    enabled: Boolean(selectedLoanId),
    queryFn: () => loansApi.detail(selectedLoanId!),
  });

  const booksForFormQuery = useQuery({
    queryKey: ["loans", "books", "all-pages"],
    queryFn: async () => {
      const firstPage = await booksApi.list(1, PAGE_SIZE);
      const allItems = [...firstPage.items];

      for (let nextPage = 2; nextPage <= firstPage.totalPages; nextPage += 1) {
        const pageData = await booksApi.list(nextPage, PAGE_SIZE);
        allItems.push(...pageData.items);
      }

      return allItems;
    },
  });

  const createMutation = useMutation({
    mutationFn: loansApi.create,
    onSuccess: () => {
      setFeedback({
        type: "success",
        message: "Empréstimo registrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeDialog(FORM_MODAL_ID);
      form.reset();
    },
    onError: (error) => {
      if (!isApiError(error)) return;

      applyFieldErrors(error, form.setError, loanFieldMap);

      const noStockMessage =
        error.message.includes("exemplares") ||
        error.message.includes("disponíveis") ||
        error.message.includes("estoque")
          ? "Não foi possível registrar: este livro está sem estoque disponível."
          : error.message;

      setFeedback({ type: "error", message: noStockMessage });
    },
  });

  const returnMutation = useMutation({
    mutationFn: loansApi.returnLoan,
    onSuccess: () => {
      setFeedback({
        type: "success",
        message: "Devolução registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeDialog(RETURN_MODAL_ID);
      setLoanToReturn(null);
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      setFeedback({ type: "error", message: error.message });
      closeDialog(RETURN_MODAL_ID);
      setLoanToReturn(null);
    },
  });

  const booksForSelect = useMemo(
    () => booksForFormQuery.data ?? [],
    [booksForFormQuery.data],
  );
  const loans = loansQuery.data?.items ?? [];
  const isSubmitting = createMutation.isPending;

  const handleOpenCreate = () => {
    form.reset({ borrowerName: "", bookId: "" });
    openDialog(FORM_MODAL_ID);
  };

  const handleStatusFilter = (nextStatus: "all" | LoanStatus) => {
    setPage(1);
    setStatusFilter(nextStatus);
  };

  const handleSubmit = form.handleSubmit((values) => {
    createMutation.mutate(values);
  });

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return "Em uso";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  return (
    <section className="space-y-5">
      {feedback && (
        <FeedbackToast
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Lista de Empréstimos</h1>

        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-destaque px-4 py-3 text-sm font-bold text-texto-principal transition hover:bg-destaque-hover"
          onClick={handleOpenCreate}
        >
          <Plus className="h-5.5 w-5.5" />
          CADASTRAR
        </button>
      </div>

      <article className={panelClass}>
        <div className="mb-5 flex flex-wrap gap-2 rounded-2xl bg-fundo-superficie-suave p-2">
          {statusOptions.map((option) => {
            const active = statusFilter === option.value;
            return (
              <button
                key={String(option.value)}
                type="button"
                className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-destaque text-texto-principal shadow-sm"
                    : "text-texto-secundario hover:bg-fundo-superficie"
                }`}
                onClick={() => handleStatusFilter(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-220 text-left">
            <thead>
              <tr className="border-b border-borda-padrao text-xs uppercase tracking-[0.2em] text-texto-secundario">
                <th className="px-3 py-3 w-[20%]">Livro</th>
                <th className="px-3 py-3 w-[20%]">Nome do Responsável</th>
                <th className="px-3 py-3 w-[14%]">Status</th>
                <th className="px-3 py-3 w-[18%]">Data do Empréstimo</th>
                <th className="px-3 py-3 w-[18%]">Data da Devolução</th>
                <th className="px-3 py-3 w-[10%] text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loansQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="px-3 py-6">
                    <div className="flex items-center gap-2 text-sm text-texto-secundario">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando empréstimos...
                    </div>
                  </td>
                </tr>
              )}

              {loans.map((loan) => (
                <tr key={loan.id} className="border-b border-borda-padrao/60">
                  <td className="px-3 py-4 w-[20%]">
                    <p
                      className="truncate font-semibold"
                      title={loan.bookTitle}
                    >
                      {loan.bookTitle}
                    </p>
                  </td>
                  <td className="px-3 py-4 w-[20%]">
                    <p
                      className="truncate text-sm font-black text-texto-secundario"
                      title={loan.borrowerName}
                    >
                      {loan.borrowerName}
                    </p>
                  </td>
                  <td className="px-3 py-4 w-[14%]">
                    <span
                      className={`inline-flex select-none rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest ${getStatusBadgeClass(loan.status)}`}
                    >
                      {getLoanStatusLabel(loan.status)}
                    </span>
                  </td>
                  <td className="px-3 py-4 w-[18%]">
                    <p
                      className="truncate text-sm font-semibold text-texto-secundario"
                      title={formatDateTime(loan.loanDate)}
                    >
                      {formatDateTime(loan.loanDate)}
                    </p>
                  </td>
                  <td className="px-3 py-4 w-[18%]">
                    <p
                      className="truncate text-sm font-semibold text-texto-secundario"
                      title={formatDateTime(loan.returnDate)}
                    >
                      {formatDateTime(loan.returnDate)}
                    </p>
                  </td>
                  <td className="px-3 py-4 w-[10%]">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="cursor-pointer rounded-xl p-2 text-destaque transition hover:bg-fundo-pagina"
                        onClick={() => setSelectedLoanId(loan.id)}
                        aria-label={`Ver empréstimo de ${loan.borrowerName}`}
                      >
                        <Eye className="h-5.5 w-5.5" />
                      </button>

                      <button
                        type="button"
                        className="cursor-pointer rounded-xl p-2 text-info transition hover:bg-fundo-pagina disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => {
                          setLoanToReturn(loan);
                          openDialog(RETURN_MODAL_ID);
                        }}
                        disabled={loan.status !== 1}
                        aria-label={`Devolver empréstimo de ${loan.borrowerName}`}
                      >
                        <RotateCcw className="h-5.5 w-5.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loansQuery.isLoading && loans.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-sm text-texto-secundario"
                  >
                    Nenhum empréstimo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <Pagination
        page={page}
        totalPages={loansQuery.data?.totalPages ?? 1}
        totalCount={loansQuery.data?.totalCount ?? 0}
        onPageChange={setPage}
      />

      <dialog
        id={FORM_MODAL_ID}
        className="fixed inset-0 m-auto rounded-3xl bg-transparent p-0 backdrop:bg-black/40"
        onClick={(event) => {
          if (event.currentTarget === event.target) {
            form.reset();
            closeDialog(FORM_MODAL_ID);
          }
        }}
      >
        <div className="w-[min(92vw,24rem)] lg:w-[min(92vw,34rem)] rounded-3xl border border-borda-padrao bg-fundo-superficie p-6 text-texto-principal shadow-2xl">
          <h3 className="text-lg font-bold">Registrar empréstimo</h3>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Responsável
              </span>
              <input
                type="text"
                className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 text-texto-principal outline-none transition focus:border-destaque"
                {...form.register("borrowerName")}
                aria-invalid={Boolean(form.formState.errors.borrowerName)}
              />
              <span className="mt-1 block text-xs text-erro">
                {form.formState.errors.borrowerName?.message}
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Livro</span>
              <select
                className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 text-texto-principal outline-none transition focus:border-destaque"
                {...form.register("bookId")}
                aria-invalid={Boolean(form.formState.errors.bookId)}
              >
                <option value="">Selecione</option>
                {booksForSelect.map((book) => (
                  <option key={book.idBook} value={book.idBook}>
                    {book.title} | Disponível: {book.quantity}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-erro">
                {form.formState.errors.bookId?.message}
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-texto-secundario transition hover:bg-fundo-superficie-suave"
                onClick={() => {
                  form.reset();
                  closeDialog(FORM_MODAL_ID);
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-destaque px-4 py-2 text-sm font-semibold text-texto-principal transition hover:bg-destaque-hover disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Registrar empréstimo
              </button>
            </div>
          </form>
        </div>
      </dialog>

      <ConfirmDialog
        id={RETURN_MODAL_ID}
        title="Confirmar devolução"
        description={`Deseja registrar a devolução do empréstimo de ${loanToReturn?.borrowerName}?`}
        confirmText="Devolver"
        confirmTone="info"
        isLoading={returnMutation.isPending}
        onConfirm={() => {
          if (!loanToReturn) return;
          returnMutation.mutate(loanToReturn.id);
        }}
      />

      <DetailsSidePanel
        isOpen={Boolean(selectedLoanId)}
        title="Detalhes do Empréstimo"
        onClose={() => setSelectedLoanId(null)}
        footer={
          <button
            type="button"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-info px-4 py-3 font-bold text-texto-principal transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              if (
                !selectedLoanQuery.data ||
                selectedLoanQuery.data.status !== 1
              )
                return;
              setLoanToReturn({
                id: selectedLoanQuery.data.id,
                borrowerName: selectedLoanQuery.data.borrowerName,
                loanDate: selectedLoanQuery.data.loanDate,
                returnDate: selectedLoanQuery.data.returnDate,
                status: selectedLoanQuery.data.status,
                createdAt: selectedLoanQuery.data.createdAt,
                updatedAt: selectedLoanQuery.data.updatedAt,
                bookTitle: selectedLoanQuery.data.book.title,
              });
              openDialog(RETURN_MODAL_ID);
            }}
            disabled={
              !selectedLoanQuery.data || selectedLoanQuery.data.status !== 1
            }
          >
            <RotateCcw className="h-4.5 w-4.5" />
            Devolver
          </button>
        }
      >
        {selectedLoanQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-texto-secundario">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando dados do empréstimo...
          </div>
        )}

        {selectedLoanQuery.data && (
          <div className="space-y-6">
            <article className="rounded-3xl border border-borda-padrao bg-fundo-superficie p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-fundo-superficie-suave text-destaque">
                  <ArrowLeftRight className="h-10 w-10" />
                </div>
                <div className="min-w-0">
                  <span className="inline-flex rounded-md bg-info/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-info">
                    Empréstimo
                  </span>
                  <h3 className="mt-2 truncate text-2xl font-black">
                    {selectedLoanQuery.data.borrowerName}
                  </h3>
                  <p className="my-1 text-lg font-black text-texto-secundario">
                    {getLoanStatusLabel(selectedLoanQuery.data.status)}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-borda-padrao bg-fundo-superficie p-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-destaque">
                Livro
              </h4>
              <div className="mt-4 flex w-full items-center gap-3 rounded-xl bg-fundo-superficie-suave p-3 text-left">
                <div>
                  <p className="font-semibold">
                    {selectedLoanQuery.data.book.title}
                  </p>
                  <p className="text-sm font-black text-texto-secundario">
                    Ano: {selectedLoanQuery.data.book.year}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-borda-padrao bg-fundo-superficie p-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-destaque">
                Datas do Empréstimo
              </h4>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-borda-padrao pb-3">
                  <span className="text-sm font-semibold text-texto-secundario">
                    Empréstimo
                  </span>
                  <span className="text-sm font-bold">
                    {formatDateTime(selectedLoanQuery.data.loanDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-texto-secundario">
                    Devolução
                  </span>
                  <span className="text-sm font-bold">
                    {formatDateTime(selectedLoanQuery.data.returnDate)}
                  </span>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-borda-padrao bg-fundo-superficie p-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-destaque">
                Auditoria
              </h4>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-borda-padrao pb-3">
                  <span className="text-sm font-semibold text-texto-secundario">
                    Registro
                  </span>
                  <span className="text-sm font-bold">
                    {formatDateTime(selectedLoanQuery.data.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-texto-secundario">
                    Modificação
                  </span>
                  <span className="text-sm font-bold">
                    {formatDateTime(selectedLoanQuery.data.updatedAt)}
                  </span>
                </div>
              </div>
            </article>
          </div>
        )}
      </DetailsSidePanel>
    </section>
  );
};
