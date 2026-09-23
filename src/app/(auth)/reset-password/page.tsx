import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Reset Password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <ErrorState
        title="This reset link is invalid."
        description="Request a new link to reset your password."
        action={<ButtonLink href="/forgot-password">Request a new link</ButtonLink>}
      />
    );
  }
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-muted">Make it strong — at least 8 characters with a letter and a number.</p>
      <div className="mt-8">
        <ResetPasswordForm token={token} />
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
