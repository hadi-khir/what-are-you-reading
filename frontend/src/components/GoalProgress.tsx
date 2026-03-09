import { useState } from "react";
import { goalsApi } from "../api/goals";
import type { ReadingGoal } from "../types";

interface GoalProgressProps {
  goal: ReadingGoal | null;
  year: number;
  onGoalUpdate: (goal: ReadingGoal) => void;
}

export function GoalProgress({ goal, year, onGoalUpdate }: GoalProgressProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const percent = goal ? Math.min(100, Math.round((goal.books_read / goal.goal_count) * 100)) : 0;

  const handleSave = async () => {
    const n = parseInt(input, 10);
    if (!n || n < 1) return;
    setSaving(true);
    try {
      const updated = await goalsApi.setGoal(year, n);
      onGoalUpdate(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-ui text-ink-muted text-sm">Goal for {year}:</span>
        <input
          type="number"
          min={1}
          max={500}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-16 border border-wood/30 rounded px-2 py-0.5 text-sm font-ui text-ink bg-cream-50 focus:outline-none focus:ring-1 focus:ring-wood"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-ui text-wood hover:text-wood-dark transition-colors"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-sm font-ui text-ink-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (!goal) {
    return (
      <button
        onClick={() => {
          setInput("");
          setEditing(true);
        }}
        className="text-sm font-ui text-wood-light hover:text-wood transition-colors underline decoration-dotted"
      >
        Set a reading goal for {year}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="font-display text-ink font-semibold">{goal.books_read}</span>
        <span className="font-ui text-ink-muted text-sm">of</span>
        <span className="font-display text-ink font-semibold">{goal.goal_count}</span>
        <span className="font-ui text-ink-muted text-sm">books</span>
      </div>
      <div className="w-32 h-2 bg-cream-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(to right, #8B5E3C, #C9853E)",
          }}
        />
      </div>
      <span className="font-ui text-ink-muted text-sm">{percent}%</span>
      <button
        onClick={() => {
          setInput(String(goal.goal_count));
          setEditing(true);
        }}
        className="text-xs font-ui text-ink-muted hover:text-wood transition-colors"
      >
        Edit
      </button>
    </div>
  );
}
