import { api } from "./api";
import type {
  AuthorCreateDto,
  AuthorDetailGetDto,
  AuthorGetDto,
  AuthorUpdateDto,
} from "../types/authorDtos";

export const authorsApi = {
  async list(page: number, size: number) {
    const { data } = await api.get<AuthorGetDto[]>("/author", {
      params: { page, size },
    });
    return data;
  },
  async detail(id: string) {
    const { data } = await api.get<AuthorDetailGetDto>(`/author/${id}`);
    return data;
  },
  async create(payload: AuthorCreateDto) {
    const { data } = await api.post<AuthorDetailGetDto>("/author", payload);
    return data;
  },
  async update(id: string, payload: AuthorUpdateDto) {
    const { data } = await api.put<AuthorDetailGetDto>(
      `/author/${id}`,
      payload,
    );
    return data;
  },
  async remove(id: string) {
    await api.delete(`/author/${id}`);
  },
};
