-- บันทึกทันทีเมื่อประเมินครบ และอัปเดตแถวเดิมเมื่อแก้ค่า (ระบุแถวด้วยรหัสสุ่มของการประเมินครั้งนั้น)
-- แก้แถวเดิมได้ภายใน 12 ชั่วโมงหลังบันทึกเท่านั้น

alter table public.news2_usage add column if not exists client_key uuid unique;
alter table public.pews_usage  add column if not exists client_key uuid unique;

create or replace function public.news2_save(k uuid, r jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.news2_usage as u (client_key, assessed_at, rr_score, spo2_score, o2_score, sbp_score,
    pulse_score, temp_score, avpu_score, total_score, risk_level, red_score, duration_sec, device_type)
  values (k, (r->>'assessed_at')::timestamptz, (r->>'rr_score')::smallint, (r->>'spo2_score')::smallint,
    (r->>'o2_score')::smallint, (r->>'sbp_score')::smallint, (r->>'pulse_score')::smallint,
    (r->>'temp_score')::smallint, (r->>'avpu_score')::smallint, (r->>'total_score')::smallint,
    r->>'risk_level', (r->>'red_score')::boolean, (r->>'duration_sec')::int, r->>'device_type')
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
    hr_score, skin_score, rr_score, o2_score, wob_score, total_score, red_score, duration_sec, device_type)
  values (k, (r->>'assessed_at')::timestamptz, r->>'age_band', (r->>'behavior_score')::smallint,
    (r->>'cardio_score')::smallint, (r->>'resp_score')::smallint, (r->>'hr_score')::smallint,
    (r->>'skin_score')::smallint, (r->>'rr_score')::smallint, (r->>'o2_score')::smallint,
    (r->>'wob_score')::smallint, (r->>'total_score')::smallint, (r->>'red_score')::boolean,
    (r->>'duration_sec')::int, r->>'device_type')
  on conflict (client_key) do update set
    age_band = excluded.age_band, behavior_score = excluded.behavior_score, cardio_score = excluded.cardio_score,
    resp_score = excluded.resp_score, hr_score = excluded.hr_score, skin_score = excluded.skin_score,
    rr_score = excluded.rr_score, o2_score = excluded.o2_score, wob_score = excluded.wob_score,
    total_score = excluded.total_score, red_score = excluded.red_score, duration_sec = excluded.duration_sec
  where u.created_at > now() - interval '12 hours';
end;
$$;

-- แก้ไขคะแนน PEWS จากหน้ารายงาน (คำนวณหมวด/คะแนนรวมใหม่อัตโนมัติ)
create or replace function public.pews_edit(row_id bigint, beh smallint, hr smallint, skin smallint,
  rr smallint, o2 smallint, wob smallint)
returns public.pews_usage language plpgsql security definer set search_path = ''
as $$
declare
  cv int := greatest(hr, skin);
  rs int := greatest(rr, o2, wob);
  r public.pews_usage;
begin
  update public.pews_usage set behavior_score = beh, hr_score = hr, skin_score = skin, rr_score = rr,
    o2_score = o2, wob_score = wob, cardio_score = cv, resp_score = rs,
    total_score = beh + cv + rs, red_score = 3 in (beh, cv, rs)
  where id = row_id returning * into r;
  if r.id is null then raise exception 'row not found'; end if;
  return r;
end;
$$;

revoke all on function public.news2_save(uuid, jsonb) from public, authenticated;
revoke all on function public.pews_save(uuid, jsonb) from public, authenticated;
revoke all on function public.pews_edit(bigint, smallint, smallint, smallint, smallint, smallint, smallint) from public, authenticated;
grant execute on function public.news2_save(uuid, jsonb) to anon;
grant execute on function public.pews_save(uuid, jsonb) to anon;
grant execute on function public.pews_edit(bigint, smallint, smallint, smallint, smallint, smallint, smallint) to anon;

notify pgrst, 'reload schema';
