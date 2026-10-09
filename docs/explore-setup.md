# Manual setup required

Code is implemented, but no live Supabase project, Resend account, webhook,
secrets, or hosting settings have been configured or verified by this change.

## Supabase

1. Create a project at https://supabase.com/dashboard. Keep the database password
   private. Wait for provisioning.
2. Open the project's **Connect** dialog (or Settings → API/Data API) and copy the
   **Project URL**, e.g. `https://PROJECT_REF.supabase.co`. Use this for
   `PUBLIC_SUPABASE_URL`.
3. Under **Settings → API Keys**, copy the **publishable key** (`sb_publishable_…`).
   A legacy **anon** JWT is also supported. Use it for
   `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never use `sb_secret_…` or a `service_role`
   key. The build rejects those keys. The browser key is intentionally public;
   grants and RLS protect data.
4. In **SQL Editor**, run the entire file
   `supabase/migrations/20261009000000_create_perspectives.sql` once.
   Alternatively install the Supabase CLI, then from the repository run:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

   If an existing `perspectives` table exists, reconcile it before applying this
   migration; this migration deliberately fails rather than silently leaving an
   insecure old schema in place.
5. In **Table Editor → public.perspectives**, confirm columns `id`, `category`,
   `question`, `response`, `created_at`, `approved`, `featured`; booleans default
   false, UUID/time have generated defaults. Responses remain private.
6. In **Database → Policies**, confirm RLS enabled and exactly one policy:
   `anonymous_insert_only`, INSERT, role `anon`, check
   `approved = false AND featured = false`. There must be no public read/update/delete
   policies. In SQL Editor inspect permissions:

   ```sql
   select relrowsecurity from pg_class where oid = 'public.perspectives'::regclass;
   select * from pg_policies where schemaname = 'public' and tablename = 'perspectives';
   select grantee, privilege_type, column_name
   from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'perspectives'
     and grantee in ('anon', 'authenticated', 'PUBLIC');
   ```

   Expected: RLS true; the single INSERT policy; `anon` INSERT only on `category`,
   `question`, `response`. Run `tests/perspectives-security.sql` in SQL Editor to
   verify actual insert/read/update/delete/moderation/length enforcement. It rolls
   back its test row.
7. Generate a private webhook secret, e.g. `openssl rand -hex 32`. Store it in your
   password manager; never add it to browser configuration or the repository.
8. In **Edge Functions → Secrets**, set:

   | Secret | Value |
   | --- | --- |
   | `RESEND_API_KEY` | Resend sending API key |
   | `PERSPECTIVES_NOTIFICATION_TO` | Your notification recipient email |
   | `PERSPECTIVES_NOTIFICATION_FROM` | Verified sender, e.g. `Ali's Portfolio <perspectives@notify.yourdomain.com>` |
   | `PERSPECTIVES_WEBHOOK_SECRET` | The random secret from step 7 |

   Use the Dashboard to avoid placing secrets in command history. These values
   belong only in Supabase secrets, not `.env` or GitHub Pages variables.
9. Install/login/link the Supabase CLI as above, then deploy from the repo:

   ```sh
   supabase functions deploy notify-perspective --no-verify-jwt
   ```

   `supabase/config.toml` also sets `verify_jwt=false`. This is intentional: the
   function authenticates its webhook with `x-webhook-secret`, not a user JWT.
   Confirm deployment in **Edge Functions**, including JWT verification disabled.
10. Under **Database → Webhooks**, enable Database Webhooks if prompted and create:

    - Name: `perspectives-insert-notification`
    - Table: `public.perspectives`
    - Event: **INSERT only**
    - Type: HTTP Request
    - Method: POST
    - URL: `https://PROJECT_REF.supabase.co/functions/v1/notify-perspective`
    - Headers: `Content-Type: application/json` and
      `x-webhook-secret: YOUR_PRIVATE_WEBHOOK_SECRET`
    - Timeout: `15000` milliseconds, if configurable
    - Body: use the generated database event payload, without a custom replacement.

    Do not put the webhook secret in the browser. No service-role Authorization
    header is required. The generated payload includes `type`, `schema`, `table`,
    and the inserted `record`. Webhooks are asynchronous and therefore email
    failure does not roll back the insert.

## Resend

1. Create an account at https://resend.com and complete account setup.
2. Add a sending domain under **Domains** (a subdomain such as
   `notify.yourdomain.com` is suitable). Add the DNS records Resend gives you at
   your DNS provider; wait until Resend shows the domain verified.
