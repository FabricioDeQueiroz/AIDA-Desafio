import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Book, Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { booksApi } from "../services/booksApi";
import { authorsApi } from "../services/authorsApi";
import { bookSchema, type BookFormValues } from "../schemas/forms";
import { applyFieldErrors } from "../utils/formErrors";
import { isApiError } from "../types/api";
import { formatIsbn, normalizeIsbn } from "../utils/isbn";
import { FeedbackToast } from "../components/ui/FeedbackToast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Pagination } from "../components/ui/Pagination";
import { DetailsSidePanel } from "../components/ui/DetailsSidePanel";
import type { BookGetDto } from "../types/bookDtos";

const FORM_MODAL_ID = "book-form-modal";
const DELETE_MODAL_ID = "book-delete-modal";
const PAGE_SIZE = 6;

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

const panelClass =
  "rounded-3xl border border-borda-padrao bg-fundo-superficie p-6 shadow-sm";

const openDialog = (id: string) => {
  const dialog = document.getElementById(id) as HTMLDialogElement | null;
  dialog?.showModal();
};

const closeDialog = (id: string) => {
  const dialog = document.getElementById(id) as HTMLDialogElement | null;
  dialog?.close();
};

export const BooksPage = () => {
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBook, setSelectedBook] = useState<BookGetDto | null>(null);
  const [editingBook, setEditingBook] = useState<BookGetDto | null>(null);
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

  const isbnValue = useWatch({
    control: form.control,
    name: "isbn",
  });

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (
        event.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const booksQuery = useQuery({
    queryKey: ["books", page],
    queryFn: () => booksApi.list(page, PAGE_SIZE),
  });

  const searchBookQuery = useQuery({
    queryKey: ["books", "search", searchTerm],
    enabled: Boolean(searchTerm.trim()),
    queryFn: async () => {
      const normalized = normalizeIsbn(searchTerm);
      const term = searchTerm.trim();

      const runSearch = async (params: { title?: string; isbn?: string }) => {
        try {
          return await booksApi.searchByTitleOrIsbn(params);
        } catch (error) {
          if (isApiError(error) && error.status === 404) {
            return [];
          }

          throw error;
        }
      };

      const requests: Array<Promise<BookGetDto[]>> = [
        runSearch({ title: term }),
      ];

      if (normalized.length > 0) {
        requests.push(runSearch({ isbn: normalized }));
        requests.push(runSearch({ title: term, isbn: normalized }));
      }

      const responses = await Promise.all(requests);
      const merged = responses.flat();

      const uniqueBooksMap = new Map<string, BookGetDto>();
      for (const book of merged) {
        uniqueBooksMap.set(book.idBook, book);
      }

      return Array.from(uniqueBooksMap.values());
    },
  });

  const authorsForFormQuery = useQuery({
    queryKey: ["books", "authors", "all-pages"],
    queryFn: async () => {
      const firstPage = await authorsApi.list(1, PAGE_SIZE);
      const allItems = [...firstPage.items];

      for (let nextPage = 2; nextPage <= firstPage.totalPages; nextPage += 1) {
        const pageData = await authorsApi.list(nextPage, PAGE_SIZE);
        allItems.push(...pageData.items);
      }

      return allItems;
    },
  });

  const createMutation = useMutation({
    mutationFn: booksApi.create,
    onSuccess: () => {
      setFeedback({
        type: "success",
        message: "Livro cadastrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "books"] });
      closeDialog(FORM_MODAL_ID);
      form.reset();
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      applyFieldErrors(error, form.setError, bookFieldMap);
      setFeedback({ type: "error", message: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: BookFormValues }) =>
      booksApi.update(id, {
        idBook: id,
        title: values.title,
        isbn: values.isbn,
        year: values.year,
        quantity: values.quantity,
        idAuthor: values.idAuthor,
      }),
    onSuccess: () => {
      setFeedback({
        type: "success",
        message: "Livro atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "books"] });
      closeDialog(FORM_MODAL_ID);
      setSelectedBook(null);
      setEditingBook(null);
      form.reset();
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      applyFieldErrors(error, form.setError, bookFieldMap);
      setFeedback({ type: "error", message: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: booksApi.remove,
    onSuccess: () => {
      setFeedback({ type: "success", message: "Livro removido com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "books"] });
      closeDialog(DELETE_MODAL_ID);
      setSelectedBook(null);
      setBookToDelete(null);
    },
    onError: (error) => {
      if (!isApiError(error)) return;

      const conflictMessage =
        error.status === 409
          ? "Não é possível remover: este livro possui empréstimos vinculados."
          : error.message;

      setFeedback({ type: "error", message: conflictMessage });
      closeDialog(DELETE_MODAL_ID);
      setBookToDelete(null);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const submitLabel = editingBook ? "Salvar alterações" : "Cadastrar livro";
  const modalTitle = useMemo(
    () => (editingBook ? "Editar livro" : "Cadastrar livro"),
    [editingBook],
  );

  const authors = authorsForFormQuery.data ?? [];
  const searchActive = Boolean(searchTerm.trim());
  const searchedBooks = searchBookQuery.data ?? [];
  const books = searchActive ? searchedBooks : (booksQuery.data?.items ?? []);

  const handleOpenCreate = () => {
    setEditingBook(null);
    form.reset({ title: "", isbn: "", year: 0, quantity: 0, idAuthor: "" });
    openDialog(FORM_MODAL_ID);
  };

  const handleOpenEdit = (book: BookGetDto) => {
    setEditingBook(book);
    form.reset({
      title: book.title,
      isbn: book.isbn,
      year: book.year,
      quantity: book.quantity,
      idAuthor: book.author.idAuthor,
    });
    openDialog(FORM_MODAL_ID);
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (editingBook) {
      updateMutation.mutate({ id: editingBook.idBook, values });
      return;
    }

    createMutation.mutate({
      title: values.title,
      isbn: values.isbn,
      year: values.year,
      quantity: values.quantity,
      idAuthor: values.idAuthor,
    });
  });

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

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
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
        <h1 className="text-2xl font-black">Lista de Livros</h1>

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
        <form
          onSubmit={handleSearch}
          className="mb-5 flex flex-col gap-3 sm:flex-row"
        >
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-texto-principal" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por título ou ISBN"
              className="w-full rounded-lg bg-fundo-superficie-suave px-10 py-2.5 text-texto-principal outline-none transition border-2 border-fundo-superficie-suave focus:border-destaque"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.blur();
                }
              }}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-texto-principal/60 flex flex-row gap-x-1">
              <kbd className="kbd bg-fundo-navbar-sidebar/30 border-0">Ctrl</kbd>
              +
              <kbd className="kbd bg-fundo-navbar-sidebar/30 border-0">K</kbd>
            </div>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-destaque px-8 py-2.5 text-sm font-bold text-texto-principal transition hover:bg-destaque-hover"
            >
              Buscar
            </button>

            <button
              type="button"
              className="cursor-pointer rounded-lg bg-fundo-superficie-suave px-8 py-2.5 text-sm font-bold text-texto-principal transition hover:bg-fundo-pagina disabled:cursor-not-allowed disabled:opacity-60"
              onClick={clearSearch}
              disabled={!searchActive && !searchInput}
            >
              Limpar
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left">
            <thead>
              <tr className="border-b border-borda-padrao text-xs uppercase tracking-[0.2em] text-texto-secundario">
                <th className="px-3 py-3">Título</th>
                <th className="px-3 py-3">ISBN</th>
                <th className="px-3 py-3">Disponível</th>
                <th className="px-3 py-3">Ano</th>
                <th className="px-3 py-3">Autor</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(booksQuery.isLoading || searchBookQuery.isLoading) && (
                <tr>
                  <td colSpan={6} className="px-3 py-6">
                    <div className="flex items-center gap-2 text-sm text-texto-secundario">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando livros...
                    </div>
                  </td>
                </tr>
              )}

              {books.map((book) => (
                <tr
                  key={book.idBook}
                  className="border-b border-borda-padrao/60"
                >
                  <td className="px-3 py-4 font-semibold">{book.title}</td>
                  <td className="px-3 py-4 font-semibold text-texto-secundario w-[15%]">
                    {formatIsbn(book.isbn)}
                  </td>
                  <td className="px-3 py-4 w-[12%]">
                    <span className="rounded bg-fundo-superficie-suave px-4 py-1.5 text-sm font-semibold">
                      {book.quantity}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm font-black text-texto-secundario">
                    {book.year}
                  </td>
                  <td className="px-3 py-4 text-sm font-black text-texto-secundario">
                    {book.author.name}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="cursor-pointer rounded-xl p-2 text-destaque transition hover:bg-fundo-pagina"
                        onClick={() => setSelectedBook(book)}
                        aria-label={`Ver livro ${book.title}`}
                      >
                        <Eye className="h-5.5 w-5.5" />
                      </button>

                      <button
                        type="button"
                        className="cursor-pointer rounded-xl p-2 text-texto-secundario transition hover:bg-fundo-pagina"
                        onClick={() => handleOpenEdit(book)}
                        aria-label={`Editar livro ${book.title}`}
                      >
                        <Pencil className="h-5.5 w-5.5" />
                      </button>

                      <button
                        type="button"
                        className="cursor-pointer rounded-xl p-2 text-erro transition hover:bg-fundo-pagina"
                        onClick={() => {
                          setBookToDelete(book);
                          openDialog(DELETE_MODAL_ID);
                        }}
                        aria-label={`Excluir livro ${book.title}`}
                      >
                        <Trash2 className="h-5.5 w-5.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!booksQuery.isLoading &&
                !searchBookQuery.isLoading &&
                books.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-sm text-texto-secundario"
                    >
                      Nenhum livro encontrado.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </article>

      {!searchActive && (
        <Pagination
          page={page}
          totalPages={booksQuery.data?.totalPages ?? 1}
          totalCount={booksQuery.data?.totalCount ?? 0}
          onPageChange={setPage}
        />
      )}

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
        <div className="w-[min(92vw,34rem)] rounded-3xl border border-borda-padrao bg-fundo-superficie p-6 text-texto-principal shadow-2xl">
          <h3 className="text-lg font-bold">{modalTitle}</h3>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Título</span>
              <input
                type="text"
                className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 text-texto-principal outline-none transition focus:border-destaque"
                {...form.register("title")}
                aria-invalid={Boolean(form.formState.errors.title)}
              />
              <span className="mt-1 block text-xs text-erro">
                {form.formState.errors.title?.message}
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">ISBN</span>
              <input
                type="text"
                className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 text-texto-principal outline-none transition focus:border-destaque"
                inputMode="numeric"
                value={formatIsbn(isbnValue ?? "")}
                onChange={(event) => {
                  form.setValue("isbn", normalizeIsbn(event.target.value), {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
                aria-invalid={Boolean(form.formState.errors.isbn)}
              />
              <span className="mt-1 block text-xs text-erro">
                {form.formState.errors.isbn?.message}
              </span>
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Ano</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 text-texto-principal outline-none transition focus:border-destaque"
                  {...form.register("year", { valueAsNumber: true })}
                  aria-invalid={Boolean(form.formState.errors.year)}
                />
                <span className="mt-1 block text-xs text-erro">
                  {form.formState.errors.year?.message}
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold">
                  Quantidade
                </span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 text-texto-principal outline-none transition focus:border-destaque"
                  {...form.register("quantity", { valueAsNumber: true })}
                  aria-invalid={Boolean(form.formState.errors.quantity)}
                />
                <span className="mt-1 block text-xs text-erro">
                  {form.formState.errors.quantity?.message}
                </span>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Autor</span>
              <select
                className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 text-texto-principal outline-none transition focus:border-destaque"
                {...form.register("idAuthor")}
                aria-invalid={Boolean(form.formState.errors.idAuthor)}
              >
                <option value="">Selecione</option>
                {authors.map((author) => (
                  <option key={author.idAuthor} value={author.idAuthor}>
                    {author.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-erro">
                {form.formState.errors.idAuthor?.message}
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
                {submitLabel}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      <ConfirmDialog
        id={DELETE_MODAL_ID}
        title="Confirmar remoção"
        description={`Deseja remover o livro ${bookToDelete?.title ?? "selecionado"}?`}
        confirmText="Remover"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!bookToDelete) return;
          deleteMutation.mutate(bookToDelete.idBook);
        }}
      />

      <DetailsSidePanel
        isOpen={Boolean(selectedBook)}
        title="Detalhes do Título"
        onClose={() => setSelectedBook(null)}
        footer={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="cursor-pointer rounded-xl border border-destaque px-4 py-3 font-bold text-destaque transition hover:bg-destaque-suave"
              onClick={() => {
                if (!selectedBook) return;
                handleOpenEdit(selectedBook);
              }}
              disabled={!selectedBook}
            >
              Editar
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-erro px-4 py-3 font-bold text-texto-principal transition hover:bg-erro/70"
              onClick={() => {
                if (!selectedBook) return;
                setBookToDelete(selectedBook);
                openDialog(DELETE_MODAL_ID);
              }}
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

            <div className="mt-10 flex flex-row justify-between px-5">
              <div className="flex flex-col items-start">
                <p className="text-xs font-black uppercase tracking-wider text-texto-secundario">
                  ISBN
                </p>
                <p className="mt-1 text-lg font-black">
                  {formatIsbn(selectedBook.isbn)}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs font-black uppercase tracking-wider text-texto-secundario">
                  Disponível
                </p>
                <p className="mt-1 text-lg font-black">
                  {selectedBook.quantity}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-xs font-black uppercase tracking-wider text-texto-secundario">
                  Ano
                </p>
                <p className="mt-1 text-lg font-black">{selectedBook.year}</p>
              </div>
            </div>

            <article className="mt-10 rounded-3xl border border-borda-padrao bg-fundo-superficie p-5">
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
    </section>
  );
};
