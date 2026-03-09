import type { UserBook } from "../types";

const SPINE_COLORS = [
  { bg: "#C17F59", text: "#FFF8F0", shade: "#A0622F" },
  { bg: "#6B8E6B", text: "#F0F5F0", shade: "#4D6B4D" },
  { bg: "#4A6FA5", text: "#EEF2F8", shade: "#2D4F85" },
  { bg: "#8B3A4A", text: "#FFF0F2", shade: "#6B2030" },
  { bg: "#4A7B8C", text: "#EEF4F5", shade: "#2D5B6C" },
  { bg: "#B8A34A", text: "#2C1A0E", shade: "#987A20" },
  { bg: "#7B5C8C", text: "#F5F0F8", shade: "#5B3C6C" },
  { bg: "#5C7B6B", text: "#F0F5F2", shade: "#3C5B4B" },
  { bg: "#8C4A4A", text: "#FFF0F0", shade: "#6C2A2A" },
  { bg: "#3A6B5C", text: "#EEF5F2", shade: "#1A4B3C" },
  { bg: "#8C6B3A", text: "#FFF5EC", shade: "#6C4B1A" },
  { bg: "#5C6B8C", text: "#EEF2F8", shade: "#3C4B6C" },
];

const SPINE_HEIGHTS = [170, 178, 184, 190, 194, 200, 175, 186, 182, 176];
const SPINE_WIDTHS  = [40,  44,  46,  48,  50,  42,  45,  47];

function seededHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getSpineStyle(seed: string) {
  const h = seededHash(seed);
  return {
    colors: SPINE_COLORS[h % SPINE_COLORS.length],
    height: SPINE_HEIGHTS[h % SPINE_HEIGHTS.length],
    width:  SPINE_WIDTHS[(h >> 4) % SPINE_WIDTHS.length],
  };
}

interface BookSpineProps {
  userBook: UserBook;
  onClick: () => void;
}

export function BookSpine({ userBook, onClick }: BookSpineProps) {
  const { book, status, rating } = userBook;
  const { colors, height, width } = getSpineStyle(book.title + book.author);
  const fontSize = Math.max(10, Math.min(13, width - 22));

  return (
    <button
      onClick={onClick}
      title={`${book.title} by ${book.author}`}
      className="group relative flex-shrink-0 focus:outline-none"
      style={{ width, height: height + 20 }}
    >
      {/* Book body */}
      <div
        className="absolute bottom-0 left-0 transition-transform duration-200 ease-out group-hover:-translate-y-4 group-focus:-translate-y-4"
        style={{
          width,
          height,
          background: `linear-gradient(to right, ${colors.shade} 0%, ${colors.bg} 8%, ${colors.bg} 92%, ${colors.shade} 100%)`,
          borderRadius: "2px 4px 4px 2px",
          boxShadow: `inset -2px 0 5px rgba(0,0,0,0.15), 3px 3px 8px rgba(0,0,0,0.28)`,
        }}
      >
        {/* Spine text */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ padding: "10px 4px" }}
        >
          <span
            className="font-display font-semibold leading-tight"
            style={{
              color: colors.text,
              fontSize,
              writingMode: "vertical-lr",
              transform: "rotate(180deg)",
              overflow: "hidden",
              maxHeight: height - 28,
              opacity: 0.93,
            }}
          >
            {book.title}
          </span>
        </div>

        {/* Reading indicator */}
        {status === "reading" && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{ background: "#F5EDD6", opacity: 0.85 }}
          />
        )}

        {/* Rating stars */}
        {status === "read" && rating && (
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2"
            style={{ color: "#F5EDD6", opacity: 0.75, fontSize: 7, letterSpacing: "1px" }}
          >
            {"★".repeat(rating)}
          </div>
        )}
      </div>

      {/* Page-top highlight */}
      <div
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{
          width: width - 2,
          height: height - 1,
          borderTop: "2px solid rgba(255,255,255,0.35)",
          borderRadius: "2px 4px 0 0",
        }}
      />
    </button>
  );
}
