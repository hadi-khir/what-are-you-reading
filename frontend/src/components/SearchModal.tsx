import { useEffect, useRef, useState } from "react";
import { booksApi } from "../api/books";
import { shelfApi } from "../api/shelf";
import { STARTER_PACKS, type StarterPack } from "../data/starterPacks";
import type { BookSearchResult, BookStatus, UserBook } from "../types";
import { StarRating } from "./StarRating";

interface SearchModalProps {
  onClose: () => void;
  onAdded: (userBook: UserBook) => void;
  currentYear: number;
}

const STATUS_OPTIONS: { value: BookStatus; label: string }[] = [
  { value: "want_to_read", label: "Want to Read" },
  { value: "reading", label: "Currently Reading" },
  { value: "read", label: "Read" },
];

// ── Pack book resolution cache ─────────────────────────────────────────────
// Keyed by pack id → sparse array (undefined = not yet fetched, null = not found)
const packCache = new Map<string, (BookSearchResult | null | undefined)[]>();

const PAGE_SIZE = 10;

async function resolvePackPage(
  pack: StarterPack,
  page: number,
): Promise<void> {
  if (!packCache.has(pack.id)) {
    packCache.set(pack.id, new Array(pack.books.length).fill(undefined));
  }
  const cache = packCache.get(pack.id)!;
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, pack.books.length);

  const toFetch = [];
  for (let i = start; i < end; i++) {
    if (cache[i] === undefined) toFetch.push(i);
  }
  if (!toFetch.length) return;

  await Promise.all(
    toFetch.map(async (i) => {
      const b = pack.books[i];
      try {
        const byBoth = await booksApi.search(`${b.title} ${b.author}`);
        if (byBoth.length > 0) { cache[i] = byBoth[0]; return; }
        // Fallback: title-only search
        const byTitle = await booksApi.search(b.title);
        cache[i] = byTitle[0] ?? null;
      } catch {
        cache[i] = null;
      }
    }),
  );
}

// ── Sub-views ──────────────────────────────────────────────────────────────

type View =
  | { kind: "search" }
  | { kind: "pack-preview"; pack: StarterPack }
  | { kind: "add-single"; book: BookSearchResult }
  | { kind: "bulk-adding"; books: BookSearchResult[]; done: number; total: number };

// ── Pack preview ───────────────────────────────────────────────────────────

