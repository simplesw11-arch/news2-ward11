// ใช้เฉพาะเว็บทดลอง (/staging/): แสดงแถบเตือน และไม่ส่งข้อมูลเข้าฐานข้อมูลจริง (ใช้ข้อมูลผู้ป่วยจำลองแทน)
(function(){
var css=document.createElement('style');css.textContent='#stgbar{position:sticky;top:0;z-index:99;background:#f08a3c;color:#fff;font:600 14px Prompt,Sarabun,sans-serif;text-align:center;padding:6px 10px}';
document.head.appendChild(css);
document.addEventListener('DOMContentLoaded',function(){var d=document.createElement('div');d.id='stgbar';d.textContent='เว็บทดลอง · ไม่ใช้กับผู้ป่วยจริง';document.body.prepend(d)});
var real=window.fetch.bind(window);
function demo(kind,from,to){var a=new Date(from+'T00:00:00+07:00'),b=new Date(to+'T23:59:00+07:00'),rows=[],n=0,seed=7;
function rnd(k){seed=(seed*9301+49297)%233280;return Math.floor(seed/233280*k)}
for(var t=a.getTime();t<=b.getTime()&&n<400;t+=3600e3*(3+rnd(6))){n++;var d=new Date(t).toISOString();
if(kind==='news2'){var s=[0,1,2,3].map(function(){return rnd(10)<7?0:1+rnd(3)});var o2=rnd(5)?0:2,av=rnd(20)?0:3,tot=s[0]+s[1]+s[2]+s[3]+o2+av,red=s.indexOf(3)>=0||av===3;
rows.push({id:n,assessed_at:d,temp_score:s[0],pulse_score:s[1],rr_score:s[2],sbp_score:s[3],spo2_score:0,o2_score:o2,avpu_score:av,total_score:tot,red_score:red,risk_level:tot>=7?'high':tot>=5?'medium':red?'low_medium_red':tot>=1?'low':'none',duration_sec:20+rnd(40),device_type:['mobile','tablet','desktop'][rnd(3)]})}
else{var be=rnd(4)?0:1+rnd(3),h=rnd(4)?0:1+rnd(3),sk=rnd(5)?0:1,rr=rnd(4)?0:1+rnd(3),o=rnd(6)?0:1+rnd(3),w=rnd(4)?0:1+rnd(3),cv=Math.max(h,sk),rs=Math.max(rr,o,w);
rows.push({id:n,assessed_at:d,age_band:['0-3m','3-12m','1-2y','2-4y','4-6y','6-10y','10-13y','13-15y'][rnd(8)],behavior_score:be,cardio_score:cv,resp_score:rs,hr_score:h,skin_score:sk,rr_score:rr,o2_score:o,wob_score:w,total_score:be+cv+rs,red_score:[be,cv,rs].indexOf(3)>=0,duration_sec:30+rnd(60),device_type:['mobile','tablet'][rnd(2)]})}}
return rows}
window.fetch=function(u,o){u=String(u);if(u.indexOf('supabase.co')<0)return real(u,o);
var body={};try{body=JSON.parse(o&&o.body||'{}')}catch(e){}
var m=u.match(/rpc\/(news2|pews)_report/);
if(m)return Promise.resolve(new Response(JSON.stringify(demo(m[1],body.date_from,body.date_to)),{status:200,headers:{'Content-Type':'application/json'}}));
var J=function(x){return Promise.resolve(new Response(JSON.stringify(x),{status:200,headers:{'Content-Type':'application/json'}}))};
var SK='w11_staging_settings',gs=function(){try{return JSON.parse(localStorage.getItem(SK)||'{}')}catch(_){return{}}};
// เว็บทดลอง: ตั้งค่าเก็บในเครื่องนี้เท่านั้น ไม่ต้องใช้รหัสผ่าน
if(/rpc\/get_settings/.test(u))return J(gs());
if(/rpc\/check_admin_pin/.test(u))return J(true);
if(/rpc\/set_hidden_tools/.test(u)){var st=gs();st.hidden_tools=body.hidden||[];try{localStorage.setItem(SK,JSON.stringify(st))}catch(_){}return J(st)}
var e=u.match(/rpc\/(news2|pews)_edit/);
if(e)return Promise.resolve(new Response(JSON.stringify(Object.assign({id:body.row_id,assessed_at:new Date().toISOString(),total_score:0,risk_level:'none',red_score:false},body)),{status:200,headers:{'Content-Type':'application/json'}}));
return Promise.resolve(new Response(null,{status:204}))};
})();
