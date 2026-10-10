-- ตารางเก็บสถิติการใช้งาน NEWS2 แบบไม่ระบุตัวผู้ป่วย (หอผู้ป่วยพิเศษ ชั้น 11)
-- ไม่มีคอลัมน์ชื่อ / HN / เลขเตียง / ค่าสัญญาณชีพดิบ

create table if not exists public.news2_usage (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  assessed_at   timestamptz not null,
  rr_score      smallint not null check (rr_score between 0 and 3),
  spo2_score    smallint not null check (spo2_score between 0 and 3),
  o2_score      smallint not null check (o2_score in (0, 2)),
  sbp_score     smallint not null check (sbp_score between 0 and 3),
  pulse_score   smallint not null check (pulse_score between 0 and 3),
  temp_score    smallint not null check (temp_score between 0 and 3),
  avpu_score    smallint not null check (avpu_score in (0, 3)),
  total_score   smallint not null check (total_score between 0 and 20),
  risk_level    text not null check (risk_level in ('none','low','low_medium_red','medium','high')),
  red_score     boolean not null,
  duration_sec  integer check (duration_sec between 0 and 86400),
  device_type   text not null check (device_type in ('mobile','tablet','desktop'))
);

-- เปิด RLS
alter table public.news2_usage enable row level security;

-- ถอนสิทธิ์ทั้งหมดจาก anon / authenticated แล้วให้ anon INSERT อย่างเดียว
revoke all on table public.news2_usage from anon, authenticated;
grant insert on table public.news2_usage to anon;

-- policy: anon insert ได้อย่างเดียว (ไม่มี policy สำหรับ select/update/delete)
drop policy if exists "anon insert only" on public.news2_usage;
create policy "anon insert only"
  on public.news2_usage
  for insert
  to anon
  with check (true);
