-- ตารางเก็บสถิติการใช้งาน ADL (Barthel) แบบไม่ระบุตัวผู้ป่วย
create table if not exists public.adl_usage (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  assessed_at     timestamptz not null,
  feeding_score   smallint not null check (feeding_score between 0 and 2),
  grooming_score  smallint not null check (grooming_score between 0 and 1),
  transfer_score  smallint not null check (transfer_score between 0 and 3),
  toilet_score    smallint not null check (toilet_score between 0 and 2),
  mobility_score  smallint not null check (mobility_score between 0 and 3),
  dressing_score  smallint not null check (dressing_score between 0 and 2),
  stairs_score    smallint not null check (stairs_score between 0 and 2),
  bathing_score   smallint not null check (bathing_score between 0 and 1),
  bowels_score    smallint not null check (bowels_score between 0 and 2),
  bladder_score   smallint not null check (bladder_score between 0 and 2),
  total_score     smallint not null check (total_score between 0 and 20),
  adl_group       text not null check (adl_group in ('social','home','bed')),
  duration_sec    integer check (duration_sec between 0 and 86400),
  device_type     text not null check (device_type in ('mobile','tablet','desktop'))
);

alter table public.adl_usage enable row level security;
revoke all on table public.adl_usage from anon, authenticated;
grant insert on table public.adl_usage to anon;

drop policy if exists "anon insert only" on public.adl_usage;
create policy "anon insert only" on public.adl_usage for insert to anon with check (true);
