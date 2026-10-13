import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/attendance";
import type { SubjectWithStats } from "@/types";
import { cn } from "@/lib/utils";

const toneByStatus = {
  safe: "success",
  "at-risk": "warning",
  critical: "danger",
} as const;

const badgeClass = {
  safe: "border-success/30 bg-success/10 text-success",
  "at-risk": "border-warning/30 bg-warning/10 text-warning",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

export function SubjectCard({
  subject,
  index = 0,
  onSelect,
}: {
  subject: SubjectWithStats;
  index?: number;
  onSelect?: (subject: SubjectWithStats) => void;
}) {
  const { stats } = subject;
  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(subject)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel w-full rounded-2xl p-5 text-left transition-colors hover:border-primary/40 focus-visible:border-primary/60"
      aria-label={`Open analytics for ${subject.name}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold">{subject.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {subject.code} {subject.faculty && `· ${subject.faculty}`}
          </p>
          <Badge
            variant="outline"
            className={cn("mt-3 rounded-full text-[11px]", badgeClass[stats.status])}
          >
            {statusLabel[stats.status]}
          </Badge>
        </div>
        <ProgressRing value={stats.percentage} tone={toneByStatus[stats.status]} size={78} />
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Attended</dt>
          <dd className="mt-1 font-display text-sm font-semibold">
            {stats.attended}/{stats.total}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Safe skips</dt>
          <dd className="mt-1 font-display text-sm font-semibold text-success">{stats.safeSkips}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Needed</dt>
          <dd className="mt-1 font-display text-sm font-semibold text-primary">
            {stats.classesNeeded}
          </dd>
        </div>
      </dl>

      <span className="mt-4 inline-flex items-center gap-1 text-xs text-primary">
        View details <ArrowUpRight className="size-3.5" aria-hidden />
      </span>
    </motion.button>
  );
}
