import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useUpdateProfile } from "@/hooks/use-attendmate";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Get Started — AttendMate" },
      {
        name: "description",
        content: "Set up your college, semester and attendance thresholds in three quick steps.",
      },
      { property: "og:title", content: "Get Started — AttendMate" },
      {
        property: "og:description",
        content: "Set up your college, semester and attendance thresholds in three quick steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

const steps = ["About you", "Your college", "Attendance rules"];

function OnboardingPage() {
  const navigate = useNavigate();
  const update = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    full_name: "",
    college: "",
    semester: "",
    section: "",
    min_attendance: "75",
    target_attendance: "85",
  });

  function finish() {
    update.mutate(
      {
        full_name: form.full_name,
        college: form.college,
        semester: form.semester,
        section: form.section,
        min_attendance: Number(form.min_attendance) || 75,
        target_attendance: Number(form.target_attendance) || 85,
        onboarded: true,
      },
      {
        onSuccess: () => {
          toast.success("You're all set");
          navigate({ to: "/dashboard", replace: true });
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome to AttendMate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {step + 1} of {steps.length} · {steps[step]}
        </p>
        <Progress value={((step + 1) / steps.length) * 100} className="mt-4" />
      </div>

      <section className="glass-panel grid gap-4 rounded-2xl p-6">
        {step === 0 && (
          <div className="grid gap-2">
            <Label htmlFor="o-name">What should we call you?</Label>
            <Input
              id="o-name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Dheeraj Vemuri"
            />
          </div>
        )}

        {step === 1 && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="o-college">College</Label>
              <Input
                id="o-college"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                placeholder="VIT Vellore"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="o-sem">Semester</Label>
                <Input
                  id="o-sem"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  placeholder="5"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="o-sec">Section</Label>
                <Input
                  id="o-sec"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  placeholder="A"
                />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="o-min">Minimum required %</Label>
              <Input
                id="o-min"
                type="number"
                min={0}
                max={100}
                value={form.min_attendance}
                onChange={(e) => setForm({ ...form, min_attendance: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="o-target">Personal target %</Label>
              <Input
                id="o-target"
                type="number"
                min={0}
                max={100}
                value={form.target_attendance}
                onChange={(e) => setForm({ ...form, target_attendance: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? navigate({ to: "/dashboard" }) : setStep(step - 1))}
          >
            {step === 0 ? "Skip" : "Back"}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Continue <ArrowRight className="ml-1.5 size-4" aria-hidden />
            </Button>
          ) : (
            <Button onClick={finish} disabled={update.isPending}>
              <Check className="mr-1.5 size-4" aria-hidden /> Finish setup
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
