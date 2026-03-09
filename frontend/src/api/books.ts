import { api } from "./client";
import type { BookSearchResult } from "../types";

export const booksApi = {
  search: (q: string) => api.get<BookSearchResult[]>(`/books/search?q=${encodeURIComponent(q)}`),
};