function PackPreview({
  pack,
  currentYear,
  onBack,
  onDone,
}: {
  pack: StarterPack;
  currentYear: number;
  onBack: () => void;
  onDone: (added: UserBook[]) => void;
}) {
  const [page, setPage] = useState(0);
  const [resolved, setResolved] = useState<(BookSearchResult | null | undefined)[]>(
    () => packCache.get(pack.id) ?? new Array(pack.books.length).fill(undefined),
  );
  const [pageLoading, setPageLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<BookStatus>("want_to_read");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const totalPages = Math.ceil(pack.books.length / PAGE_SIZE);
  const pageStart = page * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, pack.books.length);
  const pageSlice = resolved.slice(pageStart, pageEnd);
  const pageLoaded = pageSlice.every((b) => b !== undefined);

  useEffect(() => {
    let cancelled = false;
    setPageLoading(true);
    resolvePackPage(pack, page).then(() => {
      if (cancelled) return;
      setResolved([...(packCache.get(pack.id) ?? [])]);
      setPageLoading(false);
    });
    return () => { cancelled = true; };
  }, [pack, page]);

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const pageFound = pageLoaded
    ? pageSlice.flatMap((b, localI) =>
        b ? [{ b: b as BookSearchResult, i: pageStart + localI }] : [],
      )
    : [];
  const pageAllSelected =
    pageFound.length > 0 && pageFound.every(({ i }) => selected.has(i));

  const toggleAll = () =>
    pageAllSelected
      ? setSelected((prev) => {
          const next = new Set(prev);
          pageFound.forEach(({ i }) => next.delete(i));
          return next;
        })
      : setSelected((prev) => {
          const next = new Set(prev);
          pageFound.forEach(({ i }) => next.add(i));
          return next;
        });

  const handleAdd = async () => {
    const cache = packCache.get(pack.id) ?? [];
    const toAdd = cache.flatMap((b, i) =>
      b && selected.has(i) ? [b as BookSearchResult] : [],
    );
    if (!toAdd.length) return;

    setProgress({ done: 0, total: toAdd.length });
    const added: UserBook[] = [];
    for (let i = 0; i < toAdd.length; i++) {
      try {
        const ub = await shelfApi.addBook({ ...toAdd[i], status, year: currentYear });
        added.push(ub);
      } catch {
        // skip duplicates / errors silently
      }
      setProgress({ done: i + 1, total: toAdd.length });
    }
    onDone(added);
  };

  const selectedCount = selected.size;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-cream-200 flex-shrink-0">
        <button
          onClick={onBack}
          className="text-ink-muted hover:text-ink transition-colors text-sm font-ui flex-shrink-0"
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span>{pack.emoji}</span>
            <h3 className="font-display font-semibold text-ink text-base leading-tight truncate">
              {pack.name}
            </h3>
          </div>
          <p className="font-ui text-xs text-ink-muted mt-0.5 line-clamp-2">{pack.description}</p>
        </div>
      </div>

      {/* Book list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {pageLoading && !pageLoaded ? (
          // Loading skeletons for current page
          <div className="p-4 space-y-3">
            {Array.from({ length: Math.min(PAGE_SIZE, pack.books.length - pageStart) }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-4 h-4 rounded bg-cream-200 flex-shrink-0" />
                <div className="w-9 h-12 rounded-sm bg-cream-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-cream-200 rounded w-3/4" />
                  <div className="h-2.5 bg-cream-200 rounded w-1/2" />
                </div>
              </div>
            ))}
            <p className="text-center font-ui text-xs text-ink-muted pt-2 animate-pulse">
              Looking up books…
            </p>
          </div>
        ) : (
          <>
            {/* Select all toggle */}
            <div className="px-4 py-2 border-b border-cream-200/60 flex items-center justify-between">
              <button
                onClick={toggleAll}
                className="font-ui text-xs text-wood hover:text-ink transition-colors"
              >
                {pageAllSelected ? "Deselect page" : "Select page"}
              </button>
              <span className="font-ui text-xs text-ink-muted">
                {selectedCount} selected · {pack.books.length} total
              </span>
            </div>

            {pageSlice.map((book, localI) => {
              const globalI = pageStart + localI;
              const packBook = pack.books[globalI];
              const isSelected = selected.has(globalI);
              const found = book !== undefined && book !== null;
              return (
                <button
                  key={globalI}
                  onClick={() => found && toggle(globalI)}
                  disabled={!found}
                  className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-cream-200/40 text-left transition-colors"
                  style={{
                    background: isSelected && found ? "rgba(139,94,60,0.04)" : "transparent",
                    opacity: book === undefined ? 0.3 : found ? 1 : 0.45,
                    cursor: found ? "pointer" : "default",
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all"
                    style={{
                      borderColor: isSelected && found ? "#8B5E3C" : "rgba(139,94,60,0.3)",
                      background: isSelected && found ? "#8B5E3C" : "transparent",
                    }}
                  >
                    {isSelected && found && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="#FFF8F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Cover */}
                  <div
                    className="flex-shrink-0 rounded-sm overflow-hidden"
                    style={{ width: 36, height: 50 }}
                  >
                    {(book as BookSearchResult)?.cover_url ? (
                      <img src={(book as BookSearchResult).cover_url!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: "#E0D0B8" }}
                      >
                        <span className="text-xs opacity-40">📖</span>
                      </div>
                    )}
                  </div>

                  {/* Title / author */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-ink text-sm font-medium leading-tight line-clamp-2">
                      {(book as BookSearchResult)?.title ?? packBook.title}
                    </p>
                    <p className="font-ui text-ink-muted text-xs truncate mt-0.5">
                      {(book as BookSearchResult)?.author ?? packBook.author}
                    </p>
                    {book === null && (
                      <p className="font-ui text-xs mt-0.5" style={{ color: "#C9853E" }}>
                        Not found in Open Library
                      </p>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-cream-200/60">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className="font-ui text-xs transition-colors"
                  style={{ color: page === 0 ? "#C4B8A4" : "#8B5E3C" }}
                >
                  ← Prev
                </button>
                <span className="font-ui text-xs text-ink-muted">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages - 1}
                  className="font-ui text-xs transition-colors"
                  style={{ color: page === totalPages - 1 ? "#C4B8A4" : "#8B5E3C" }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex-shrink-0 p-4 border-t border-cream-200"
        style={{ background: "#FFFDF8" }}
      >
        {progress ? (
          <div className="text-center space-y-2">
            <div className="w-full h-2 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((progress.done / progress.total) * 100)}%`,
                  background: "linear-gradient(to right, #8B5E3C, #C9853E)",
                }}
              />
            </div>
            <p className="font-ui text-xs text-ink-muted">
              Adding {progress.done} of {progress.total}…
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status picker */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-ui text-xs text-ink-muted">Add as:</span>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className="px-2.5 py-1 rounded-full text-xs font-ui transition-all"
                  style={
                    status === opt.value
                      ? { background: "#8B5E3C", color: "#FFF8F0" }
                      : { background: "#F5EDD6", color: "#7A6952", border: "1px solid #EBD9A8" }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleAdd}
              disabled={selectedCount === 0}
              className="w-full py-2.5 rounded-sm font-ui text-sm transition-all"
              style={
                selectedCount > 0
                  ? { background: "#8B5E3C", color: "#FFF8F0" }
                  : { background: "#E0D0B8", color: "#A89070", cursor: "not-allowed" }
              }
            >
              Add {selectedCount} book{selectedCount !== 1 ? "s" : ""} to {currentYear} shelf
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────

export function SearchModal({ onClose, onAdded, currentYear }: SearchModalProps) {
  const [view, setView] = useState<View>({ kind: "search" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addTarget, setAddTarget] = useState<BookSearchResult | null>(null);
  const [status, setStatus] = useState<BookStatus>("want_to_read");
  const [rating, setRating] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (view.kind === "search") inputRef.current?.focus();
  }, [view]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (view.kind !== "search") setView({ kind: "search" });
      else onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, onClose]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await booksApi.search(value.trim()));
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleAddSingle = async () => {
    if (!addTarget) return;
    setAdding(true);
    try {
      const ub = await shelfApi.addBook({
        ...addTarget,
        status,
        rating: rating ?? undefined,
        year: currentYear,
      });
      onAdded(ub);
      onClose();
    } finally {
      setAdding(false);
    }
  };

  const handleBulkDone = (added: UserBook[]) => {
    added.forEach(onAdded);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 p-4"
      style={{ background: "rgba(28,16,8,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-sm flex flex-col"
        style={{
          background: "#FFFDF8",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          maxHeight: "82vh",
          overflow: "hidden", // clips border-radius; children handle their own overflow
        }}
      >
        {/* Accent bar */}
        <div
          className="h-1 flex-shrink-0"
          style={{ background: "linear-gradient(to right, #8B5E3C, #C9853E)" }}
        />

        {/* ── Pack preview ── */}
        {view.kind === "pack-preview" && (
          <PackPreview
            pack={view.pack}
            currentYear={currentYear}
            onBack={() => setView({ kind: "search" })}
            onDone={handleBulkDone}
          />
        )}

        {/* ── Add single book ── */}
        {view.kind === "search" && addTarget && (
          <div className="p-5 overflow-y-auto">
            <div className="flex items-start gap-3 mb-5">
              <button
                onClick={() => setAddTarget(null)}
                className="mt-0.5 text-ink-muted hover:text-ink transition-colors text-sm font-ui"
              >
                ← Back
              </button>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-ink leading-tight">{addTarget.title}</h3>
                <p className="font-ui text-ink-muted text-sm">{addTarget.author}</p>
              </div>
              {addTarget.cover_url && (
                <img
                  src={addTarget.cover_url}
                  alt=""
                  className="w-12 h-16 object-cover rounded-sm flex-shrink-0"
                />
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-ui text-ink-muted text-xs uppercase tracking-wider mb-2">
                  Status
                </label>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className="px-3 py-1.5 rounded-full text-xs font-ui transition-all"
                      style={
                        status === opt.value
                          ? { background: "#8B5E3C", color: "#FFF8F0" }
                          : { background: "#F5EDD6", color: "#7A6952", border: "1px solid #EBD9A8" }
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-ui text-ink-muted text-xs uppercase tracking-wider mb-2">
                  Rating (optional)
                </label>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
              <button
                onClick={handleAddSingle}
                disabled={adding}
                className="w-full py-2.5 rounded-sm font-ui text-sm transition-all"
                style={{ background: "#8B5E3C", color: "#FFF8F0" }}
              >
                {adding ? "Adding…" : `Add to ${currentYear} shelf`}
              </button>
            </div>
          </div>
        )}

        {/* ── Search + starter packs ── */}
        {view.kind === "search" && !addTarget && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search input */}
            <div className="p-4 border-b border-cream-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">🔍</span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by title or author…"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 bg-transparent font-ui text-ink placeholder-ink-muted/60 focus:outline-none"
                />
                {searching && (
                  <span className="text-ink-muted text-xs font-ui animate-pulse">Searching…</span>
                )}
                <button onClick={onClose} className="text-ink-muted hover:text-ink text-sm ml-1">
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              {/* Search results */}
              {query ? (
                <>
                  {results.length === 0 && !searching && (
                    <p className="text-center font-ui text-ink-muted text-sm py-8">
                      No results found.
                    </p>
                  )}
                  {results.map((book) => (
                    <button
                      key={book.open_library_key}
                      onClick={() => {
                        setAddTarget(book);
                        setStatus("want_to_read");
                        setRating(null);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-cream-100 transition-colors text-left border-b border-cream-200/50"
                    >
                      <div
                        className="flex-shrink-0 rounded-sm overflow-hidden"
                        style={{ width: 36, height: 50 }}
                      >
                        {book.cover_url ? (
                          <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: "#E0D0B8" }}
                          >
                            <span className="text-xs opacity-50">📖</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-ink font-medium text-sm leading-tight truncate">
                          {book.title}
                        </p>
                        <p className="font-ui text-ink-muted text-xs truncate">{book.author}</p>
                        {book.publish_year && (
                          <p className="font-ui text-ink-muted/70 text-xs">{book.publish_year}</p>
                        )}
                      </div>
                      <span className="text-wood-light text-xs font-ui flex-shrink-0">Add →</span>
                    </button>
                  ))}
                </>
              ) : (
                /* Starter packs — shown when search is empty */
                <div className="p-4">
                  <p className="font-ui text-xs text-ink-muted uppercase tracking-wider mb-3">
                    Starter packs
                  </p>
                  <div className="space-y-2">
                    {STARTER_PACKS.map((pack) => (
                      <button
                        key={pack.id}
                        onClick={() => setView({ kind: "pack-preview", pack })}
                        className="w-full flex items-center gap-3 p-3 rounded-sm text-left transition-all hover:shadow-sm group"
                        style={{
                          background: "#F5EDD6",
                          border: "1px solid rgba(139,94,60,0.12)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.borderColor = "rgba(139,94,60,0.3)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.borderColor = "rgba(139,94,60,0.12)")
                        }
                      >
                        <span className="text-2xl flex-shrink-0">{pack.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-ink font-semibold text-sm leading-tight">
                            {pack.name}
                          </p>
                          <p className="font-ui text-ink-muted text-xs mt-0.5 line-clamp-1">
                            {pack.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="font-ui text-ink-muted text-xs">{pack.books.length} books</p>
                          <p className="font-ui text-wood text-xs mt-0.5 group-hover:translate-x-0.5 transition-transform">
                            Browse →
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
