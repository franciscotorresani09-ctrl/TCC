import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Lock, MapPin, Users } from "lucide-react";
import { getSessionUser } from "@/server/auth-guard";
import { getEventBySlug, getViewerRsvp } from "@/server/services/events";
import { getFavoriteIds } from "@/server/services/favorites";
import { SafeImage } from "@/components/ui/safe-image";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RsvpButtons } from "@/components/events/rsvp-button";
import { FavoriteButton } from "@/components/vehicles/favorite-button";
import { ShareButton } from "@/components/vehicles/share-button";
import { ReportButton } from "@/components/vehicles/report-dialog";
import { EVENT_TYPES } from "@/lib/constants";
import { absoluteUrl, formatTime } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getSessionUser();
  const e = await getEventBySlug((await params).slug, user?.id);
  if (!e) return { title: "Event not found" };
  const when = e.startsAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const description = `${EVENT_TYPES.labels[e.type]} · ${when} · ${e.venue}, ${e.city}, ${e.state}. ${e.description.slice(0, 120)}`;
  return {
    title: e.title,
    description,
    alternates: { canonical: `/events/${e.slug}` },
    openGraph: { type: "website", title: e.title, description, images: [{ url: e.coverImage, alt: e.title }] },
    twitter: { card: "summary_large_image", title: e.title, description, images: [e.coverImage] },
    robots: e.visibility === "PRIVATE" ? { index: false } : undefined,
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const user = await getSessionUser();
  const e = await getEventBySlug(slug, user?.id);
  if (!e) notFound();
  const [rsvp, favs] = await Promise.all([user ? getViewerRsvp(e.id, user.id) : null, getFavoriteIds(user?.id)]);

  const going = e._count.attendees;
  const full = Boolean(e.maxAttendees && going >= e.maxAttendees);
  const ended = e.endsAt < new Date();
  const cancelled = e.status === "CANCELLED";
  const dateLabel = e.startsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description,
    startDate: e.startsAt.toISOString(),
    endDate: e.endsAt.toISOString(),
    eventStatus: cancelled ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: e.venue, address: { "@type": "PostalAddress", addressLocality: e.city, addressRegion: e.state, addressCountry: e.country } },
    image: [e.coverImage],
    organizer: { "@type": "Person", name: e.organizer.name, url: e.organizer.username ? absoluteUrl(`/u/${e.organizer.username}`) : undefined },
    maximumAttendeeCapacity: e.maxAttendees ?? undefined,
    url: absoluteUrl(`/events/${e.slug}`),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="relative h-[42svh] min-h-72 overflow-hidden sm:h-[52svh]">
        <SafeImage src={e.coverImage} alt={e.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/10" />
        <div className="container-page relative flex h-full flex-col justify-between pb-8 pt-6">
          <Link href="/events" className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-sm backdrop-blur-md hover:bg-black/70">
            <ArrowLeft className="size-4" /> All events
          </Link>
          <div className="max-w-3xl animate-fade-up">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="glass">{EVENT_TYPES.labels[e.type]}</Badge>
              {e.visibility === "PRIVATE" && (
                <Badge tone="glass">
                  <Lock className="size-3" /> Private
                </Badge>
              )}
              {cancelled && <Badge tone="danger">Cancelled</Badge>}
              {ended && !cancelled && <Badge tone="glass">Ended</Badge>}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{e.title}</h1>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 pb-8 pt-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: CalendarDays, label: "Date", value: dateLabel },
              { icon: Clock, label: "Time", value: `${formatTime(e.startsAt)} – ${formatTime(e.endsAt)}` },
              { icon: MapPin, label: "Location", value: `${e.venue}, ${e.city}, ${e.state}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-border bg-surface p-4">
                <p className="flex items-center gap-1.5 text-xs text-subtle">
                  <Icon className="size-3.5 text-accent" /> {label}
                </p>
                <p className="mt-1 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">About this event</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{e.description}</p>
          </section>

          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              Attendees <span className="text-base font-normal text-muted">({going})</span>
            </h2>
            {e.attendees.length ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {e.attendees.map(({ user: a }) => (
                  <Link key={a.id} href={a.username ? `/u/${a.username}` : "#"} className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-sm hover:border-border-strong">
                    <Avatar src={a.image} name={a.name} size="sm" />
                    {a.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Be the first to RSVP.</p>
            )}
          </section>
          <div className="mt-8 border-t border-border pt-5">
            <ReportButton target={{ eventId: e.id }} label="Report event" />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm text-muted">
                <Users className="size-4" /> {going} going{e.maxAttendees ? ` · ${e.maxAttendees} max` : ""}
              </p>
              {e.maxAttendees && (
                <span className="text-xs text-subtle">{Math.max(0, e.maxAttendees - going)} spots left</span>
              )}
            </div>
            {e.maxAttendees && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-accent-gradient" style={{ width: `${Math.min(100, (going / e.maxAttendees) * 100)}%` }} />
              </div>
            )}
            <div className="mt-5">
              <RsvpButtons eventId={e.id} initial={rsvp} full={full} disabled={ended || cancelled} isOrganizer={user?.id === e.organizerId} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <FavoriteButton kind="event" targetId={e.id} initial={favs.events.has(e.id)} variant="outline" label />
              <ShareButton title={e.title} />
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Organizer</p>
            <Link href={e.organizer.username ? `/u/${e.organizer.username}` : "#"} className="group mt-3 flex items-center gap-3">
              <Avatar src={e.organizer.image} name={e.organizer.name} size="lg" />
              <div>
                <p className="font-semibold group-hover:underline">{e.organizer.name}</p>
                <p className="text-sm text-muted">{e.organizer._count.eventsOrganized} events organized</p>
              </div>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
