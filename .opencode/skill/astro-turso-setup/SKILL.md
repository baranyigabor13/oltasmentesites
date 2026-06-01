---
name: astro-turso-setup
description: "Set up Turso (edge SQLite) database in an Astro project with Drizzle ORM, including schema, API routes for contact/newsletter forms, and an admin dashboard. Use this skill whenever the user wants to add a database to an Astro site, store form submissions, set up Turso, configure Drizzle with libSQL, build a contact form backend, create newsletter signup storage, or build an admin dashboard for an Astro site. Triggers on mentions of Turso, Drizzle, libSQL, contact form backend, or admin dashboard in an Astro context."
---

# Astro Turso Database Setup

Sets up a complete Turso + Drizzle ORM stack in an Astro project: database client, schema, API routes for forms, and an admin dashboard for viewing submissions.

## When to use

- User wants to add a database to an Astro site
- User mentions Turso, libSQL, or Drizzle
- User needs a backend for contact forms, newsletter signups, bookings, or lead capture
- User wants an admin dashboard to view stored data
- User asks to "set up a database" in an Astro project

## Tech stack

- **@libsql/client** — Turso/libSQL client
- **drizzle-orm** + **drizzle-kit** — ORM and migrations
- **Turso** — edge SQLite database
- **Astro API routes** with `export const prerender = false` for server-rendered endpoints

## Workflow

Follow these steps in order. The full code snippets for every file live in `references/turso-setup.md` — read it before writing any code.

### 1. Confirm with the user

Before installing anything, confirm:
- Do they have a Turso account? (If not, point them at the CLI setup in the reference.)
- Do they have `.env` values for `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`? If not, walk them through `turso auth login` and `turso db create`.
- Do they want a contact form, newsletter signup, both, or a custom form?
- Do they want the admin dashboard? (It uses cookie-based auth with `ADMIN_SECRET`.)

### 2. Install dependencies

```bash
npm install @libsql/client drizzle-orm
npm install -D drizzle-kit
```

### 3. Create the files

Read `references/turso-setup.md` and create, in this order:

1. `src/lib/turso.ts` — raw libSQL client (skip if using Drizzle)
2. `src/lib/db.ts` — Drizzle-wrapped client
3. `src/lib/schema.ts` — table definitions (`contacts`, `subscribers`, `formSubmissions`)
4. `drizzle.config.ts` at project root
5. `src/pages/api/contact.ts` — contact form POST handler
6. `src/pages/api/subscribe.ts` — newsletter POST handler
7. `src/pages/api/admin/submissions.ts` — admin GET endpoint
8. `src/middleware.ts` — protects `/admin/*` routes
9. `src/pages/admin/login.astro` — password login
10. `src/pages/admin/index.astro` — dashboard host page
11. `src/components/admin/AdminDashboard.tsx` — React dashboard island

### 4. Push the schema

```bash
npx drizzle-kit push
```

### 5. Environment variables

Add to `.env` (do NOT prefix with `PUBLIC_` — these are server-only):

```
TURSO_DATABASE_URL=libsql://[db]-[user].turso.io
TURSO_AUTH_TOKEN=...
ADMIN_SECRET=your-secure-password
```

Add `.env` and `.env.local` to `.gitignore`. Add `ADMIN_SECRET` to the deployment environment.

## Important rules

- **Server-only secrets.** Never expose `TURSO_AUTH_TOKEN` or `ADMIN_SECRET` to the client. Never use the `PUBLIC_` prefix for these.
- **API routes need `export const prerender = false`.** Astro defaults to static output; server routes must opt out individually.
- **Do not use `output: 'hybrid'`.** Removed in Astro v5. Use default static output and opt routes out per-file.
- **Use cookie-based admin auth** as a simple starting point. Recommend replacing with a real auth system (Auth.js, Clerk, etc.) for production.
- **Validate input server-side.** The reference includes email regex and required-field checks — keep them.
- **Security headers** are set in the middleware — keep `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.

## Reference

Full file-by-file code, including Drizzle schema, API handlers, middleware, and the React admin component: see `references/turso-setup.md`.
