import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendMateData } from "@/hooks/use-attendmate";
import { generateAiCoaching, type AiCoachingResult } from "@/lib/ai.functions";
import { generateInsights } from "@/lib/insights";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — AttendMate" },
      {
        name: "description",
        content: "AI coaching grounded in your real attendance maths — alerts, recovery plans and next steps.",
      },
      { property: "og:title", content: "AI Insights — AttendMate" },
      {
        property: "og:description",
        content: "AI coaching grounded in your real attendance maths — alerts, recovery plans and next steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

const severityClass = {
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-warning/30 bg-warning/10 text-warning",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-primary/30 bg-primary/10 text-primary",
} as const;

function InsightsPage() {
  const { subjectsWithStats, minimum, target, overall, weeklyTrend, isLoading } =
    useAttendMateData();
  const coach = useServerFn(generateAiCoaching);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AiCoachingResult | null>(null);

  const insights = useMemo(
    () => generateInsights(subjectsWithStats, minimum, weeklyTrend),
    [subjectsWithStats, minimum, weeklyTrend],
  );

  const ask = useMutation({
    mutationFn: () =>
      coach({
        data: {
          minimum,
          target,
          overallPercentage: overall.percentage,
          subjects: subjectsWithStats.slice(0, 20).map((s) => ({
            name: s.name,
            attended: s.stats.attended,
            total: s.stats.total,
            percentage: s.stats.percentage,
            target: s.target_percentage ?? target,
            safeSkips: Number.isFinite(s.stats.safeSkips) ? s.stats.safeSkips : 0,
            classesNeeded: Number.isFinite(s.stats.classesNeeded) ? s.stats.classesNeeded : 0,
          })),
          question: question.trim() || undefined,
        },
      }),
    onSuccess: (data) => setResult(data),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI insights"
        description="Every recommendation is derived from your actual attendance numbers."
      />

      <section className="glass-panel space-y-4 rounded-2xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your coach — e.g. can I skip Friday labs?"
            aria-label="Ask the AI coach"
          />
          <Button onClick={() => ask.mutate()} disabled={ask.isPending}>
            <Wand2 className="mr-1.5 size-4" aria-hidden />
            {ask.isPending ? "Thinking…" : "Get coaching"}
          </Button>
        </div>

        {result && (
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {result.source === "ai" ? "AI coach" : "Rule-based coach"}
              </span>
            </div>
            <p className="mt-2 text-sm">{result.summary}</p>
            {result.actions.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {result.actions.map((action) => (
                  <li key={action} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {insights.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No insights yet"
          description="Mark attendance for a few classes and insights will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <article key={insight.id} className="glass-panel rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-base font-semibold">{insight.title}</h2>
                <Badge
                  variant="outline"
                  className={cn("rounded-full text-[11px] capitalize", severityClass[insight.severity])}
                >
                  {insight.category}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{insight.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
