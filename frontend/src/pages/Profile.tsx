import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { goalsApi } from "../api/goals";
import { shelfApi } from "../api/shelf";
import { usersApi } from "../api/users";
import { BookModal } from "../components/BookModal";
import { BookShelf } from "../components/BookShelf";
import { GoalProgress } from "../components/GoalProgress";
import { Layout } from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import type { BookStatus, ReadingGoal, User, UserBook } from "../types";

const STATUSES: { value: BookStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "want_to_read", label: "Want to Read" },
];

const YEARS_KEY = "bookshelf:years";

function loadStoredYears(currentYear: number): number[] {
  try {
    const raw = localStorage.getItem(YEARS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? (parsed as unknown[]) : [];
    const valid = list.filter(
      (y): y is number => typeof y === "number" && Number.isInteger(y) && y > 1900 && y < 2200,
    );
    return [...new Set([currentYear, ...valid])].sort((a, b) => b - a);
  } catch {
    return [currentYear];
  }
}

function saveStoredYears(years: number[]) {
  localStorage.setItem(YEARS_KEY, JSON.stringify(years));
}

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: me, refreshUser } = useAuth();
  const currentYear = new Date().getFullYear();

  const isOwnProfile = me?.username === username;

  const [profile, setProfile] = useState<User | null>(null);
  const [books, setBooks] = useState<UserBook[]>([]);
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [filter, setFilter] = useState<BookStatus | "all">("all");
  const [selected, setSelected] = useState<UserBook | null>(null);

  // Year management
  const [years, setYears] = useState<number[]>(() => loadStoredYears(currentYear));
  const [year, setYear] = useState(currentYear);
  const [addingYear, setAddingYear] = useState(false);
  const [yearInput, setYearInput] = useState("");
  const yearInputRef = useRef<HTMLInputElement>(null);

  const mergeYears = useCallback(
    (extra: number[]) => {
      setYears((prev) => {
        const next = [...new Set([...prev, ...extra, currentYear])].sort((a, b) => b - a);
        saveStoredYears(next);
        return next;
      });
    },
    [currentYear],
  );

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);
    try {
      if (isOwnProfile) {
        const [shelfData, goalsData] = await Promise.all([
          shelfApi.getMyShelf(year),
          goalsApi.getGoals(),
        ]);
        setBooks(shelfData);
        setGoal(goalsData.find((g) => g.year === year) ?? null);
        mergeYears(goalsData.map((g) => g.year));
      } else {
        const [profileData, shelfData] = await Promise.all([
          usersApi.getUser(username),
          usersApi.getUserShelf(username, year),
        ]);
        setProfile(profileData);
        setBooks(shelfData);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [username, year, isOwnProfile, mergeYears]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (addingYear) yearInputRef.current?.focus();
  }, [addingYear]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.is_following) {
        await usersApi.unfollow(profile.username);
        setProfile((p) => p && { ...p, is_following: false, followers_count: p.followers_count - 1 });
      } else {
        await usersApi.follow(profile.username);
        setProfile((p) => p && { ...p, is_following: true, followers_count: p.followers_count + 1 });
      }
      await refreshUser();
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddYear = () => {
    const y = parseInt(yearInput, 10);
    setAddingYear(false);
    setYearInput("");
    if (!y || y < 1900 || y > 2200) return;
    mergeYears([y]);
    setYear(y);
  };

  const refreshGoal = () => {
    goalsApi.getGoals().then((g) => setGoal(g.find((x) => x.year === year) ?? null));
  };

  const handleBookAdded = (userBook: UserBook) => {
    if (userBook.year === year) setBooks((prev) => [userBook, ...prev]);
  };

  const handleUpdate = (updated: UserBook) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    refreshGoal();
    setSelected(null);
  };

  const handleRemove = (id: number) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    refreshGoal();
    setSelected(null);
  };

  const filtered = filter === "all" ? books : books.filter((b) => b.status === filter);
  const displayName = isOwnProfile ? me?.username : profile?.username ?? username;

  if (notFound) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="font-display text-2xl text-ink mb-2">User not found</p>
          <p className="font-ui text-ink-muted">No one goes by that name here.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onBookAdded={isOwnProfile ? handleBookAdded : undefined}>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <h1 className="font-display text-3xl font-semibold text-ink">{displayName}'s Shelf</h1>

          {!isOwnProfile && profile && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className="px-4 py-1.5 rounded-sm font-ui text-sm transition-all flex-shrink-0"
              style={
                profile.is_following
                  ? { background: "transparent", border: "1px solid rgba(139,94,60,0.4)", color: "#7A6952" }
                  : { background: "#8B5E3C", color: "#FFF8F0" }
              }
            >
              {followLoading ? "…" : profile.is_following ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>

        {/* Follower stats for other profiles */}
        {!isOwnProfile && profile && (
          <div className="flex items-center gap-4 mb-3">
            <span className="font-ui text-ink-muted text-sm">
              <span className="font-semibold text-ink">{profile.followers_count}</span> followers
            </span>
            <span className="font-ui text-ink-muted text-sm">
              <span className="font-semibold text-ink">{profile.following_count}</span> following
            </span>
          </div>
        )}

        {/* Year selector */}
        <div className="flex items-center gap-1 flex-wrap">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className="px-3 py-1 rounded-full text-sm font-ui transition-all"
              style={
                year === y
                  ? { background: "#8B5E3C", color: "#FFF8F0" }
                  : { background: "transparent", color: "#7A6952" }
              }
            >
              {y}
            </button>
          ))}

          {addingYear ? (
            <input
              ref={yearInputRef}
              type="number"
              placeholder="Year"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddYear();
                if (e.key === "Escape") { setAddingYear(false); setYearInput(""); }
              }}
              onBlur={handleAddYear}
              className="w-20 border border-wood/30 rounded px-2 py-0.5 text-sm font-ui text-ink bg-transparent focus:outline-none focus:ring-1 focus:ring-wood"
            />
          ) : (
            <button
              onClick={() => setAddingYear(true)}
              title="Add year"
              className="w-7 h-7 rounded-full text-sm font-ui text-ink-muted hover:text-ink hover:bg-wood/10 transition-all flex items-center justify-center"
            >
              +
            </button>
          )}
        </div>

        {/* Goal progress — own profile only */}
        {isOwnProfile && (
          <div className="mt-3">
            <GoalProgress goal={goal} year={year} onGoalUpdate={setGoal} />
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-wood/15 overflow-x-auto">
        {STATUSES.map(({ value, label }) => {
          const count =
            value === "all" ? books.length : books.filter((b) => b.status === value).length;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="px-3 py-2 text-sm font-ui transition-colors whitespace-nowrap"
              style={{
                color: filter === value ? "#1C1008" : "#7A6952",
                borderBottom: filter === value ? "2px solid #8B5E3C" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {label}
              <span
                className="ml-1.5 text-xs"
                style={{ color: filter === value ? "#8B5E3C" : "#7A6952" }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Shelf */}
      {loading ? (
        <div className="text-center py-12 font-ui text-ink-muted animate-pulse">Loading…</div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <BookShelf
            books={filtered}
            onBookClick={setSelected}
            emptyMessage={
              isOwnProfile
                ? filter === "all"
                  ? `No books on your ${year} shelf yet. Hit "Add book" to get started.`
                  : `No ${filter.replace("_", " ")} books in ${year}.`
                : `${username} hasn't added any books here yet.`
            }
          />
        </div>
      )}

      {selected && (
        <BookModal
          userBook={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          readonly={!isOwnProfile}
        />
      )}
    </Layout>
  );
}
