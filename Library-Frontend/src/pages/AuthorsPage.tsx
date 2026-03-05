import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Book, Eye, Loader2, Pencil, Plus, Trash2, User } from "lucide-react";
import { authorsApi } from "../services/authorsApi";
import { booksApi } from "../services/booksApi";
import { authorSchema, type AuthorFormValues } from "../schemas/forms";
import { isApiError } from "../types/api";
import { applyFieldErrors } from "../utils/formErrors";
import type { AuthorGetDto } from "../types/authorDtos";
import { FeedbackToast } from "../components/ui/FeedbackToast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Pagination } from "../components/ui/Pagination";
import { DetailsSidePanel } from "../components/ui/DetailsSidePanel";

const FORM_MODAL_ID = "author-form-modal";
const DELETE_MODAL_ID = "author-delete-modal";

const authorFieldMap = {
  Name: "name",
  Nationality: "nationality",
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

export const AuthorsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingAuthor, setEditingAuthor] = useState<AuthorGetDto | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [authorToDelete, setAuthorToDelete] = useState<AuthorGetDto | null>(
    null,
  );
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      name: "",
      nationality: "",
    },
  });

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const authorsQuery = useQuery({
    queryKey: ["authors", page],
    queryFn: () => authorsApi.list(page, 6),
  });

  const authorDetailsQuery = useQuery({
    queryKey: ["author", "detail", selectedAuthorId],
    enabled: Boolean(selectedAuthorId),
    queryFn: () => authorsApi.detail(selectedAuthorId!),
  });

  const authorBookIds =
    authorDetailsQuery.data?.books.map((book) => book.idBook) ?? [];

  const authorBooksWithDatesQuery = useQuery({
    queryKey: [
      "author",
      "books",
      "detail",
      selectedAuthorId,
      authorBookIds.join(","),
    ],
    enabled: Boolean(selectedAuthorId) && authorBookIds.length > 0,
    queryFn: async () => {
      return Promise.all(
        authorBookIds.map(async (idBook) => {
          const detail = await booksApi.detail(idBook);
          return detail;
        }),
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: authorsApi.create,
    onSuccess: () => {
      setFeedback({
        type: "success",
        message: "Autor cadastrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      closeDialog(FORM_MODAL_ID);
      form.reset();
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      applyFieldErrors(error, form.setError, authorFieldMap);
      setFeedback({ type: "error", message: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AuthorFormValues }) =>
      authorsApi.update(id, {
        idAuthor: id,
        name: values.name,
        nationality: values.nationality || null,
      }),
    onSuccess: () => {
      setFeedback({
        type: "success",
        message: "Autor atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      closeDialog(FORM_MODAL_ID);
      setEditingAuthor(null);
      form.reset();
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      applyFieldErrors(error, form.setError, authorFieldMap);
      setFeedback({ type: "error", message: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: authorsApi.remove,
    onSuccess: () => {
      setFeedback({ type: "success", message: "Autor removido com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      closeDialog(DELETE_MODAL_ID);
      setSelectedAuthorId(null);
      setAuthorToDelete(null);
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      setFeedback({ type: "error", message: error.message });
      closeDialog(DELETE_MODAL_ID);
      setAuthorToDelete(null);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const submitLabel = editingAuthor ? "Salvar alterações" : "Cadastrar autor";
  const authorItems = authorsQuery.data?.items ?? [];
  const modalTitle = useMemo(
    () => (editingAuthor ? "Editar autor" : "Cadastrar autor"),
    [editingAuthor],
  );
  const authorDetail = authorDetailsQuery.data;

  const authorBooksWithDates =
    authorBooksWithDatesQuery.data?.map((book) => ({
      idBook: book.idBook,
      title: book.title,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      year: book.year,
    })) ?? [];

  const handleOpenCreate = () => {
    setEditingAuthor(null);
    form.reset({ name: "", nationality: "" });
    openDialog(FORM_MODAL_ID);
  };

  const handleOpenEdit = (author: AuthorGetDto) => {
    setEditingAuthor(author);
    form.reset({
      name: author.name,
      nationality: author.nationality ?? "",
    });
    openDialog(FORM_MODAL_ID);
  };

  const handleOpenDelete = (author: AuthorGetDto) => {
    setAuthorToDelete(author);
    openDialog(DELETE_MODAL_ID);
  };

  const handleOpenEditFromDetails = () => {
    if (!authorDetail) return;

    handleOpenEdit({
      idAuthor: authorDetail.idAuthor,
      name: authorDetail.name,
      nationality: authorDetail.nationality,
      bookCount: authorDetail.bookCount,
      createdAt: authorDetail.createdAt,
      updatedAt: authorDetail.updatedAt,
    });
  };

  const handleOpenDeleteFromDetails = () => {
    if (!authorDetail) return;

    handleOpenDelete({
      idAuthor: authorDetail.idAuthor,
      name: authorDetail.name,
      nationality: authorDetail.nationality,
      bookCount: authorDetail.bookCount,
      createdAt: authorDetail.createdAt,
      updatedAt: authorDetail.updatedAt,
    });
  };

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

  const handleSubmit = form.handleSubmit((values) => {
    if (editingAuthor) {
      updateMutation.mutate({ id: editingAuthor.idAuthor, values });
      return;
    }

    createMutation.mutate({
      name: values.name,
      nationality: values.nationality || null,
    });
  });

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
        <div>
          <h1 className="text-2xl font-black">Lista de Autores</h1>
        </div>

        <button
          type="button"
          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-destaque px-4 py-3 text-sm font-bold text-white transition hover:bg-destaque-hover"
          onClick={handleOpenCreate}
        >
          <Plus className="h-5.5 w-5.5" />
          CADASTRAR
        </button>
      </div>

      <article className={`${panelClass} overflow-x-auto`}>
        <table className="w-full min-w-175 text-left">
          <thead>
            <tr className="border-b border-borda-padrao text-xs uppercase tracking-[0.2em] text-texto-secundario">
              <th className="px-3 py-3">Nome</th>
              <th className="px-3 py-3">Nacionalidade</th>
              <th className="px-3 py-3">Livros</th>
              <th className="px-3 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {authorsQuery.isLoading && (
              <tr>
                <td colSpan={4} className="px-3 py-6">
                  <div className="flex items-center gap-2 text-sm text-texto-secundario">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando autores...
                  </div>
                </td>
              </tr>
            )}

            {authorItems.map((author) => (
              <tr
                key={author.idAuthor}
                className="border-b border-borda-padrao/60"
              >
                <td className="px-3 py-4 font-semibold">{author.name}</td>
                <td className="px-3 py-4 font-black text-sm text-texto-secundario">
                  {author.nationality ?? "Não informada"}
                </td>
                <td className="px-3 py-4">
                  <span className="rounded bg-fundo-superficie-suave px-5 py-2 text-sm font-semibold">
                    {author.bookCount}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="cursor-pointer rounded-xl p-2 text-destaque transition hover:bg-fundo-pagina"
                      onClick={() => setSelectedAuthorId(author.idAuthor)}
                      aria-label={`Ver autor ${author.name}`}
                    >
                      <Eye className="h-5.5 w-5.5" />
                    </button>

                    <button
                      type="button"
                      className="cursor-pointer rounded-xl p-2 text-texto-secundario transition hover:bg-fundo-pagina"
                      onClick={() => handleOpenEdit(author)}
                      aria-label={`Editar autor ${author.name}`}
                    >
                      <Pencil className="h-5.5 w-5.5" />
                    </button>

                    <button
                      type="button"
                      className="cursor-pointer rounded-xl p-2 text-erro transition hover:bg-fundo-pagina"
                      onClick={() => handleOpenDelete(author)}
                      aria-label={`Excluir autor ${author.name}`}
                    >
                      <Trash2 className="h-5.5 w-5.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!authorsQuery.isLoading && authorItems.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-sm text-texto-secundario"
                >
                  Nenhum autor encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </article>

      <Pagination
        page={page}
        totalPages={authorsQuery.data?.totalPages ?? 1}
        totalCount={authorsQuery.data?.totalCount ?? 0}
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
        <div className="w-[min(92vw,34rem)] rounded-3xl border border-borda-padrao bg-fundo-superficie p-6 text-texto-principal shadow-2xl">
          <h3 className="text-lg font-bold">{modalTitle}</h3>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Nome</span>
              <input
                type="text"
                className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 text-texto-principal outline-none transition focus:border-destaque"
                {...form.register("name")}
                aria-invalid={Boolean(form.formState.errors.name)}
              />
              <span className="mt-1 block text-xs text-erro">
                {form.formState.errors.name?.message}
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Nacionalidade (2 letras)
              </span>
              <input
                type="text"
                className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 text-texto-principal uppercase outline-none transition focus:border-destaque"
                maxLength={2}
                {...form.register("nationality")}
                aria-invalid={Boolean(form.formState.errors.nationality)}
              />
              <span className="mt-1 block text-xs text-erro">
                {form.formState.errors.nationality?.message}
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

      <DetailsSidePanel
        isOpen={Boolean(selectedAuthorId)}
        title="Detalhes do Autor"
        onClose={() => setSelectedAuthorId(null)}
        footer={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="cursor-pointer rounded-xl border border-destaque px-4 py-3 font-bold text-destaque transition hover:bg-destaque-suave disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleOpenEditFromDetails}
              disabled={!authorDetail}
            >
              Editar
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-erro px-4 py-3 font-bold text-white transition hover:bg-erro/70 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleOpenDeleteFromDetails}
              disabled={!authorDetail}
            >
              Excluir
            </button>
          </div>
        }
      >
        {authorDetailsQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-texto-secundario">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando dados do autor...
          </div>
        )}

        {authorDetail && (
          <div className="space-y-6">
            <article className="rounded-3xl border border-borda-padrao bg-fundo-superficie p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-fundo-superficie-suave text-destaque">
                  <User className="h-10 w-10" />
                </div>
                <div className="min-w-0">
                  <span className="inline-flex rounded-md bg-info/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-info">
                    Autor
                  </span>
                  <h3 className="mt-2 truncate text-2xl font-black">
                    {authorDetail.name}
                  </h3>
                  <p className="my-1 text-texto-secundario font-black">
                    {authorDetail.nationality ?? "Nacionalidade não informada"}
                  </p>
                </div>
              </div>
            </article>

            <div className="grid grid-cols-2 gap-4 px-1">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-texto-secundario">
                  Livros Registrados
                </p>
                <p className="mt-1 text-lg font-black">
                  {authorDetail.bookCount}
                </p>
              </div>
            </div>

            <article className="rounded-3xl bg-fundo-superficie p-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-destaque">
                Livros do Autor
              </h4>
              <div className="mt-4 max-h-52 space-y-3 overflow-y-auto pr-1">
                {authorBooksWithDatesQuery.isLoading && (
                  <div className="flex items-center gap-2 text-sm text-texto-secundario">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando livros...
                  </div>
                )}

                {!authorBooksWithDatesQuery.isLoading &&
                  authorBooksWithDates.length === 0 && (
                    <p className="rounded-xl p-3 text-sm text-texto-secundario">
                      Este autor ainda não possui livros cadastrados.
                    </p>
                  )}

                {authorBooksWithDates.map((book) => (
                  <div
                    key={book.idBook}
                    className="rounded-xl bg-fundo-superficie-suave p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Book className="mt-0.5 h-4.5 w-4.5 text-destaque" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{book.title}</p>
                        <p className="text-sm font-black text-texto-secundario">
                          Ano: {book.year}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl bg-fundo-superficie p-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-destaque">
                Auditoria
              </h4>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-borda-padrao pb-3">
                  <span className="text-sm font-semibold text-texto-secundario">
                    Registro
                  </span>
                  <span className="text-sm font-bold">
                    {formatDateTime(authorDetail.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-texto-secundario">
                    Modificação
                  </span>
                  <span className="text-sm font-bold">
                    {formatDateTime(authorDetail.updatedAt)}
                  </span>
                </div>
              </div>
            </article>
          </div>
        )}
      </DetailsSidePanel>

      <ConfirmDialog
        id={DELETE_MODAL_ID}
        title="Confirmar remoção"
        description={`Deseja remover o autor ${authorToDelete?.name ?? "selecionado"}?`}
        confirmText="Remover"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!authorToDelete) return;
          deleteMutation.mutate(authorToDelete.idAuthor);
        }}
      />
    </section>
  );
};
