# Street-Car

**Everything automotive. One place.**

Street-Car is an automotive marketplace and community platform. People can buy, sell, and trade vehicles, message each other in real time, send offers and trade proposals, and find or host car meets, shows, and track days.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-149eca) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Prisma](https://img.shields.io/badge/Prisma-6-2d3748) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## Features

| Area | What's included |
| --- | --- |
| **Marketplace** | Natural-language search (`"Porsche under $100,000"`, `"2020+ Toyota SUV"`, `"Ford Mustang in Miami"`), advanced filters (type, condition, price, year, mileage, make, city/state/country, distance radius, transmission, fuel, body type), five sort orders, grid and list views, and infinite scrolling |
| **Listings** | Gallery with thumbnails, swipe, keyboard control, and a fullscreen lightbox. Full specs, features, seller card with rating, Message Seller / Make an Offer / Propose a Trade, favorite, share, report, and similar vehicles |
| **Sell** | 5-step wizard (vehicle info → photos → description → location → review). Drag-and-drop uploads with reorder, delete, and primary-photo selection, validation at every step, and auto-saved drafts. The same wizard edits existing listings |
| **Trading** | Trade proposals with an optional cash difference. Statuses: Pending, Accepted, Declined, Counter Offer, Completed, Cancelled. Completing a trade marks both vehicles as sold |
| **Offers** | Offers with counter-offers, accept, decline, and withdraw |
| **Messaging** | Real-time chat over Server-Sent Events. Includes online presence, read receipts, optimistic sending, listing previews, offer and trade cards you can act on inside the chat, and conversation search |
| **Events** | Discover events by type or search, RSVP (Going / Interested) with a capacity limit, organizer and attendee lists, reminders, public or private visibility, and a Create Event flow with a cover-image upload |
| **Profiles** | Avatar, bio, location, rating, stats, follow, save seller, and tabs for Listings, Vehicles (garage), Events, and Reviews. Only members who have been in a conversation with someone can review them |
| **Favorites** | Saved vehicles, events, and sellers in separate tabs |
| **Notifications** | Notification center plus live toasts and badge counts for messages, offers, trades, favorites, sold listings, event reminders, followers, and reviews |
| **Dashboard** | Overview stats, listing management (edit, pause, mark as sold, delete, statistics), incoming and outgoing offers, trades, and recent messages |
| **Admin** | Platform stats and a chart of new listings. Moderation tools for users (suspend, change role), listings (feature, remove), events, reports, reviews, and categories |
| **Auth** | Email/password, Google, and Apple via Auth.js v5. Forgot and reset password use hashed, single-use tokens that expire |

The UI is fully in English, dark-first, and responsive. On phones you get a bottom tab bar, bottom-sheet modals, a full-screen chat, and a sticky contact bar on listing pages. The app also includes skeleton loaders, empty states, friendly error states, toasts, and animations that respect reduced-motion settings.

## Architecture

```
prisma/               schema.prisma, seed.ts
src/
  app/                App Router routes
    (main)/           Pages with the navbar/footer shell (marketplace, vehicles, sell, events, messages, dashboard, admin…)
    (auth)/           Sign in / up, forgot and reset password
    api/              auth, uploads, realtime (SSE), vehicles (search)
    sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx
  components/         UI primitives (ui/) and feature components
  hooks/              Client hooks (useAction, useSyncedState)
  lib/                Client-safe code: constants, validation (zod), search parser, geo, utils
  server/
    services/         Business logic and data access (Prisma), import "server-only"
    actions/          Thin, validated, rate-limited server actions
    realtime/         Pub/sub bus used by the SSE endpoint
    security/         Rate limiting
    storage/          Image storage (local disk or Cloudinary)
  auth.ts, auth.config.ts, proxy.ts
```

- **Layering.** Pages call services, and client components call server actions, which call services. Business rules such as offer and trade state transitions, authorization checks, and notifications live only in `src/server/services`.
- **Validation.** One set of zod schemas in `src/lib/validation` validates on the client (for instant feedback) and again on the server (as the source of truth).
- **Search.** `src/lib/search/parse-query.ts` turns free text into structured filters. Filters you set explicitly in the UI always override what the parser infers. The "Showing results for" chips tell the user how their query was understood.
- **Real-time.** `/api/realtime` streams events from an in-process bus. For more than one server instance, back `publish()` with Redis pub/sub; the interface stays the same.

## Security

- Passwords are hashed with bcrypt (cost 12). Sign-in runs a comparison even for unknown emails, so response timing doesn't reveal which emails have accounts.
- Password-reset tokens are stored only as SHA-256 hashes. They are single-use, expire after 1 hour, and the reset-request response is the same whether or not the account exists.
- Protected routes are checked twice: by `proxy.ts` and again by guards in every page and action. Admin routes require the `ADMIN` role.
- Every write checks ownership and valid status transitions on the server.
- Sign-in, sign-up, password reset, messages, uploads, listing creation, reports, and interactions are all rate-limited.
- Uploads are checked by magic bytes (not the client-supplied MIME type), limited to 8 MB, restricted to allowed folders, and rejected if the request comes from another site.
- Image URLs saved to listings must come from allowed hosts.
- Security headers are set (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). JSON-LD is escaped before it is inlined.
- Users only ever see friendly error messages. Unexpected errors are logged on the server, and client props never include sensitive fields.

## Getting started

Requirements: Node 20+ and PostgreSQL 14+.

```bash
cp .env.example .env          # set DATABASE_URL and AUTH_SECRET (openssl rand -base64 32)
npm install
npm run db:push               # create the schema
npm run db:seed               # demo data
npm run dev                   # http://localhost:3000
```

Demo accounts (password `StreetCar2026`):

- `alex@street-car.dev`: private seller with listings, a pending offer, and an incoming trade proposal
- `sales@premierauto.dev`: dealership
- `admin@street-car.dev`: admin panel

In development, password-reset links are printed to the server console. Plug an email provider into `sendPasswordResetEmail` in `src/server/services/account.ts` for production.

### Optional configuration

- **Google / Apple sign-in:** set `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` and `AUTH_APPLE_ID`/`AUTH_APPLE_SECRET`. Until they are set, the buttons show a friendly "not available yet" message.
- **Cloud image storage:** set `STORAGE_DRIVER=cloudinary` plus `CLOUDINARY_*`. The default `local` driver writes files to `public/uploads` and is meant for development only.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript checks |
| `npm test` | Unit tests (search query parser) |
| `npm run db:push` / `db:migrate` / `db:seed` / `db:reset` | Database workflows |
