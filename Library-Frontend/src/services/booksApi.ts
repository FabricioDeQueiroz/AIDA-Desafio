import { api } from "./api";
import type {
  BookCreateDto,
  BookGetDto,
  BookUpdateDto,
} from "../types/bookDtos";
import type { PagedResult } from "../types/commonDtos";

export const booksApi = {
  async list(page: number, size: number) {
    const { data } = await api.get<PagedResult<BookGetDto>>("/book", {
      params: { page, size },
    });
    return data;
  },
  async detail(id: string) {
    const { data } = await api.get<BookGetDto>(`/book/${id}`);
    return data;
  },
  async searchByTitleOrIsbn(params: { title?: string; isbn?: string }) {
    const { data } = await api.get<BookGetDto[]>("/book/title-isbn", {
      params,
    });
    return data;
  },
  async create(payload: BookCreateDto) {
    const { data } = await api.post<BookGetDto>("/book", payload);
    return data;
  },
  async update(id: string, payload: BookUpdateDto) {
    const { data } = await api.put<BookGetDto>(`/book/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await api.delete(`/book/${id}`);
  },
};
