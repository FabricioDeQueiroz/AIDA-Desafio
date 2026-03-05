import axios from "axios";
import { APP_CONFIG } from "../utils/constants";
import type { ApiError, ValidationErrorResponse } from "../types/api";
import { requestTracker } from "./requestTracker";

const normalizeApiError = (error: unknown): ApiError => {
  if (!axios.isAxiosError(error)) {
    const fallback = new Error("Erro inesperado de comunicação.") as ApiError;
    fallback.raw = error;
    return fallback;
  }

  const status = error.response?.status;
  const data = error.response?.data as unknown;
  const defaultMessage = "Falha ao processar a requisição.";

  if (typeof data === "string") {
    const apiError = new Error(data || defaultMessage) as ApiError;
    apiError.status = status;
    apiError.raw = data;
    return apiError;
  }

  if (typeof data === "object" && data !== null) {
    const maybeValidation = data as ValidationErrorResponse;
    const title = maybeValidation.title;
    const fieldErrors = maybeValidation.errors;
    const fieldMessages = fieldErrors
      ? Object.values(fieldErrors).flat().filter(Boolean)
      : [];

    const message = fieldMessages[0] ?? title ?? defaultMessage;

    const apiError = new Error(message) as ApiError;
    apiError.status = status;
    apiError.fieldErrors = fieldErrors;
    apiError.raw = data;

    return apiError;
  }

  const apiError = new Error(defaultMessage) as ApiError;
  apiError.status = status;
  apiError.raw = data;
  return apiError;
};

export const api = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  requestTracker.start();
  return config;
});

api.interceptors.response.use(
  (response) => {
    requestTracker.end();
    return response;
  },
  (error) => {
    requestTracker.end();
    return Promise.reject(normalizeApiError(error));
  },
);
