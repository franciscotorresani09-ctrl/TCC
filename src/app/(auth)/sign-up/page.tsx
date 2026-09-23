import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/auth-forms";
import { Divider, OAuthButtons } from "@/components/auth/oauth-buttons";
import { oauthProviders } from "@/auth";

export const metadata: Metadata = { title: "Sign Up", description: "Join Street-Car to buy, sell, and trade vehicles and discover automotive events." };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Join Street-Car</h1>
      <p className="mt-2 text-muted">Create your free account and join the automotive community.</p>
      <div className="mt-8">
        <OAuthButtons google={oauthProviders.google} apple={oauthProviders.apple} />
        <Divider />
        <SignUpForm />
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
