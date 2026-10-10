-- หน้ารายงาน report.html: อ่านข้อมูลได้เฉพาะผ่านฟังก์ชันนี้ และต้องใส่รหัสผ่านถูกต้อง
-- ก่อนกด Run ให้เปลี่ยน 'ตั้งรหัสผ่านที่นี่' เป็นรหัสผ่านที่ต้องการ (แนะนำอย่างน้อย 8 ตัวอักษร)

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.report_settings (
  id int primary key default 1 check (id = 1),
  pin_hash text not null
);

insert into private.report_settings (id, pin_hash)
values (1, encode(sha256(convert_to('ตั้งรหัสผ่านที่นี่', 'UTF8')), 'hex'))
on conflict (id) do update set pin_hash = excluded.pin_hash;

create or replace function public.news2_report(pin text, date_from date, date_to date)
returns setof public.news2_usage
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pin is null or encode(sha256(convert_to(pin, 'UTF8')), 'hex')
     is distinct from (select pin_hash from private.report_settings where id = 1) then
    perform pg_sleep(1);
    raise exception 'invalid pin' using errcode = '28P01';
  end if;
  return query
    select * from public.news2_usage u
    where u.assessed_at >= (date_from::timestamp at time zone 'Asia/Bangkok')
      and u.assessed_at <  ((date_to + 1)::timestamp at time zone 'Asia/Bangkok')
    order by u.assessed_at;
end;
$$;

revoke all on function public.news2_report(text, date, date) from public, authenticated;
grant execute on function public.news2_report(text, date, date) to anon;
