export const APP_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  defaultPageSize: 10,
} as const;

export const ROUTES = {
  home: "/",
  dashboard: "/panel",
  authors: "/authors",
  books: "/books",
  loans: "/loans",
} as const;
