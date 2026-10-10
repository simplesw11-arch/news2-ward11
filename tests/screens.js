// ตรวจทุกหน้าในทุกขนาดจอที่กำหนด: ไม่มี error, ไม่ล้นจอแนวนอน, ปุ่มหลักใช้งานได้
// วิธีรัน: NODE_PATH=$(npm root -g) node tests/screens.js   (ภาพหน้าจอจะอยู่ใน tests/out/)
const pw=require('playwright');
// ENGINES=chromium,webkit (webkit = Safari บน iPhone/iPad; GitHub Actions รันทั้งสอง)
const ENGINES=(process.env.ENGINES||'chromium').split(',');const path=require('path'),fs=require('fs');
const ROOT='file://'+path.resolve(__dirname,'..')+'/',OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});
const SCREENS=[['mobile',360,740,true],['mobile-land',740,360,true],['ipad',820,1180,true],['ipad-land',1180,820,true],['desktop',1280,800,false]];
const PAGES=['index','news2','pews','fall','adl','report'];
const MOCK='[]';
(async()=>{let fail=0;for(const eng of ENGINES){const b=await pw[eng].launch();
for(const [name0,w,h,touch] of SCREENS)for(const pg of PAGES){const name=eng==='chromium'?name0:name0+'-'+eng;if(eng==='webkit'&&name0==='desktop')continue;
const p=await b.newPage({viewport:{width:w,height:h},hasTouch:touch,isMobile:eng==='chromium'?touch&&w<700:undefined});const errs=[];
p.on('pageerror',e=>errs.push(e.message));
await p.route('**supabase**',r=>r.fulfill({status:200,contentType:'application/json',body:MOCK}));
await p.goto(ROOT+pg+'.html');await p.waitForTimeout(300);
try{
if(pg==='news2'){await p.click('#ageq button[data-a="1"]');for(const [k,v] of [['bt','37'],['pr','80'],['rr','16'],['sbp','120'],['spo2','98']])await p.fill(`#c_${k} input`,v);
await p.click('#c_o2 button:first-child');await p.click('#c_avpu button:first-child');if((await p.textContent('#t')).trim()!=='0')errs.push('NEWS2 total≠0')}
if(pg==='pews'){await p.fill('#ageY','3');await p.fill('#hr','100');await p.fill('#rr','30');for(const k of ['beh','skin','o2','wob'])await p.click(`.seg[data-k=${k}] button[data-v="0"]`);if((await p.textContent('#t')).trim()!=='0')errs.push('PEWS total≠0')}
if(pg==='adl'){for(let i=0;i<10;i++)await p.click(`#c${i} button:last-child`);if((await p.textContent('#t')).trim()!=='20')errs.push('ADL total≠20')}
if(pg==='fall'){await p.fill('#age','45');await p.waitForTimeout(100)}
if(pg==='report'){await p.click('#mode button[data-m="pews"]');await p.waitForTimeout(200)}
}catch(e){errs.push('interaction: '+e.message.split('\n')[0])}
await p.evaluate(()=>{document.activeElement&&document.activeElement.blur();document.body.classList.remove('typing')});
const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>w)errs.push(`ล้นจอ ${sw}>${w}`);
await p.screenshot({path:path.join(OUT,`${pg}-${name}.png`)});
console.log((errs.length?'✗':'✓'),name.padEnd(12),pg.padEnd(7),errs.join('; '));if(errs.length)fail++;await p.close()}
await b.close()}console.log(fail?`พบปัญหา ${fail} รายการ`:'ผ่านทั้งหมด');process.exit(fail?1:0)})();
