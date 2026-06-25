import { api } from "../lib/api";
import type { Goal } from "../types";

export const goalsService = {
  getGoals: () => api.get<{ goals: Goal[] }>("/goals"),
  createGoal: (data: { title: string; description?: string; deadline: string }) =>
    api.post<{ goal: Goal }>("/goals", data),
  updateGoal: (id: string, data: Partial<Pick<Goal, "title" | "description" | "deadline" | "status">>) =>
    api.patch<{ goal: Goal }>(`/goals/${id}`, data),
  deleteGoal: (id: string) => api.delete<{ message: string }>(`/goals/${id}`),
};
