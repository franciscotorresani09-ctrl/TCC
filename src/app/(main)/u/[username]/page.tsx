import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, CalendarX, Car, MapPin, MessageSquareQuote, Settings, Warehouse } from "lucide-react";
import { getSessionUser } from "@/server/auth-guard";
import { getProfile, getProfileTabs, isFollowing } from "@/server/services/users";
import { getFavoriteIds } from "@/server/services/favorites";
import { db } from "@/server/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating";
import { LinkTabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { VehicleGrid } from "@/components/vehicles/vehicle-card";
import { EventCard } from "@/components/events/event-card";
import { FavoriteButton } from "@/components/vehicles/favorite-button";
import { ReportButton } from "@/components/vehicles/report-dialog";
import { AddGarageVehicleButton, FollowButton, MessageUserButton, WriteReviewButton } from "@/components/profile/profile-actions";
import { absoluteUrl, formatDate, timeAgo } from "@/lib/utils";

type Props = { params: Promise<{ username: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProfile((await params).username);
  if (!p) return { title: "Profile not found" };
  const title = `${p.name} (@${p.username})`;
  const description = p.bio ?? `${p.name} on Street-Car — ${p._count.vehicles} vehicles for sale.`;
  return { title, description, alternates: { canonical: `/u/${p.username}` }, openGraph: { type: "profile", title, description, images: p.image ? [p.image] : undefined } };
}

const TABS = ["listings", "vehicles", "events", "reviews"] as const;

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = TABS.includes(rawTab as (typeof TABS)[number]) ? (rawTab as (typeof TABS)[number]) : "listings";
  const profile = await getProfile(username);
  if (!profile) notFound();

  const viewer = await getSessionUser();
  const isMe = viewer?.id === profile.id;
  const [tabs, following, favs, canReview] = await Promise.all([
    getProfileTabs(profile.id),
    viewer && !isMe ? isFollowing(viewer.id, profile.id) : false,
    getFavoriteIds(viewer?.id),
    viewer && !isMe
      ? db.conversation.findFirst({ where: { AND: [{ participants: { some: { userId: viewer.id } } }, { participants: { some: { userId: profile.id } } }] }, select: { id: true } })
      : null,
  ]);
  const eventsCreated = tabs.events.filter((e) => e.organizerId === profile.id).length;
  const dealer = profile.sellerType === "DEALER";
  const base = `/u/${profile.username}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": dealer ? "AutoDealer" : "Person",
    name: profile.name,
    url: absoluteUrl(base),
    image: profile.image ?? undefined,
    ...(profile.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: profile.rating.toFixed(1), reviewCount: profile._count.reviewsReceived } } : {}),
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="relative h-32 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,59,47,0.45),transparent_60%),radial-gradient(ellipse_at_90%_100%,rgba(255,122,24,0.3),transparent_55%)] sm:h-44">
          <div className="grid-bg absolute inset-0 opacity-60" />
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar src={profile.image} name={profile.name} size="xl" className="rounded-full ring-4 ring-surface" />
              <div className="pb-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {profile.name}
                  {dealer && <BadgeCheck className="size-6 text-info" aria-label="Verified dealership" />}
                </h1>
                <p className="text-muted">@{profile.username}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isMe ? (
                <ButtonLink href="/settings" variant="outline">
                  <Settings className="size-4" /> Edit profile
                </ButtonLink>
              ) : (
                <>
                  <FollowButton userId={profile.id} initial={following} followers={profile._count.followers} />
                  <MessageUserButton userId={profile.id} name={profile.name ?? "this member"} />
                  <FavoriteButton kind="seller" targetId={profile.id} initial={favs.sellers.has(profile.id)} variant="outline" />
                </>
              )}
            </div>
          </div>

          {profile.bio && <p className="mt-5 max-w-2xl leading-relaxed text-muted">{profile.bio}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            {dealer && <Badge tone="info">Dealership</Badge>}
            {(profile.city || profile.state) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" /> {[profile.city, profile.state].filter(Boolean).join(", ")}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" /> Joined {formatDate(profile.createdAt, { day: undefined })}
            </span>
            {profile.rating !== null && (
              <span className="inline-flex items-center gap-1.5">
                <RatingStars value={profile.rating} /> <span className="font-medium text-fg">{profile.rating.toFixed(1)}</span> ({profile._count.reviewsReceived})
              </span>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              ["Listings", profile._count.vehicles],
              ["Sold", profile.soldCount],
              ["Vehicles owned", profile._count.garage],
              ["Events attended", profile._count.eventAttendance],
              ["Events created", eventsCreated],
              ["Followers", profile._count.followers],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-surface-2 p-3 text-center">
                <dd className="text-xl font-bold">{value}</dd>
                <dt className="text-[11px] text-subtle">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <LinkTabs
        className="mt-8"
        active={tab}
        tabs={[
          { value: "listings", label: "Listings", href: base, count: tabs.listings.length },
          { value: "vehicles", label: "Vehicles", href: `${base}?tab=vehicles`, count: tabs.garage.length },
          { value: "events", label: "Events", href: `${base}?tab=events`, count: tabs.events.length },
          { value: "reviews", label: "Reviews", href: `${base}?tab=reviews`, count: tabs.reviews.length },
        ]}
      />

      <div className="mt-6">
        {tab === "listings" &&
          (tabs.listings.length ? (
            <VehicleGrid vehicles={tabs.listings} favoriteIds={favs.vehicles} />
          ) : (
            <EmptyState icon={Car} title="No active listings" description={isMe ? "List your first vehicle and reach thousands of enthusiasts." : `${profile.name} doesn't have any vehicles for sale right now.`} action={isMe ? <ButtonLink href="/sell">Sell Your Vehicle</ButtonLink> : undefined} />
          ))}

        {tab === "vehicles" && (
          <>
            {isMe && (
              <div className="mb-4 flex justify-end">
                <AddGarageVehicleButton />
              </div>
            )}
            {tabs.garage.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tabs.garage.map((g) => (
                  <div key={g.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                    <div className="relative aspect-[16/10] bg-surface-2">
                      <SafeImage src={g.image ?? ""} alt={`${g.year} ${g.make} ${g.model}`} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold">
                        {g.year} {g.make} {g.model}
                      </p>
                      {g.notes && <p className="mt-1 text-sm text-muted">{g.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Warehouse} title="The garage is empty" description={isMe ? "Add the vehicles you own to show them off on your profile." : "No vehicles in this garage yet."} />
            )}
          </>
        )}

        {tab === "events" &&
          (tabs.events.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tabs.events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarX} title="No events yet" description="Events this member organizes or attends will appear here." />
          ))}

        {tab === "reviews" && (
          <div className="max-w-3xl">
            {canReview && (
              <div className="mb-4 flex justify-end">
                <WriteReviewButton targetUserId={profile.id} name={profile.name ?? "this member"} />
              </div>
            )}
            {tabs.reviews.length ? (
              <ul className="space-y-3">
                {tabs.reviews.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-border bg-surface p-5">
                    <div className="flex items-center gap-3">
                      <Avatar src={r.author.image} name={r.author.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{r.author.name}</p>
                        <p className="text-xs text-subtle">{timeAgo(r.createdAt)}</p>
                      </div>
                      <RatingStars value={r.rating} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{r.comment}</p>
                    <ReportButton target={{ reviewId: r.id }} label="Report" className="mt-3" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={MessageSquareQuote} title="No reviews yet" description="Reviews from buyers, sellers, and traders will appear here." />
            )}
          </div>
        )}
      </div>

      {!isMe && (
        <div className="mt-10 border-t border-border pt-5">
          <ReportButton target={{ targetUserId: profile.id }} label="Report this user" />
        </div>
      )}
    </div>
  );
}
