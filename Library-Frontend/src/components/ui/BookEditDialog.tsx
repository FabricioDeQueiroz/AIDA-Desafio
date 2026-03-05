import type { AuthorSummaryDto } from "../../types/commonDtos";
import type { BookFormValues } from "../../schemas/forms";
import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { formatIsbn, normalizeIsbn } from "../../utils/isbn";

type BookEditDialogProps = {
  id: string;
  form: UseFormReturn<BookFormValues>;
  authorOptions: AuthorSummaryDto[];
  isSubmitting: boolean;
  onSubmit: (event?: BaseSyntheticEvent) => void;
  onClose: () => void;
};

export const BookEditDialog = ({
  id,
  form,
  authorOptions,
  isSubmitting,
  onSubmit,
  onClose,
}: BookEditDialogProps) => {
  const isbnValue = form.watch("isbn");

  return (
    <dialog
      id={id}
      className="fixed inset-0 m-auto rounded-3xl bg-transparent p-0 backdrop:bg-black/40"
      onClick={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div className="w-[min(92vw,34rem)] rounded-3xl border border-borda-padrao bg-fundo-superficie p-6 shadow-2xl">
        <h3 className="text-lg font-bold">Editar livro</h3>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Título</span>
            <input
              type="text"
              className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 outline-none transition focus:border-destaque"
              {...form.register("title")}
              aria-invalid={Boolean(form.formState.errors.title)}
            />
            <span className="mt-1 block text-xs text-erro">{form.formState.errors.title?.message}</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">ISBN</span>
            <input
              type="text"
              className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 outline-none transition focus:border-destaque"
              inputMode="numeric"
              value={formatIsbn(isbnValue)}
              onChange={(event) => {
                form.setValue("isbn", normalizeIsbn(event.target.value), {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
              aria-invalid={Boolean(form.formState.errors.isbn)}
            />
            <span className="mt-1 block text-xs text-erro">{form.formState.errors.isbn?.message}</span>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Ano</span>
              <input
                type="number"
                className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 outline-none transition focus:border-destaque"
                {...form.register("year", { valueAsNumber: true })}
                aria-invalid={Boolean(form.formState.errors.year)}
              />
              <span className="mt-1 block text-xs text-erro">{form.formState.errors.year?.message}</span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Quantidade</span>
              <input
                type="number"
                className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 outline-none transition focus:border-destaque"
                {...form.register("quantity", { valueAsNumber: true })}
                aria-invalid={Boolean(form.formState.errors.quantity)}
              />
              <span className="mt-1 block text-xs text-erro">{form.formState.errors.quantity?.message}</span>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Autor</span>
            <select
              className="w-full rounded-xl border border-borda-padrao bg-fundo-superficie px-3 py-2 outline-none transition focus:border-destaque"
              {...form.register("idAuthor")}
              aria-invalid={Boolean(form.formState.errors.idAuthor)}
            >
              <option value="">Selecione</option>
              {authorOptions.map((author) => (
                <option key={author.idAuthor} value={author.idAuthor}>
                  {author.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-erro">{form.formState.errors.idAuthor?.message}</span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-texto-secundario transition hover:bg-fundo-superficie-suave"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-destaque px-4 py-2 text-sm font-semibold text-white transition hover:bg-destaque-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};