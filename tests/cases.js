// ผู้ป่วยจำลอง: กรอกข้อมูลอัตโนมัติแล้วเทียบคะแนน/การแปลผลกับคำตอบที่คำนวณจากเกณฑ์ต้นฉบับ (ไม่ได้คำนวณจากโค้ดของเว็บ)
// วิธีรัน: NODE_PATH=$(npm root -g) node tests/cases.js
const {chromium}=require('playwright');const path=require('path');
// BASE_URL=https://.../ เพื่อทดสอบเว็บจริง (ค่าเริ่มต้น: ไฟล์ในเครื่อง)
const ROOT=process.env.BASE_URL||('file://'+path.resolve(__dirname,'..')+'/');

// NEWS2 (RCP 2017): [ชื่อ, BT, PR, RR, SBP, SpO2, ใช้O2(0/1), AVPU(0=A,1=V,2=P,3=U), คะแนนรวม, คำในผลการแปล]
const NEWS2=[
['ปกติทุกค่า','37.0','80','16','120','98',0,0,0,'ต่ำมาก'],
['คะแนน 1','36.5','100','18','115','96',0,0,1,'ต่ำ (Low)'],
['คะแนน 4 ไม่มีข้อใดได้ 3','38.1','91','12','110','95',0,0,4,'ต่ำ (Low)'],
['V อย่างเดียว (3 ในข้อเดียว)','37','80','16','120','98',0,1,3,'ต่ำ–ปานกลาง'],
['SpO2 91 + O2 = 5','37','80','16','120','91',1,0,5,'ปานกลาง'],
['ไข้ ชีพจรเร็ว หายใจเร็ว = 6','38.5','95','22','105','95',0,0,6,'ปานกลาง'],
['ค่าขอบเขต 36.0/50/8/220 = 8','36.0','50','8','220','96',0,0,8,'สูง'],
['ค่าขอบเขตปกติ 36.1/51/12/111','36.1','51','12','111','96',0,0,0,'ต่ำมาก'],
['วิกฤตหลายระบบ = 12','39.5','120','24','100','92',1,0,12,'สูง'],
['คะแนนสูงสุด 20','35','135','26','85','90',1,2,20,'สูง'],
];
// PEWS: [ชื่อ, ปี, เดือน, HR, RR, พฤติกรรม, สีผิว, O2, การหายใจ, คะแนนรวม, มีหมวดได้3]
const PEWS=[
['3 ปี ปกติ','3','','120','30',0,0,0,0,0,false],
['3 ปี HR+10 RR+10 ง่วง','3','','150','50',1,0,0,0,3,false],
['8 ปี HR+35 RR+22','8','','175','52',0,0,0,0,5,true],
['12 ปี หัวใจเต้นช้า RR ต่ำ 10','12','','50','8',0,0,0,0,6,true],
['2 เดือน เกินไม่ถึง 10 = 0','','2','210','65',0,0,0,0,0,false],
['14 ปี RR+10 O2≥6L สีผิวซีด','14','','100','26',0,1,2,0,3,false],
['6 เดือน severe retraction','','6','100','40',0,0,0,3,3,true],
];
// ADL: คะแนนรวมเป้าหมาย → คำแปลผล
const ADL=[[0,'พึ่งพาโดยสมบูรณ์'],[4,'พึ่งพาโดยสมบูรณ์'],[5,'พึ่งพามาก'],[8,'พึ่งพามาก'],[9,'พึ่งพาปานกลาง'],[11,'พึ่งพาปานกลาง'],[12,'พึ่งพาน้อย'],[20,'พึ่งพาน้อย']];
const ADL_MAX=[2,1,3,2,3,2,2,1,2,2];

