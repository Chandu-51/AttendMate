import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendMateData } from "@/hooks/use-attendmate";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — AttendMate" },
      {
        name: "description",
        content: "Weekly and monthly attendance trends, subject comparisons and present/absent split.",
      },
      { property: "og:title", content: "Analytics — AttendMate" },
      {
        property: "og:description",
        content: "Weekly and monthly attendance trends, subject comparisons and present/absent split.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

const chartAxis = { stroke: "var(--muted-foreground)", fontSize: 12 };

function AnalyticsPage() {
  const {
    weeklyTrend,
    monthlyTrend,
    subjectsWithStats,
    attendedCount,
    missedCount,
    minimum,
    isLoading,
  } = useAttendMateData();

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  if (subjectsWithStats.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Trends across your semester." />
        <EmptyState
          icon={BarChart3}
          title="Nothing to analyse yet"
          description="Mark some attendance to unlock trends and comparisons."
        />
      </div>
    );
  }

  const split = [
    { name: "Attended", value: attendedCount, fill: "var(--success)" },
    { name: "Missed", value: missedCount, fill: "var(--destructive)" },
  ];

  const bySubject = subjectsWithStats.map((s) => ({
    name: s.code || s.name.slice(0, 8),
    percentage: s.stats.percentage,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`All charts respect your ${minimum}% minimum requirement.`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="font-display text-sm font-semibold">Weekly trend</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="wk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" {...chartAxis} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} {...chartAxis} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--primary)"
                  fill="url(#wk)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="font-display text-sm font-semibold">Monthly progression</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" {...chartAxis} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} {...chartAxis} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="font-display text-sm font-semibold">Subject comparison</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubject}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" {...chartAxis} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} {...chartAxis} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="percentage" radius={[8, 8, 0, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="font-display text-sm font-semibold">Present vs missed</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={split} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92}>
                  {split.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
