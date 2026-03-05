import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Book,
  LibraryBig,
  Eye,
  History,
  Users,
} from "lucide-react";
import { APP_CONFIG } from "../utils/constants";
import { authorsApi } from "../services/authorsApi";
import { booksApi } from "../services/booksApi";
import { loansApi } from "../services/loansApi";
import type { BookGetDto } from "../types/bookDtos";
import { DetailsSidePanel } from "../components/ui/DetailsSidePanel";
import { bookSchema, type BookFormValues } from "../schemas/forms";
import { applyFieldErrors } from "../utils/formErrors";
import { isApiError } from "../types/api";
import { FeedbackToast } from "../components/ui/FeedbackToast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { BookEditDialog } from "../components/ui/BookEditDialog";
import { formatIsbn } from "../utils/isbn";

const sectionCardClass =
  "rounded border border-borda-padrao bg-fundo-superficie p-6 shadow-sm";

const EDIT_BOOK_MODAL_ID = "home-book-edit-modal";
const DELETE_BOOK_MODAL_ID = "home-book-delete-modal";

const bookFieldMap = {
  Title: "title",
  Isbn: "isbn",
  ISBN: "isbn",
  Year: "year",
  Quantity: "quantity",
  IdAuthor: "idAuthor",
  AuthorId: "idAuthor",
};

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

