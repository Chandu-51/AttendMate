import { classesNeeded, round1, safeSkips } from "@/lib/attendance";
import type { SubjectWithStats } from "@/types";

export interface Insight {
  id: string;
  category: "alert" | "recommendation" | "recovery" | "weekly";
  title: string;
  message: string;
  severity: "info" | "success" | "warning" | "danger";
  subject?: string;
}

/**
 * Deterministic, mathematically-grounded insight engine.
 * Used directly as a fallback and as the factual input for the AI layer,
 * so recommendations never contain unsupported claims.
 */
export function generateInsights(
  subjects: SubjectWithStats[],
  minimum: number,
  weeklyTrend: { percentage: number }[],
): Insight[] {
  const insights: Insight[] = [];

  subjects.forEach((subject) => {
    const { attended, total, percentage: pct } = subject.stats;
    const target = subject.target_percentage ?? minimum;

    if (pct < minimum) {
      const need = classesNeeded(attended, total, minimum);
      insights.push({
        id: `${subject.id}-recovery`,
        category: "recovery",
        title: `Recovery plan for ${subject.name}`,
        message: `Attendance is ${round1(pct)}%, below the ${minimum}% requirement. Attending the next ${need} ${need === 1 ? "class" : "classes"} without absence brings it back to ${minimum}%.`,
        severity: "danger",
        subject: subject.name,
      });
    } else if (pct < minimum + 5) {
      insights.push({
        id: `${subject.id}-alert`,
        category: "alert",
        title: `${subject.name} is approaching the limit`,
        message: `At ${round1(pct)}% you are only ${round1(pct - minimum)} points above the ${minimum}% minimum. Avoid absences this week.`,
        severity: "warning",
        subject: subject.name,
      });
    } else {
      const skips = safeSkips(attended, total, target);
      insights.push({
        id: `${subject.id}-safe`,
        category: "recommendation",
        title: `${subject.name} has buffer`,
        message: `You can skip about ${skips} ${skips === 1 ? "class" : "classes"} and stay at or above your ${target}% target (currently ${round1(pct)}%).`,
        severity: "success",
        subject: subject.name,
      });
    }
  });

  if (weeklyTrend.length >= 2) {
    const last = weeklyTrend[weeklyTrend.length - 1]!.percentage;
    const prev = weeklyTrend[weeklyTrend.length - 2]!.percentage;
    const delta = round1(last - prev);
    insights.push({
      id: "weekly-trend",
      category: "weekly",
      title: "Weekly insight",
      message:
        delta >= 0
          ? `Your attendance improved by ${delta}% compared with last week (${last}% this week).`
          : `Your attendance dropped by ${Math.abs(delta)}% compared with last week (${last}% this week).`,
      severity: delta >= 0 ? "success" : "warning",
    });
  }

  const order = { danger: 0, warning: 1, info: 2, success: 3 } as const;
  return insights.sort((a, b) => order[a.severity] - order[b.severity]);
}
