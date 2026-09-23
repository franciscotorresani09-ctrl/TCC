import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Your privacy matters. This policy explains what we collect and how we use it.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account information such as your name, username, email, and profile details.</li>
        <li>Content you create: listings, photos, messages, reviews, and events.</li>
        <li>Usage information that helps us keep Street-Car fast and secure.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To operate the marketplace, deliver messages and notifications, prevent fraud, and improve the product. We never sell your personal information.</p>
      <h2>Your choices</h2>
      <p>You can edit your profile at any time from Settings, and you can contact us to delete your account and data.</p>
    </>
  );
}