export const HomePage = () => {
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState<BookGetDto | null>(null);
  const [bookToDelete, setBookToDelete] = useState<BookGetDto | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      isbn: "",
      year: 0,
      quantity: 0,
      idAuthor: "",
    },
  });

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const booksQuery = useQuery({
    queryKey: ["dashboard", "books"],
    queryFn: () => booksApi.list(1, APP_CONFIG.defaultPageSize),
  });

  const allBooksQuery = useQuery({
    queryKey: ["dashboard", "books", "all", booksQuery.data?.totalCount],
    enabled: Boolean(booksQuery.data?.totalCount),
    queryFn: () => booksApi.list(1, booksQuery.data!.totalCount),
  });

  const authorsQuery = useQuery({
    queryKey: ["dashboard", "authors"],
    queryFn: () => authorsApi.list(1, APP_CONFIG.defaultPageSize),
  });

  const authorsForFormQuery = useQuery({
    queryKey: ["dashboard", "authors", "all-pages"],
    queryFn: async () => {
      const size = APP_CONFIG.defaultPageSize;
      const firstPage = await authorsApi.list(1, size);
      const allItems = [...firstPage.items];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await authorsApi.list(page, size);
        allItems.push(...nextPage.items);
      }

      return allItems;
    },
  });

  const loansForChartQuery = useQuery({
    queryKey: ["dashboard", "loans", "all-pages"],
    queryFn: async () => {
      const size = APP_CONFIG.defaultPageSize;
      const firstPage = await loansApi.list(1, size);

      const allItems = [...firstPage.items];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await loansApi.list(page, size);
        allItems.push(...nextPage.items);
      }

      return allItems;
    },
  });

  const activeLoansQuery = useQuery({
    queryKey: ["dashboard", "loans", "active"],
    queryFn: () => loansApi.list(1, 1, 1),
  });

  const updateBookMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: BookFormValues }) =>
      booksApi.update(id, {
        idBook: id,
        title: values.title,
        isbn: values.isbn,
        year: values.year,
        quantity: values.quantity,
        idAuthor: values.idAuthor,
      }),
    onSuccess: (updatedBook) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "books"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "authors"] });
      setSelectedBook(updatedBook);
      setFeedback({ type: "success", message: "Livro atualizado com sucesso." });
      closeDialog(EDIT_BOOK_MODAL_ID);
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      applyFieldErrors(error, form.setError, bookFieldMap);
      setFeedback({ type: "error", message: error.message });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: booksApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "books"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "authors"] });
      setSelectedBook(null);
      setBookToDelete(null);
      setFeedback({ type: "success", message: "Livro removido com sucesso." });
      closeDialog(DELETE_BOOK_MODAL_ID);
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      setFeedback({ type: "error", message: error.message });
      setBookToDelete(null);
      closeDialog(DELETE_BOOK_MODAL_ID);
    },
  });

  const books = booksQuery.data?.items ?? [];
  const allBooks = allBooksQuery.data?.items ?? books;
  const totalBooks = booksQuery.data?.totalCount ?? 0;
  const totalAuthors = authorsQuery.data?.totalCount ?? 0;
  const activeLoans = activeLoansQuery.data?.totalCount ?? 0;
  const totalQuantity = allBooks.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const authorOptions = authorsForFormQuery.data ?? authorsQuery.data?.items ?? [];

  const monthlyLoans = useMemo(() => {
    const loans = loansForChartQuery.data ?? [];
    const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
    const currentDate = new Date();

    const months = Array.from({ length: 7 }, (_, index) => {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - (6 - index),
        1,
      );
      const key = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
      const label = monthFormatter
        .format(monthDate)
        .replace(".", "")
        .slice(0, 3)
        .toUpperCase();
      return { key, label, count: 0 };
    });

    const monthCountMap = new Map(months.map((month) => [month.key, 0]));

    for (const loan of loans) {
      const dateValue = loan.loanDate || loan.createdAt;
      const loanDate = new Date(dateValue);
      if (Number.isNaN(loanDate.getTime())) {
        continue;
      }

      const key = `${loanDate.getFullYear()}-${loanDate.getMonth() + 1}`;
      if (!monthCountMap.has(key)) {
        continue;
      }

      monthCountMap.set(key, (monthCountMap.get(key) ?? 0) + 1);
    }

    const counts = months.map((month) => monthCountMap.get(month.key) ?? 0);
    const maxCount = Math.max(1, ...counts);

    return months.map((month, index) => {
      const count = counts[index];
      const height =
        count > 0 ? Math.max(10, Math.round((count / maxCount) * 100)) : 1;

      return {
        label: month.label,
        count,
        height,
      };
    });
  }, [loansForChartQuery.data]);

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return "-";
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

  const stats = [
    {
      label: "Títulos",
      value: totalBooks,
      isLoading: booksQuery.isLoading,
      icon: Book,
      bgClass: "bg-laranja-claro/70",
      textClass: "text-laranja-escuro",
    },
    {
      label: "Autores",
      value: totalAuthors,
      isLoading: authorsQuery.isLoading,
      icon: Users,
      bgClass: "bg-roxo-claro/70",
      textClass: "text-roxo-escuro",
    },
    {
      label: "Empréstimos",
      value: activeLoans,
      isLoading: activeLoansQuery.isLoading,
      icon: ArrowLeftRight,
      bgClass: "bg-vermelho-claro/70",
      textClass: "text-vermelho-escuro",
    },
    {
      label: "Livros",
      value: totalQuantity,
      isLoading: booksQuery.isLoading || allBooksQuery.isLoading,
      icon: LibraryBig,
      bgClass: "bg-verde-claro/70",
      textClass: "text-verde-escuro",
    },
  ];

  const handleOpenEditModal = () => {
    if (!selectedBook) return;
    form.reset({
      title: selectedBook.title,
      isbn: selectedBook.isbn,
      year: selectedBook.year,
      quantity: selectedBook.quantity,
      idAuthor: selectedBook.author.idAuthor,
    });
    openDialog(EDIT_BOOK_MODAL_ID);
  };

  const handleOpenDeleteModal = () => {
    if (!selectedBook) return;
    setBookToDelete(selectedBook);
    openDialog(DELETE_BOOK_MODAL_ID);
  };

  const handleSubmitEdit = form.handleSubmit((values) => {
    if (!selectedBook) return;
    updateBookMutation.mutate({ id: selectedBook.idBook, values });
  });

  return (
    <section className="space-y-6">
      {feedback && (
        <FeedbackToast
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className={`${sectionCardClass}`}>
            <div
              className={`inline-flex rounded p-3 ${stat.bgClass} ${stat.textClass}`}
            >
              <stat.icon className="h-6 w-6" />
            </div>
            {stat.isLoading ? (
              <div className="mt-5 ml-1 h-10 w-18 animate-pulse rounded-xl bg-fundo-superficie-suave" />
            ) : (
              <p className="mt-5 ml-1 text-4xl font-black">{stat.value}</p>
            )}
            <p className="mt-1 ml-1 text-xs font-bold uppercase tracking-[0.2em] text-texto-secundario">
              {stat.label}
            </p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className={`${sectionCardClass} xl:col-span-2`}>
          <header className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black select-none">
              <History className="h-6 w-6 text-destaque" />
              Empréstimos
            </h2>
            <span className="rounded-lg bg-destaque-hover/15 border border-destaque px-2.5 py-1 text-xs font-black uppercase tracking-wider text-destaque select-none">
              Últimos 7 meses
            </span>
          </header>

          {loansForChartQuery.isLoading ? (
            <div className="pb-8 pt-16 flex h-full items-end justify-between gap-2 sm:gap-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex h-full flex-1 flex-col items-center justify-end">
                  <div className="h-3 w-6 animate-pulse rounded bg-fundo-superficie-suave" />
                  <div className="mt-2 flex h-40 w-full items-end justify-center">
                    <div className="h-16 w-3 animate-pulse rounded-t bg-fundo-superficie-suave" />
                  </div>
                  <div className="mt-2 h-3 w-8 animate-pulse rounded bg-fundo-superficie-suave" />
                </div>
              ))}
            </div>
          ) : (
            <div className="pb-8 pt-20 flex h-full items-end justify-between gap-2 sm:gap-3">
              {monthlyLoans.map((month) => (
                <div
                  key={month.label}
                  className="flex h-full flex-1 flex-col items-center justify-end"
                >
                  <div className="relative flex min-h-full h-40 w-full items-end justify-center">
                    <span
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-black text-texto-principal"
                      style={{ bottom: `calc(${month.height}% + 0.35rem)` }}
                    >
                      {month.count}
                    </span>
                    <div
                      className={`w-3 rounded-t transition sm:w-3 ${
                        month.count === 0 ? "bg-destaque/20" : "bg-destaque"
                      }`}
                      style={{ height: `${month.height}%` }}
                      title={`${month.count} empréstimo(s)`}
                    />
                  </div>
                  <span className="mt-2 text-xs font-bold text-texto-secundario select-none">
                    {month.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={sectionCardClass}>
          <header className="mb-5 flex items-center gap-2 text-lg font-black select-none">
            <Book className="h-5.5 w-5.5 text-destaque" />
            Alguns Títulos
          </header>

          <div className="space-y-3">
            {booksQuery.isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`book-loading-${index}`}
                  className="flex items-center justify-between rounded-[10px] bg-fundo-superficie-suave p-3"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-fundo-pagina" />
                    <div className="h-3 w-24 animate-pulse rounded bg-fundo-pagina" />
                  </div>
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-fundo-pagina" />
                </div>
              ))}

            {books.slice(0, 4).map((book) => (
              <div
                key={book.idBook}
                className="flex items-center justify-between rounded-[10px] bg-fundo-superficie-suave p-3"
              >
                <div>
                  <p className="max-w-72 truncate text-md font-bold">
                    {book.title}
                  </p>
                  <p className="text text-texto-secundario font-black">
                    {book.author.name}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Ver livro ${book.title}`}
                  className="cursor-pointer rounded-xl p-2 text-destaque transition hover:bg-fundo-superficie/50"
                  onClick={() => setSelectedBook(book)}
                >
                  <Eye className="h-5.5 w-5.5" />
                </button>
              </div>
            ))}

            {!booksQuery.isLoading && books.length === 0 && (
              <p className="rounded-2xl border border-borda-padrao p-4 text-sm text-texto-secundario">
                Nenhum livro disponível para exibição.
              </p>
            )}
          </div>
        </article>
      </div>

      <DetailsSidePanel
        isOpen={Boolean(selectedBook)}
        title="Detalhes do Título"
        onClose={() => setSelectedBook(null)}
        footer={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="cursor-pointer rounded-xl border border-destaque px-4 py-3 font-bold text-destaque transition hover:bg-destaque-suave"
              onClick={handleOpenEditModal}
              disabled={!selectedBook}
            >
              Editar
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-erro px-4 py-3 font-bold text-white transition hover:bg-erro/70"
              onClick={handleOpenDeleteModal}
              disabled={!selectedBook}
            >
              Excluir
            </button>
          </div>
        }
      >
        {selectedBook && (
          <div className="space-y-6">
            <article className="rounded-3xl border border-borda-padrao bg-fundo-superficie p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-fundo-superficie-suave text-destaque">
                  <Book className="h-10 w-10" />
                </div>
                <div className="min-w-0">
                  <span className="inline-flex rounded-md bg-info/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-info">
                    Livro
                  </span>
                  <h3 className="mt-2 truncate text-2xl font-black">
                    {selectedBook.title}
                  </h3>
                  <p className="my-1 text-lg font-black text-texto-secundario">
                    {selectedBook.author.name}
                  </p>
                </div>
              </div>
            </article>

            <div className="flex flex-row mt-14 justify-between px-5">
              <div className="flex flex-col items-start">
                <p className="text-xs font-black uppercase tracking-wider text-texto-secundario">
                  ISBN
                </p>
                <p className="mt-1 text-lg font-black">{formatIsbn(selectedBook.isbn)}</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs font-black uppercase tracking-wider text-texto-secundario">
                  Disponível
                </p>
                <p className="mt-1 text-lg font-black">{selectedBook.quantity}</p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-xs font-black uppercase tracking-wider text-texto-secundario">
                  Ano
                </p>
                <p className="mt-1 text-lg font-black">{selectedBook.year}</p>
              </div>
            </div>

            <article className="rounded-3xl border border-borda-padrao bg-fundo-superficie p-5 mt-14">
              <h4 className="text-xs font-black uppercase tracking-wider text-destaque">
                Auditoria
              </h4>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-borda-padrao pb-3">
                  <span className="text-sm font-semibold text-texto-secundario">
                    Registro
                  </span>
                  <span className="text-sm font-bold">
                    {formatDateTime(selectedBook.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-texto-secundario">
                    Modificação
                  </span>
                  <span className="text-sm font-bold">
                    {formatDateTime(selectedBook.updatedAt)}
                  </span>
                </div>
              </div>
            </article>
          </div>
        )}
      </DetailsSidePanel>

      <BookEditDialog
        id={EDIT_BOOK_MODAL_ID}
        form={form}
        authorOptions={authorOptions}
        isSubmitting={updateBookMutation.isPending}
        onSubmit={handleSubmitEdit}
        onClose={() => closeDialog(EDIT_BOOK_MODAL_ID)}
      />

      <ConfirmDialog
        id={DELETE_BOOK_MODAL_ID}
        title="Confirmar remoção"
        description={`Deseja remover o livro ${bookToDelete?.title ?? "selecionado"}?`}
        confirmText="Remover"
        isLoading={deleteBookMutation.isPending}
        onConfirm={() => {
          if (!bookToDelete) return;
          deleteBookMutation.mutate(bookToDelete.idBook);
        }}
      />
    </section>
  );
};
