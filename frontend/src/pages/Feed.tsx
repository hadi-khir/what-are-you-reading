import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../api/users";
import { BookModal } from "../components/BookModal";
import { Layout } from "../components/Layout";
import { StarRating } from "../components/StarRating";
import { ApiError } from "../api/client";
import type { FeedItem, User, UserBook } from "../types";

const STATUS_LABELS: Record<string, string> = {
  reading: "is reading",
  read: "finished",
  want_to_read: "wants to read",
};

// ── Feed card ──────────────────────────────────────────────────────────────

function FeedCard({ item, onBookClick }: { item: FeedItem; onBookClick: (ub: UserBook) => void }) {
  const { user, user_book } = item;
  const { book } = user_book;
  const [likesCount, setLikesCount] = useState(item.likes_count);
  const [likedByMe, setLikedByMe] = useState(item.liked_by_me);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    // Optimistic update
    if (likedByMe) {
      setLikedByMe(false);
      setLikesCount((n) => n - 1);
    } else {
      setLikedByMe(true);
      setLikesCount((n) => n + 1);
    }
    try {
      const res = likedByMe
        ? await usersApi.unlike(user_book.id)
        : await usersApi.like(user_book.id);
      setLikesCount(res.likes_count);
      setLikedByMe(res.liked_by_me);
    } catch {
      // Revert on error
      setLikedByMe(likedByMe);
      setLikesCount(item.likes_count);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div
      className="flex gap-4 p-4 rounded-sm"
      style={{
        background: "#FFFDF8",
        boxShadow: "0 1px 4px rgba(28,16,8,0.08), 0 0 0 1px rgba(139,94,60,0.1)",
      }}
    >
      <button
        onClick={() => onBookClick(user_book)}
        className="flex-shrink-0 rounded-sm overflow-hidden transition-transform hover:scale-105"
        style={{ width: 52, height: 72 }}
      >
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#E0D0B8" }}>
            <span className="text-lg opacity-50">📖</span>
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm text-ink-muted mb-1">
          <Link
            to={`/profile/${user.username}`}
            className="font-semibold text-ink hover:text-wood transition-colors"
          >
            {user.username}
          </Link>{" "}
          {STATUS_LABELS[user_book.status]}{" "}
          <button
            onClick={() => onBookClick(user_book)}
            className="font-display font-semibold text-ink hover:text-wood transition-colors"
          >
            {book.title}
          </button>
        </p>
        <p className="font-ui text-xs text-ink-muted mb-2">{book.author}</p>
        {user_book.rating && <StarRating value={user_book.rating} readonly size="sm" />}
        <div className="mt-2 flex items-center justify-between">
          <p className="font-ui text-xs text-ink-muted/60">
            {new Date(user_book.added_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
          <button
            onClick={handleLike}
            disabled={liking}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full font-ui text-xs transition-all"
            style={
              likedByMe
                ? { color: "#8B3A4A", background: "rgba(139,58,74,0.08)" }
                : { color: "#A89070", background: "transparent" }
            }
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M6.5 11.5S1 7.8 1 4.5a2.5 2.5 0 0 1 5.5-1 2.5 2.5 0 0 1 5.5 1c0 3.3-5.5 7-5.5 7Z"
                fill={likedByMe ? "#8B3A4A" : "none"}
                stroke={likedByMe ? "#8B3A4A" : "#A89070"}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User search ────────────────────────────────────────────────────────────

function UserSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<number | null>(null);
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await usersApi.search(value.trim());
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleFollow = async (user: User) => {
    setFollowLoading(user.id);
    try {
      const isNowFollowing = user.is_following || followed.has(user.id);
      if (isNowFollowing) {
        await usersApi.unfollow(user.username);
        setFollowed((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
        setResults((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, is_following: false, followers_count: u.followers_count - 1 }
              : u,
          ),
        );
      } else {
        await usersApi.follow(user.username);
        setFollowed((prev) => new Set(prev).add(user.id));
        setResults((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, is_following: true, followers_count: u.followers_count + 1 }
              : u,
          ),
        );
      }
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setFollowLoading(null);
    }
  };

  return (
    <div
      className="mb-6 rounded-sm overflow-hidden"
      style={{
        background: "#FFFDF8",
        boxShadow: "0 1px 4px rgba(28,16,8,0.08), 0 0 0 1px rgba(139,94,60,0.1)",
      }}
    >
      {/* Search input */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cream-200">
        <span className="text-ink-muted text-sm">🔍</span>
        <input
          type="text"
          placeholder="Find readers to follow…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 bg-transparent font-ui text-sm text-ink placeholder-ink-muted/60 focus:outline-none"
        />
        {loading && <span className="text-xs font-ui text-ink-muted animate-pulse">Searching…</span>}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="text-ink-muted hover:text-ink text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          {results.map((user) => {
            const isFollowing = user.is_following || followed.has(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0 border-cream-200/60 hover:bg-cream-100/50 transition-colors"
              >
                <div>
                  <Link
                    to={`/profile/${user.username}`}
                    className="font-ui text-sm font-semibold text-ink hover:text-wood transition-colors"
                  >
                    {user.username}
                  </Link>
                  <p className="font-ui text-xs text-ink-muted">
                    {user.followers_count} follower{user.followers_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleFollow(user)}
                  disabled={followLoading === user.id}
                  className="px-3 py-1 rounded-full text-xs font-ui transition-all"
                  style={
                    isFollowing
                      ? {
                          background: "transparent",
                          border: "1px solid rgba(139,94,60,0.35)",
                          color: "#7A6952",
                        }
                      : { background: "#8B5E3C", color: "#FFF8F0" }
                  }
                >
                  {followLoading === user.id ? "…" : isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && query && !loading && (
        <p className="px-4 py-3 font-ui text-sm text-ink-muted">No readers found for "{query}".</p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export function Feed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserBook | null>(null);

  useEffect(() => {
    usersApi
      .getFeed()
      .then(setFeedItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-ink mb-1">Reading Feed</h1>
        <p className="font-ui text-ink-muted text-sm">What people you follow are reading</p>
      </div>

      <UserSearchPanel />

      {loading ? (
        <div className="text-center py-12 font-ui text-ink-muted animate-pulse">Loading…</div>
      ) : feedItems.length === 0 ? (
        <div
          className="text-center py-14 rounded-sm"
          style={{ background: "#FFFDF8", border: "1px dashed rgba(139,94,60,0.2)" }}
        >
          <p className="font-display text-ink text-lg mb-2">Your feed is empty</p>
          <p className="font-ui text-ink-muted text-sm">
            Search for readers above and follow them to see what they're reading.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedItems.map((item, idx) => (
            <FeedCard
              key={`${item.user.id}-${item.user_book.id}-${idx}`}
              item={item}
              onBookClick={setSelected}
            />
          ))}
        </div>
      )}

      {selected && (
        <BookModal
          userBook={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => {}}
          onRemove={() => {}}
          readonly
        />
      )}
    </Layout>
  );
}
