import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { GraduationCap, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AttendMate" },
      {
        name: "description",
        content: "Sign in or create your AttendMate account to track attendance and plan your semester.",
      },
      { property: "og:title", content: "Sign in — AttendMate" },
      {
        property: "og:description",
        content: "Access your AttendMate attendance dashboard, planner and AI insights.",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(100);

function AuthPage() {
  const navigate = useNavigate();
  const { session, signIn, signUp, demoLogin } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [forgot, setForgot] = useState(false);
  const [loading, setLoading] = useState<"email" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const email = emailSchema.safeParse(form.email);
    if (!email.success) return setError(email.error.issues[0]!.message);

    if (forgot) {
      setLoading("email");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(null);
      if (resetError) return setError(resetError.message);
      toast.success("Reset link sent", { description: "Check your inbox for the reset email." });
      setForgot(false);
      return;
    }

    const password = passwordSchema.safeParse(form.password);
    if (!password.success) return setError(password.error.issues[0]!.message);

    setLoading("email");
    if (mode === "signup") {
      const name = nameSchema.safeParse(form.name);
      if (!name.success) {
        setLoading(null);
        return setError(name.error.issues[0]!.message);
      }
      const res = await signUp(name.data, email.data, password.data);
      setLoading(null);
      if (res.error) {
        return setError(res.error);
      }
      toast.success("Account created", { description: "Setting up your semester…" });
      navigate({ to: "/onboarding" });
      return;
    }

    const res = await signIn(email.data, password.data);
    setLoading(null);
    if (res.error) {
      return setError(res.error);
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  async function handleDemo() {
    setError(null);
    setLoading("demo");
    const res = await demoLogin();
    setLoading(null);
    if (res.error) {
      return setError(res.error);
    }
    toast.success("Demo session started", { description: "Loaded pre-seeded semester data." });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="hero-gradient relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">AttendMate</span>
        </Link>

        <div className="glass-panel rounded-3xl p-7">
          {forgot ? (
            <>
              <h1 className="font-display text-xl font-semibold">Reset your password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email address to update your account password.
              </p>
            </>
          ) : (
            <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="pt-4">
                <h1 className="font-display text-xl font-semibold">Welcome back</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Continue tracking your semester attendance.
                </p>
              </TabsContent>
              <TabsContent value="signup" className="pt-4">
                <h1 className="font-display text-xl font-semibold">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start with a ready-made demo semester you can edit.
                </p>
              </TabsContent>
            </Tabs>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {mode === "signup" && !forgot && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@college.edu"
              />
            </div>
            {!forgot && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setForgot(true)}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading !== null}>
              {loading === "email" && <Loader2 className="mr-2 size-4 animate-spin" />}
              {forgot ? "Proceed to reset" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>

            {forgot && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => setForgot(false)}>
                Back to sign in
              </Button>
            )}
          </form>

          {!forgot && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                variant="outline"
                className="w-full border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
                onClick={handleDemo}
                disabled={loading !== null}
              >
                {loading === "demo" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                Continue as Demo Student (1-Click)
              </Button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to keep your academic data accurate and up to date.
        </p>
      </div>
    </div>
  );
}
