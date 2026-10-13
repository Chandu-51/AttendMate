import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendMateData, useUpdateProfile } from "@/hooks/use-attendmate";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — AttendMate" },
      {
        name: "description",
        content: "Update your college details, attendance thresholds and appearance preferences.",
      },
      { property: "og:title", content: "Profile & Settings — AttendMate" },
      {
        property: "og:description",
        content: "Update your college details, attendance thresholds and appearance preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, isLoading } = useAttendMateData();
  const update = useUpdateProfile();
  const { resolved, toggle } = useTheme();
  const [form, setForm] = useState({
    full_name: "",
    college: "",
    semester: "",
    section: "",
    min_attendance: "75",
    target_attendance: "85",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        college: profile.college ?? "",
        semester: profile.semester ?? "",
        section: profile.section ?? "",
        min_attendance: String(profile.min_attendance ?? 75),
        target_attendance: String(profile.target_attendance ?? 85),
      });
    }
  }, [profile]);

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  function save() {
    update.mutate(
      {
        full_name: form.full_name,
        college: form.college,
        semester: form.semester,
        section: form.section,
        min_attendance: Number(form.min_attendance) || 75,
        target_attendance: Number(form.target_attendance) || 85,
      },
      {
        onSuccess: () => toast.success("Settings saved"),
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile & settings" description="Your details drive every calculation." />

      <section className="glass-panel grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="p-name">Full name</Label>
          <Input
            id="p-name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-college">College</Label>
          <Input
            id="p-college"
            value={form.college}
            onChange={(e) => setForm({ ...form, college: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-semester">Semester</Label>
          <Input
            id="p-semester"
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-section">Section</Label>
          <Input
            id="p-section"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" value={profile?.email ?? ""} disabled />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-min">Minimum required %</Label>
          <Input
            id="p-min"
            type="number"
            min={0}
            max={100}
            value={form.min_attendance}
            onChange={(e) => setForm({ ...form, min_attendance: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-target">Personal target %</Label>
          <Input
            id="p-target"
            type="number"
            min={0}
            max={100}
            value={form.target_attendance}
            onChange={(e) => setForm({ ...form, target_attendance: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Button onClick={save} disabled={update.isPending}>
            Save changes
          </Button>
        </div>
      </section>

      <section className="glass-panel flex items-center justify-between rounded-2xl p-6">
        <div>
          <p className="font-display text-sm font-semibold">Dark mode</p>
          <p className="text-sm text-muted-foreground">Switch between the light and dark theme.</p>
        </div>
        <Switch checked={resolved === "dark"} onCheckedChange={toggle} aria-label="Toggle dark mode" />
      </section>
    </div>
  );
}
