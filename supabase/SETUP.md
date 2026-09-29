# BukzEx Supabase setup

This frontend uses Supabase Auth and Postgres. Do not put a Supabase secret/service-role key in this Vite app.

## Create the project

1. Create a Supabase project named `bukzex` in the account you want to use.
2. In **Project Settings → API Keys**, copy the project URL and the **publishable** key. Keep any secret key private.
3. In **SQL Editor**, run the migration in `supabase/migrations/20260929000000_bukzex_core.sql`.
4. In **Authentication → URL Configuration**, set the site URL to `https://bukzex.shadexgoltd.com` and add `https://bukzex.shadexgoltd.com/**` to the redirect URLs.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Cloudflare Workers Build environment, then trigger a new production build.
6. Create your own account through the public signup page. After that, promote that account to admin from Supabase SQL Editor by replacing the email below:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('YOUR_ADMIN_EMAIL');
```

No admin password is stored in the frontend. Supabase Auth handles passwords, and the database role controls admin access.

## Current backend scope

The migration creates profiles, roles, wallets, services, deposit requests, orders and a wallet transaction ledger with row-level security. Deposit approval is admin-only and credits a wallet in one database transaction. Service requests are saved for admin review; they do not charge the wallet or call a provider yet.

To enable real wallet funding and automatic service fulfillment, add the chosen payment provider and service-provider integrations as Supabase Edge Functions. Store their secret keys in Supabase Function Secrets. Do not paste secret keys into source files, Cloudflare build variables, or chat.
