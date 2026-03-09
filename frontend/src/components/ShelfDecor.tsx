export type DecorType =
  | "potted-plant"
  | "succulent"
  | "flower-vase"
  | "candle"
  | "bookend"
  | "globe";

interface ShelfDecorProps {
  type: DecorType;
  side?: "left" | "right";
}

/*
 * All SVGs use overflow="visible" so content is never clipped.
 * Each decoration's visible content ends exactly at y = viewBox height
 * so decors sit flush on the shelf plank with no floating gap.
 */

function PottedPlant() {
  return (
    <svg width="52" height="118" viewBox="0 0 52 118" overflow="visible">
      {/* ── Pot ── */}
      <rect x="14" y="98" width="24" height="6"  rx="3"   fill="#A05030" />
      <path d="M13 104 Q12 114 14 116 Q26 120 38 116 Q40 114 39 104 Z" fill="#C17F59" />
      <ellipse cx="26" cy="104" rx="13" ry="3" fill="#7A4020" />

      {/* ── Stem ── */}
      <line x1="26" y1="98" x2="26" y2="74" stroke="#7A5030" strokeWidth="2.5" />

      {/* ── Back leaves (darker) ── */}
      <path d="M26 90 C18 76 6 70 2 54 C12 58 22 70 26 82 Z"  fill="#4D6B4D" />
      <path d="M26 90 C34 76 46 70 50 54 C40 58 30 70 26 82 Z" fill="#436043" />

      {/* ── Branch stems ── */}
      <path d="M26 82 Q16 70 8 58"  stroke="#7A5030" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M26 80 Q36 68 44 56" stroke="#7A5030" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* ── Branch leaves ── */}
      <path d="M8 58 C2 50 4 38 8 32 C10 40 11 50 8 58 Z"   fill="#5C8050" />
      <path d="M44 56 C50 48 48 36 44 30 C42 38 41 48 44 56 Z" fill="#5C8050" />

      {/* ── Front leaves ── */}
      <path d="M26 94 C17 76 19 58 22 42 C26 58 28 76 26 94 Z" fill="#7AAA6A" />
      <path d="M26 92 C16 78 12 60 14 44 C20 56 22 74 26 92 Z" fill="#8AB870" />
      <path d="M26 92 C36 78 40 60 38 44 C32 56 30 74 26 92 Z" fill="#8AB870" />
    </svg>
  );
}

function Succulent() {
  return (
    <svg width="48" height="96" viewBox="0 0 48 96" overflow="visible">
      {/* ── Pot — moved down 5 px so base sits flush at y≈95.5 ── */}
      <rect x="9" y="71" width="30" height="7" rx="3.5" fill="#A05030" />
      <path d="M10 78 Q9 90 11 93 Q24 98 37 93 Q39 90 38 78 Z" fill="#C17F59" />
      <ellipse cx="24" cy="78" rx="14" ry="3.5" fill="#7A4020" />

      {/* ── Outer petals — shifted down 13 px so base sits in pot (rim top ≈ y74.5) ── */}
      <ellipse cx="24"  cy="61" rx="15" ry="10" fill="#3D7030" />
      <ellipse cx="9"   cy="68" rx="9"  ry="6"  fill="#3D7030" />
      <ellipse cx="39"  cy="68" rx="9"  ry="6"  fill="#3D7030" />
      <ellipse cx="9"   cy="55" rx="8"  ry="5.5" fill="#4E8040" />
      <ellipse cx="39"  cy="55" rx="8"  ry="5.5" fill="#4E8040" />

      {/* ── Mid petals ── */}
      <ellipse cx="24"  cy="59" rx="11" ry="7.5" fill="#6B9B5A" />
      <ellipse cx="14"  cy="65" rx="7.5" ry="5"  fill="#6B9B5A" />
      <ellipse cx="34"  cy="65" rx="7.5" ry="5"  fill="#6B9B5A" />

      {/* ── Centre ── */}
      <circle cx="24" cy="57" r="7.5" fill="#8ABB7A" />
      <circle cx="24" cy="57" r="4.5" fill="#A0CE8A" />
      <circle cx="24" cy="57" r="2"   fill="#C0E0AA" />

      {/* ── Highlight ── */}
      <ellipse cx="20" cy="53" rx="3" ry="2" fill="rgba(255,255,255,0.32)" />
    </svg>
  );
}

