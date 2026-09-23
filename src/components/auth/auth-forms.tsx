"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AtSign, CheckCircle2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PasswordInput, PasswordStrength } from "./password-input";
import { forgotPasswordAction, resetPasswordAction, signInAction, signUpAction } from "@/server/actions/auth";

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
      {message}
    </div>
  );
}

export function SignInForm({ callbackUrl, initialError }: { callbackUrl?: string; initialError?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(initialError);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(undefined);
        start(async () => {
          const res = await signInAction({ email: String(fd.get("email")), password: String(fd.get("password")), callbackUrl });
          if (!res.ok) return setError(res.error);
          router.replace(res.data.redirectTo);
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <Field label="Email">{(p) => <Input {...p} name="email" type="email" autoComplete="email" required icon={<Mail />} placeholder="you@example.com" />}</Field>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-fg/90">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="Your password" />
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Sign In
      </Button>
    </form>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(undefined);
        setFields({});
        start(async () => {
          const res = await signUpAction({
            name: String(fd.get("name")),
            username: String(fd.get("username")),
            email: String(fd.get("email")),
            password: String(fd.get("password")),
          });
          if (!res.ok) {
            setFields(res.fieldErrors ?? {});
            if (!res.fieldErrors) setError(res.error);
            return;
          }
          router.replace(res.data.redirectTo);
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={fields.name}>
          {(p) => <Input {...p} name="name" autoComplete="name" required icon={<User />} placeholder="Alex Rivera" />}
        </Field>
        <Field label="Username" error={fields.username}>
          {(p) => <Input {...p} name="username" autoComplete="username" required icon={<AtSign />} placeholder="alexr" pattern="[A-Za-z0-9_]{3,24}" title="3–24 letters, numbers, or underscores" />}
        </Field>
      </div>
      <Field label="Email" error={fields.email}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" required icon={<Mail />} placeholder="you@example.com" />}
      </Field>
      <Field label="Password" error={fields.password} hint="At least 8 characters, including a letter and a number.">
        {(p) => <PasswordInput {...p} name="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />}
      </Field>
      <PasswordStrength value={password} />
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Create account
      </Button>
      <p className="text-center text-xs text-subtle">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline hover:text-fg">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-fg">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState<string>();
  const [error, setError] = useState<string>();

  if (sent) {
    return (
      <div className="rounded-2xl border border-success/25 bg-success/10 p-5 text-center animate-scale-in">
        <CheckCircle2 className="mx-auto size-8 text-success" />
        <p className="mt-3 font-medium">Check your inbox</p>
        <p className="mt-1 text-sm text-muted">{sent}</p>
      </div>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email"));
        setError(undefined);
        start(async () => {
          const res = await forgotPasswordAction({ email });
          if (res.ok) setSent(res.message);
          else setError(res.error);
        });
      }}
    >
      <FormError message={error} />
      <Field label="Email">{(p) => <Input {...p} name="email" type="email" required autoComplete="email" icon={<Mail />} placeholder="you@example.com" />}</Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-2xl border border-success/25 bg-success/10 p-5 text-center animate-scale-in">
        <CheckCircle2 className="mx-auto size-8 text-success" />
        <p className="mt-3 font-medium">Password updated</p>
        <p className="mt-1 text-sm text-muted">You can now sign in with your new password.</p>
        <Button className="mt-4" onClick={() => router.push("/sign-in")}>
          Go to Sign In
        </Button>
      </div>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(undefined);
        start(async () => {
          const res = await resetPasswordAction({ token, password: String(fd.get("password")), confirmPassword: String(fd.get("confirmPassword")) });
          if (res.ok) setDone(true);
          else {
            setFields(res.fieldErrors ?? {});
            if (!res.fieldErrors) setError(res.error);
          }
        });
      }}
    >
      <FormError message={error} />
      <Field label="New password" error={fields.password}>
        {(p) => <PasswordInput {...p} name="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
      </Field>
      <PasswordStrength value={password} />
      <Field label="Confirm new password" error={fields.confirmPassword}>
        {(p) => <PasswordInput {...p} name="confirmPassword" autoComplete="new-password" required />}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Reset password
      </Button>
    </form>
  );
}
