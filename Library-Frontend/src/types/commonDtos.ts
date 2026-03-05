export type BookSummaryDto = {
  idBook: string;
  title: string;
  year: number;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
};

export type AuthorSummaryDto = {
  idAuthor: string;
  name: string;
  nationality: string | null;
};
