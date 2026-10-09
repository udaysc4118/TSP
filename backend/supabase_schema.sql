-- Supabase bootstrap schema for MahaRoute backend
-- Run this in Supabase SQL Editor, then restart backend.

create extension if not exists pgcrypto;

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null unique,
    password_hash text,
    password text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    last_login_at timestamptz
);

create table if not exists public.admins (
    id uuid primary key default gen_random_uuid(),
    admin_id text not null unique,
    password_hash text,
    password text,
    created_at timestamptz not null default now()
);

create table if not exists public.otps (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    otp text not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    user_name text,
    user_email text,
    sender_type text not null check (sender_type in ('user', 'admin')),
    message text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_admins_admin_id on public.admins(admin_id);
create index if not exists idx_otps_email_otp on public.otps(email, otp);
create index if not exists idx_messages_user_id_created_at on public.messages(user_id, created_at);

create or replace function public.check_admin_pass(a_id text, a_pass text)
returns boolean
language sql
security definer
as $$
    select exists (
        select 1
        from public.admins
        where admin_id = a_id
          and password_hash = crypt(a_pass, password_hash)
    );
$$;

insert into public.admins (admin_id, password_hash)
select 'admin@maharoute.ai', '$2b$10$LGgL8b4TGBx.3EcZ.01x4Ov8jTka62Pkc6w5KKU29jgiWtKHnJP8C'
where not exists (
    select 1 from public.admins where admin_id = 'admin@maharoute.ai'
);

-- Optional hardening notes:
-- 1) If server uses SUPABASE service_role key, RLS can stay disabled for this internal backend use-case.
-- 2) If using anon key, you must add proper RLS policies for all operations in server.js.
