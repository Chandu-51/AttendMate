import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAttendMateData, useGoals, qk } from "@/hooks/use-attendmate";
import { useAuth } from "@/hooks/use-auth";
import { goalService } from "@/services/attendmate.service";
import { classesNeeded } from "@/lib/attendance";
import type { AttendanceGoal } from "@/types";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Planner — AttendMate" },
      {
        name: "description",
        content: "Set attendance goals per subject and track the classes needed to reach them.",
      },
      { property: "og:title", content: "Planner — AttendMate" },
      {
        property: "og:description",
        content: "Set attendance goals per subject and track the classes needed to reach them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

const priorities: AttendanceGoal["priority"][] = ["low", "medium", "high"];

function PlannerPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { subjectsWithStats, overall } = useAttendMateData();
  const goalsQuery = useGoals();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject_id: "",
    target_percentage: "85",
    deadline: "",
    priority: "medium" as AttendanceGoal["priority"],
    note: "",
  });

  const create = useMutation({
    mutationFn: () =>
      goalService.create({
        user_id: user!.id,
        subject_id: form.subject_id || null,
        target_percentage: Number(form.target_percentage) || 85,
        deadline: form.deadline || null,
        priority: form.priority,
        note: form.note,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.goals });
      setOpen(false);
      toast.success("Goal created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => goalService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.goals });
      toast.success("Goal removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (goalsQuery.isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  const goals = goalsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planner"
        description="Turn targets into a concrete plan: how many classes, by when."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 size-4" aria-hidden /> New goal
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create a goal to get a class-by-class recovery plan."
          actionLabel="New goal"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const subject = subjectsWithStats.find((s) => s.id === goal.subject_id);
            const stats = subject?.stats ?? overall;
            const need = classesNeeded(stats.attended, stats.total, goal.target_percentage);
            const progress = Math.min(
              100,
              (stats.percentage / (goal.target_percentage || 100)) * 100,
            );
            return (
              <article key={goal.id} className="glass-panel rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold">
                      {subject?.name ?? "Overall attendance"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Target {goal.target_percentage}%
                      {goal.deadline && ` · by ${goal.deadline}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="rounded-full text-[11px] capitalize">
                      {goal.priority}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete goal"
                      onClick={() => remove.mutate(goal.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="mt-4" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Now at {stats.percentage}%.{" "}
                  {need === 0
                    ? "Target already met — keep it steady."
                    : `Attend the next ${need} ${need === 1 ? "class" : "classes"} without absence to reach ${goal.target_percentage}%.`}
                </p>
                {goal.note && <p className="mt-2 text-xs text-muted-foreground">{goal.note}</p>}
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select
                value={form.subject_id || "overall"}
                onValueChange={(v) => setForm({ ...form, subject_id: v === "overall" ? "" : v })}
              >
                <SelectTrigger aria-label="Subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall attendance</SelectItem>
                  {subjectsWithStats.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="g-target">Target %</Label>
                <Input
                  id="g-target"
                  type="number"
                  min={0}
                  max={100}
                  value={form.target_percentage}
                  onChange={(e) => setForm({ ...form, target_percentage: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="g-deadline">Deadline</Label>
                <Input
                  id="g-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm({ ...form, priority: v as AttendanceGoal["priority"] })
                }
              >
                <SelectTrigger aria-label="Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="g-note">Note</Label>
              <Input
                id="g-note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="No more Monday misses"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              Create goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
