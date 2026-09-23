import type { Metadata } from "next";
import { requireUserPage } from "@/server/auth-guard";
import { EventForm } from "@/components/events/event-form";

export const metadata: Metadata = { title: "Create Event", robots: { index: false } };

export default async function NewEventPage() {
  await requireUserPage("/events/new");
  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create an event</h1>
        <p className="mt-2 text-muted">Host a meet, a show, a drive, or a track day. We&apos;ll handle RSVPs and reminders.</p>
      </div>
      <EventForm />
    </div>
  );
}
