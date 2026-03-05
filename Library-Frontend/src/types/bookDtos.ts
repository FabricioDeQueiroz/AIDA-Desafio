import type { AuthorSummaryDto } from "./commonDtos";

export type BookGetDto = {
  idBook: string;
  title: string;
  isbn: string;
  year: number;
  quantity: number;
  createdAt: string;
  updatedAt: string | null;
  author: AuthorSummaryDto;
};

export type BookCreateDto = {
  title: string;
  isbn: string;
  year: number;
  quantity: number;
  idAuthor: string;
};

export type BookUpdateDto = {
  idBook: string;
  title: string;
  isbn: string;
  year: number;
  quantity: number;
  idAuthor: string;
};
