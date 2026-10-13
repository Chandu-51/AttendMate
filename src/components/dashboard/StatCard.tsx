import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  caption?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
  index?: number;
}

const toneClass = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
} as const;

export function StatCard({
  label,
  value,
  decimals = 0,
  suffix = "",
  caption,
  icon: Icon,
  tone = "primary",
  index = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel group relative overflow-hidden rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span
          className={cn(
            "rounded-lg bg-secondary p-2 transition-transform group-hover:scale-105",
            toneClass[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold tracking-tight">
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </p>
      {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
    </motion.div>
  );
}
