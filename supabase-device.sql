-- เก็บระบบปฏิบัติการ (iOS/Android/Windows/Mac) และรหัสเครื่องแบบสุ่ม (นับจำนวนเครื่องที่ใช้งาน ไม่ระบุตัวบุคคล)
-- รันได้ทันที ไม่ต้องแก้อะไร · ข้อมูลเก่าจะไม่มีค่าในคอลัมน์ใหม่

alter table public.news2_usage add column if not exists os text check (os in ('ios','android','windows','mac','other'));
alter table public.news2_usage add column if not exists device_id uuid;
alter table public.pews_usage  add column if not exists os text check (os in ('ios','android','windows','mac','other'));
alter table public.pews_usage  add column if not exists device_id uuid;

create or replace function public.news2_save(k uuid, r jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.news2_usage as u (client_key, assessed_at, rr_score, spo2_score, o2_score, sbp_score,
    pulse_score, temp_score, avpu_score, total_score, risk_level, red_score, duration_sec, device_type, os, device_id)
  values (k, (r->>'assessed_at')::timestamptz, (r->>'rr_score')::smallint, (r->>'spo2_score')::smallint,
    (r->>'o2_score')::smallint, (r->>'sbp_score')::smallint, (r->>'pulse_score')::smallint,
    (r->>'temp_score')::smallint, (r->>'avpu_score')::smallint, (r->>'total_score')::smallint,
    r->>'risk_level', (r->>'red_score')::boolean, (r->>'duration_sec')::int, r->>'device_type',
    r->>'os', (r->>'device_id')::uuid)
  on conflict (client_key) do update set
    rr_score = excluded.rr_score, spo2_score = excluded.spo2_score, o2_score = excluded.o2_score,
    sbp_score = excluded.sbp_score, pulse_score = excluded.pulse_score, temp_score = excluded.temp_score,
    avpu_score = excluded.avpu_score, total_score = excluded.total_score, risk_level = excluded.risk_level,
    red_score = excluded.red_score, duration_sec = excluded.duration_sec
  where u.created_at > now() - interval '12 hours';
end;
$$;

create or replace function public.pews_save(k uuid, r jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.pews_usage as u (client_key, assessed_at, age_band, behavior_score, cardio_score, resp_score,
    hr_score, skin_score, rr_score, o2_score, wob_score, total_score, red_score, duration_sec, device_type, os, device_id)
  values (k, (r->>'assessed_at')::timestamptz, r->>'age_band', (r->>'behavior_score')::smallint,
    (r->>'cardio_score')::smallint, (r->>'resp_score')::smallint, (r->>'hr_score')::smallint,
    (r->>'skin_score')::smallint, (r->>'rr_score')::smallint, (r->>'o2_score')::smallint,
    (r->>'wob_score')::smallint, (r->>'total_score')::smallint, (r->>'red_score')::boolean,
    (r->>'duration_sec')::int, r->>'device_type',
    r->>'os', (r->>'device_id')::uuid)
  on conflict (client_key) do update set
    age_band = excluded.age_band, behavior_score = excluded.behavior_score, cardio_score = excluded.cardio_score,
    resp_score = excluded.resp_score, hr_score = excluded.hr_score, skin_score = excluded.skin_score,
    rr_score = excluded.rr_score, o2_score = excluded.o2_score, wob_score = excluded.wob_score,
    total_score = excluded.total_score, red_score = excluded.red_score, duration_sec = excluded.duration_sec
  where u.created_at > now() - interval '12 hours';
end;
$$;

notify pgrst, 'reload schema';
