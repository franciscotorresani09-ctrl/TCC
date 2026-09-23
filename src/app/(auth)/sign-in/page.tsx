import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/auth-forms";
import { Divider, OAuthButtons } from "@/components/auth/oauth-buttons";
import { oauthProviders } from "@/auth";

export const metadata: Metadata = { title: "Sign In", robots: { index: false } };

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "This email is already registered. Sign in with your password instead.",
  AccessDenied: "Access denied. Your account may be suspended.",
  Configuration: "Sign-in is temporarily unavailable. Please try again.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl, error } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted">Sign in to message sellers, save favorites, and manage your listings.</p>
      <div className="mt-8">
        <OAuthButtons google={oauthProviders.google} apple={oauthProviders.apple} callbackUrl={callbackUrl} />
        <Divider />
        <SignInForm callbackUrl={callbackUrl} initialError={error ? (ERRORS[error] ?? "Unable to sign in. Please try again.") : undefined} />
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        New to Street-Car?{" "}
        <Link href="/sign-up" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
