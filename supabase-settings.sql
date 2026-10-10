-- หน้าตั้งค่าผู้ดูแล (settings.html): เปิด/ปิดแบบประเมินในหน้าหลัก
-- ก่อนกด Run ให้เปลี่ยน 'ตั้งรหัสผ่านที่นี่' เป็นรหัสผ่านผู้ดูแล (แนะนำอย่างน้อย 8 ตัวอักษร)
-- เปลี่ยนรหัสผ่านภายหลัง: รันเฉพาะคำสั่ง insert ... on conflict ด้านล่างอีกครั้งด้วยรหัสใหม่

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admin_pin (
  id int primary key default 1 check (id = 1),
  pin_hash text not null
);
insert into private.admin_pin (id, pin_hash)
values (1, encode(sha256(convert_to('ตั้งรหัสผ่านที่นี่', 'UTF8')), 'hex'))
on conflict (id) do update set pin_hash = excluded.pin_hash;

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on table public.app_settings from anon, authenticated;

-- อ่านค่าตั้ง (ทุกคนอ่านได้ ใช้แสดงหน้าหลัก)
create or replace function public.get_settings()
returns jsonb language sql stable security definer set search_path = ''
as $$ select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from public.app_settings $$;

-- ตรวจรหัสผ่าน (ผิดจะหน่วง 1 วินาที กันการเดารหัส)
create or replace function public.check_admin_pin(pin text)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if pin is not null and encode(sha256(convert_to(pin, 'UTF8')), 'hex')
     = (select pin_hash from private.admin_pin where id = 1) then
    return true;
  end if;
  perform pg_sleep(1);
  return false;
end;
$$;

-- บันทึกรายการแบบประเมินที่ซ่อน (ต้องใช้รหัสผ่าน)
create or replace function public.set_hidden_tools(pin text, hidden text[])
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not public.check_admin_pin(pin) then
    raise exception 'invalid pin' using errcode = '28P01';
  end if;
  if exists (select 1 from unnest(hidden) h where h not in ('news2','fall','adl','report')) then
    raise exception 'invalid tool';
  end if;
  insert into public.app_settings (key, value, updated_at)
  values ('hidden_tools', to_jsonb(coalesce(hidden, '{}')), now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return public.get_settings();
end;
$$;

revoke all on function public.get_settings() from public, authenticated;
revoke all on function public.check_admin_pin(text) from public, authenticated;
revoke all on function public.set_hidden_tools(text, text[]) from public, authenticated;
grant execute on function public.get_settings() to anon;
grant execute on function public.check_admin_pin(text) to anon;
grant execute on function public.set_hidden_tools(text, text[]) to anon;

notify pgrst, 'reload schema';
