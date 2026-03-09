import { api } from "./client";
import type { FeedItem, User, UserBook } from "../types";

export const usersApi = {
  search: (q: string) => api.get<User[]>(`/users/search?q=${encodeURIComponent(q)}`),

  getFeed: () => api.get<FeedItem[]>("/users/feed"),

  getUser: (username: string) => api.get<User>(`/users/${username}`),

  getUserShelf: (username: string, year?: number) => {
    const params = year !== undefined ? `?year=${year}` : "";
    return api.get<UserBook[]>(`/users/${username}/shelf${params}`);
  },

  follow: (username: string) => api.post<{ message: string }>(`/users/${username}/follow`),

  unfollow: (username: string) => api.delete<void>(`/users/${username}/follow`),

  like: (userBookId: number) =>
    api.post<{ likes_count: number; liked_by_me: boolean }>(`/users/likes/${userBookId}`),

  unlike: (userBookId: number) =>
    api.delete<{ likes_count: number; liked_by_me: boolean }>(`/users/likes/${userBookId}`),
};
