/**
 * Pure attendance mathematics. No IO, no framework — fully unit-testable.
 * All percentages are 0-100 numbers. Cancelled classes never count.
 */

export type AttendanceStatus = "present" | "absent" | "cancelled";

export interface SubjectStats {
  attended: number;
  total: number;
  percentage: number;
  safeSkips: number;
  classesNeeded: number;
  status: "safe" | "at-risk" | "critical";
}

export function percentage(attended: number, total: number): number {
  if (total <= 0) return 0;
  return (attended / total) * 100;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * How many consecutive classes can be skipped while staying >= target.
 * Solves: attended / (total + x) >= target/100
 */
export function safeSkips(attended: number, total: number, target: number): number {
  if (target <= 0) return Infinity;
  if (total === 0) return 0;
  const max = Math.floor((attended * 100) / target - total);
  return Math.max(0, max);
}

/**
 * How many consecutive classes must be attended to reach the target.
 * Solves: (attended + x) / (total + x) >= target/100
 */
export function classesNeeded(attended: number, total: number, target: number): number {
  if (percentage(attended, total) >= target) return 0;
  if (target >= 100) return Infinity;
  const needed = (target * total - 100 * attended) / (100 - target);
  return Math.max(0, Math.ceil(needed));
}

/** Projected percentage after attending `attend` of the next `upcoming` classes. */
export function projectedPercentage(
  attended: number,
  total: number,
  attend: number,
  upcoming: number,
): number {
  const willAttend = Math.min(attend, upcoming);
  return percentage(attended + willAttend, total + upcoming);
}

export function statusOf(pct: number, minimum: number): SubjectStats["status"] {
  if (pct >= minimum + 5) return "safe";
  if (pct >= minimum) return "at-risk";
  return "critical";
}

export function buildStats(
  attended: number,
  total: number,
  target: number,
  minimum: number,
): SubjectStats {
  const pct = percentage(attended, total);
  return {
    attended,
    total,
    percentage: round1(pct),
    safeSkips: safeSkips(attended, total, target),
    classesNeeded: classesNeeded(attended, total, target),
    status: statusOf(pct, minimum),
  };
}

export const statusLabel: Record<SubjectStats["status"], string> = {
  safe: "Safe",
  "at-risk": "At risk",
  critical: "Critical",
};
