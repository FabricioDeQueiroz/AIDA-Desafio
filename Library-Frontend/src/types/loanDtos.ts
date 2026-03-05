import type { BookSummaryDto } from "./commonDtos";

export type LoanStatus = 1 | 2;

export const getLoanStatusLabel = (status: LoanStatus): string => {
  return status === 1 ? "Ativo" : "Devolvido";
};

export type LoanGetDto = {
  id: string;
  borrowerName: string;
  loanDate: string;
  returnDate: string | null;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string | null;
  bookTitle: string;
};

export type LoanDetailGetDto = {
  id: string;
  borrowerName: string;
  loanDate: string;
  returnDate: string | null;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string | null;
  book: BookSummaryDto;
};

export type LoanCreateDto = {
  borrowerName: string;
  bookId: string;
};
