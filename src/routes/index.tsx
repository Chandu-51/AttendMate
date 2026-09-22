import { Suspense, lazy } from "react";
import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Calculator,
  Check,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AttendanceOrb = lazy(() => import("@/components/three/AttendanceOrb"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AttendMate — Never lose track of your attendance again" },
      {
        name: "description",
        content:
          "AttendMate tracks college attendance subject-by-subject, calculates safe skips and shows exactly how many classes you must attend to hit your target.",
      },
      { property: "og:title", content: "AttendMate — Smart attendance tracking for students" },
      {
        property: "og:description",
        content:
          "Track smarter. Plan better. Stay above the attendance limit — with intelligent attend/skip recommendations.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Calculator,
    title: "Smart attendance calculator",
    body: "Exact safe skips and the number of classes required to reach your target, computed live.",
  },
  {
    icon: Sparkles,
    title: "AI insights",
    body: "Grounded recommendations built from your real attendance numbers — never guesswork.",
  },
  {
    icon: CalendarDays,
    title: "Timetable management",
    body: "A weekly schedule with rooms and faculty, editable in seconds.",
  },
  {
    icon: BarChart3,
    title: "Deep analytics",
    body: "Weekly and monthly trends, subject comparison and consistency scores.",
  },
  {
    icon: Target,
    title: "Semester planner",
    body: "Turn exam dates and targets into a realistic attendance strategy.",
  },
  {
    icon: Bell,
    title: "Actionable alerts",
    body: "Know the moment a subject approaches the minimum requirement.",
  },
];

const floatCards = [
  { label: "Target", value: "75%", position: "left-0 top-10" },
  { label: "Safe to skip", value: "4 classes", position: "right-0 top-24" },
  { label: "Classes required", value: "8 classes", position: "left-4 bottom-10" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">AttendMate</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-gradient relative overflow-hidden">
          <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-24">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" aria-hidden />
                Track smarter. Plan better.
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Never lose track of your <span className="text-gradient">attendance</span> again.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                AttendMate intelligently tracks your attendance, predicts your academic needs, and
                helps you decide when to attend or skip classes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/auth">Get started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">View demo</Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Subject-wise tracking", "Safe-skip maths", "Exam-aware planning"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-success" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <div className="relative">
              <ClientOnly
                fallback={
                  <div className="flex h-[320px] items-center justify-center sm:h-[420px] lg:h-[480px]">
                    <div className="size-56 animate-pulse rounded-full border border-border" />
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="flex h-[320px] items-center justify-center sm:h-[420px] lg:h-[480px]">
                      <div className="size-56 animate-pulse rounded-full border border-border" />
                    </div>
                  }
                >
                  <AttendanceOrb percentage={85} />
                </Suspense>
              </ClientOnly>

              {floatCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                  className={`glass-panel absolute hidden rounded-xl px-4 py-3 lg:block ${card.position}`}
                >
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-0.5 font-display text-sm font-semibold">{card.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Everything your semester needs
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            One workspace for attendance, timetable, planning and analytics — with the maths done
            for you.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="glass-panel rounded-2xl p-6"
              >
                <span className="inline-grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="how" className="border-y border-border bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-3">
            {[
              { step: "01", title: "Add your subjects", body: "Import a demo semester or add subjects, targets and faculty in a minute." },
              { step: "02", title: "Mark attendance", body: "One tap per class. AttendMate recalculates percentages instantly." },
              { step: "03", title: "Plan with confidence", body: "See safe skips, recovery plans and exam-aware strategies." },
            ].map(({ step, title, body }) => (
              <div key={step}>
                <span className="font-mono text-xs text-primary">{step}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="glass-panel flex flex-col items-center gap-5 rounded-3xl px-6 py-14 text-center">
            <ShieldCheck className="size-8 text-primary" aria-hidden />
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Stay above the attendance limit
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Your data stays private to your account. Start with a realistic demo semester and
              replace it with your own subjects whenever you're ready.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth">Create your account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} AttendMate</p>
          <p>Track smarter. Plan better. Stay above the attendance limit.</p>
        </div>
      </footer>
    </div>
  );
}
