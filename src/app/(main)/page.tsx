import Link from "next/link";
import { ArrowRight, CalendarPlus, Handshake, MapPin, MessagesSquare, Rocket, ShieldCheck, Sparkles, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroSearch } from "@/components/home/hero-search";
import { HeroImage } from "@/components/home/hero-image";
import { SectionHeader } from "@/components/home/section-header";
import { CategoryIcon } from "@/components/home/category-icon";
import { Rail } from "@/components/home/rail";
import { getCategoriesWithCounts, getFeaturedVehicles, getPopularLocations, getRecentVehicles } from "@/server/services/vehicles";
import { listUpcomingEvents } from "@/server/services/events";
import { getFavoriteIds } from "@/server/services/favorites";
import { getSessionUser } from "@/server/auth-guard";
import { db } from "@/server/db";
import { SITE } from "@/lib/constants";
import { absoluteUrl, formatCompact } from "@/lib/utils";

const WHY = [
  { icon: ShieldCheck, title: "Buy with confidence", text: "Verified sellers, transparent ratings, and detailed listings help you know exactly what you're getting." },
  { icon: Rocket, title: "Sell faster", text: "A guided listing flow, beautiful photo galleries, and smart search put your vehicle in front of real buyers." },
  { icon: MessagesSquare, title: "Connect directly", text: "Real-time messaging with built-in offers and trade proposals. No middlemen, no phone tag." },
  { icon: CalendarPlus, title: "Discover automotive events", text: "From Cars & Coffee to track days, find meetups near you or organize your own." },
  { icon: Users, title: "Built for enthusiasts", text: "Profiles, garages, followers, and reviews — a community for people who genuinely love cars." },
];

