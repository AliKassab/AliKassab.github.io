# Ali Kassab - Portfolio

Live site: https://alikassab.dev

Static HTML/CSS/JavaScript portfolio. Explore inserts private anonymous perspectives
through Supabase's REST Data API. No traditional backend server or public response feed.
Email notifications run independently: INSERT → Database Webhook →
`notify-perspective` Edge Function → Resend.

- [Manual setup and exact test procedure](docs/explore-setup.md)
- Database: `supabase/migrations/20261009000000_create_perspectives.sql`
- Client transport and submission states: `scripts/perspectives.js`
- Function: `supabase/functions/notify-perspective/`

## Local checks and preview

Requires Node 22+ and Deno 2 for Edge Function checks. No npm dependencies needed.

```sh
npm run lint
npm test
npm run typecheck
npm run test:edge
cp .env.example .env
# Fill .env with public Supabase configuration only.
npm run build
python3 -m http.server 8080 --directory dist
```

Visit `http://localhost:8080/explore.html?preview=explore` while the launch flag is off.
The deployed page redirects to Home and its navigation link is hidden until
`EXPLORE_ENABLED=true`. Build output is `dist/`; it includes public assets only.

## Security and operational limits

The table grants `anon` INSERT on only `category`, `question`, and `response`.
RLS additionally requires moderation flags to be false. It grants no anonymous
SELECT, UPDATE, or DELETE; authenticated browser clients have no grants either.
IDs/timestamps/default flags are database-controlled. Dashboard administrators
can manage rows. Response constraint: 1–5,000 characters and not only whitespace.
The browser's 5,000 UTF-16-unit limit is slightly stricter for emoji than PostgreSQL's
character limit. Categories are allowlisted and questions capped at 500 characters.

The browser locks each form during submission. This prevents duplicate clicks,
not automated spam or retries after ambiguous network failures. There are no
automatic client retries. `submit()` is isolated so a future Turnstile-protected
Edge endpoint can replace direct inserts. When doing so, revoke direct anonymous
INSERT access to prevent bypassing the new protection.

The webhook requires a server-side shared secret. Notification content is plain
text, logs exclude response bodies/secrets, and Resend gets a row-based idempotency
key (Resend's deduplication window applies). Notification failures never mutate
perspectives. Webhooks are asynchronous; delivery is best effort, not a durable
retry queue. Monitor function/webhook logs and manually retry failed deliveries
using the same INSERT payload and secret; the table remains the source of truth.
Stronger protection and a durable delivery queue are future additions.

External Supabase/Resend/hosting setup is not performed by this repository.
