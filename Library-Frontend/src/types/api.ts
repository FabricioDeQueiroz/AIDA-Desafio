export type ValidationErrorResponse = {
  type?: string;
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
  traceId?: string;
};

export type ApiError = Error & {
  status?: number;
  fieldErrors?: Record<string, string[]>;
  raw?: unknown;
};

export const isApiError = (error: unknown): error is ApiError => {
  if (typeof error !== "object" || error === null) return false;
  return "message" in error;
};
