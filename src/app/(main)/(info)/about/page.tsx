import type { Metadata } from "next";

export const metadata: Metadata = { title: "About", description: "Street-Car brings buying, selling, trading, and automotive community together in one place." };

export default function AboutPage() {
  return (
    <>
      <h1>About Street-Car</h1>
      <p>
        Buying, selling, and trading vehicles has been scattered across classified sites, social media groups, and endless text threads. Street-Car brings it all together — a modern marketplace and a real community for people who love cars.
      </p>
      <h2>What you can do</h2>
      <ul>
        <li>Browse cars, motorcycles, trucks, SUVs, classics, EVs, and parts with powerful, natural-language search.</li>
        <li>List your vehicle in minutes with a guided flow and a beautiful gallery.</li>
        <li>Message sellers in real time, make offers, and propose trades — all in one conversation.</li>
        <li>Discover car meets, shows, track days, and Cars &amp; Coffee near you, or host your own.</li>
        <li>Build your profile, show off your garage, and earn reviews from the community.</li>
      </ul>
    </>
  );
}
