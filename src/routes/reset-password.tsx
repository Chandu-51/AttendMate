import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — AttendMate" },
      { name: "description", content: "Choose a new password for your AttendMate account." },
      { property: "og:title", content: "Set a new password — AttendMate" },
      { property: "og:description", content: "Choose a new password for your AttendMate account." },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z.string().min(8, "Password must be at least 8 characters").max(72);

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = schema.safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data });
      setLoading(false);
      if (updateError) return setError(updateError.message);
      toast.success("Password updated");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to connect to server.");
    }
  }

  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="glass-panel w-full max-w-md rounded-3xl p-7" noValidate>
        <h1 className="font-display text-xl font-semibold">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use at least 8 characters you don't reuse elsewhere.
        </p>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Update password
          </Button>
        </div>
      </form>
    </div>
  );
}
