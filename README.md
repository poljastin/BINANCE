# BINANCE

Mobile-first couples finance tracker for Paul & Jemimah.

## Cross-device database

The app uses this persistence order:

1. Supabase cloud database, when configured.
2. IndexedDB on the device, as offline fallback.
3. localStorage backup.

To make data persist across different phones and browsers:

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run this SQL:

```sql
create table if not exists public.binance_app_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.binance_app_state enable row level security;

create policy "Allow app read"
on public.binance_app_state
for select
to anon
using (true);

create policy "Allow app insert"
on public.binance_app_state
for insert
to anon
with check (true);

create policy "Allow app update"
on public.binance_app_state
for update
to anon
using (true)
with check (true);
```

4. Copy your Supabase project URL and anon public key.
5. Add them in `src/environments/environment.ts`:

```ts
export const environment = {
  production: true,
  supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
    stateId: 'paul-jemimah-shared-finance',
  },
};
```

6. Commit, push to GitHub, then redeploy Netlify.

The `stateId` must be the same on every deploy so Paul and Jemimah share one finance record.
