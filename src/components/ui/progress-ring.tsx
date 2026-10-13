import { cn } from "@/lib/utils";

interface Props {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "primary" | "success" | "warning" | "danger";
  className?: string;
  label?: string;
}

const toneVar: Record<NonNullable<Props["tone"]>, string> = {
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
};

export function ProgressRing({
  value,
  size = 92,
  stroke = 8,
  tone = "primary",
  className,
  label,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} role="img" aria-label={label ?? `${value}% attendance`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={toneVar[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute font-display text-sm font-semibold">{Math.round(value)}%</span>
    </div>
  );
}
