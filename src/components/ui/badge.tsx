import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "glass";

const tones: Record<Tone, string> = {
  neutral: "bg-elevated text-muted border-border",
  accent: "bg-accent-soft text-accent border-accent/25",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  info: "bg-info/10 text-info border-info/25",
  glass: "bg-black/55 text-white border-white/10 backdrop-blur-md",
};

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}

const STATUS_TONES: Record<string, Tone> = {
  ACTIVE: "success",
  PENDING: "warning",
  COUNTERED: "info",
  COUNTER_OFFER: "info",
  ACCEPTED: "success",
  COMPLETED: "success",
  SOLD: "accent",
  PAUSED: "neutral",
  DECLINED: "danger",
  CANCELLED: "danger",
  WITHDRAWN: "neutral",
  REMOVED: "danger",
  OPEN: "warning",
  RESOLVED: "success",
  DISMISSED: "neutral",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"}>
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")}
    </Badge>
  );
}
