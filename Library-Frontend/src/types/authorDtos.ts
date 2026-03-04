import type { BookSummaryDto } from "./commonDtos";

export type AuthorGetDto = {
  idAuthor: string;
  name: string;
  nationality: string | null;
  bookCount: number;
  createdAt: string;
  updatedAt: string | null;
};

export type AuthorDetailGetDto = {
  idAuthor: string;
  name: string;
  nationality: string | null;
  bookCount: number;
  createdAt: string;
  updatedAt: string | null;
  books: BookSummaryDto[];
};

export type AuthorCreateDto = {
  name: string;
  nationality?: string | null;
};

export type AuthorUpdateDto = {
  idAuthor: string;
  name: string;
  nationality?: string | null;
};