3. Create a sending API key under **API Keys**, preferably restricted to your
   sending domain. Store it as Supabase secret `RESEND_API_KEY` only.
4. Choose a sender on that verified domain, e.g.
   `Ali's Portfolio <perspectives@notify.yourdomain.com>`, and set
   `PERSPECTIVES_NOTIFICATION_FROM`. Set your real recipient in
   `PERSPECTIVES_NOTIFICATION_TO`.
5. Resend's test sender `onboarding@resend.dev` is suitable only for account-owner
   testing under Resend's restrictions; use a verified domain for production.

## Portfolio hosting

The repository is a GitHub Pages static site. A new workflow builds public
configuration from environment variables; raw HTML cannot read hosting env vars.

1. In GitHub **Settings → Secrets and variables → Actions → Variables**, add:

   | Variable | Value |
   | --- | --- |
   | `PUBLIC_SUPABASE_URL` | Supabase project URL from above |
   | `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe publishable key or legacy anon key |
   | `EXPLORE_ENABLED` | `true` to launch; `false` to keep hidden |

2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as
   the source. Retain the existing custom domain `alikassab.dev` and HTTPS setting.
3. Push the implementation to `main` or manually run **Deploy portfolio**.
   `.github/workflows/pages.yml` builds and publishes `dist/`. Changing variables
   requires another deployment; they are baked into `scripts/public-config.js`.
4. For another static host, configure the same three environment variables,
   build command `npm run build` (Node 22+), publish directory `dist`, then redeploy.
5. Local configuration: copy `.env.example` to `.env`, fill only the public values,
   and run `npm run build`. `.env` and `dist/` are gitignored. The build copies only
   public assets, never server functions, migrations, tests, or secret env files.
6. The existing `noindex` meta tag in `explore.html` stays in place. Remove it if
   you want the launched page indexed by search engines; it is unrelated to RLS.

## Testing

1. Build/deploy with valid public settings and `EXPLORE_ENABLED=true`. Open Explore
   in a private browser window. Submit a unique response, e.g. `Explore test
   2026-10-09 A`, through a card. Verify “Sharing…” and the disabled button; rapid
   repeated clicks should produce one POST. Success clears the textarea. Test a
   whitespace-only answer (rejected); browser max length is 5,000.
2. In Supabase **Table Editor → perspectives**, find that unique response. Confirm
   category/question match the card and `id`/`created_at` are populated.
3. Confirm `approved=false` and `featured=false`. Neither value is sent by the
   client. Run `tests/perspectives-security.sql` to verify attempts to set these
   flags and oversized/whitespace inserts fail at the database level.
4. Confirm email arrives with subject `New perspective: [category]` and category,
   question, full response, timestamp in its body. If absent, inspect **Edge
   Functions → notify-perspective → Logs**, database webhook history, and Resend
   email logs. Check sender verification and webhook header. Notifications do not
   affect the visitor's success state.
5. In the private window, open DevTools Console and run:

   ```js
   const { url, key } = window.SITE_CONFIG.supabase;
   const headers = { apikey: key };
   if (!key.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${key}`;
   const read = await fetch(`${url}/rest/v1/perspectives?select=*`, { headers });
   console.log(read.status, await read.text());
   ```

   Expected: permission-denied 401/403, never any rows. To verify UPDATE/DELETE and
   moderation tampering without a destructive HTTP test, use the rollback SQL
   security test above. Even with the public key, there is no SELECT grant/policy.
6. Temporarily change `RESEND_API_KEY` in Supabase secrets to an invalid test value.
   Submit a second unique response. The website must still succeed; verify the
   row exists with false moderation flags and the function logs a notification
   failure. Restore the real key immediately. The failed notification is not
   automatically retried; use the existing row's INSERT payload to invoke the
   function again with `x-webhook-secret` if needed. Resend idempotency uses the row
   ID to suppress duplicate delivery within its deduplication window.
7. In DevTools, block `*/rest/v1/perspectives*` or switch offline after page load.
   Submit an answer: error is shown, text stays intact, controls are re-enabled.
   Restore networking and retry. Inspect that no public reads are performed.

References: [Supabase database webhooks](https://supabase.com/docs/guides/database/webhooks),
[API keys](https://supabase.com/docs/guides/api/api-keys),
[column privileges](https://supabase.com/docs/guides/database/postgres/column-level-security),
[Resend sending domains](https://resend.com/docs/dashboard/domains/introduction),
[Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email).
