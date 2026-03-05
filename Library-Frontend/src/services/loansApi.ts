import { api } from "./api";
import type {
  LoanCreateDto,
  LoanDetailGetDto,
  LoanGetDto,
  LoanStatus,
} from "../types/loanDtos";
import type { PagedResult } from "../types/commonDtos";

export const loansApi = {
  async list(page: number, size: number, status?: LoanStatus) {
    const { data } = await api.get<PagedResult<LoanGetDto>>("/loan", {
      params: { page, size, status },
    });
    return data;
  },
  async detail(id: string) {
    const { data } = await api.get<LoanDetailGetDto>(`/loan/${id}`);
    return data;
  },
  async create(payload: LoanCreateDto) {
    const { data } = await api.post<LoanDetailGetDto>("/loan", payload);
    return data;
  },
  async returnLoan(id: string) {
    const { data } = await api.put<LoanDetailGetDto>(`/loan/${id}`);
    return data;
  },
};
