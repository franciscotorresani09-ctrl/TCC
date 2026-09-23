import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="sc-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3b2f" />
          <stop offset="1" stopColor="#ff7a18" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sc-g)" />
      {/* Stylised apex curve + speed lines forming an abstract "S" */}
      <path d="M22.5 9.5h-8.2a4.3 4.3 0 0 0 0 8.6h3.4a2.2 2.2 0 0 1 0 4.4H9.5" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M6 13.8h3.2M5 17.2h2.4" stroke="#fff" strokeOpacity=".6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Street-Car home">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      {!compact && (
        <span className="text-[17px] font-bold tracking-tight">
          Street<span className="text-accent">-Car</span>
        </span>
      )}
    </Link>
  );
}
