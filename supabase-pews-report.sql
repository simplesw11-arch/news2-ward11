-- ให้หน้ารายงานอ่านข้อมูล PEWS ได้ (อ่านอย่างเดียว ผ่านฟังก์ชันนี้เท่านั้น)
create or replace function public.pews_report(date_from date, date_to date)
returns setof public.pews_usage
language sql stable security definer set search_path = ''
as $$
  select * from public.pews_usage u
  where u.assessed_at >= (date_from::timestamp at time zone 'Asia/Bangkok')
    and u.assessed_at <  ((date_to + 1)::timestamp at time zone 'Asia/Bangkok')
  order by u.assessed_at;
$$;

revoke all on function public.pews_report(date, date) from public, authenticated;
grant execute on function public.pews_report(date, date) to anon;
