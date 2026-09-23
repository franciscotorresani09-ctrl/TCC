import type { Metadata } from "next";

export const metadata: Metadata = { title: "Safety Tips", description: "How to buy, sell, and trade vehicles safely on Street-Car." };

export default function SafetyPage() {
  return (
    <>
      <h1>Safety tips</h1>
      <p>Most members are enthusiasts just like you. These habits keep every deal smooth and safe.</p>
      <h2>Meeting and test drives</h2>
      <ul>
        <li>Meet in a busy public place during daylight — many police stations offer safe exchange zones.</li>
        <li>Bring a friend, and verify the other person&apos;s driver&apos;s license and insurance before a test drive.</li>
      </ul>
      <h2>Inspect before you pay</h2>
      <ul>
        <li>Check the VIN against the title and a vehicle history report.</li>
        <li>Get a pre-purchase inspection from an independent mechanic for higher-value vehicles.</li>
      </ul>
      <h2>Payments</h2>
      <ul>
        <li>Never wire money, send gift cards, or pay a deposit to someone you haven&apos;t met.</li>
        <li>Complete payment at a bank when possible and transfer the title in person.</li>
        <li>Keep conversations on Street-Car so there&apos;s a record, and report anything suspicious.</li>
      </ul>
    </>
  );
}
