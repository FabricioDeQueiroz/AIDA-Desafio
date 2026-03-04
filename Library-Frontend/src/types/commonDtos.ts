export type BookSummaryDto = {
  idBook: string;
  title: string;
  year: number;
};

export type AuthorSummaryDto = {
  idAuthor: string;
  name: string;
  nationality: string | null;
};
