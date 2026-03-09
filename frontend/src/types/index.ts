export interface User {
  id: number;
  username: string;
  created_at: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export interface UserMe extends User {
  email: string;
}

export interface Book {
  id: number;
  open_library_key: string;
  title: string;
  author: string;
  cover_url: string | null;
  publish_year: number | null;
}

export type BookStatus = "reading" | "read" | "want_to_read";

export interface UserBook {
  id: number;
  book: Book;
  status: BookStatus;
  rating: number | null;
  started_at: string | null;
  finished_at: string | null;
  added_at: string;
  year: number;
}

export interface ReadingGoal {
  id: number;
  year: number;
  goal_count: number;
  books_read: number;
}

export interface FeedItem {
  user: User;
  user_book: UserBook;
  likes_count: number;
  liked_by_me: boolean;
}

export interface BookSearchResult {
  open_library_key: string;
  title: string;
  author: string;
  cover_url: string | null;
  publish_year: number | null;
}
