import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-3xl border border-dashed border-border-strong bg-surface/50 px-6 py-16 text-center animate-fade-up", className)}>
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border-strong bg-elevated">
          <Icon className="size-7 text-accent" strokeWidth={1.75} />
        </div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
