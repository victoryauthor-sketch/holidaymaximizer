const HM={data:null,countries:[],subs:{},lang:'en',cache:{},lastTrips:[],lastPlan:null};
const $=s=>document.querySelector(s);

const ADSTERRA_CONFIG={
  enabled:true,
  domainId:6176073,
  units:{"desktopBanner":{"key":"8da4f60a736e13046a9c88be9b8de6bd","width":728,"height":90,"scriptUrl":"https://bauval.org/22/8da4f60a736e13046a9c88be9b8de6bd"},"rectangleBanner":{"key":"17d46e7ef75e864b11e99a78a4ef5046","width":300,"height":250,"scriptUrl":"https://bauval.org/22/17d46e7ef75e864b11e99a78a4ef5046"},"mobileBanner":{"key":"5302600cb2f933f200f0cf885a9bf708","width":320,"height":50,"scriptUrl":"https://bauval.org/22/5302600cb2f933f200f0cf885a9bf708"}}
};

function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function getWorkPattern(){const el=$('#workPattern');return el?el.value:'mon-fri'}
function isWeekend(d,pattern='mon-fri'){
  const day=d.getDay();
  if(pattern==='sun-thu')return day===5||day===6;
  if(pattern==='mon-thu')return day===5||day===6||day===0;
  if(pattern==='tue-sat')return day===0||day===1;
  return day===0||day===6;
}
function fmt(d,withYear=false){return new Intl.DateTimeFormat(HM.lang==='fr'?'fr-FR':'en-GB',{weekday:'short',day:'numeric',month:'short',...(withYear?{year:'numeric'}:{})}).format(d)}
function fmtEfficiency(n){return new Intl.NumberFormat(HM.lang==='fr'?'fr-FR':'en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)}
function baseCode(code){return code.includes('-')?code.split('-')[0]:code}

function setupLanguageSwitch(){
  const links=[...document.querySelectorAll('.lang-switch a')];
  if(!links.length)return;
  const p=location.pathname||'/';
  const tail=location.search+location.hash;
  let en=p.startsWith('/fr/')?(p.slice(3)||'/'):p;
  let fr=p.startsWith('/fr/')?p:('/fr'+(p==='/'?'/':p));
  en=en.replace(/\/{2,}/g,'/');
  fr=fr.replace(/\/{2,}/g,'/');
  for(const a of links){
    const t=a.textContent.trim().toUpperCase();
    if(t==='EN')a.href=en+tail;
    if(t==='FR')a.href=fr+tail;
  }
}

function canonicalHolidayName(code,date,name){
  const cc=baseCode(code),md=date.slice(5);
  const fr=HM.lang==='fr';
  const map={
    DK:{'12-25':fr?'Jour de Noël':'Christmas Day','12-26':fr?'Deuxième jour de Noël':'Second Day of Christmas'},
    GB:{'12-25':fr?'Jour de Noël':'Christmas Day','12-26':'Boxing Day'},
    IE:{'12-25':fr?'Jour de Noël':'Christmas Day','12-26':fr?'Saint-Étienne':"St Stephen's Day"},
    AU:{'12-26':'Boxing Day'},
    NZ:{'12-26':'Boxing Day'},
    CA:{'12-26':'Boxing Day'}
  };
  return map[cc]?.[md]||name;
}

async function apiHolidays(code,year){
  let cc=baseCode(code),key=`${cc}-${year}`;
  if(HM.cache[key])return HM.cache[key];
  const storageKey=`hm-holidays-v13-${key}`;
  try{
    const cached=localStorage.getItem(storageKey);
    if(cached){
      const parsed=JSON.parse(cached);
      if(Array.isArray(parsed.items)&&Date.now()-parsed.saved<86400000){
        HM.cache[key]=parsed.items;
        return parsed.items;
      }
    }
  }catch(e){}
  try{
    let r=await fetch(`https://nagerholidays.com/api/v4/Holidays/${cc}/${year}`,{signal:AbortSignal.timeout(8000)});
    if(!r.ok)return [];
    let a=await r.json();
    HM.cache[key]=a;
    try{localStorage.setItem(storageKey,JSON.stringify({saved:Date.now(),items:a}))}catch(e){}
    return a;
  }catch(e){return []}
}

function normalizeApi(a,region,code){
  return a.filter(h=>(!h.holidayTypes||h.holidayTypes.includes('Public'))&&(region?(h.nationalHoliday||!h.subdivisionCodes||h.subdivisionCodes.includes(region)):h.nationalHoliday!==false)).map(h=>({date:h.date,name:canonicalHolidayName(code,h.date,h.name)}));
}

function optimize(hs,year,budget,minTrip,maxTrip,earliest=null,pattern='mon-fri'){
  const hmap=new Map(hs.map(h=>[h.date,h.name]));
  let cand=[],selectedStart=new Date(year,0,1),selectedEnd=new Date(year,11,31),start=new Date(year-1,11,1),lastStart=new Date(year,11,31),searchEnd=new Date(year+1,0,31);
  for(let d=new Date(start);d<=lastStart;d=addDays(d,1)){
    if(earliest&&d<earliest)continue;
    for(let len=minTrip;len<=maxTrip;len++){
      let e=addDays(d,len-1);
      if(e>searchEnd)break;
      if(e<selectedStart)continue;
      let leave=0,hol=0,weekend=0,days=[];
      for(let x=new Date(d);x<=e;x=addDays(x,1)){
        let key=iso(x),type='work';
        if(hmap.has(key)){type='holiday';hol++}
        else if(isWeekend(x,pattern)){type='weekend';weekend++}
        else leave++;
        days.push({date:new Date(x),type,name:hmap.get(key)||''});
      }
      if(leave<1||leave>budget||hol<1)continue;
      let crossesPrev=d<selectedStart,crossesNext=e>selectedEnd,eff=len/leave,boundaryBonus=(crossesPrev||crossesNext)?2.5:0;
      let score=eff*12+len*.28+hol*.45-(leave/budget)*.15+boundaryBonus;
      cand.push({start:new Date(d),end:e,leave,total:len,hol,weekend,efficiency:eff,score,days,crossesPrev,crossesNext});
    }
  }
  cand.sort((a,b)=>b.score-a.score||b.total-a.total||a.leave-b.leave);
  let out=[];
  const overlaps=(a,b)=>Math.max(a.start,b.start)<=Math.min(a.end,b.end);
  for(let c of cand){
    if(!out.some(o=>overlaps(c,o)))out.push(c);
    if(out.length>=10)break;
  }
  function ensureBoundary(flag){
    let best=cand.find(c=>c[flag]);
    if(!best||out.some(o=>o.start.getTime()===best.start.getTime()&&o.end.getTime()===best.end.getTime())||out.some(o=>overlaps(best,o)))return;
    if(out.length>=10)out.pop();
    out.push(best);
  }
  ensureBoundary('crossesPrev');
  ensureBoundary('crossesNext');
  out.sort((a,b)=>b.score-a.score||b.total-a.total||a.leave-b.leave);
  return out.slice(0,10);
}

function buildAnnualPlan(trips,budget,year){
  let inYear=trips.filter(t=>t.start.getFullYear()===year||t.end.getFullYear()===year);
  let left=budget,picks=[];
  const overlaps=(a,b)=>Math.max(a.start,b.start)<=Math.min(a.end,b.end);
  for(let t of inYear){
    if(t.leave<=left&&!picks.some(p=>overlaps(t,p))){
      picks.push(t);
      left-=t.leave;
    }
  }
  const sortedPicks=[...picks].sort((a,b)=>a.start-b.start);
  const usedLeave=budget-left;
  const totalOff=sortedPicks.reduce((s,t)=>s+t.total,0);
  const totalHol=sortedPicks.reduce((s,t)=>s+t.hol,0);
  return {budget,usedLeave,left,totalOff,totalHol,picks:sortedPicks,multiplier:usedLeave>0?(totalOff/usedLeave):0};
}

function toIcsDate(d){
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function generateIcsContent(tripList,titlePrefix){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HolidayMaximizer.com//Annual Leave Planner//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  tripList.forEach((t,idx)=>{
    const dtStart=toIcsDate(t.start);
    const dtEnd=toIcsDate(addDays(t.end,1));
    const leaveDays=t.days.filter(x=>x.type==='work').map(x=>fmt(x.date,true)).join('; ');
    const hols=[...new Set(t.days.filter(x=>x.type==='holiday').map(x=>x.name))].join(', ');
    const summary=`${titlePrefix}: ${t.total} days off (${t.leave} leave day${t.leave===1?'':'s'})`;
    const desc=`Book annual leave on: ${leaveDays}.\nPublic holidays included: ${hols||'None'}.\nEfficiency multiplier: ${t.efficiency.toFixed(2)}x.\nPlanned via https://holidaymaximizer.com/`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:hm-${dtStart}-${dtEnd}-${idx}@holidaymaximizer.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${summary.replace(/[,;]/g,'')}`,
      `DESCRIPTION:${desc}`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadIcs(icsText,filename){
  const blob=new Blob([icsText],{type:'text/calendar;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},200);
}

function renderAnnualPlanCard(plan,cn,year){
  if(!plan||plan.picks.length<1)return '';
  const fr=HM.lang==='fr';
  return `<aside class="annual-plan-card" aria-label="${fr?'Plan annuel combiné':'Combined annual leave plan'}">
    <div class="annual-plan-top">
      <div>
        <span class="eyebrow">✦ ${fr?'Plan annuel combiné sans chevauchement':'Combined non-overlapping annual plan'}</span>
        <h4>${plan.totalOff} ${fr?'jours de repos au total avec':'total days off using'} ${plan.usedLeave} ${fr?'jours posés sur':'of'} ${plan.budget} (${plan.picks.length} ${fr?'séjours':'breaks'})</h4>
        <p class="annual-plan-sub">${fr?`Il vous reste ${plan.left} jour(s) de congé libre(s) · ${plan.totalHol} jours fériés mobilisés`:`${plan.left} leave day${plan.left===1?'':'s'} still unallocated · ${plan.totalHol} public holidays leveraged`}</p>
      </div>
      <div class="score">
        <strong>${fmtEfficiency(plan.multiplier)}×</strong>
        <span>${fr?'multiplicateur annuel':'combined multiplier'}</span>
      </div>
    </div>
    <ul class="annual-plan-list">
      ${plan.picks.map(t=>{
        const L=t.days.filter(x=>x.type==='work');
        return `<li><strong>${fmt(t.start,true)} → ${fmt(t.end,true)}</strong> (${t.total} ${fr?'jours':'days off'}, ${t.leave} ${fr?'congés':'leave'}) — ${fr?'Poser :':'Book:'} ${L.map(x=>fmt(x.date)).join(', ')}</li>`;
      }).join('')}
    </ul>
    <div class="trip-actions">
      <button type="button" class="chip-btn primary" data-action="export-plan-ics">📅 ${fr?'Exporter tout le plan (.ics)':'Export full-year plan (.ics)'}</button>
      <button type="button" class="chip-btn" data-action="copy-plan">📋 ${fr?'Copier le résumé annuel':'Copy full-year summary'}</button>
    </div>
  </aside>`;
}

function render(t,idx){
  let L=t.days.filter(x=>x.type==='work'),hn=[...new Set(t.days.filter(x=>x.type==='holiday').map(x=>x.name))],crossYear=t.start.getFullYear()!==t.end.getFullYear(),boundary=t.crossesPrev?(HM.lang==='fr'?`Commence en ${t.start.getFullYear()}`:`Starts in ${t.start.getFullYear()}`):t.crossesNext?(HM.lang==='fr'?`Continue en ${t.end.getFullYear()}`:`Continues into ${t.end.getFullYear()}`):'',holidayLabel=hn.length<=3?hn.join(' + '):hn.slice(0,2).join(' + ')+` + ${hn.length-2} ${HM.lang==='fr'?'autre'+(hn.length-2>1?'s':''):'more'}`;
  const fr=HM.lang==='fr';
  return `<article class="trip-card" data-trip-idx="${idx}">
    <div class="trip-top">
      <div>
        <div class="trip-title">${t.total} ${fr?'jours de repos avec':'days off using'} ${t.leave} ${fr?'jour(s) de congé':'leave day'+(t.leave===1?'':'s')}</div>
        <div class="trip-sub">${fmt(t.start,true)} → ${fmt(t.end,true)}${holidayLabel?' · '+holidayLabel:''}</div>
      </div>
      <div class="score">
        <strong>${fmtEfficiency(t.efficiency)}×</strong>
        <span>${fr?'multiplicateur':'days-off multiplier'}</span>
      </div>
    </div>
    <div class="trip-metrics">
      <span class="pill orange">${fr?'Poser':'Book'} ${L.length}</span>
      <span class="pill green">${t.hol} ${fr?'jours fériés':'public holidays'}</span>
      <span class="pill">${t.weekend} ${fr?'jours de week-end':'weekend days'}</span>
      ${boundary?`<span class="pill">${boundary}</span>`:''}
    </div>
    <p class="book-dates"><strong>${fr?'Jours à poser :':'Book these dates:'}</strong> ${L.map(x=>fmt(x.date,true)).join('; ')}</p>
    <div class="trip-days">${t.days.map(x=>`<div class="date-chip ${x.type==='work'?'leave':x.type}" title="${x.name||''}"><small>${fmt(x.date).split(' ')[0]}</small><b>${x.date.getDate()}</b><small>${x.date.toLocaleString(fr?'fr-FR':'en-GB',{month:'short'})}</small>${crossYear?`<small class="chip-year">${x.date.getFullYear()}</small>`:''}</div>`).join('')}</div>
    <div class="trip-actions">
      <button type="button" class="chip-btn" data-action="export-ics" data-idx="${idx}">📅 ${fr?'Ajouter au calendrier (.ics)':'Add to calendar (.ics)'}</button>
      <button type="button" class="chip-btn" data-action="copy-trip" data-idx="${idx}">📋 ${fr?'Copier les dates':'Copy dates for HR'}</button>
    </div>
  </article>`;
}

async function updateRegions(){
  let c=$('#locale'),r=$('#region');
  if(!c||!r)return;
  let cc=baseCode(c.value);
  let names=HM.subs[cc]||[];
  let year=+($('#year')?.value||new Date().getFullYear());
  let api=await apiHolidays(cc,year);
  let used=new Set(api.flatMap(h=>h.subdivisionCodes||[]));
  let local=Object.values(HM.data.locales).filter(x=>x.code.startsWith(cc+'-')).map(x=>({code:x.code,name:x.label.replace(/^.*?—\s*/,''),local:true}));
  let opts=[...local];
  for(let x of names)if(used.has(x.code)&&!opts.some(o=>o.code===x.code))opts.push(x);
  opts.sort((a,b)=>a.name.localeCompare(b.name));
  let prev=new URLSearchParams(location.search).get('region')||'';
  r.innerHTML=`<option value="">${HM.lang==='fr'?'National / toutes les régions':'National / all regions'}</option>`+opts.map(x=>`<option value="${x.code}">${x.name}</option>`).join('');
  r.disabled=!opts.length;
  if(prev&&[...r.options].some(o=>o.value===prev))r.value=prev;
}

function ensureWorkPatternField(){
  const form=$('#plannerForm');
  if(!form||$('#workPattern'))return;
  const fr=HM.lang==='fr';
  const tripRangeField=$('#tripRange')?.closest('.field');
  if(!tripRangeField)return;
  const div=document.createElement('div');
  div.className='field';
  div.innerHTML=`<label for="workPattern">${fr?'Rythme de travail':'Workweek pattern'}</label>
    <select id="workPattern">
      <option value="mon-fri" selected>${fr?'Lun–Ven (week-end Sam–Dim)':'Mon–Fri (Sat–Sun weekend)'}</option>
      <option value="mon-thu">${fr?'Semaine de 4 jours Lun–Jeu (Ven–Dim off)':'4-day week Mon–Thu (Fri–Sun off)'}</option>
      <option value="sun-thu">${fr?'Dim–Jeu (week-end Ven–Sam)':'Sun–Thu (Fri–Sat weekend)'}</option>
      <option value="tue-sat">${fr?'Mar–Sam (week-end Dim–Lun)':'Tue–Sat (Sun–Mon weekend)'}</option>
    </select>`;
  tripRangeField.after(div);
}

async function populate(){
  let loc=$('#locale');
  if(!loc)return;
  ensureWorkPatternField();
  let p=new URLSearchParams(location.search),current=p.get('country')||loc.dataset.default||'DK';
  let displayNames;
  try{displayNames=new Intl.DisplayNames([HM.lang==='fr'?'fr':'en'],{type:'region'})}catch(e){}
  let entries=HM.countries.map(x=>({code:x.code,label:(displayNames&&displayNames.of(x.code))||x.name}));
  entries.sort((a,b)=>a.label.localeCompare(b.label,HM.lang==='fr'?'fr':'en'));
  loc.innerHTML=entries.map(e=>`<option value="${e.code}">${HM.lang==='en'&&e.code==='GB'?'UK':e.label}</option>`).join('');
  loc.value=baseCode(current);
  if(!loc.value)loc.value='DK';
  let y=$('#year'),now=new Date().getFullYear(),defaultYear=(new Date().getMonth()>=9)?now+1:now;
  y.innerHTML=[0,1,2,3,4,5].map(n=>`<option>${now+n}</option>`).join('');
  y.value=p.get('year')||defaultYear;
  if(!y.value)y.value=String(defaultYear);
  let savedRange=p.get('range');
  if(savedRange&&[...$('#tripRange').options].some(o=>o.value===savedRange))$('#tripRange').value=savedRange;
  let savedPattern=p.get('pattern');
  if(savedPattern&&$('#workPattern')&&[...$('#workPattern').options].some(o=>o.value===savedPattern))$('#workPattern').value=savedPattern;
  $('#leave').value=p.get('leave')||20;
  await updateRegions();
  if(current.includes('-')&&$('#region')&&[...$('#region').options].some(o=>o.value===current)){
    $('#region').value=current;
  }
}

async function holidayList(code,region,year){
  let localKey=region&&HM.data.holidays[region]?.[String(year)]?region:(!region&&HM.data.holidays[code]?.[String(year)]?code:null);
  if(localKey)return{items:HM.data.holidays[localKey][String(year)].map(h=>({...h,name:canonicalHolidayName(code,h.date,h.name)})),localKey};
  return{items:normalizeApi(await apiHolidays(code,year),region,code),localKey:null};
}

async function run(){
  const results=$('#results');
  if(!results)return;
  results.setAttribute('aria-busy','true');
  try{
    let code=$('#locale').value,region=$('#region')?.value||'',year=+$('#year').value,budget=Math.min(90,Math.max(1,Math.floor(+$('#leave').value||1))),range=$('#tripRange').value.split('-').map(Number),min=range[0]||3,max=range[1]||30,pattern=getWorkPattern();
    let[previous,current,next]=await Promise.all([holidayList(code,region,year-1),holidayList(code,region,year),holidayList(code,region,year+1)]);
    let seen=new Map();
    [...previous.items,...current.items,...next.items].forEach(h=>seen.set(h.date,h));
    let hs=[...seen.values()];
    let meta=HM.data.locales[current.localKey||code];
    let note=$('#countryNote');
    if(note)note.innerHTML=(meta?`<strong>${meta.label}:</strong> ${meta.note} `:'')+(region?`${HM.lang==='fr'?'Calendrier régional sélectionné.':'Regional calendar selected.'} `:'')+(note.dataset.note||'');
    let today=new Date();today.setHours(0,0,0,0);
    let trips=current.items.length?optimize(hs,year,budget,min,max,year===today.getFullYear()?today:null,pattern):[];
    HM.lastTrips=trips;
    HM.lastPlan=trips.length?buildAnnualPlan(trips,budget,year):null;
    let cn=$('#locale').selectedOptions[0].text,rn=region&&$('#region').selectedOptions[0].text;
    let labelTitle=`${cn}${rn?' — '+rn:''} · ${year}`;
    $('#resultsTitle').textContent=labelTitle;
    $('#resultsMeta').textContent=`${budget} ${HM.lang==='fr'?'jours de congé':'leave days'} · ${min}–${max} ${HM.lang==='fr'?'jours':'day trips'} · ${HM.lang==='fr'?'options indépendantes + plan annuel combiné':'independent options + combined annual plan'}`;
    results.innerHTML=trips.length?(renderAnnualPlanCard(HM.lastPlan,cn,year)+trips.map((t,i)=>render(t,i)).join('')):`<div class="empty"><strong>${HM.lang==='fr'?'Aucune combinaison utile trouvée.':'No useful combination found.'}</strong> ${current.items.length?(HM.lang==='fr'?'Essayez une autre durée de voyage ou un autre budget de congés.':'Try another trip length or leave budget.'):(HM.lang==='fr'?'Aucune donnée de jour férié prise en charge n’a été renvoyée pour ce pays/cette année. Consultez le guide du pays et les sources officielles.':'No supported public-holiday data was returned for this country/year. Check the country guide and official sources.')}</div>`;
    let q=`?country=${code}&year=${year}&leave=${budget}&range=${min}-${max}`+(region?`&region=${encodeURIComponent(region)}`:'')+(pattern!=='mon-fri'?`&pattern=${pattern}`:'');
    history.replaceState(null,'',location.pathname+q);
  }finally{
    results.setAttribute('aria-busy','false');
  }
}

function setupResultActions(){
  const results=$('#results');
  if(!results)return;
  results.addEventListener('click',async(e)=>{
    const btn=e.target.closest('button[data-action]');
    if(!btn)return;
    const action=btn.dataset.action;
    const cn=$('#locale')?.selectedOptions?.[0]?.text||'HolidayMaximizer';
    const year=$('#year')?.value||'2027';
    if(action==='export-ics'){
      const idx=+btn.dataset.idx;
      const t=HM.lastTrips[idx];
      if(!t)return;
      const ics=generateIcsContent([t],`${cn} Leave Break`);
      downloadIcs(ics,`holidaymaximizer-${iso(t.start)}-to-${iso(t.end)}.ics`);
    }else if(action==='export-plan-ics'){
      if(!HM.lastPlan||!HM.lastPlan.picks.length)return;
      const ics=generateIcsContent(HM.lastPlan.picks,`${cn} ${year} Leave Plan`);
      downloadIcs(ics,`holidaymaximizer-${cn.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${year}-plan.ics`);
    }else if(action==='copy-trip'){
      const idx=+btn.dataset.idx;
      const t=HM.lastTrips[idx];
      if(!t)return;
      const L=t.days.filter(x=>x.type==='work').map(x=>fmt(x.date,true)).join('; ');
      const txt=`${t.total} days off (${fmt(t.start,true)} – ${fmt(t.end,true)}, ${t.efficiency.toFixed(2)}x value) using ${t.leave} leave day(s). Book: ${L}`;
      try{await navigator.clipboard.writeText(txt);}catch(_){}
      const orig=btn.textContent;
      btn.textContent=HM.lang==='fr'?'✓ Copié !':'✓ Copied!';
      setTimeout(()=>{btn.textContent=orig},1800);
    }else if(action==='copy-plan'){
      if(!HM.lastPlan||!HM.lastPlan.picks.length)return;
      const lines=HM.lastPlan.picks.map(t=>{
        const L=t.days.filter(x=>x.type==='work').map(x=>fmt(x.date)).join(', ');
        return `• ${fmt(t.start,true)} – ${fmt(t.end,true)} (${t.total} days off, ${t.leave} leave): Book ${L}`;
      });
      const txt=`${cn} ${year} Annual Leave Plan (${HM.lastPlan.totalOff} days off using ${HM.lastPlan.usedLeave}/${HM.lastPlan.budget} leave days):\n`+lines.join('\n');
      try{await navigator.clipboard.writeText(txt);}catch(_){}
      const orig=btn.textContent;
      btn.textContent=HM.lang==='fr'?'✓ Copié !':'✓ Copied!';
      setTimeout(()=>{btn.textContent=orig},1800);
    }
  });
}

function setupNav(){
  const b=$('.menu-toggle'),n=$('.navlinks');
  if(!b||!n)return;
  b.addEventListener('click',()=>{
    const open=n.classList.toggle('open');
    b.setAttribute('aria-expanded',String(open));
    b.textContent=open?(HM.lang==='fr'?'Fermer':'Close'):'Menu';
  });
  n.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    n.classList.remove('open');
    b.setAttribute('aria-expanded','false');
    b.textContent='Menu';
  }));
}

function isEeaOrUkVisitor(){
  try{
    const params=new URLSearchParams(window.location.search);
    if(params.get('eea')==='1')return true;
    if(params.get('eea')==='0')return false;
    const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    return tz.startsWith('Europe/')||tz==='Atlantic/Reykjavik'||tz==='Atlantic/Faroe'||tz==='Atlantic/Canary'||tz==='Atlantic/Madeira';
  }catch(_){
    return true;
  }
}

function clearAdSlots(){
  document.querySelectorAll('.ad-slot').forEach(slot=>{
    slot.classList.remove('ad-active');
    delete slot.dataset.adLoaded;
    slot.innerHTML='';
  });
}

function renderAdSlots(){
  try{
    if(!ADSTERRA_CONFIG.enabled){
      clearAdSlots();
      return;
    }
    const isMobile=window.innerWidth<768;
    const fr=HM.lang==='fr';
    const slots=document.querySelectorAll('.ad-slot[data-ad-slot]');
    slots.forEach(slot=>{
      if(slot.dataset.adLoaded==='1')return;
      const slotId=slot.getAttribute('data-ad-slot');
      let unit=null;
      if(slotId==='M1'){
        unit=ADSTERRA_CONFIG.units.rectangleBanner;
      }else{
        unit=isMobile?ADSTERRA_CONFIG.units.mobileBanner:ADSTERRA_CONFIG.units.desktopBanner;
      }
      if(!unit||!unit.key||!unit.scriptUrl){
        slot.classList.remove('ad-active');
        return;
      }
      slot.dataset.adLoaded='1';
      const label=document.createElement('div');
      label.className='ad-slot-label';
      label.textContent=fr?'Publicité':'Advertisement';

      const iframe=document.createElement('iframe');
      iframe.className='adsterra-frame';
      iframe.width=String(unit.width);
      iframe.height=String(unit.height);
      iframe.scrolling='no';
      iframe.frameBorder='0';
      iframe.title=fr?'Publicité':'Advertisement';
      iframe.style.cssText=`border:0;overflow:hidden;width:${unit.width}px;height:${unit.height}px;max-width:100%;display:block;margin:0 auto;`;
      iframe.srcdoc=`<!doctype html><html><body style="margin:0;padding:0;background:transparent;overflow:hidden;"><script>atOptions={'key':'${unit.key}','format':'iframe','height':${unit.height},'width':${unit.width},'params':{}};<\/script><script src="${unit.scriptUrl}" async onerror="window.parent.postMessage({type:'hm-ad-error',slot:'${slotId}'},'*')"><\/script></body></html>`;

      slot.innerHTML='';
      slot.appendChild(label);
      slot.appendChild(iframe);
      slot.classList.add('ad-active');
    });
  }catch(_){
    clearAdSlots();
  }
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  window.addEventListener('message',(e)=>{
    if(e&&e.data&&e.data.type==='hm-ad-error'&&e.data.slot){
      const slot=document.querySelector(`.ad-slot[data-ad-slot="${e.data.slot}"]`);
      if(slot){
        slot.classList.remove('ad-active');
        slot.innerHTML='';
      }
    }
  });
}

function initConsentAndAds(){
  const STORAGE_KEY='hm_ad_consent';
  let saved=null;
  try{saved=localStorage.getItem(STORAGE_KEY);}catch(_){}
  const fr=HM.lang==='fr';

  function showConsentBanner(){
    let banner=$('#consent-banner');
    if(!banner){
      banner=document.createElement('aside');
      banner.id='consent-banner';
      banner.className='consent-banner';
      banner.setAttribute('role','region');
      banner.setAttribute('aria-label',fr?'Préférences de confidentialité et de cookies':'Cookie and advertising preferences');
      banner.innerHTML=`
        <div class="wrap consent-inner">
          <p class="consent-text"><strong>${fr?'Confidentialité et cookies :':'Privacy &amp; cookies:'}</strong> ${fr?'HolidayMaximizer fonctionne dans votre navigateur. Avec votre accord, notre partenaire publicitaire (Adsterra) peut utiliser des cookies pour afficher des bannières qui financent cet outil gratuit. Voir notre <a href="/fr/privacy/">Politique de confidentialité</a>.':'HolidayMaximizer runs in your browser. With your consent, our advertising partner (Adsterra) may use cookies and device data to show display banners that keep this planner free. See our <a href="/privacy/">Privacy Policy</a>.'}</p>
          <div class="consent-actions">
            <button type="button" class="btn consent-btn-accept" id="consent-accept">${fr?'Accepter les cookies publicitaires':'Accept advertising cookies'}</button>
            <button type="button" class="btn consent-btn-decline" id="consent-decline">${fr?'Essentiels uniquement':'Essential only'}</button>
          </div>
        </div>
      `;
      document.body.appendChild(banner);
      $('#consent-accept')?.addEventListener('click',()=>{
        try{localStorage.setItem(STORAGE_KEY,'granted');}catch(_){}
        banner.remove();
        renderAdSlots();
      });
      $('#consent-decline')?.addEventListener('click',()=>{
        try{localStorage.setItem(STORAGE_KEY,'declined');}catch(_){}
        banner.remove();
        clearAdSlots();
      });
    }
  }

  document.querySelectorAll('[data-open-consent]').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.preventDefault();
      showConsentBanner();
    });
  });

  if(saved==='granted'){
    renderAdSlots();
  }else if(saved==='declined'){
    clearAdSlots();
  }else if(isEeaOrUkVisitor()){
    showConsentBanner();
  }else{
    renderAdSlots();
  }
}

document.addEventListener('DOMContentLoaded',async()=>{
  HM.lang=document.documentElement.lang||'en';
  setupNav();
  setupLanguageSwitch();
  initConsentAndAds();
  if(!document.querySelector('#plannerForm'))return;
  setupResultActions();
  try{
    let[d,c,s]=await Promise.all([
      fetch('/data/holidays-v13.json').then(r=>r.json()),
      fetch('/data/countries.json').then(r=>r.json()),
      fetch('/data/subdivisions.json').then(r=>r.json())
    ]);
    HM.data=d;
    HM.countries=c;
    HM.subs=s;
    await populate();
    $('#locale')?.addEventListener('change',updateRegions);
    $('#year')?.addEventListener('change',updateRegions);
    $('#workPattern')?.addEventListener('change',run);
    $('#plannerForm').addEventListener('submit',e=>{e.preventDefault();run()});
    run();
  }catch(e){
    console.error(e);
    const results=$('#results');
    if(results){
      results.setAttribute('aria-busy','false');
      results.textContent=HM.lang==='fr'?'Impossible de charger le calendrier. Rechargez la page ou consultez les guides.':'The calendar could not load. Reload this page or use the dated country guides below.';
    }
  }
});