export default async function HomePage() {
  const user = await getSessionUser();
  const [featured, recent, categories, locations, events, favs, stats] = await Promise.all([
    getFeaturedVehicles(8),
    getRecentVehicles(8),
    getCategoriesWithCounts(),
    getPopularLocations(8),
    listUpcomingEvents({ take: 3 }),
    getFavoriteIds(user?.id),
    Promise.all([db.vehicle.count({ where: { status: "ACTIVE" } }), db.user.count(), db.event.count({ where: { status: "ACTIVE" } })]),
  ]);
  const [listingCount, memberCount, eventCount] = stats;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/marketplace?q={search_term_string}") },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative -mt-16 flex min-h-[92svh] items-end overflow-hidden pt-16 sm:items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,#3a0d0a_0%,#08080a_60%)]" />
        <HeroImage
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=80"
          alt="A sports car on an open road at dusk"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/40" />
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_left,black,transparent_70%)]" />
        <div className="absolute -left-32 top-1/3 size-[480px] rounded-full bg-accent/20 blur-[140px]" />

        <div className="container-page relative z-10 pb-14 pt-24 sm:pb-24">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur animate-fade-up">
              <Sparkles className="size-3.5 text-accent" />
              The marketplace &amp; community for car people
            </p>
            <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl animate-fade-up [animation-delay:80ms]">
              Everything automotive.
              <br />
              <span className="text-gradient">One place.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted sm:text-lg animate-fade-up [animation-delay:160ms]">{SITE.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-fade-up [animation-delay:240ms]">
              <ButtonLink href="/marketplace" size="lg">
                Explore Marketplace <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/sell" variant="outline" size="lg" className="border-white/15 bg-white/5 backdrop-blur hover:bg-white/10">
                Sell Your Vehicle
              </ButtonLink>
            </div>
            <div className="mt-10 animate-fade-up [animation-delay:320ms]">
              <HeroSearch />
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6 animate-fade-up [animation-delay:400ms]">
              {[
                [formatCompact(listingCount), "Active listings"],
                [formatCompact(memberCount), "Members"],
                [formatCompact(eventCount), "Upcoming events"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-xs text-subtle">{label}</dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────── */}
      <section className="container-page pt-16 sm:pt-20">
        <SectionHeader eyebrow="Hand-picked" title="Featured Vehicles" description="Standout machines from trusted sellers across the country." href="/marketplace" />
        {featured.length ? (
          <Rail>
            {featured.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} favorited={favs.vehicles.has(v.id)} priority={i < 2} className="h-full" />
            ))}
          </Rail>
        ) : (
          <EmptyState icon={Sparkles} title="No featured vehicles yet" description="Check back soon — new standout listings are added every day." />
        )}
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section className="container-page pt-20">
        <SectionHeader eyebrow="Explore" title="Browse by Category" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.slice(0, 8).map((c) => (
            <Link
              key={c.id}
              href={`/marketplace?category=${c.slug}`}
              className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong sm:aspect-[5/4]"
            >
              {c.image && (
                <SafeImage src={c.image} alt="" fill sizes="(min-width: 1024px) 20vw, 50vw" className="object-cover opacity-40 transition-all duration-700 group-hover:scale-110 group-hover:opacity-55" fallbackClassName="opacity-40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
              <div className="relative">
                <span className="mb-3 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 backdrop-blur transition-colors group-hover:border-accent/50 group-hover:bg-accent">
                  <CategoryIcon slug={c.slug} className="size-5" />
                </span>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-muted">{c.count} listings</p>
              </div>
            </Link>
          ))}
          <Link
            href="/marketplace"
            className="group flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong text-muted transition hover:border-accent hover:text-fg sm:aspect-[5/4] xl:flex"
          >
            <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" />
            <span className="text-sm font-medium">All vehicles</span>
          </Link>
        </div>
      </section>

      {/* ── Recently listed ──────────────────────────────── */}
      <section className="container-page pt-20">
        <SectionHeader eyebrow="Fresh" title="Recently Listed" description="The newest vehicles on Street-Car, updated in real time." href="/marketplace?sort=newest" />
        <Rail>
          {recent.map((v) => (
            <VehicleCard key={v.id} vehicle={v} favorited={favs.vehicles.has(v.id)} className="h-full" />
          ))}
        </Rail>
      </section>

      {/* ── Locations ────────────────────────────────────── */}
      <section className="container-page pt-20">
        <SectionHeader eyebrow="Near you" title="Popular Locations" description="Discover listings in the most active automotive markets." />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {locations.map((l, i) => (
            <Link
              key={`${l.city}-${l.state}`}
              href={`/marketplace?city=${encodeURIComponent(l.city)}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-all hover:border-border-strong sm:p-5"
            >
              <div className="absolute -right-6 -top-6 size-24 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-0" />
              <div className="flex items-center justify-between">
                <MapPin className="size-5 text-accent" />
                <span className="text-xs text-subtle">#{i + 1}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{l.city}</h3>
              <p className="text-sm text-muted">
                {l.state} · {l.count} {l.count === 1 ? "listing" : "listings"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Events ───────────────────────────────────────── */}
      <section className="container-page pt-20">
        <SectionHeader eyebrow="Community" title="Automotive Events" description="Meets, shows, and track days happening soon." href="/events" linkLabel="All events" />
        {events.items.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {events.items.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarPlus} title="No upcoming events" description="Check back soon for automotive events near you." action={<ButtonLink href="/events/new">Create Event</ButtonLink>} />
        )}
      </section>

      {/* ── Why ──────────────────────────────────────────── */}
      <section className="container-page pt-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10 lg:p-14">
          <div className="grid-bg absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Why Street-Car?</p>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">The whole automotive journey — buying, selling, trading, and belonging.</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {WHY.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-border bg-bg/60 p-5 backdrop-blur transition hover:border-border-strong">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft">
                    <Icon className="size-5 text-accent" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="container-page pt-20">
        <div className="relative overflow-hidden rounded-3xl bg-accent-gradient p-8 sm:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.25),transparent_45%)]" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to sell or trade?</h2>
              <p className="mt-2 max-w-lg text-white/85">List your vehicle in minutes and reach thousands of enthusiasts. Open to trades? Buyers can send you proposals directly.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/sell" variant="white" size="lg">
                Sell Your Vehicle
              </ButtonLink>
              <ButtonLink href="/marketplace" size="lg" className="border border-white/30 bg-black/20 shadow-none hover:bg-black/30">
                <Handshake className="size-4" /> Find a trade
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
