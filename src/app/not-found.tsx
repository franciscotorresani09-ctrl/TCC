import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="container-page flex min-h-[75dvh] flex-col items-center justify-center py-20 text-center">
        <p className="text-gradient text-[7rem] font-extrabold leading-none tracking-tighter sm:text-[10rem]">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Wrong turn.</h1>
        <p className="mt-2 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist, was removed, or the listing has been sold.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/marketplace">Explore Marketplace</ButtonLink>
          <ButtonLink href="/" variant="outline">
            Back to home
          </ButtonLink>
        </div>
        <p className="mt-10 text-sm text-subtle">
          Looking for events? <Link href="/events" className="text-accent hover:underline">See what&apos;s coming up</Link>
        </p>
      </main>
      <MobileNav />
    </>
  );
}
