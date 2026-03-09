interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const sizes = { sm: "text-base", md: "text-xl", lg: "text-2xl" };

  return (
    <div className={`flex gap-0.5 ${sizes[size]}`} role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={[
            "transition-transform duration-100",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default",
            (value ?? 0) >= star ? "opacity-100" : "opacity-25",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <span style={{ color: "#C9853E" }}>★</span>
        </button>
      ))}
    </div>
  );
}
