export const normalizeIsbn = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 13);
};

export const formatIsbn = (value: string): string => {
  const digits = normalizeIsbn(value);
  const chunks = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 13)].filter(Boolean);
  return chunks.join("-");
};