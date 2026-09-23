import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { HeroImage } from "@/components/home/hero-image";
import { getSessionUser } from "@/server/auth-guard";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,#4a110c_0%,#08080a_65%)]" />
        <HeroImage src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1800&q=80" alt="Sports car in a dark studio" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-bg/30" />
        <div className="grid-bg absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent)]" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo />
          <blockquote className="max-w-md">
            <p className="text-3xl font-semibold leading-tight tracking-tight">
              “Sold my GT4 in three days and found my next project through a trade proposal. This is how car people should do business.”
            </p>
            <footer className="mt-4 text-sm text-muted">— Street-Car member, Miami</footer>
          </blockquote>
        </div>
      </div>
      <main id="main" className="flex flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
