-- หน้ารายงาน report.html (ไม่ใช้รหัสผ่าน ตามที่หอผู้ป่วยเลือก)
-- อ่านข้อมูลและแก้คะแนนได้ผ่าน 2 ฟังก์ชันนี้เท่านั้น ลบแถวไม่ได้
-- คะแนนรวม / ระดับความเสี่ยง / red score คำนวณใหม่ในฐานข้อมูลทุกครั้งที่แก้

drop function if exists public.news2_report(text, date, date);

create or replace function public.news2_report(date_from date, date_to date)
returns setof public.news2_usage
language sql stable security definer set search_path = ''
as $$
  select * from public.news2_usage u
  where u.assessed_at >= (date_from::timestamp at time zone 'Asia/Bangkok')
    and u.assessed_at <  ((date_to + 1)::timestamp at time zone 'Asia/Bangkok')
  order by u.assessed_at;
$$;

create or replace function public.news2_edit(
  row_id bigint, rr smallint, spo2 smallint, o2 smallint, sbp smallint,
  pulse smallint, temp smallint, avpu smallint)
returns public.news2_usage
language plpgsql security definer set search_path = ''
as $$
declare
  t int := rr + spo2 + o2 + sbp + pulse + temp + avpu;
  red boolean := 3 in (rr, spo2, o2, sbp, pulse, temp, avpu);
  r public.news2_usage;
begin
  update public.news2_usage set
    rr_score = rr, spo2_score = spo2, o2_score = o2, sbp_score = sbp,
    pulse_score = pulse, temp_score = temp, avpu_score = avpu,
    total_score = t, red_score = red,
    risk_level = case when t >= 7 then 'high' when t >= 5 then 'medium'
                      when red then 'low_medium_red' when t >= 1 then 'low' else 'none' end
  where id = row_id
  returning * into r;
  if r.id is null then raise exception 'row not found'; end if;
  return r;
end;
$$;

revoke all on function public.news2_report(date, date) from public, authenticated;
revoke all on function public.news2_edit(bigint, smallint, smallint, smallint, smallint, smallint, smallint, smallint) from public, authenticated;
grant execute on function public.news2_report(date, date) to anon;
grant execute on function public.news2_edit(bigint, smallint, smallint, smallint, smallint, smallint, smallint, smallint) to anon;
