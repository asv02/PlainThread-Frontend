-- Users + order linking. Paste in Supabase SQL Editor if you cannot run full schema.sql.
-- Also run the checkout_create changes in supabase/schema.sql (or the full file).

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  phone text,
  name text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists customer_sessions_user_idx
  on public.customer_sessions (user_id, expires_at desc);

alter table public.orders add column if not exists user_id uuid references public.users(id);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_email_idx on public.orders (email);

alter table public.users enable row level security;
alter table public.customer_sessions enable row level security;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

create or replace function public.upsert_customer(
  p_email text,
  p_phone text default null,
  p_name text default null
) returns uuid
language plpgsql
as $$
declare
  v_email text;
  v_id uuid;
begin
  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'INVALID_EMAIL';
  end if;

  insert into public.users (email, phone, name)
  values (
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_name, '')), '')
  )
  on conflict (email) do update
  set
    phone = coalesce(excluded.phone, public.users.phone),
    name = coalesce(excluded.name, public.users.name),
    updated_at = now()
  returning id into v_id;

  update public.orders
  set user_id = v_id
  where user_id is null
    and lower(email) = v_email;

  return v_id;
end;
$$;

insert into public.users (email, phone, name)
select distinct on (lower(o.email))
  lower(o.email),
  o.phone,
  o.customer_name
from public.orders o
where o.email is not null and length(trim(o.email)) > 3
order by lower(o.email), o.created_at desc
on conflict (email) do nothing;

update public.orders o
set user_id = u.id
from public.users u
where o.user_id is null
  and lower(o.email) = u.email;

revoke all on public.users from anon, authenticated;
revoke all on public.customer_sessions from anon, authenticated;
revoke all on function public.upsert_customer(text, text, text) from public, anon, authenticated;
grant execute on function public.upsert_customer(text, text, text) to service_role;