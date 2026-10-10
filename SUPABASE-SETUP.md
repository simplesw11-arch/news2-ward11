# การตั้งค่าเก็บสถิติการใช้งาน NEWS2 (Supabase)

ระบบบันทึก 1 แถวอัตโนมัติเมื่อประเมินครบ 7 ข้อ (รอ 3 วินาทีหลังแก้ไขค่าล่าสุด) โดยไม่เก็บชื่อ HN เลขเตียง หรือค่าสัญญาณชีพดิบ เก็บเฉพาะคะแนน

## ขั้นที่ 1 ใส่ Publishable key
1. ใน Supabase ไปที่ **Project Settings → API Keys** คัดลอก **Publishable key** (ขึ้นต้นด้วย `sb_publishable_`)
2. เปิด `news2.html` ค้นหา `PASTE_PUBLISHABLE_KEY_HERE` แล้วแทนที่ด้วย key ที่คัดลอกมา
3. Commit และ push (ระหว่างที่ยังไม่ใส่ key ระบบจะไม่ส่งข้อมูล และเครื่องคำนวณใช้งานได้ตามปกติ)

> ห้ามใช้ **Secret key** หรือ `service_role` ในหน้าเว็บเด็ดขาด

## ขั้นที่ 2 รัน SQL สร้างตาราง
1. เข้า https://supabase.com/dashboard เลือกโปรเจกต์
2. เมนูซ้าย **SQL Editor** → **New query**
3. คัดลอกเนื้อหาทั้งหมดจากไฟล์ `supabase-setup.sql` วางลงไป
4. กด **Run** ต้องขึ้น `Success. No rows returned`
5. ไปที่ **Table Editor** จะเห็นตาราง `news2_usage`

## ขั้นที่ 3 ทดสอบว่าข้อมูลเข้า
1. เปิดหน้า NEWS2 บน GitHub Pages (กดรีเฟรชเพื่อให้ได้ไฟล์ใหม่)
2. กรอกครบทั้ง 7 ข้อ แล้วรอประมาณ 5 วินาที
3. ใน Supabase ไปที่ **Table Editor → news2_usage** กดรีเฟรช ต้องเห็นแถวใหม่ 1 แถว
4. ทดสอบส่งซ้ำ: แก้ค่าโดยไม่กดล้างค่า → ต้องไม่มีแถวเพิ่ม กด **ล้างค่า** แล้วกรอกใหม่ครบ → เพิ่ม 1 แถว
5. ถ้าไม่มีข้อมูลเข้า: บนคอมพิวเตอร์กด F12 → แท็บ **Network** ดูคำขอ `news2_usage`
   - `201` = สำเร็จ
   - `401` = key ผิด
   - `403` / `42501` = สิทธิ์หรือ policy ไม่ถูกต้อง (รัน SQL ขั้นที่ 2 ใหม่)
   - `400` = ค่าไม่ผ่านเงื่อนไขตาราง

ทดสอบว่าบุคคลภายนอกอ่านข้อมูลไม่ได้ (ต้องได้ผลเป็น `[]` หรือ error ไม่ใช่ข้อมูล):
```
curl "https://bouxgjkhlywhxmtuyvpp.supabase.co/rest/v1/news2_usage?select=*" -H "apikey: <PUBLISHABLE_KEY>"
```

## ขั้นที่ 4 Export เป็น CSV
**วิธีที่ 1 (ง่าย):** Table Editor → `news2_usage` → ปุ่ม **Export** (หรือเมนู `…`) → **Export to CSV**

**วิธีที่ 2 (กรองช่วงเวลา):** SQL Editor รันคำสั่งด้านล่าง แล้วกด **Export → Download CSV** ใต้ผลลัพธ์
```sql
select assessed_at at time zone 'Asia/Bangkok' as วันเวลา,
       rr_score, spo2_score, o2_score, sbp_score, pulse_score, temp_score, avpu_score,
       total_score, risk_level, red_score, duration_sec, device_type
from public.news2_usage
where assessed_at >= '2026-10-01' and assessed_at < '2026-11-01'
order by assessed_at;
```
เมื่อเปิดใน Excel ภาษาไทยเพี้ยน ให้ใช้ **Data → From Text/CSV** แล้วเลือก encoding **UTF-8**

## ความหมาย risk_level
| ค่า | ความหมาย |
|---|---|
| none | คะแนน 0 |
| low | 1–4 |
| low_medium_red | 1–4 แต่มี 3 คะแนนในข้อใดข้อหนึ่ง |
| medium | 5–6 |
| high | ≥7 |

หมายเหตุ: Supabase แผนฟรีจะพักโปรเจกต์ถ้าไม่มีการใช้งาน 7 วัน ระหว่างนั้นข้อมูลจะไม่ถูกบันทึก (เครื่องคำนวณยังใช้งานได้) ให้เข้า dashboard กด Restore

## หน้ารายงาน (กดดูและแก้ไขจากเว็บ ไม่ใช้รหัสผ่าน)
1. SQL Editor → วางเนื้อหาไฟล์ `supabase-report.sql` → Run
2. หน้าหลัก → กด **รายงานการใช้งาน** → ข้อมูลเดือนนี้แสดงทันที
3. ตาราง “รายการทั้งหมด” กด **แก้ไข** เปลี่ยนคะแนน → **บันทึก** (คะแนนรวม/ความเสี่ยงคำนวณใหม่อัตโนมัติ)
4. กด **ดาวน์โหลด CSV** เพื่อเอาข้อมูลไปใช้ใน Excel

ข้อควรทราบ: ไม่มีรหัสผ่าน ผู้ที่มีลิงก์ทุกคนดูและแก้คะแนนได้ (ลบแถวไม่ได้)

## PEWS
SQL Editor → วางเนื้อหาไฟล์ `supabase-pews.sql` → Run (ตาราง `pews_usage`)
