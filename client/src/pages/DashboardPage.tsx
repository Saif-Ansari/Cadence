import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import UserMenu from "../components/layout/UserMenu";
import { goalsService } from "../services/goals.service";
import { habitsService } from "../services/habits.service";
import { tasksService } from "../services/tasks.service";
import type { Goal, Task } from "../types";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function computeGoalStatus(
  goal: Goal,
): "on-track" | "at-risk" | "overdue" | "completed" {
  if (goal.status === "completed") return "completed";
  const daysLeft = Math.ceil(
    (new Date(goal.deadline).getTime() - Date.now()) / 86400000,
  );
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 7 && goal.progress < 80) return "at-risk";
  if (daysLeft <= 14 && goal.progress < 50) return "at-risk";
  return "on-track";
}

const STATUS_STYLES: Record<string, string> = {
  "on-track": "bg-teal-50 text-teal-700",
  "at-risk": "bg-amber-50 text-amber-700",
  overdue: "bg-red-50 text-red-600",
  completed: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  "on-track": "ON TRACK",
  "at-risk": "AT RISK",
  overdue: "OVERDUE",
  completed: "COMPLETED",
};

const PROGRESS_COLOR: Record<string, string> = {
  "on-track": "bg-teal-600",
  "at-risk": "bg-amber-400",
  overdue: "bg-red-400",
  completed: "bg-slate-300",
};

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: goalsData } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsService.getGoals(),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", "today"],
    queryFn: () => tasksService.getTasks({ today: true }),
  });

  const { data: habitsData } = useQuery({
    queryKey: ["habits"],
    queryFn: () => habitsService.getHabits(),
  });

  const toggleTask = useMutation({
    mutationFn: (task: Task) =>
      tasksService.updateTask(task._id, { done: !task.done }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const toggleHabit = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      habitsService.toggleDay(id, date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  const goals = goalsData?.goals ?? [];
  const tasks = tasksData?.tasks ?? [];
  const habits = habitsData?.habits ?? [];

  const activeGoals = goals.filter((g) => g.status !== "completed");
  const doneCount = tasks.filter((t) => t.done).length;
  const goalLinkedTasks = tasks.filter((t) => t.goalId && !t.done);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="p-8">
      {/* Greeting header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {getGreeting()}, {user?.name}.
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {formatFullDate()}
            {activeGoals.length > 0 &&
              ` · ${activeGoals.length} goal${activeGoals.length === 1 ? "" : "s"} in progress`}
          </p>
        </div>
        <UserMenu />
      </div>
      <div className="border-b border-slate-100 mb-8" />

      {/* Two column layout */}
      <div className="grid grid-cols-5 gap-6 min-h-[calc(100vh-220px)]">
        {/* Left column */}
        <div className="col-span-3 space-y-6">
          {/* Goals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Goals
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/goals")}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  Manage
                </button>
                <button
                  onClick={() => navigate("/goals")}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                >
                  + Add goal
                </button>
              </div>
            </div>

            {goals.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center">
                <p className="text-sm text-slate-400">
                  No goals yet. Add one to get started.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {goals.map((goal) => {
                  const status = computeGoalStatus(goal);
                  return (
                    <div key={goal._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {goal.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Due {formatDeadline(goal.deadline)}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-1 rounded-md flex-shrink-0 ${STATUS_STYLES[status]}`}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">
                            Progress
                          </span>
                          <span className="text-xs font-medium text-slate-600">
                            {goal.progress}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${PROGRESS_COLOR[status]}`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* What Matters Most Today */}
          {goalLinkedTasks.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                What matters most today
              </h2>
              <div className="bg-teal-50 rounded-xl p-4 space-y-3">
                {goalLinkedTasks.map((task) => {
                  const linkedGoal = goals.find((g) => g._id === task.goalId);
                  return (
                    <div key={task._id} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-teal-900">
                          {task.title}
                        </p>
                        {linkedGoal && (
                          <p className="text-xs text-teal-600 mt-0.5">
                            Linked to: {linkedGoal.title}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="col-span-2 flex flex-col">
          {/* Today + Habits — grows to fill space */}
          <div className="flex-1 space-y-6">
            {/* Today's tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Today
                </h2>
                <button
                  onClick={() => navigate("/tasks")}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                >
                  + Add task
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-slate-400">No tasks for today.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    {tasks.map((task) => (
                      <button
                        key={task._id}
                        onClick={() => toggleTask.mutate(task)}
                        className="flex items-center gap-3 w-full text-left py-1.5 group cursor-pointer"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            task.done
                              ? "bg-teal-600 border-teal-600"
                              : "border-slate-300 group-hover:border-teal-400"
                          }`}
                        >
                          {task.done && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        <span
                          className={`text-sm transition-colors ${task.done ? "line-through text-slate-400" : "text-slate-700"}`}
                        >
                          {task.title}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {doneCount} of {tasks.length} done
                    </span>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all"
                        style={{
                          width: tasks.length
                            ? `${(doneCount / tasks.length) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Habits */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Habits
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate("/habits")}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => navigate("/habits")}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                  >
                    + Add habit
                  </button>
                </div>
              </div>

              {habits.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-slate-400">No habits yet.</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-[1fr_repeat(7,_20px)] gap-1 mb-2 items-center">
                    <div />
                    {DAY_LABELS.map((d, i) => (
                      <div
                        key={i}
                        className="text-center text-[10px] font-medium text-slate-400"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  {habits.map((habit) => (
                    <div
                      key={habit._id}
                      className="grid grid-cols-[1fr_repeat(7,_20px)] gap-1 mb-2 items-center"
                    >
                      <span className="text-xs text-slate-700 truncate pr-1">
                        {habit.name}
                      </span>
                      {habit.weekGrid.map((day, i) => {
                        const dayDate = new Date(day.date);
                        dayDate.setHours(0, 0, 0, 0);
                        const isFuture = dayDate > today;
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              !isFuture &&
                              toggleHabit.mutate({
                                id: habit._id,
                                date: day.date,
                              })
                            }
                            disabled={isFuture}
                            className={`w-5 h-5 rounded-full transition-colors ${
                              day.done
                                ? "bg-teal-600"
                                : isFuture
                                  ? "bg-slate-100"
                                  : "bg-slate-200 hover:bg-slate-300 cursor-pointer"
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* end flex-1 */}

        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
