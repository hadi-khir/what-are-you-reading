import { useEffect, useState } from "react";
import { BookSpine } from "./BookSpine";
import { ShelfDecor, type DecorType } from "./ShelfDecor";
import type { UserBook } from "../types";

/** 5 books on mobile (< 640px), 7 on larger screens. */
function useBooksPerRow() {
  const [n, setN] = useState(() => (window.innerWidth < 640 ? 5 : 7));
  useEffect(() => {
    const handler = () => setN(window.innerWidth < 640 ? 5 : 7);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return n;
}

/** Empty space on each side of the content so the plank overhangs the books. */
const SHELF_OVERHANG = 36;

const DECOR_TYPES: DecorType[] = [
  "potted-plant",
  "succulent",
  "flower-vase",
  "candle",
  "bookend",
  "globe",
];

function seededHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface ShelfDecors {
  left: DecorType;
  right: DecorType;
}

/** Every shelf always gets a left and right decoration, chosen by index. */
function getShelfDecors(shelfIndex: number): ShelfDecors {
  const h = seededHash(`shelf-decor-${shelfIndex}`);
  return {
    left:  DECOR_TYPES[h % DECOR_TYPES.length],
    right: DECOR_TYPES[(h >> 4) % DECOR_TYPES.length],
  };
}

/** Advance to the next decor type in the cycle. */
function nextDecorType(current: DecorType): DecorType {
  const idx = DECOR_TYPES.indexOf(current);
  return DECOR_TYPES[(idx + 1) % DECOR_TYPES.length];
}

interface BookShelfProps {
  books: UserBook[];
  onBookClick: (userBook: UserBook) => void;
  emptyMessage?: string;
}

function FloatingPlank() {
  // No explicit width — as a block element it fills the parent's computed width.
  return (
    <div
      style={{
        height: 14,
        background: "linear-gradient(to bottom, #B07840 0%, #8B5E3C 45%, #6B4419 100%)",
        boxShadow:
          "0 8px 22px rgba(0,0,0,0.26), 0 3px 6px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.2)",
        borderRadius: "0 0 3px 3px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity: 0.08,
          borderRadius: "0 0 3px 3px",
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.5) 61px)",
        }}
      />
    </div>
  );
}

function ShelfRow({
  books,
  decors,
  onDecorClick,
  onBookClick,
}: {
  books: UserBook[];
  decors: ShelfDecors;
  onDecorClick: (side: "left" | "right") => void;
  onBookClick: (ub: UserBook) => void;
}) {
  return (
    /*
     * width: max-content — the shelf is exactly as wide as its children
     * (overhang spacers + decors + books). FloatingPlank, as a block element
     * with no explicit width, fills the same computed width automatically.
     */
    <div style={{ width: "max-content" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          paddingTop: 8,
        }}
      >
        {/* Left plank overhang */}
        <div style={{ width: SHELF_OVERHANG, flexShrink: 0 }} />

        {/* Left decoration */}
        <button
          onClick={() => onDecorClick("left")}
          title="Click to change decoration"
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-end",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            borderRadius: 4,
            transition: "filter 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
        >
          <ShelfDecor type={decors.left} side="left" />
        </button>

        {/* Books */}
        {books.map((ub) => (
          <BookSpine key={ub.id} userBook={ub} onClick={() => onBookClick(ub)} />
        ))}

        {/* Right decoration */}
        <button
          onClick={() => onDecorClick("right")}
          title="Click to change decoration"
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-end",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            borderRadius: 4,
            transition: "filter 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
        >
          <ShelfDecor type={decors.right} side="right" />
        </button>

        {/* Right plank overhang */}
        <div style={{ width: SHELF_OVERHANG, flexShrink: 0 }} />
      </div>

      {/* Block element — inherits parent's max-content width, so spans the full plank */}
      <FloatingPlank />
    </div>
  );
}

export function BookShelf({ books, onBookClick, emptyMessage }: BookShelfProps) {
  const booksPerRow = useBooksPerRow();
  const rows: UserBook[][] = [];
  for (let i = 0; i < books.length; i += booksPerRow) {
    rows.push(books.slice(i, i + booksPerRow));
  }

  // Decor state: initialised from seeded hash, overridable by clicking.
  const [decorOverrides, setDecorOverrides] = useState<Record<number, ShelfDecors>>({});

  function getDecors(idx: number): ShelfDecors {
    return decorOverrides[idx] ?? getShelfDecors(idx);
  }

  function handleDecorClick(shelfIdx: number, side: "left" | "right") {
    setDecorOverrides((prev) => {
      const current = prev[shelfIdx] ?? getShelfDecors(shelfIdx);
      return {
        ...prev,
        [shelfIdx]: {
          ...current,
          [side]: nextDecorType(current[side]),
        },
      };
    });
  }

  if (books.length === 0) {
    return (
      // Center the empty shelf the same way as populated shelves
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: "max-content", minWidth: 320 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              paddingLeft: SHELF_OVERHANG,
              paddingRight: SHELF_OVERHANG,
              paddingTop: 8,
              minHeight: 180,
              paddingBottom: 10,
            }}
          >
            <p style={{ color: "#7A6952", fontStyle: "italic", fontSize: 14 }}>
              {emptyMessage ?? "No books yet — add some to fill your shelf."}
            </p>
          </div>
          <FloatingPlank />
        </div>
      </div>
    );
  }

  return (
    /*
     * alignItems: center centers each shelf row (which is width: max-content)
     * horizontally within the page column.
     */
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
      }}
    >
      {rows.map((row, idx) => (
        <ShelfRow
          key={idx}
          books={row}
          decors={getDecors(idx)}
          onDecorClick={(side) => handleDecorClick(idx, side)}
          onBookClick={onBookClick}
        />
      ))}
    </div>
  );
}
