import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Check, Trash2, X } from "lucide-react";
import DeletePopover from "../components/ui/DeletePopover";
import { useAuthStore } from "../store/auth.store";
import UserMenu from "../components/layout/UserMenu";
import { goalsService } from "../services/goals.service";
import { habitsService } from "../services/habits.service";
import { tasksService } from "../services/tasks.service";
import type { Goal, Task } from "../types";
import { computeGoalStatus, STATUS_STYLES, STATUS_LABELS, PROGRESS_COLOR } from "../lib/goalStatus";

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


function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);

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

  const createTask = useMutation({
    mutationFn: (title: string) => tasksService.createTask({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTaskTitle("");
      setShowAddTask(false);
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => tasksService.deleteTask(id),
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="p-4 lg:p-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Goals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Goals
              </h2>
              <button
                onClick={() => navigate("/goals")}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
              >
                + Add goal
              </button>
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

        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Today + Habits — grows to fill space */}
          <div className="flex-1 space-y-6">
            {/* Today's tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Today
                </h2>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                >
                  + Add task
                </button>
              </div>

              {tasks.length === 0 && !showAddTask ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-slate-400">No tasks for today.</p>
                </div>
              ) : (
                <>
                  {tasks.length > 0 && (
                    <>
                      <div className="space-y-1">
                        {tasks.map((task) => (
                          <div
                            key={task._id}
                            className="flex items-center gap-2 py-1.5 group"
                          >
                            <button
                              onClick={() => toggleTask.mutate(task)}
                              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                                task.done
                                  ? "bg-teal-600 border-teal-600"
                                  : "border-slate-300 hover:border-teal-400"
                              }`}
                            >
                              {task.done && <Check size={10} className="text-white" strokeWidth={3} />}
                            </button>
                            <span
                              onClick={() => toggleTask.mutate(task)}
                              className={`flex-1 text-sm cursor-pointer transition-colors ${task.done ? "line-through text-slate-400" : "text-slate-700"}`}
                            >
                              {task.title}
                            </span>
                            <div className="relative">
                              <button
                                onClick={() => setConfirmDeleteTaskId(confirmDeleteTaskId === task._id ? null : task._id)}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                              {confirmDeleteTaskId === task._id && (
                                <DeletePopover
                                  title="Delete task"
                                  itemName={task.title}
                                  onConfirm={() => { deleteTask.mutate(task._id); setConfirmDeleteTaskId(null); }}
                                  onCancel={() => setConfirmDeleteTaskId(null)}
                                />
                              )}
                            </div>
                          </div>
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

                  {showAddTask && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newTaskTitle.trim()) createTask.mutate(newTaskTitle.trim());
                      }}
                      className={`flex items-center gap-2 ${tasks.length > 0 ? "mt-3" : ""}`}
                    >
                      <input
                        autoFocus
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title…"
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="submit"
                        disabled={!newTaskTitle.trim() || createTask.isPending}
                        className="px-3 py-1.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddTask(false); setNewTaskTitle(""); }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* Habits */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Habits
                </h2>
                <button
                  onClick={() => navigate("/habits")}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                >
                  + Add habit
                </button>
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
