import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import type { ApiError } from "../types/api";

type KeyMap = Record<string, string>;

export const applyFieldErrors = <T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  keyMap: KeyMap,
) => {
  if (!error.fieldErrors) return;

  Object.entries(error.fieldErrors).forEach(([key, messages]) => {
    const mapped = keyMap[key];
    if (!mapped || messages.length === 0) return;

    setError(mapped as FieldPath<T>, {
      type: "server",
      message: messages[0],
    });
  });
};
