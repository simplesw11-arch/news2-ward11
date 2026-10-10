-- ตารางเก็บสถิติการใช้งาน PEWS แบบไม่ระบุตัวผู้ป่วย (เก็บช่วงอายุ ไม่เก็บอายุจริง/ค่าสัญญาณชีพดิบ)
create table if not exists public.pews_usage (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  assessed_at     timestamptz not null,
  age_band        text not null check (age_band in ('0-3m','3-12m','1-2y','2-4y','4-6y','6-10y','10-13y','13-16y')),
  behavior_score  smallint not null check (behavior_score between 0 and 3),
  cardio_score    smallint not null check (cardio_score between 0 and 3),
  resp_score      smallint not null check (resp_score between 0 and 3),
  hr_score        smallint not null check (hr_score between 0 and 3),
  skin_score      smallint not null check (skin_score between 0 and 3),
  rr_score        smallint not null check (rr_score between 0 and 3),
  o2_score        smallint not null check (o2_score between 0 and 3),
  wob_score       smallint not null check (wob_score between 0 and 3),
  total_score     smallint not null check (total_score between 0 and 9),
  red_score       boolean not null,
  duration_sec    integer check (duration_sec between 0 and 86400),
  device_type     text not null check (device_type in ('mobile','tablet','desktop'))
);

alter table public.pews_usage enable row level security;
revoke all on table public.pews_usage from anon, authenticated;
grant insert on table public.pews_usage to anon;

drop policy if exists "anon insert only" on public.pews_usage;
create policy "anon insert only" on public.pews_usage for insert to anon with check (true);
