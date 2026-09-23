import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Forgot Password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <Link href="/sign-in" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Back to Sign In
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Forgot your password?</h1>
      <p className="mt-2 text-muted">Enter the email you signed up with and we&apos;ll send you a link to reset it.</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </>
  );
}
