# SRS Calculation Explorer — production app

A production build of the "SRS Calculation Explorer" prototype:
**React + TypeScript + Tailwind + shadcn-style UI, Supabase (Postgres +
Auth + Realtime), deployed on Vercel.** All the scoring logic (exclusive
groups, capped connection groups, per-item limits, half-even rounding) is
ported 1:1 from the original prototype into `src/lib/scoring.ts`, and all
the config/agent data from the prototype's embedded JSON has been
converted into real Postgres tables and seed data.

## What's here

```
supabase/
  migrations/
    0001_schema.sql     — tables (verticals, srs_config, exclusive_groups,
                           connection_group_caps, agents, completions,
                           score history, monthly snapshots, profiles/roles)
    0002_rls.sql        — row-level security: everyone (signed-in) reads,
                           only role='admin' can write config tables
    0003_harden_functions.sql — moves is_admin()/handle_new_user() into a
                           non-exposed `private` schema and pins search_path,
                           closing the security-advisor findings below
  seed.sql              — real data extracted from the original prototype
                           (5 verticals, 342 config rows, 5 sample agents,
                           their completions, score history, monthly snapshots)
src/
  lib/scoring.ts         — the scoring engine (ported from the prototype)
  lib/supabaseClient.ts  — Supabase client
  hooks/                 — data-fetching hooks (React Query + Realtime)
  pages/                 — Explorer, Agent Dashboard, Admin, Login
  components/ui/         — shadcn-style primitives (button, card, select, tabs…)
```

## Your live Supabase project

Already set up and seeded for you (project: `satheesh_SRP_Explorer`, id `dmzcxsxpcjelpwewvfwq`):

- All 3 migrations applied (schema, RLS, and a security-hardening pass — see below)
- All seed data loaded: 5 verticals, 342 config rows, 3 exclusive/priority rules, 2 connection caps, 5 agents with their completions/history/snapshots — verified row-for-row against the original prototype
- Review Index confirmed as the default for the Review Source rule
- `.env` in this project is already filled in with your project's URL and anon key — `npm install && npm run dev` works as-is

A security advisor pass found and fixed two real issues before handoff: `is_admin()` and the new-user trigger function were callable directly as public REST RPC endpoints (a side effect of Postgres functions in the `public` schema being auto-exposed by PostgREST), and one function had a mutable `search_path`. Both are fixed in `0003_harden_functions.sql` — those two functions now live in a `private` schema instead, unreachable via the REST API, while RLS policies and the auth trigger still call them internally.

**Still needs you:**
- **Make yourself admin.** No one has signed up yet. Once you sign up in the running app, go to Supabase → Table Editor → `profiles`, find your row, and change `role` from `viewer` to `admin`.
- **Email confirmation**, if you want instant sign-in while testing: Supabase → Authentication → Providers → Email, toggle off "Confirm email" (there's no API for this, so it's a dashboard-only step).
- **Vercel** — no Vercel connector is available here, so deployment is still on you: push this folder to GitHub, import it in Vercel, and add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (same values as `.env`) as environment variables there.

## Setting up your own Supabase project from scratch

If you ever need to point this at a different Supabase project instead:

1. Go to https://supabase.com/dashboard → New project.
2. In the SQL editor, run the three files in `supabase/migrations/` **in
   order** (0001, then 0002, then 0003).
3. Run `supabase/seed.sql` to load the real config + sample agent data.
4. In **Project Settings → API**, copy your **Project URL** and **anon
   public key** into `.env`.
5. In **Authentication → Providers**, make sure Email sign-in is enabled
   (it is by default).
6. Every new sign-up starts with `role = 'viewer'` (see the
   `handle_new_user` trigger). To make yourself an admin: **Table
   Editor → profiles**, find your row, change `role` to `admin`.

## 2. Run locally

```bash
npm install
npm run dev
```
(`.env` is already filled in for the live project above — only edit it if you're pointing at a different Supabase project.)

## 3. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel: **New Project → import the repo**. Vercel will detect Vite
   automatically (a `vercel.json` is included that pins the build/output
   settings and adds an SPA rewrite so client-side routing works).
3. Add the two environment variables under **Settings → Environment
   Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. That's it — Vercel builds `npm run build` and serves `dist/`.

## How the pieces map to your requirements

- **React + TS** — Vite + React 18 + TypeScript throughout.
- **Tailwind + shadcn** — Tailwind config + hand-written shadcn-pattern
  primitives in `src/components/ui/` (Button, Card, Select, Tabs, Badge,
  Input, Dialog, Collapsible) built on Radix + `class-variance-authority`,
  the same stack the shadcn CLI generates.
- **Postgres** — via Supabase; full schema in `supabase/migrations/`.
- **API integration** — `@supabase/supabase-js` client as the API layer;
  React Query for caching, loading state, and Realtime-driven refetching.
- **Supabase** — Postgres, Auth (email/password, roles via `profiles`
  table + RLS), and Realtime (the Agent Dashboard subscribes to
  `agent_category_completions` changes and refetches automatically).
- **Vercel** — `vercel.json` included; see deploy steps above.
- **CSV → Supabase** — the prototype's 5 embedded JSON blocks (SRS
  config, completions, connection caps, score history, monthly
  snapshots) were parsed and converted into `supabase/seed.sql`, ready to
  load straight into Postgres.

## Admin page

`/admin` (role = 'admin' only) has two sections:

- **Priority Rules** — for scoring rules where two paths compete for the
  same points (currently *Review Source: Widget vs. Index*), this shows
  which path is the default when a business hasn't started either one,
  and lets an admin change it with a "Make default" button. **Review
  Index is the default** across all verticals (previously it was
  Through Widget) — this is set both in `supabase/seed.sql` and
  changeable live from this screen, which reorders the `paths` array on
  the `exclusive_groups` row.
- **Field config table** — edit `component_limit` / `points` per
  sub-category for the selected vertical.

## Notes / next steps

- **Auth roles**: promoting the first admin is a manual step (see step
  1.6 above) by design — there's no "make me admin" button in the app,
  since that would defeat the point of the role gate.
- **Loading real agent data going forward**: `agent_category_completions`,
  `agent_score_history`, and `agent_monthly_snapshot` are meant to be
  populated by whatever pipeline computes real completions (using the
  Supabase **service role** key, which bypasses RLS) — the admin UI here
  is for correcting the *scoring rules* (`srs_config`, priority
  defaults), not for hand-typing agent data.
- **Bundle size**: the production build is a single ~575 kB JS chunk;
  fine to ship as-is, but if this grows, split routes with
  `React.lazy()`.
