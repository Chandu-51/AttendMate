import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications, qk } from "@/hooks/use-attendmate";
import { useAuth } from "@/hooks/use-auth";
import { notificationService } from "@/services/attendmate.service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — AttendMate" },
      {
        name: "description",
        content: "Attendance alerts, milestone updates and weekly summaries in one inbox.",
      },
      { property: "og:title", content: "Notifications — AttendMate" },
      {
        property: "og:description",
        content: "Attendance alerts, milestone updates and weekly summaries in one inbox.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

const categoryClass = {
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-warning/30 bg-warning/10 text-warning",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-primary/30 bg-primary/10 text-primary",
} as const;

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useNotifications();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.notifications });

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(user!.id),
    onSuccess: () => {
      invalidate();
      toast.success("All marked as read");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      notificationService.markRead(id, read),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationService.remove(id),
    onSuccess: invalidate,
  });

  if (query.isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  const notifications = query.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Alerts generated from your attendance thresholds."
        action={
          notifications.some((n) => !n.read) ? (
            <Button variant="outline" onClick={() => markAll.mutate()}>
              <CheckCheck className="mr-1.5 size-4" aria-hidden /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Alerts appear here when a subject drops near your minimum."
        />
      ) : (
        <div className="glass-panel divide-y divide-border rounded-2xl">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3 px-5 py-4",
                !n.read && "bg-secondary/40",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full text-[10px] capitalize", categoryClass[n.category])}
                  >
                    {n.category}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggle.mutate({ id: n.id, read: !n.read })}
                >
                  {n.read ? "Unread" : "Read"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete notification"
                  onClick={() => remove.mutate(n.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
