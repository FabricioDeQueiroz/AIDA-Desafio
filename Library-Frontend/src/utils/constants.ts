export const APP_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  defaultPageSize: 10,
} as const;

export const ROUTES = {
  home: "/",
  authors: "/authors",
  books: "/books",
  loans: "/loans",
} as const;
