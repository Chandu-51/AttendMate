import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator as CalcIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ProgressRing } from "@/components/ui/progress-ring";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAttendMateData } from "@/hooks/use-attendmate";
import { classesNeeded, projectedPercentage, round1, safeSkips } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/calculator")({
  head: () => ({
    meta: [
      { title: "Attendance Calculator — AttendMate" },
      {
        name: "description",
        content: "Simulate future classes and see exactly how many you can skip or must attend.",
      },
      { property: "og:title", content: "Attendance Calculator — AttendMate" },
      {
        property: "og:description",
        content: "Simulate future classes and see exactly how many you can skip or must attend.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const { subjectsWithStats, minimum, target } = useAttendMateData();
  const [subjectId, setSubjectId] = useState("");
  const [upcoming, setUpcoming] = useState(10);
  const [attend, setAttend] = useState(8);

  const subject = useMemo(
    () => subjectsWithStats.find((s) => s.id === subjectId) ?? subjectsWithStats[0],
    [subjectsWithStats, subjectId],
  );

  if (!subject) {
    return (
      <div className="space-y-6">
        <PageHeader title="Calculator" description="What-if attendance simulation." />
        <EmptyState
          icon={CalcIcon}
          title="Nothing to simulate yet"
          description="Add a subject and mark a few classes to use the calculator."
        />
      </div>
    );
  }

  const { attended, total } = subject.stats;
  const goal = subject.target_percentage ?? target;
  const projected = round1(projectedPercentage(attended, total, attend, upcoming));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculator"
        description="Move the sliders to project your attendance across upcoming classes."
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="glass-panel space-y-6 rounded-2xl p-6">
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Select value={subject.id} onValueChange={setSubjectId}>
              <SelectTrigger aria-label="Subject">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjectsWithStats.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Upcoming classes: {upcoming}</Label>
            <Slider
              value={[upcoming]}
              min={1}
              max={60}
              step={1}
              onValueChange={([v]) => {
                const next = v ?? 1;
                setUpcoming(next);
                setAttend((a) => Math.min(a, next));
              }}
            />
          </div>

          <div className="space-y-3">
            <Label>Classes you will attend: {attend}</Label>
            <Slider
              value={[attend]}
              min={0}
              max={upcoming}
              step={1}
              onValueChange={([v]) => setAttend(v ?? 0)}
            />
          </div>

          <dl className="grid grid-cols-3 gap-4 border-t border-border pt-5 text-center">
            <div>
              <dt className="text-xs text-muted-foreground">Current</dt>
              <dd className="font-display text-lg font-semibold">{subject.stats.percentage}%</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Safe skips</dt>
              <dd className="font-display text-lg font-semibold text-success">
                {safeSkips(attended, total, goal)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Needed for {goal}%</dt>
              <dd className="font-display text-lg font-semibold text-primary">
                {classesNeeded(attended, total, goal)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="glass-panel flex flex-col items-center justify-center gap-4 rounded-2xl p-6 text-center">
          <ProgressRing
            value={projected}
            size={168}
            stroke={12}
            tone={projected >= goal ? "success" : projected >= minimum ? "warning" : "danger"}
            label={`Projected attendance ${projected}%`}
          />
          <p className="font-display text-lg font-semibold">Projected attendance</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Attending {attend} of the next {upcoming} classes in {subject.name} moves you from{" "}
            {subject.stats.percentage}% to {projected}% (target {goal}%, minimum {minimum}%).
          </p>
        </section>
      </div>
    </div>
  );
}