function FlowerVase() {
  return (
    <svg width="48" height="124" viewBox="0 0 48 124" overflow="visible">
      {/* ── Vase ── */}
      <ellipse cx="24" cy="120" rx="14" ry="4"  fill="#325A68" />
      <path d="M12 92 Q10 108 13 114 Q24 120 35 114 Q38 108 36 92 Z" fill="#4A7B8C" />
      <path d="M15 76 Q12 86 12 92 Q24 98 36 92 Q36 86 33 76 Z" fill="#5A8B9C" />
      <ellipse cx="24" cy="76" rx="10" ry="4" fill="#3A6B7C" />

      {/* ── Stems ── */}
      <line x1="24" y1="74" x2="24" y2="42" stroke="#5C8250" strokeWidth="2"   strokeLinecap="round" />
      <line x1="24" y1="72" x2="11" y2="38" stroke="#6B9060" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="24" y1="72" x2="37" y2="38" stroke="#6B9060" strokeWidth="1.6" strokeLinecap="round" />

      {/* ── Stem leaves ── */}
      <path d="M19 62 C13 56 14 46 17 42 C18 48 19 56 19 62 Z" fill="#5C8250" />
      <path d="M29 60 C35 54 34 44 31 40 C30 46 29 54 29 60 Z" fill="#5C8250" />

      {/* ── Left flower — burgundy ── */}
      <circle cx="11" cy="30" r="10" fill="#8B3A4A" />
      <ellipse cx="11" cy="19" rx="4"   ry="7.5" fill="#8B3A4A" />
      <ellipse cx="11" cy="41" rx="4"   ry="7.5" fill="#8B3A4A" />
      <ellipse cx="0"  cy="30" rx="7.5" ry="4"   fill="#8B3A4A" />
      <ellipse cx="22" cy="30" rx="7.5" ry="4"   fill="#8B3A4A" />
      <circle cx="11" cy="30" r="5" fill="#C07080" />

      {/* ── Centre flower — amber ── */}
      <circle cx="24" cy="22" r="12" fill="#C9853E" />
      <ellipse cx="24" cy="9"  rx="5"  ry="9"  fill="#C9853E" />
      <ellipse cx="24" cy="35" rx="5"  ry="9"  fill="#C9853E" />
      <ellipse cx="11" cy="22" rx="9"  ry="5"  fill="#C9853E" />
      <ellipse cx="37" cy="22" rx="9"  ry="5"  fill="#C9853E" />
      <circle cx="24" cy="22" r="6" fill="#F5C070" />
      <circle cx="24" cy="22" r="2.5" fill="#FFE090" />

      {/* ── Right flower — sage/mustard ── */}
      <circle cx="37" cy="30" r="10" fill="#B8A34A" />
      <ellipse cx="37" cy="19" rx="4"   ry="7.5" fill="#B8A34A" />
      <ellipse cx="37" cy="41" rx="4"   ry="7.5" fill="#B8A34A" />
      <ellipse cx="26" cy="30" rx="7.5" ry="4"   fill="#B8A34A" />
      <ellipse cx="48" cy="30" rx="7.5" ry="4"   fill="#B8A34A" />
      <circle cx="37" cy="30" r="5" fill="#E0C860" />
    </svg>
  );
}

function Candle() {
  // Wider candle body (22 px) so it reads clearly at small sizes.
  return (
    <svg width="44" height="108" viewBox="0 0 44 108" overflow="visible">
      {/* ── Glow ── */}
      <ellipse cx="22" cy="18" rx="13" ry="15" fill="#FFD06030" />

      {/* ── Flame outer ── */}
      <path d="M22 24 C16 17 15 8 22 2 C29 8 28 17 22 24 Z" fill="#FF9020" />
      {/* ── Flame mid ── */}
      <path d="M22 23 C18 17 17 10 22 5 C27 10 26 17 22 23 Z" fill="#FFCC40" />
      {/* ── Flame core ── */}
      <path d="M22 22 C20 17 20 12 22 7 C24 12 24 17 22 22 Z" fill="#FFF5A0" />

      {/* ── Wick ── */}
      <line x1="22" y1="24" x2="22" y2="30" stroke="#3A2010" strokeWidth="1.6" strokeLinecap="round" />

      {/* ── Candle body ── */}
      <rect x="11" y="30" width="22" height="62" rx="3" fill="#F5EDD6" />
      {/* Side shading */}
      <rect x="11" y="30" width="5"  height="62" rx="2" fill="rgba(0,0,0,0.04)" />
      <rect x="28" y="30" width="5"  height="62" rx="2" fill="rgba(255,255,255,0.22)" />

      {/* ── Wax drips ── */}
      <path d="M11 40 Q8 48 9 55 Q11 49 11 40 Z"  fill="#EDE0C0" />
      <path d="M33 46 Q36 54 35 60 Q33 55 33 46 Z" fill="#EDE0C0" />

      {/* ── Holder rim ── */}
      <rect x="7"  y="92" width="30" height="7"  rx="3"   fill="#A08060" />
      {/* ── Holder base ── */}
      <rect x="4"  y="99" width="36" height="5"  rx="2.5" fill="#C4A882" />
      <ellipse cx="22" cy="104" rx="18" ry="4" fill="#B09070" />
    </svg>
  );
}

