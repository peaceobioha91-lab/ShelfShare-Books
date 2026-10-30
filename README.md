# ShelfShare Books

ShelfShare Books is the online catalogue and membership portal for Ekenwan Community Library in Benin City, Edo State, Nigeria. It uses Next.js App Router, TypeScript, Tailwind CSS, Neon Postgres, Paystack and Resend.

## Requirements

- Node.js 20 or newer
- pnpm
- A Neon Postgres database

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in the values below.
3. Initialize the database and seed the catalogue and librarian account with `pnpm db:setup`.
4. Start the development server with `pnpm dev`, then open [http://localhost:3000](http://localhost:3000).

The database setup script creates the schema, seeds 20 Nigerian and widely read books, and creates or updates the librarian account from `LIBRARIAN_EMAIL` and `LIBRARIAN_PASSWORD`. Choose a unique librarian password; the database stores its hash.

## Environment variables

Set these in the ignored `.env.local` file. Never commit live credentials.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (include SSL mode as provided by Neon). |
| `SESSION_SECRET` | Random secret of at least 32 bytes for signing session cookies. |
| `LIBRARIAN_EMAIL` | Email address for the seeded librarian account. |
| `LIBRARIAN_PASSWORD` | Initial librarian password; at least 12 characters and at most 72 bytes. |
| `PAYSTACK_SECRET_KEY` | Paystack secret key. Use a `sk_test_...` key for local/test checkout. |
| `RESEND_API_KEY` | Resend API key for email notifications. |
| `RESEND_FROM_EMAIL` | Verified sender address, such as `ShelfShare Books <library@example.com>`. |
| `APP_URL` | Public base URL used for payment callbacks and links (local default: `http://localhost:3000`). |
| `CRON_SECRET` | Secret used to authorize the due reminder cron endpoint. |

## Main features

- Public home, catalogue search/category filters, book details, and membership plans (Basic ₦1,500/month; Standard ₦2,500/month).
- Member registration and login with hashed passwords and secure session cookies.
- Member loans, waitlist positions, 14-day loans, and 48-hour holds after a return.
- Librarian tools for collection management, borrow request review, returns, and overdue loans.
- Paystack checkout and verified 30-day membership activation.
- Resend emails for waitlist availability and due-date reminders.

Protected routes enforce role checks on the server. Members use `/member/*`; librarians use `/librarian/*`. New member accounts do not gain an active paid membership until checkout completes successfully.

## Email reminders and deployment

`vercel.json` schedules `/api/cron/due-reminders` daily at 09:00 UTC (12:00 in Benin City). Configure `CRON_SECRET` in the Vercel project environment. The route sends reminders for loans due in two days. Waitlist availability email is sent when a return promotes the next member in the queue.

Configure the remaining environment variables in Vercel before deploying. Use live Paystack credentials only after configuring the production callback URL and verifying the payment flow. Resend requires a verified sending domain/address.

## Useful commands

- `pnpm dev` — start local development
- `pnpm build` — create a production build
- `pnpm start` — serve the production build
- `pnpm db:setup` — apply schema and seed initial records

The app uses `src/app` for routes, `src/components` for shared UI, `src/lib` for database/auth helpers, and `db/schema.sql` for the database schema.
