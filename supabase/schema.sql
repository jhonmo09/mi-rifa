-- =====================================================================
-- Mi Rifa - talonario digital
-- Ejecutar completo en Supabase > SQL Editor
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- tipos ----------
do $$ begin
  create type public.raffle_status as enum ('draft', 'active', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum ('reserved', 'paid');
exception when duplicate_object then null; end $$;

-- ---------- rifas ----------
create table if not exists public.raffles (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  slug             text not null unique,
  title            text not null check (char_length(btrim(title)) between 3 and 120),
  description      text,
  draw_rules       text,
  prize            text,
  price            numeric(12, 2) not null default 0 check (price >= 0),
  currency         text not null default 'COP',
  total_numbers    int not null check (total_numbers between 10 and 10000),
  draw_date        date,
  contact_name     text,
  contact_whatsapp text,
  payment_info     text,
  max_per_person   int not null default 5 check (max_per_person between 1 and 100),
  status           public.raffle_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists raffles_owner_idx on public.raffles (owner_id, created_at desc);

-- Para proyectos creados antes de que existiera la dinamica del sorteo.
alter table public.raffles add column if not exists draw_rules text;

-- ---------- boletas ----------
create table if not exists public.tickets (
  id              uuid primary key default gen_random_uuid(),
  raffle_id       uuid not null references public.raffles(id) on delete cascade,
  number          int not null check (number >= 0),
  buyer_name      text not null,
  buyer_whatsapp  text not null,
  status          public.ticket_status not null default 'reserved',
  note            text,
  reserved_at     timestamptz not null default now(),
  paid_at         timestamptz,
  unique (raffle_id, number)
);

create index if not exists tickets_raffle_idx on public.tickets (raffle_id, number);

-- ---------- updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists raffles_touch_updated_at on public.raffles;
create trigger raffles_touch_updated_at
  before update on public.raffles
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.raffles enable row level security;
alter table public.tickets enable row level security;

-- Rifas: el dueno manda; el publico solo ve las publicadas.
drop policy if exists "raffles_select_own" on public.raffles;
create policy "raffles_select_own" on public.raffles
  for select using (auth.uid() = owner_id);

drop policy if exists "raffles_select_public" on public.raffles;
create policy "raffles_select_public" on public.raffles
  for select using (status in ('active', 'closed'));

drop policy if exists "raffles_insert_own" on public.raffles;
create policy "raffles_insert_own" on public.raffles
  for insert with check (auth.uid() = owner_id);

drop policy if exists "raffles_update_own" on public.raffles;
create policy "raffles_update_own" on public.raffles
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "raffles_delete_own" on public.raffles;
create policy "raffles_delete_own" on public.raffles
  for delete using (auth.uid() = owner_id);

-- Boletas: SOLO el dueno de la rifa ve nombres y telefonos.
-- El publico nunca lee esta tabla directamente (ver vista public_tickets).
drop policy if exists "tickets_owner_all" on public.tickets;
create policy "tickets_owner_all" on public.tickets
  for all
  using (exists (select 1 from public.raffles r where r.id = tickets.raffle_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.raffles r where r.id = tickets.raffle_id and r.owner_id = auth.uid()));

-- =====================================================================
-- Vista publica: que numeros estan ocupados, sin datos personales
-- =====================================================================
drop view if exists public.public_tickets;
create view public.public_tickets
with (security_invoker = off) as
  select t.raffle_id, t.number, t.status
  from public.tickets t
  join public.raffles r on r.id = t.raffle_id
  where r.status in ('active', 'closed');

grant select on public.public_tickets to anon, authenticated;

-- =====================================================================
-- RPC: reservar numeros sin exponer la tabla
-- =====================================================================
create or replace function public.reserve_numbers(
  p_slug     text,
  p_numbers  int[],
  p_name     text,
  p_whatsapp text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_raffle   public.raffles%rowtype;
  v_numbers  int[];
  v_taken    int[];
  v_name     text := btrim(coalesce(p_name, ''));
  v_whatsapp text := regexp_replace(coalesce(p_whatsapp, ''), '[^0-9+]', '', 'g');
begin
  select * into v_raffle from public.raffles where slug = p_slug;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_raffle.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'closed');
  end if;

  if char_length(v_name) < 3 or char_length(v_name) > 80 then
    return jsonb_build_object('ok', false, 'error', 'invalid_name');
  end if;

  if char_length(v_whatsapp) < 7 or char_length(v_whatsapp) > 20 then
    return jsonb_build_object('ok', false, 'error', 'invalid_whatsapp');
  end if;

  select coalesce(array_agg(distinct n), '{}') into v_numbers from unnest(coalesce(p_numbers, '{}')) n;

  if coalesce(array_length(v_numbers, 1), 0) = 0 then
    return jsonb_build_object('ok', false, 'error', 'no_numbers');
  end if;

  if array_length(v_numbers, 1) > v_raffle.max_per_person then
    return jsonb_build_object('ok', false, 'error', 'too_many', 'max', v_raffle.max_per_person);
  end if;

  if exists (select 1 from unnest(v_numbers) n where n < 0 or n >= v_raffle.total_numbers) then
    return jsonb_build_object('ok', false, 'error', 'out_of_range');
  end if;

  -- serializa reservas simultaneas sobre la misma rifa
  perform 1 from public.raffles where id = v_raffle.id for update;

  select coalesce(array_agg(number order by number), '{}') into v_taken
  from public.tickets
  where raffle_id = v_raffle.id and number = any (v_numbers);

  if coalesce(array_length(v_taken, 1), 0) > 0 then
    return jsonb_build_object('ok', false, 'error', 'taken', 'numbers', to_jsonb(v_taken));
  end if;

  insert into public.tickets (raffle_id, number, buyer_name, buyer_whatsapp)
  select v_raffle.id, n, v_name, v_whatsapp from unnest(v_numbers) n;

  return jsonb_build_object('ok', true, 'numbers', to_jsonb(v_numbers));
end;
$$;

revoke all on function public.reserve_numbers(text, int[], text, text) from public;
grant execute on function public.reserve_numbers(text, int[], text, text) to anon, authenticated;
