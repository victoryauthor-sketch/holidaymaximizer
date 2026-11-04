const HM={data:null,locale:null,year:null};
const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
function parseDate(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function fmt(d,opts={}){return new Intl.DateTimeFormat('en',{day:'numeric',month:'short',...opts}).format(d)}
function isWeekend(d){return d.getDay()===0||d.getDay()===6}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function diffDays(a,b){return Math.round((b-a)/86400000)+1}
function optimize(code,year,budget,maxTrip){const hs=HM.data.holidays[code][String(year)]||[];const hmap=new Map(hs.map(h=>[h.date,h.name]));let cand=[];const start=new Date(year,0,1),end=new Date(year,11,31);
 for(let d=new Date(start);d<=end;d=addDays(d,1)){
  for(let len=3;len<=maxTrip;len++){
   const e=addDays(d,len-1); if(e>end) break;
   let leave=0,hol=0,weekend=0;let days=[];
   for(let x=new Date(d);x<=e;x=addDays(x,1)){const key=iso(x);let type='work';if(hmap.has(key)){type='holiday';hol++}else if(isWeekend(x)){type='weekend';weekend++}else leave++;days.push({date:new Date(x),type,name:hmap.get(key)||''})}
   if(leave<1||leave>budget||hol<1) continue;
   const efficiency=len/leave; const boundaryBonus=(isWeekend(d)||hmap.has(iso(d))?0.1:0)+(isWeekend(e)||hmap.has(iso(e))?0.1:0);
   const score=efficiency*10+Math.min(len,14)*.22+hol*.35+boundaryBonus;
   cand.push({start:new Date(d),end:new Date(e),leave,total:len,hol,weekend,efficiency,score,days});
  }
 }
 cand.sort((a,b)=>b.score-a.score||b.total-a.total||a.leave-b.leave);
 const out=[]; for(const c of cand){const overlaps=out.some(o=>Math.max(0,Math.min(c.end,o.end)-Math.max(c.start,o.start))/86400000>Math.min(c.total,o.total)*.45); if(!overlaps) out.push(c); if(out.length>=8)break}
 return out;
}
function renderTrip(t,i){const leaveDates=t.days.filter(x=>x.type==='work').map(x=>x.date);const holidays=t.days.filter(x=>x.type==='holiday');let hnames=[...new Set(holidays.map(x=>x.name))];return `<article class="trip-card"><div class="trip-top"><div><div class="trip-title">${t.total} days off using ${t.leave} leave day${t.leave===1?'':'s'}</div><div class="trip-sub">${fmt(t.start,{weekday:'short'})} ${fmt(t.start)} → ${fmt(t.end,{weekday:'short'})} ${fmt(t.end)}${hnames.length?` · around ${hnames.slice(0,2).join(' + ')}`:''}</div></div><div class="score"><strong>${t.efficiency.toFixed(2)}×</strong><span>days-off multiplier</span></div></div><div class="trip-metrics"><span class="pill orange">Book ${leaveDates.length} day${leaveDates.length===1?'':'s'}</span><span class="pill green">${t.hol} public holiday${t.hol===1?'':'s'}</span><span class="pill">${t.weekend} weekend days</span></div><div class="trip-days">${t.days.map(x=>`<div class="date-chip ${x.type==='work'?'leave':x.type}" title="${x.name|| (x.type==='work'?'Book annual leave':'Weekend')}"><small>${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][x.date.getDay()]}</small><b>${x.date.getDate()}</b><small>${x.date.toLocaleString('en',{month:'short'})}</small></div>`).join('')}</div></article>`}
function populate(){const loc=$('#locale'), yr=$('#year');if(!loc||!yr)return;const groups={};Object.values(HM.data.locales).forEach(l=>(groups[l.region]??=[]).push(l));loc.innerHTML=Object.entries(groups).map(([g,ls])=>`<optgroup label="${g}">${ls.map(l=>`<option value="${l.code}">${l.label}</option>`).join('')}</optgroup>`).join('');yr.innerHTML=HM.data.years.map(y=>`<option>${y}</option>`).join('');const p=new URLSearchParams(location.search);loc.value=p.get('country')||loc.dataset.default||'DK';yr.value=p.get('year')||yr.dataset.default||Math.max(new Date().getFullYear(),2027);$('#leave').value=p.get('leave')||20;$('#maxTrip').value=p.get('max')||16}
function run(){const code=$('#locale').value,year=Number($('#year').value),budget=Math.max(1,Number($('#leave').value)),maxTrip=Math.max(5,Number($('#maxTrip').value));const meta=HM.data.locales[code];const trips=optimize(code,year,budget,maxTrip);$('#countryNote').innerHTML=`<strong>${meta.label}:</strong> ${meta.note} <span>This is a planning aid—always confirm dates and entitlement with official/local sources and your employer.</span>`;$('#resultsTitle').textContent=`Best leave combinations for ${meta.label}, ${year}`;$('#resultsMeta').textContent=`Up to ${budget} leave days · trips up to ${maxTrip} days`;$('#results').innerHTML=trips.length?trips.map(renderTrip).join(''):`<div class="empty"><strong>No combinations found</strong>Try a larger trip length or leave budget.</div>`;history.replaceState(null,'',`${location.pathname}?country=${encodeURIComponent(code)}&year=${year}&leave=${budget}&max=${maxTrip}#planner`)}
async function init(){HM.data=await fetch('/data/holidays.json').then(r=>r.json());populate();$('#plannerForm')?.addEventListener('submit',e=>{e.preventDefault();run()});if($('#results'))run()}
document.addEventListener('DOMContentLoaded',init);