(async()=>{const b=await chromium.launch();let fail=0,n=0;
const ok=(c,name,got)=>{n++;if(!c)fail++;console.log((c?'✓':'✗'),name,c?'':'→ ได้ '+got)};
const page=async f=>{const p=await b.newPage({viewport:{width:390,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**supabase**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));await p.goto(ROOT+f);
p.blurAll=()=>p.evaluate(()=>{document.activeElement&&document.activeElement.blur();document.body.classList.remove('typing')});p.errs=errs;return p};
const T=async p=>(await p.textContent('#t')).trim(),Rs=async p=>(await p.textContent('#r')).trim();

{const p=await page('news2.html');
for(const [nm,bt,pr,rr,sbp,spo2,o2,avpu,tot,txt] of NEWS2){await p.blurAll();await p.click('#clr');await p.click('#ageq button[data-a="1"]');
for(const [k,v] of [['bt',bt],['pr',pr],['rr',rr],['sbp',sbp],['spo2',spo2]])await p.fill(`#c_${k} input`,v);
await p.waitForTimeout(500);await p.$eval(`#c_o2 .seg button:nth-child(${o2+1})`,e=>e.click());await p.$eval(`#c_avpu .seg button:nth-child(${avpu+1})`,e=>e.click());
const t=await T(p),r=await Rs(p);ok(t===String(tot)&&r.includes(txt),`NEWS2 ${nm}: ${tot} / ${txt}`,`${t} / ${r}`)}
if(p.errs.length)ok(false,'NEWS2 JavaScript error',p.errs.join(';'));await p.close()}

{const p=await page('pews.html');
for(const [nm,y,m,hr,rr,beh,skin,o2,wob,tot,red] of PEWS){await p.blurAll();await p.click('#clr');
await p.fill('#ageY',y);await p.fill('#ageM',m);await p.fill('#hr',hr);await p.fill('#rr',rr);
for(const [k,v] of [['beh',beh],['skin',skin],['o2',o2],['wob',wob]])await p.click(`.seg[data-k=${k}] button[data-v="${v}"]`);
const t=await T(p),r=await Rs(p);ok(t===String(tot)&&r.includes('มีหมวดที่ได้ 3')===red,`PEWS ${nm}: ${tot}${red?' มีหมวดได้ 3':''}`,`${t} / ${r}`)}
// เลื่อนช่องอัตโนมัติ: พิมพ์ทีละตัวเหมือนผู้ใช้จริง
const act=()=>p.evaluate(()=>document.activeElement&&document.activeElement.id||document.activeElement.tagName);
for(const [nm,y,want] of [['0 ปี → ช่องเดือน','0','ageM'],['1 ปี (รอ 1.5 วิ) → ช่องเดือน','1','ageM'],['5 ปี → ข้ามไปชีพจร','5','hr'],['12 ปี → ข้ามไปชีพจร','12','hr']]){
await p.blurAll();await p.click('#clr');await p.click('#ageY');await p.keyboard.type(y,{delay:60});await p.waitForTimeout(y==='1'?1900:500);ok(await act()===want,`PEWS เลื่อนช่อง: อายุ ${nm}`,await act())}
await p.blurAll();await p.click('#clr');await p.click('#ageY');await p.keyboard.type('0',{delay:60});await p.waitForTimeout(400);await p.keyboard.type('6',{delay:60});await p.waitForTimeout(500);
ok(await act()==='hr','PEWS เลื่อนช่อง: เดือน → ชีพจร',await act());
await p.keyboard.type('120',{delay:60});await p.waitForTimeout(500);ok(await act()==='rr','PEWS เลื่อนช่อง: ชีพจร → อัตราการหายใจ',await act());
await p.keyboard.type('40',{delay:60});await p.waitForTimeout(700);const hl=await p.evaluate(()=>document.getElementById('c_beh').classList.contains('hl'));
ok(hl&&await act()==='BODY','PEWS เลื่อนช่อง: อัตราการหายใจ → หมวดพฤติกรรม',`${await act()} hl=${hl}`);
await p.blurAll();await p.click('#clr');await p.fill('#ageY','15');ok((await p.textContent('#norm')).includes('NEWS2'),'PEWS อายุ 15 ปี → แนะนำ NEWS2','');
if(p.errs.length)ok(false,'PEWS JavaScript error',p.errs.join(';'));await p.close()}

{const p=await page('adl.html');
for(const [tot,txt] of ADL){await p.click('#clr');let left=tot;
for(let i=0;i<10;i++){const v=Math.min(ADL_MAX[i],left);left-=v;await p.click(`#c${i} button[data-v="${v}"]`)}
const t=await T(p),r=await Rs(p);ok(t===String(tot)&&r.includes(txt),`ADL ${tot} คะแนน: ${txt}`,`${t} / ${r}`)}
if(p.errs.length)ok(false,'ADL JavaScript error',p.errs.join(';'));await p.close()}

{const p=await page('fall.html');
const tab=async()=>p.evaluate(()=>document.querySelector('#tabs button.on')?.dataset.k);
for(const [a,k] of [['14','ped'],['15','hen'],['59','hen'],['60','eld']]){await p.blurAll();await p.click('#clr');await p.fill('#age',a);ok(await tab()===k,`Fall อายุ ${a} ปี → แบบ ${k}`,await tab())}
const pick=async(i,j)=>p.click(`#g > .p:nth-child(${i}) .seg button:nth-child(${j})`);
// Humpty Dumpty: ข้อ 1 อายุเลือกอัตโนมัติ, ข้อ 2–8 เลือกตัวเลือกที่ j
for(const [a,j,tot,txt] of [['2',3,11,'ปานกลาง'],['13',3,8,'น้อย'],['2',1,27,'สูง']]){await p.blurAll();await p.click('#clr');await p.fill('#age',a);await p.blurAll();
for(let i=2;i<=8;i++)await pick(i,j===3?(i===3||i===4?4:3):1);const t=await T(p),r=await Rs(p);ok(t===String(tot)&&r.includes(txt),`Fall เด็ก อายุ ${a}: ${tot} ${txt}`,`${t} / ${r}`)}
// Hendrich: ข้อ 1 ปัจจัยเสี่ยง (เลือกได้หลายข้อ), ข้อ 2 Get up & go
for(const [risk,go,tot,txt] of [[[],1,0,'ไม่มีความเสี่ยง'],[[5],2,2,'มีความเสี่ยง'],[[2,5],3,6,'เสี่ยงสูง']]){await p.blurAll();await p.click('#clr');await p.fill('#age','45');await p.blurAll();
for(const j of risk)await pick(1,j);await pick(2,go);const t=await T(p),r=await Rs(p);ok(t===String(tot)&&r.includes(txt),`Fall Hendrich: ${tot} ${txt}`,`${t} / ${r}`)}
// ผู้สูงอายุ: ข้อ 1 อายุอัตโนมัติ, ข้อ 2 ปัจจัยเสี่ยง
for(const [a,risk,tot,txt] of [['70',[3],'1.5','ระดับ 1'],['85',[1],'3','ระดับ 2'],['85',[2],'6','ระดับ 3']]){await p.blurAll();await p.click('#clr');await p.fill('#age',a);await p.blurAll();
for(const j of risk)await pick(2,j);const t=await T(p),r=await Rs(p);ok(t===tot&&r.includes(txt),`Fall ผู้สูงอายุ อายุ ${a}: ${tot} ${txt}`,`${t} / ${r}`)}
if(p.errs.length)ok(false,'Fall JavaScript error',p.errs.join(';'));await p.close()}

// ปุ่มเพิ่มไอคอนบนหน้าจอ: แสดงขั้นตอนตามอุปกรณ์/เบราว์เซอร์
for(const [nm,ua,w,want] of [
['iPhone Safari','Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',360,'Safari'],
['iPhone Chrome','Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1',360,'Chrome'],
['Android','Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',360,'Android'],
['LINE','Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/13.0',360,'LINE'],
['คอมพิวเตอร์','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/120.0',1280,'คอมพิวเตอร์']]){
const ctx=await b.newContext({userAgent:ua,viewport:{width:w,height:740}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(ROOT+'index.html');await p.click('#inst');const sub=await p.textContent('#ms'),vis=await p.isVisible('#mbg');const qr=await p.evaluate(()=>{const i=document.querySelector('.qr img');return i.complete&&i.naturalWidth>0&&i.getBoundingClientRect().width>=150});
const fits=await p.evaluate(()=>{const r=document.querySelector('.mdl').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth});
await p.click('#mx');const closed=await p.isHidden('#mbg');
ok(vis&&sub.includes(want)&&qr&&fits&&closed&&!errs.length,`ปุ่มเพิ่มไอคอน + QR: ${nm}`,`${sub} visible=${vis} qr=${qr} fits=${fits} closed=${closed} ${errs.join(';')}`);await ctx.close()}

await b.close();console.log(fail?`ไม่ผ่าน ${fail} จาก ${n} กรณี`:`ผ่านทั้งหมด ${n} กรณี`);process.exit(fail?1:0)})();
