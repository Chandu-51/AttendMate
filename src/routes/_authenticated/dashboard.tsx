import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, CheckCircle2, Percent, SkipForward, TrendingUp, XCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAttendMateData } from "@/hooks/use-attendmate";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AttendMate" },
      { name: "description", content: "Your live attendance overview, safe skips and weekly trend." },
      { property: "og:title", content: "Dashboard — AttendMate" },
      { property: "og:description", content: "Live attendance overview, safe skips and weekly trend." },
    ],
  }),
  component: DashboardPage,
});

const chartTooltip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    color: "var(--popover-foreground)",
    fontSize: "12px",
  },
};

function DashboardPage() {
  const data = useAttendMateData();

  if (data.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!data.subjects.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Nothing tracked yet." />
        <EmptyState
          icon={GraduationCap}
          title="No attendance data yet"
          description="Add your first subject to start tracking your attendance."
          actionLabel="Add subject"
          onAction={() => {
            window.location.href = "/subjects";
          }}
        />
      </div>
    );
  }

  const subjectComparison = data.subjectsWithStats.map((s) => ({
    name: s.code || s.name.slice(0, 10),
    fullName: s.name,
    percentage: s.stats.percentage,
  }));

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Welcome back${data.profile?.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""}`}
        description={`Semester ${data.profile?.semester || "—"} · minimum requirement ${data.minimum}%`}
        action={
          <Button asChild variant="outline">
            <Link to="/attendance">Mark attendance</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          index={0}
          label="Overall attendance"
          value={data.overall.percentage}
          decimals={1}
          suffix="%"
          caption={`Target: ${data.target}%`}
          icon={Percent}
          tone={data.overall.status === "critical" ? "danger" : data.overall.status === "at-risk" ? "warning" : "success"}
        />
        <StatCard index={1} label="Classes attended" value={data.attendedCount} icon={CheckCircle2} tone="success" />
        <StatCard index={2} label="Classes missed" value={data.missedCount} icon={XCircle} tone="danger" />
        <StatCard
          index={3}
          label="Safe skips"
          value={Number.isFinite(data.overall.safeSkips) ? data.overall.safeSkips : 0}
          caption={`At ${data.target}% target`}
          icon={SkipForward}
          tone="primary"
        />
        <StatCard
          index={4}
          label="Classes needed"
          value={Number.isFinite(data.overall.classesNeeded) ? data.overall.classesNeeded : 0}
          caption="To reach target"
          icon={CalendarClock}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel rounded-2xl p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold">Weekly attendance trend</h2>
              <p className="text-xs text-muted-foreground">Percentage of classes attended per week</p>
            </div>
            <TrendingUp className="size-4 text-primary" aria-hidden />
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyTrend}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32} />
                <Tooltip {...chartTooltip} formatter={(v: number) => [`${v}%`, "Attendance"]} />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="glass-panel rounded-2xl p-5"
        >
          <h2 className="font-display text-base font-semibold">Subject comparison</h2>
          <p className="text-xs text-muted-foreground">Current attendance by subject</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectComparison} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={58}
                />
                <Tooltip
                  {...chartTooltip}
                  formatter={(v: number, _n, item) => [`${v}%`, item.payload.fullName]}
                />
                <Bar dataKey="percentage" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Your subjects</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/subjects">Manage</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.subjectsWithStats.map((subject, index) => (
            <SubjectCard key={subject.id} subject={subject} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
