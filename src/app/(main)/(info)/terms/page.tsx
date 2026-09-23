import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>By using Street-Car you agree to these terms. Please read them carefully.</p>
      <h2>Your account</h2>
      <p>You are responsible for your account and for keeping your password secure. You must provide accurate information and be at least 18 years old.</p>
      <h2>Listings and transactions</h2>
      <p>Sellers must accurately describe vehicles and have the legal right to sell or trade them. Street-Car is a platform that connects members; transactions are between buyers and sellers.</p>
      <h2>Community rules</h2>
      <p>No fraud, harassment, discrimination, spam, or prohibited items. We may remove content or suspend accounts that violate these rules.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use of Street-Car means you accept the updated terms.</p>
    </>
  );
}
