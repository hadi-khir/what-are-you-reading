import { useEffect, useState } from "react";
import { shelfApi } from "../api/shelf";
import type { BookStatus, UserBook } from "../types";
import { StarRating } from "./StarRating";

interface BookModalProps {
  userBook: UserBook;
  onClose: () => void;
  onUpdate: (updated: UserBook) => void;
  onRemove: (id: number) => void;
  readonly?: boolean;
}

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: "Currently Reading",
  read: "Read",
  want_to_read: "Want to Read",
};

const STATUS_OPTIONS: BookStatus[] = ["reading", "read", "want_to_read"];

export function BookModal({ userBook, onClose, onUpdate, onRemove, readonly = false }: BookModalProps) {
  const [status, setStatus] = useState<BookStatus>(userBook.status);
  const [rating, setRating] = useState<number | null>(userBook.rating);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const isDirty = status !== userBook.status || rating !== userBook.rating;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await shelfApi.update(userBook.id, status, rating ?? undefined);
      onUpdate(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove this book from your shelf?")) return;
    setRemoving(true);
    try {
      await shelfApi.remove(userBook.id);
      onRemove(userBook.id);
      onClose();
    } finally {
      setRemoving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const { book } = userBook;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(28,16,8,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-sm overflow-hidden"
        style={{
          background: "#FFFDF8",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,94,60,0.2)",
        }}
      >
        {/* Header strip */}
        <div
          className="h-1.5"
          style={{ background: "linear-gradient(to right, #8B5E3C, #C9853E)" }}
        />

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="flex gap-4">
            {/* Cover */}
            <div
              className="flex-shrink-0 rounded-sm overflow-hidden"
              style={{
                width: 80,
                height: 112,
                background: "linear-gradient(135deg, #E0D0B8, #C8B89A)",
                boxShadow: "2px 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-wood-light text-2xl opacity-50">📖</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2
                className="font-display font-semibold text-ink leading-tight mb-1"
                style={{ fontSize: 18 }}
              >
                {book.title}
              </h2>
              <p className="font-ui text-ink-muted text-sm mb-1">{book.author}</p>
              {book.publish_year && (
                <p className="font-ui text-ink-muted text-xs">{book.publish_year}</p>
              )}
            </div>
          </div>

          {!readonly && (
            <div className="mt-5 space-y-4 border-t border-cream-200 pt-4">
              {/* Status */}
              <div>
                <label className="block font-ui text-ink-muted text-xs mb-1.5 uppercase tracking-wider">
                  Status
                </label>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className="px-3 py-1 rounded-full text-xs font-ui transition-all duration-150"
                      style={
                        status === s
                          ? { background: "#8B5E3C", color: "#FFF8F0" }
                          : {
                              background: "#F5EDD6",
                              color: "#7A6952",
                              border: "1px solid #EBD9A8",
                            }
                      }
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block font-ui text-ink-muted text-xs mb-1.5 uppercase tracking-wider">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                  {rating && (
                    <button
                      onClick={() => setRating(null)}
                      className="text-xs font-ui text-ink-muted hover:text-ink transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="text-xs font-ui text-red-700/60 hover:text-red-700 transition-colors"
                >
                  Remove from shelf
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="px-4 py-1.5 rounded-sm text-sm font-ui transition-all duration-150"
                  style={
                    isDirty && !saving
                      ? { background: "#8B5E3C", color: "#FFF8F0" }
                      : { background: "#EBD9A8", color: "#7A6952" }
                  }
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}

          {readonly && (
            <div className="mt-4 border-t border-cream-200 pt-4">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-ui px-2.5 py-1 rounded-full"
                  style={{ background: "#F5EDD6", color: "#7A6952" }}
                >
                  {STATUS_LABELS[userBook.status]}
                </span>
                {userBook.rating && <StarRating value={userBook.rating} readonly size="md" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