function Bookend({ side = "left" }: { side?: "left" | "right" }) {
  /*
   * The plate always faces the books:
   *   left side  → plate on the RIGHT edge, foot extends left  (mirrored)
   *   right side → plate on the LEFT  edge, foot extends right (default)
   *
   * We draw the default "right-side" orientation (plate on left, books to its
   * right) and flip horizontally for the left-side placement.
   */
  const flip = side === "left";
  return (
    <svg
      width="44"
      height="106"
      viewBox="0 0 44 106"
      overflow="visible"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      {/* ── Shadow — extends below via overflow:visible ── */}
      <ellipse cx="22" cy="106" rx="18" ry="3" fill="rgba(0,0,0,0.1)" />

      {/* ── Foot (horizontal base) ── */}
      <rect x="2"  y="94" width="40" height="12" rx="3" fill="#7A6A50" />
      <rect x="2"  y="94" width="40" height="5"  rx="2" fill="#A08A68" />

      {/* ── Vertical back plate ── */}
      <rect x="4"  y="18" width="16" height="78" rx="2" fill="#9A8A70" />
      <rect x="4"  y="18" width="6"  height="78" rx="2" fill="#B0A088" />

      {/* ── Engraved lines on plate ── */}
      <line x1="6" y1="38" x2="18" y2="38" stroke="#7A6A50" strokeWidth="1" />
      <line x1="6" y1="58" x2="18" y2="58" stroke="#7A6A50" strokeWidth="1" />
      <line x1="6" y1="78" x2="18" y2="78" stroke="#7A6A50" strokeWidth="1" />

      {/* ── Finial base collar ── */}
      <rect x="3" y="14" width="18" height="6" rx="2" fill="#8A7A60" />

      {/* ── Finial sphere ── */}
      <circle cx="12" cy="12" r="10" fill="#C4A882" />
      <circle cx="12" cy="12" r="7"  fill="#D4B892" />
      <circle cx="12" cy="12" r="3.5" fill="#E8CC9A" />
      {/* Highlight */}
      <ellipse cx="9" cy="8" rx="3" ry="2" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

function Globe() {
  return (
    <svg width="52" height="112" viewBox="0 0 52 112" overflow="visible">
      {/* ── Base shadow ── */}
      <ellipse cx="26" cy="110" rx="17" ry="3.5" fill="rgba(0,0,0,0.1)" />

      {/* ── Wooden base ── */}
      <rect x="8"  y="100" width="36" height="10" rx="5" fill="#7A5030" />
      <rect x="6"  y="98"  width="40" height="6"  rx="3" fill="#9A6A40" />

      {/* ── Stand column ── */}
      <rect x="21" y="74" width="10" height="26" rx="5" fill="#A07040" />
      <rect x="21" y="74" width="5"  height="26" rx="4" fill="#C09060" />

      {/* ── Stand cup (where globe sits) ── */}
      <ellipse cx="26" cy="74" rx="13" ry="4.5" fill="#8B5E3C" />

      {/* ── Meridian ring — sphere shifted down 6 px to rest in cup (cup top ≈ y69.5) ── */}
      <ellipse cx="26" cy="46" rx="24" ry="24" stroke="#8B5E3C" strokeWidth="2.5" fill="none" />

      {/* ── Globe sphere ── */}
      <circle cx="26" cy="46" r="23" fill="#3A6B7C" />

      {/* ── Ocean radial highlight ── */}
      <circle cx="26" cy="46" r="23" fill="url(#gGrad)" />

      {/* ── Land masses (all y+6) ── */}
      <path d="M16 34 Q22 28 32 31 Q37 37 34 46 Q28 52 20 48 Q13 42 16 34 Z" fill="#6B8E6B" />
      <path d="M32 52 Q38 48 42 55 Q41 63 35 65 Q28 63 32 52 Z"              fill="#6B8E6B" />
      <path d="M10 52 Q16 48 18 55 Q17 61 12 59 Q8 56 10 52 Z"               fill="#6B8E6B" />
      <path d="M18 64 Q23 61 26 66 Q24 72 19 71 Q16 68 18 64 Z"              fill="#7A9E7A" />

      {/* ── Graticule (all y+6) ── */}
      <ellipse cx="26" cy="46" rx="23" ry="8"  stroke="rgba(255,255,255,0.14)" strokeWidth="0.8" fill="none" />
      <ellipse cx="26" cy="46" rx="23" ry="16" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" fill="none" />
      <line x1="26" y1="23" x2="26" y2="69" stroke="rgba(255,255,255,0.14)" strokeWidth="0.8" />
      <line x1="3"  y1="46" x2="49" y2="46" stroke="rgba(255,255,255,0.14)" strokeWidth="0.8" />

      {/* ── Sphere highlight ── */}
      <ellipse cx="17" cy="34" rx="7" ry="5" fill="rgba(255,255,255,0.22)" />

      <defs>
        <radialGradient id="gGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#6AAABB" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1A4050" stopOpacity="0.35" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function ShelfDecor({ type, side = "left" }: ShelfDecorProps) {
  switch (type) {
    case "potted-plant":  return <PottedPlant />;
    case "succulent":     return <Succulent />;
    case "flower-vase":   return <FlowerVase />;
    case "candle":        return <Candle />;
    case "bookend":       return <Bookend side={side} />;
    case "globe":         return <Globe />;
  }
}
