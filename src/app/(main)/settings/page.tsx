import type { Metadata } from "next";
import { requireUserPage } from "@/server/auth-guard";
import { getSettingsUser } from "@/server/services/users";
import { Card, CardHeader } from "@/components/ui/card";
import { PasswordForm, ProfileForm } from "@/components/profile/settings-forms";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const session = await requireUserPage("/settings");
  const user = await getSettingsUser(session.id);
  return (
    <div className="container-page max-w-3xl space-y-6 py-6 sm:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
          <p className="mt-1 text-muted">Manage your profile and account security.</p>
        </div>
        {user.username && (
          <ButtonLink href={`/u/${user.username}`} variant="outline" size="sm">
            View profile
          </ButtonLink>
        )}
      </div>
      <Card>
        <CardHeader title="Public profile" description="This is how other members see you on Street-Car." />
        <div className="p-5">
          <ProfileForm user={{ name: user.name, bio: user.bio, city: user.city, state: user.state, country: user.country, image: user.image }} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Account" />
        <dl className="divide-y divide-border px-5 text-sm">
          <div className="flex justify-between py-3">
            <dt className="text-muted">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-muted">Username</dt>
            <dd>@{user.username}</dd>
          </div>
        </dl>
      </Card>
      <Card>
        <CardHeader title="Password" description="Use a strong password you don't use anywhere else." />
        <div className="p-5">
          <PasswordForm hasPassword={user.hasPassword} />
        </div>
      </Card>
    </div>
  );
}
