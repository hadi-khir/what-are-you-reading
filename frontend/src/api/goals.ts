import { api } from "./client";
import type { ReadingGoal } from "../types";

export const goalsApi = {
  getGoals: () => api.get<ReadingGoal[]>("/goals"),
  setGoal: (year: number, goal_count: number) => api.put<ReadingGoal>(`/goals/${year}`, { goal_count }),
};
