-- BukzEx core database: profiles, service catalogue, wallet ledger,
-- deposits and orders. All money-changing operations are server-side RPCs.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  notifications_enabled boolean not null default true,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  currency text not null default 'NGN' check (currency ~ '^[A-Z]{3}$'),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  service_key text not null unique,
  name text not null,
  description text not null default '',
  status text not null default 'setup_required'
    check (status in ('active', 'inactive', 'setup_required')),
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'NGN' check (currency ~ '^[A-Z]{3}$'),
  payment_reference text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, payment_reference)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  service_key text not null references public.services(service_key),
  requested_amount numeric(14,2) not null check (requested_amount > 0),
  currency text not null default 'NGN' check (currency ~ '^[A-Z]{3}$'),
  details text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('deposit', 'purchase', 'refund', 'adjustment')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'NGN' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  source_id uuid not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  unique (transaction_type, source_id)
);

create index if not exists wallet_deposits_user_created_idx
  on public.wallet_deposits (user_id, created_at desc);
create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);
create index if not exists wallet_transactions_user_created_idx
  on public.wallet_transactions (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists wallets_set_updated_at on public.wallets;
create trigger wallets_set_updated_at before update on public.wallets
for each row execute function public.set_updated_at();
drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at before update on public.services
for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.is_bukzex_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.handle_new_bukzex_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id, balance, currency)
  values (new.id, 0, 'NGN')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.sync_bukzex_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_bukzex on auth.users;
create trigger on_auth_user_created_bukzex
  after insert on auth.users
  for each row execute function public.handle_new_bukzex_user();

drop trigger if exists on_auth_user_email_updated_bukzex on auth.users;
create trigger on_auth_user_email_updated_bukzex
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_bukzex_user_email();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.services enable row level security;
alter table public.wallet_deposits enable row level security;
alter table public.orders enable row level security;
alter table public.wallet_transactions enable row level security;

revoke all on public.profiles, public.wallets, public.services,
  public.wallet_deposits, public.orders, public.wallet_transactions
  from anon, authenticated;
grant select on public.profiles, public.wallets,
  public.wallet_deposits, public.orders, public.wallet_transactions
  to authenticated;
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;

drop policy if exists "Profiles are visible to owner and admins" on public.profiles;
create policy "Profiles are visible to owner and admins" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_bukzex_admin()));

drop policy if exists "Users can update their own contact details" on public.profiles;
create policy "Users can update their own contact details" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name, phone, notifications_enabled) on public.profiles to authenticated;

drop policy if exists "Users can read own wallet and admins can read all" on public.wallets;
create policy "Users can read own wallet and admins can read all" on public.wallets
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_bukzex_admin()));

drop policy if exists "Active services are public" on public.services;
create policy "Active services are public" on public.services
  for select to anon, authenticated
  using (status = 'active');
drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services" on public.services
  for all to authenticated
  using ((select public.is_bukzex_admin()))
  with check ((select public.is_bukzex_admin()));

drop policy if exists "Users can read own deposits and admins can read all" on public.wallet_deposits;
create policy "Users can read own deposits and admins can read all" on public.wallet_deposits
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_bukzex_admin()));

drop policy if exists "Users can read own orders and admins can read all" on public.orders;
create policy "Users can read own orders and admins can read all" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_bukzex_admin()));

drop policy if exists "Users can read own wallet transactions and admins can read all" on public.wallet_transactions;
create policy "Users can read own wallet transactions and admins can read all" on public.wallet_transactions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_bukzex_admin()));

create or replace function public.create_wallet_deposit(
  p_amount numeric,
  p_payment_reference text
)
returns public.wallet_deposits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deposit public.wallet_deposits;
begin
  if v_user_id is null then
    raise exception 'Sign in to submit a deposit.' using errcode = '28000';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 10000000 then
    raise exception 'Enter a valid deposit amount.' using errcode = '22023';
  end if;
  if nullif(trim(p_payment_reference), '') is null then
    raise exception 'Enter the transfer reference.' using errcode = '22023';
  end if;

  insert into public.wallet_deposits (user_id, amount, payment_reference)
  values (v_user_id, round(p_amount, 2), trim(p_payment_reference))
  returning * into v_deposit;

  return v_deposit;
