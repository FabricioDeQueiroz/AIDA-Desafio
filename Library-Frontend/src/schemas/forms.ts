import { z } from "zod";

export const authorSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres.").max(150),
  nationality: z
    .string()
    .trim()
    .toUpperCase()
    .length(2, "A nacionalidade deve ter 2 caracteres.")
    .or(z.literal("")),
});

export const bookSchema = z.object({
  title: z
    .string()
    .min(3, "O título deve ter no mínimo 3 caracteres.")
    .max(300),
  isbn: z.string().length(13, "O ISBN deve ter 13 caracteres."),
  year: z.number().int().min(0, "O ano não pode ser negativo.").max(32767),
  quantity: z.number().int().min(0, "A quantidade não pode ser negativa."),
  idAuthor: z.uuid("Selecione um autor válido."),
});

export const loanSchema = z.object({
  borrowerName: z
    .string()
    .min(3, "O nome deve ter no mínimo 3 caracteres.")
    .max(150),
  bookId: z.uuid("Selecione um livro válido."),
});

export type AuthorFormValues = z.infer<typeof authorSchema>;
export type BookFormValues = z.infer<typeof bookSchema>;
export type LoanFormValues = z.infer<typeof loanSchema>;
