import { api } from "./client";
import type { BookSearchResult, BookStatus, UserBook } from "../types";

interface AddToShelfPayload extends BookSearchResult {
  status: BookStatus;
  rating?: number;
  year: number;
}

export const shelfApi = {
  getMyShelf: (year?: number) => {
    const params = year !== undefined ? `?year=${year}` : "";
    return api.get<UserBook[]>(`/shelf${params}`);
  },

  addBook: (payload: AddToShelfPayload) => api.post<UserBook>("/shelf", payload),

  update: (id: number, status?: BookStatus, rating?: number) =>
    api.patch<UserBook>(`/shelf/${id}`, { status, rating }),

  remove: (id: number) => api.delete<void>(`/shelf/${id}`),
};
