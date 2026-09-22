# DocMate+

A privacy-first document, card, and subscription manager. Track expiry dates for ID documents, bank cards, and recurring subscriptions — get notified before they lapse — with data stored locally in your browser by default.

Built during a hackathon exploring local-first web app architecture.

## Features

- **Document tracking** — store documents with categories, tags, and expiry dates
- **Card management** — track debit/credit cards, expiry dates, and support contacts
- **Subscription tracking** — monitor renewal dates, billing cycles, and costs across subscriptions
- **Expiry notifications** — configurable per-item alerts before something expires
- **Local-first storage** — all data lives in the browser via IndexedDB, so nothing leaves the device by default
- **Optional cloud sync** — a Supabase-backed sync layer is wired in for cross-device access when configured
- **Theming** — light/dark/system theme support
- **Simple auth** — lightweight email/password auth layer for gating the local workspace

## Tech stack

- **Frontend:** React + TypeScript + Vite
- **UI:** shadcn/ui (Radix primitives) + Tailwind CSS
- **Local storage:** IndexedDB via the `idb` library
- **Optional backend:** Supabase (auth + sync), with client-side encryption support
- **Routing:** React Router

## Project structure

```
src/
  App.tsx                    # Route definitions & auth gate
  pages/
    dashboard.tsx              # Overview of upcoming expirations
    documents.tsx               # Document CRUD
    cards.tsx                    # Card CRUD
    subscriptions.tsx             # Subscription CRUD
    settings.tsx                   # App settings
  components/
    auth/                          # Auth provider & form
    ui/                              # shadcn/ui component library
    notification-manager.tsx          # Schedules/clears expiry notifications
    sidebar.tsx                        # App navigation
  utils/
    localdb.ts                        # IndexedDB schema & CRUD (documents/cards/subscriptions)
    database.ts                        # Supabase-backed sync layer
    auth.ts                             # Local auth (localStorage-based)
    supabase.ts                          # Supabase client + encryption helpers
```

## Setup

```bash
npm install
npm run dev
```

To enable optional cloud sync, copy `.env.example` to `.env` and set:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Without these set, the app falls back to local-only storage — no backend required to run it.

Build for production:

```bash
npm run build
```

## Status

Hackathon/prototype build. The local auth layer is intentionally simple (client-side, not meant for production-grade security) — the focus of the project is the local-first data architecture, not auth hardening.
