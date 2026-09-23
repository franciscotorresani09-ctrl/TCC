"use client";

import { useTransition } from "react";
import { oauthSignInAction } from "@/server/actions/auth";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
  </svg>
);
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
    <path d="M16.37 12.62c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.8 1.3 10.35.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.03 2.29-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.05-2.73-4.13zM13.79 5.01c.71-.87 1.2-2.07 1.07-3.27-1.03.04-2.28.69-3.02 1.55-.66.77-1.24 2-1.09 3.18 1.15.09 2.33-.58 3.04-1.46z" />
  </svg>
);

export function OAuthButtons({ google, apple, callbackUrl }: { google: boolean; apple: boolean; callbackUrl?: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const go = (provider: "google" | "apple", enabled: boolean) => {
    if (!enabled) {
      toast({ title: `${provider === "google" ? "Google" : "Apple"} sign-in isn't available yet.`, description: "Please use your email and password for now.", tone: "info" });
      return;
    }
    start(() => oauthSignInAction(provider, callbackUrl));
  };
  const cls =
    "flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border-strong bg-surface text-sm font-medium transition hover:bg-surface-2 active:scale-[0.98] disabled:opacity-60";
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button type="button" className={cls} onClick={() => go("google", google)} disabled={pending}>
        {pending ? <Spinner className="size-4" /> : <GoogleIcon />} Continue with Google
      </button>
      <button type="button" className={cls} onClick={() => go("apple", apple)} disabled={pending}>
        <AppleIcon /> Continue with Apple
      </button>
    </div>
  );
}

export function Divider({ label = "or continue with email" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-subtle">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