end;
$$;

create or replace function public.admin_confirm_wallet_deposit(p_deposit_id uuid)
returns public.wallet_deposits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deposit public.wallet_deposits;
begin
  if not public.is_bukzex_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  select * into v_deposit
  from public.wallet_deposits
  where id = p_deposit_id
  for update;

  if not found then
    raise exception 'Deposit not found.' using errcode = 'P0002';
  end if;
  if v_deposit.status = 'confirmed' then
    return v_deposit;
  end if;
  if v_deposit.status <> 'pending' then
    raise exception 'Only pending deposits can be confirmed.' using errcode = '22023';
  end if;

  update public.wallet_deposits
  set status = 'confirmed', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_deposit_id
  returning * into v_deposit;

  update public.wallets
  set balance = balance + v_deposit.amount
  where user_id = v_deposit.user_id;

  insert into public.wallet_transactions
    (user_id, transaction_type, amount, currency, status, source_id, description)
  values
    (v_deposit.user_id, 'deposit', v_deposit.amount, v_deposit.currency,
     'completed', v_deposit.id, 'Admin-confirmed wallet deposit')
  on conflict (transaction_type, source_id) do nothing;

  return v_deposit;
end;
$$;

create or replace function public.create_service_order(
  p_service_key text,
  p_amount numeric,
  p_details text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders;
begin
  if v_user_id is null then
    raise exception 'Sign in to submit an order.' using errcode = '28000';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 10000000 then
    raise exception 'Enter a valid amount.' using errcode = '22023';
  end if;
  if nullif(trim(p_details), '') is null then
    raise exception 'Enter the service details.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.services
    where service_key = p_service_key and status = 'active'
  ) then
    raise exception 'This service is not enabled yet.' using errcode = '22023';
  end if;

  insert into public.orders (user_id, service_key, requested_amount, details)
  values (v_user_id, p_service_key, round(p_amount, 2), trim(p_details))
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.admin_update_order(
  p_order_id uuid,
  p_status text,
  p_admin_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if not public.is_bukzex_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  if p_status not in ('processing', 'completed', 'rejected') then
    raise exception 'Invalid order status.' using errcode = '22023';
  end if;

  update public.orders
  set status = p_status, admin_note = nullif(trim(p_admin_note), '')
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;
  return v_order;
end;
$$;

revoke all on function public.is_bukzex_admin() from public, anon;
grant execute on function public.is_bukzex_admin() to authenticated;
revoke all on function public.create_wallet_deposit(numeric, text) from public, anon;
grant execute on function public.create_wallet_deposit(numeric, text) to authenticated;
revoke all on function public.admin_confirm_wallet_deposit(uuid) from public, anon;
grant execute on function public.admin_confirm_wallet_deposit(uuid) to authenticated;
revoke all on function public.create_service_order(text, numeric, text) from public, anon;
grant execute on function public.create_service_order(text, numeric, text) to authenticated;
revoke all on function public.admin_update_order(uuid, text, text) from public, anon;
grant execute on function public.admin_update_order(uuid, text, text) to authenticated;

insert into public.services (service_key, name, description, status)
values
  ('vtu', 'VTU', 'Airtime and data services', 'setup_required'),
  ('marketplace', 'Marketplace', 'Products and digital offers', 'setup_required'),
  ('sms', 'Virtual SMS / OTP', 'Virtual messaging and verification', 'setup_required'),
  ('social', 'Social Media Boost', 'Social media growth services', 'setup_required'),
  ('gift-cards', 'Gift Cards', 'Gift card services', 'setup_required'),
  ('crypto', 'Crypto', 'Supported cryptocurrency services', 'setup_required')
on conflict (service_key) do nothing;
