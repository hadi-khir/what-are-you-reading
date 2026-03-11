const COLORS = [
  { bg: "#C17F59", shade: "#A0622F" },
  { bg: "#6B8E6B", shade: "#4D6B4D" },
  { bg: "#4A6FA5", shade: "#2D4F85" },
  { bg: "#8B3A4A", shade: "#6B2030" },
  { bg: "#4A7B8C", shade: "#2D5B6C" },
  { bg: "#B8A34A", shade: "#987A20" },
  { bg: "#7B5C8C", shade: "#5B3C6C" },
  { bg: "#5C7B6B", shade: "#3C5B4B" },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const ROW1 = [
  { id: "r1a", w: 34, h: 152 },
  { id: "r1b", w: 42, h: 162 },
  { id: "r1c", w: 36, h: 145 },
  { id: "r1d", w: 40, h: 158 },
  { id: "r1e", w: 32, h: 148 },
  { id: "r1f", w: 44, h: 164 },
  { id: "r1g", w: 38, h: 154 },
  { id: "r1h", w: 34, h: 142 },
];

const ROW2 = [
  { id: "r2a", w: 40, h: 156 },
  { id: "r2b", w: 36, h: 148 },
  { id: "r2c", w: 44, h: 160 },
  { id: "r2d", w: 32, h: 152 },
  { id: "r2e", w: 42, h: 164 },
  { id: "r2f", w: 38, h: 146 },
  { id: "r2g", w: 34, h: 158 },
  { id: "r2h", w: 40, h: 150 },
];

function SpineRow({ books }: { books: typeof ROW1 }) {
  const maxH = Math.max(...books.map((b) => b.h));
  return (
    <div style={{ marginBottom: 0 }}>
      <div className="flex items-end" style={{ height: maxH + 4, gap: 2 }}>
        {books.map((book) => {
          const h = hash(book.id);
          const color = COLORS[h % COLORS.length];
          return (
            <div
              key={book.id}
              style={{
                width: book.w,
                height: book.h,
                flexShrink: 0,
                background: `linear-gradient(to right, ${color.shade} 0%, ${color.bg} 10%, ${color.bg} 90%, ${color.shade} 100%)`,
                borderRadius: "2px 3px 3px 2px",
                position: "relative",
                boxShadow: "inset -1px 0 4px rgba(0,0,0,0.18), 1px 0 0 rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderTop: "1px solid rgba(255,255,255,0.32)",
                  borderRadius: "2px 3px 0 0",
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Shelf plank */}
      <div
        style={{
          height: 10,
          background: "linear-gradient(to bottom, #C4A882, #A88A65)",
          boxShadow: "0 3px 8px rgba(0,0,0,0.22)",
        }}
      />
    </div>
  );
}

function DecorativeShelf() {
  return (
    <div
      style={{
        background: "#FFFDF8",
        borderRadius: 6,
        boxShadow: "0 8px 40px rgba(28,16,8,0.18), 0 0 0 1px rgba(139,94,60,0.1)",
        padding: "20px 20px 0",
        maxWidth: 380,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <SpineRow books={ROW1} />
      </div>
      <SpineRow books={ROW2} />
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "#F5EDD6" }}>
      {/* Left decorative panel — desktop only */}
      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center gap-8 p-12"
        style={{ background: "#E8D5B0" }}
      >
        <DecorativeShelf />

        <div className="text-center" style={{ maxWidth: 360 }}>
          <h1
            className="font-display font-semibold"
            style={{ fontSize: 38, color: "#1C1008", letterSpacing: "-0.5px", marginBottom: 8 }}
          >
            Bookshelf
          </h1>
          <p
            className="font-ui italic"
            style={{ color: "#7A6952", fontSize: 15, marginBottom: 24 }}
          >
            Your reading life, beautifully organized.
          </p>
          <ul className="space-y-2 text-left inline-block">
            {[
              "Track every book you read",
              "Discover what to read next",
              "See what friends are reading",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2 font-ui" style={{ color: "#5C4A30", fontSize: 13 }}>
                <span style={{ color: "#8B5E3C", fontSize: 16 }}>·</span>
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 lg:p-10"
        style={{ minHeight: "100vh" }}
      >
        {/* Mobile-only wordmark */}
        <div className="lg:hidden text-center mb-8">
          <h1 className="font-display font-semibold text-ink" style={{ fontSize: 32 }}>
            Bookshelf
          </h1>
          <p className="font-ui text-ink-muted text-sm italic mt-1">
            Your reading life, beautifully organized.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3" style={{ maxWidth: 350 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
