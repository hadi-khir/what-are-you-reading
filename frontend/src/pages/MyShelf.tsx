import { useCallback, useEffect, useState } from "react";
import { goalsApi } from "../api/goals";
import { shelfApi } from "../api/shelf";
import { BookModal } from "../components/BookModal";
import { BookShelf } from "../components/BookShelf";
import { GoalProgress } from "../components/GoalProgress";
import { Layout } from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import type { BookStatus, ReadingGoal, UserBook } from "../types";

const STATUSES: { value: BookStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "want_to_read", label: "Want to Read" },
];

export function MyShelf() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [books, setBooks] = useState<UserBook[]>([]);
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookStatus | "all">("all");
  const [selected, setSelected] = useState<UserBook | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shelfData, goalsData] = await Promise.all([
        shelfApi.getMyShelf(year),
        goalsApi.getGoals(),
      ]);
      setBooks(shelfData);
      setGoal(goalsData.find((g) => g.year === year) ?? null);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBookAdded = (userBook: UserBook) => {
    if (userBook.year === year) {
      setBooks((prev) => [userBook, ...prev]);
    }
  };

  const handleUpdate = (updated: UserBook) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleRemove = (id: number) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleGoalUpdate = (updated: ReadingGoal) => {
    setGoal(updated);
  };

  const filtered = filter === "all" ? books : books.filter((b) => b.status === filter);

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <Layout onBookAdded={handleBookAdded}>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-1">
          <h1 className="font-display text-3xl font-semibold text-ink">
            {user?.username}'s Shelf
          </h1>
          {/* Year selector */}
          <div className="flex items-center gap-1">
            {yearOptions.map((y) => (
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
          </div>
        </div>

        {/* Goal progress */}
        <GoalProgress goal={goal} year={year} onGoalUpdate={handleGoalUpdate} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-wood/15 pb-0 overflow-x-auto">
        {STATUSES.map(({ value, label }) => {
          const count =
            value === "all" ? books.length : books.filter((b) => b.status === value).length;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="px-3 py-2 text-sm font-ui transition-colors relative"
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
              filter === "all"
                ? `No books on your ${year} shelf yet. Hit "Add book" to get started.`
                : `No ${filter.replace("_", " ")} books this year.`
            }
          />
        </div>
      )}

      {/* Book detail modal */}
      {selected && (
        <BookModal
          userBook={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            handleUpdate(updated);
            // Refresh goal count if status changed to/from read
            goalsApi.getGoals().then((goals) => {
              setGoal(goals.find((g) => g.year === year) ?? null);
            });
          }}
          onRemove={(id) => {
            handleRemove(id);
            goalsApi.getGoals().then((goals) => {
              setGoal(goals.find((g) => g.year === year) ?? null);
            });
          }}
        />
      )}
    </Layout>
  );
}
