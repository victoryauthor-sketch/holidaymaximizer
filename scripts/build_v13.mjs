import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = 'C:/Users/HP-User/.gemini/antigravity/scratch/holidaymaximizer';
const V12_SRC = 'C:/Users/HP-User/Documents/Codex/2026-10-17/yo/work/release';
const TODAY = '2026-11-04';
const GSC_VERIFICATION = 'uBlwh9aRM-wKTubHzWG6-WVt3_PWccE_kHOQRorzKEE';

const ADSTERRA_UNITS = {
  desktopBanner: {
    key: '8da4f60a736e13046a9c88be9b8de6bd',
    width: 728,
    height: 90,
    scriptUrl: 'https://bauval.org/22/8da4f60a736e13046a9c88be9b8de6bd'
  },
  rectangleBanner: {
    key: '17d46e7ef75e864b11e99a78a4ef5046',
    width: 300,
    height: 250,
    scriptUrl: 'https://bauval.org/22/17d46e7ef75e864b11e99a78a4ef5046'
  },
  mobileBanner: {
    key: '5302600cb2f933f200f0cf885a9bf708',
    width: 320,
    height: 50,
    scriptUrl: 'https://bauval.org/22/5302600cb2f933f200f0cf885a9bf708'
  }
};

const REGION_SLUGS = {
  'DK': 'denmark',
  'GB-ENG': 'united-kingdom-england-wales',
  'GB-SCT': 'united-kingdom-scotland',
  'GB-NIR': 'united-kingdom-northern-ireland',
  'IE': 'ireland',
  'DE-BE': 'germany-berlin',
  'DE-BY': 'germany-bavaria',
  'DE-NW': 'germany-north-rhine-westphalia',
  'DE-HH': 'germany-hamburg',
  'DE-SN': 'germany-saxony',
  'FR': 'france',
  'IT': 'italy',
  'NL': 'netherlands',
  'BE': 'belgium',
  'AT': 'austria',
  'SE': 'sweden',
  'NO': 'norway',
  'FI': 'finland',
  'US': 'united-states-federal',
  'CA': 'canada-federal',
  'AU-NSW': 'australia-new-south-wales',
  'AU-VIC': 'australia-victoria',
  'AU-QLD': 'australia-queensland'
};

const FLAGSHIP_CFG = {
  DK: {
    name: 'Denmark',
    key: 'DK',
    scope: 'National calendar',
    url: 'https://www.nationalbanken.dk/en/what-we-do/stable-prices-monetary-policy-and-the-danish-economy/bank-holidays',
    authority: 'Danmarks Nationalbank',
    note: 'Bank closure dates are not all general days off. This model excludes 5 June, Christmas Eve, New Year’s Eve and the Friday after Ascension. Check your contract for extra days.',
    focus: 'Easter combines three weekday holidays in 2027 (Maundy Thursday, Good Friday and Easter Monday). Ascension Day on Thursday 6 May creates a classic four-day bridge weekend by booking Friday 7 May.'
  },
  GB: {
    name: 'UK',
    key: 'GB-ENG',
    scope: 'England and Wales',
    url: 'https://www.gov.uk/bank-holidays',
    authority: 'GOV.UK',
    note: 'These examples use England and Wales. Choose Scotland or Northern Ireland in the planner for a different calendar. Bank holidays can be included in your statutory leave allowance; enter the days still available to book.',
    focus: 'In 2027, Good Friday (26 March) and Easter Monday (29 March) anchor a high-efficiency 10-day spring break for just 4 leave days, while substitute bank holidays for Christmas and Boxing Day fall on Monday 27 and Tuesday 28 December.'
  },
  IE: {
    name: 'Ireland',
    key: 'IE',
    scope: 'National calendar',
    url: 'https://www.workplacerelations.ie/en/what_you_should_know/public-holidays/',
    authority: 'Workplace Relations Commission',
    note: 'Good Friday is not a statutory public holiday in Ireland. A weekend holiday does not automatically make the following Monday a day off; your employer determines the applicable benefit.',
    focus: 'St Brigid’s Day (Monday 1 February), St Patrick’s Day (Wednesday 17 March), and Easter Monday (29 March) provide three distinct spring leverage windows in 2027.'
  },
  DE: {
    name: 'Germany',
    key: 'DE-BE',
    scope: 'Berlin & regional calendars',
    url: 'https://www.berlin.de/en/tourism/travel-information/1887651-2862820-public-holidays-school-holidays.en.html',
    authority: 'Berlin.de',
    note: 'Germany has no single complete state calendar. These baseline calculations use Berlin (including 8 March). Select Bavaria, North Rhine-Westphalia, Hamburg or Saxony below or in the planner for state-specific holidays such as Corpus Christi, Epiphany or Reformation Day.',
    focus: 'International Women’s Day falls on Monday 8 March 2027 in Berlin, while Good Friday (26 March), Easter Monday (29 March), Ascension Day (Thursday 6 May) and Whit Monday (17 May) offer high-multiplier bridge weeks across all German states.'
  },
  FR: {
    name: 'France',
    key: 'FR',
    scope: 'Metropolitan national calendar',
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2405',
    authority: 'Service Public',
    note: 'These examples assume the listed holidays are non-working days for you. Whit Monday may be worked under solidarity-day arrangements. Alsace-Moselle and overseas calendars need local checking.',
    focus: 'Ascension Day (Thursday 6 May 2027), Bastille Day (Wednesday 14 July) and Armistice Day (Thursday 11 November) provide prime French “faire le pont” bridge opportunities.'
  },
  NL: {
    name: 'Netherlands',
    key: 'NL',
    scope: 'Bundled planning calendar',
    url: 'https://www.government.nl/themes/work/working-hours/question-and-answer/work/public-holidays-in-the-netherlands',
    authority: 'Government.nl',
    note: 'A public holiday does not automatically entitle you to time off. This calendar assumes Liberation Day is off but excludes Good Friday; check your CAO or contract before using those results.',
    focus: 'King’s Day falls on Tuesday 27 April 2027, followed the next week by Liberation Day (Wednesday 5 May) and Ascension Day (Thursday 6 May) for workers whose CAO grants Liberation Day off.'
  },
  IT: {
    name: 'Italy',
    key: 'IT',
    scope: 'National calendar',
    url: 'https://www.italia.it/en/italy/practical-information/time-zones-and-public-holidays-italy',
    authority: 'Italia.it',
    extra: 'https://www.normattiva.it/eli/id/2025/10/10/25G00153/CONSOLIDATED',
    note: 'Local patron-saint holidays are not included. The calendar includes 4 October, the national holiday for St Francis of Assisi effective from 2026 under Law 151/2025.',
    focus: 'Epiphany falls on Wednesday 6 January 2027, Republic Day on Wednesday 2 June, St Francis of Assisi on Monday 4 October, and Immaculate Conception on Wednesday 8 December—creating strong mid-week and long-weekend bridges throughout the year.'
  },
  US: {
    name: 'United States',
    key: 'US',
    scope: 'Federal observed calendar, Monday–Friday schedule',
    url: 'https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/',
    authority: 'U.S. Office of Personnel Management',
    note: 'Federal holidays are not a promise of paid time off for private-sector workers. Check which dates your employer observes. State-specific days are not included in these examples.',
    focus: 'In 2027, observed federal holidays include Friday 18 June (Juneteenth), Monday 5 July (Independence Day), Thursday 11 November (Veterans Day), Thursday 25 November (Thanksgiving) and Friday 24 December (Christmas Day observed).'
  },
  AT: {
    name: 'Austria',
    key: 'AT',
    scope: 'National calendar',
    url: 'https://www.bmeia.gv.at/fileadmin/user_upload/Vertretungen/Kopenhagen/Aktuelles/Feiertage_2025-2027.pdf',
    authority: 'Austrian Foreign Ministry holiday calendar',
    note: 'These examples use the nationwide calendar, not school holidays or additional local patron-saint days. A weekend holiday is not automatically moved to Monday in this model.',
    focus: 'Austria’s 2027 calendar features Epiphany on Wednesday 6 January, Ascension on Thursday 6 May, Corpus Christi on Thursday 27 May, National Day on Tuesday 26 October (classic “Fenstertag” on Monday 25 October) and Immaculate Conception on Wednesday 8 December.'
  },
  BE: {
    name: 'Belgium',
    key: 'BE',
    scope: 'National dates before employer replacement days',
    url: 'https://employment.belgium.be/en/themes/international/posting/working-conditions-be-respected-case-posting-belgium/public-holidays',
    authority: 'Belgian FPS Employment',
    note: 'Weekend or usual non-working-day holidays require replacement days under applicable arrangements. This model does not invent those dates: ask your employer and adjust your booking accordingly.',
    focus: 'Ascension Day (Thursday 6 May 2027), Whit Monday (17 May), Belgian National Day (Wednesday 21 July) and Armistice Day (Thursday 11 November) anchor Belgium’s highest-value weekday combinations.'
  },
  CA: {
    name: 'Canada',
    key: 'CA',
    scope: 'Federal holiday calendar',
    url: 'https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html',
    authority: 'Government of Canada',
    note: 'Provincial and territorial statutory holidays vary (for example Family Day, Civic Holiday, Boxing Day and St. Jean Baptiste Day). Use the subdivision selector in the planner to include provincial holidays.',
    focus: 'Canada Day falls on Thursday 1 July 2027, National Day for Truth and Reconciliation on Thursday 30 September, Remembrance Day on Thursday 11 November, and the federal Christmas substitute day on Monday 27 December.'
  },
  AU: {
    name: 'Australia',
    key: 'AU-NSW',
    scope: 'New South Wales & state calendars',
    url: 'https://www.fairwork.gov.au/employment-conditions/public-holidays',
    authority: 'Fair Work Ombudsman',
    note: 'Australian public holidays are legislated at the state and territory level. These examples use New South Wales; dedicated guides for Victoria and Queensland are linked below and selectable in the planner.',
    focus: 'Australia Day falls on Tuesday 26 January 2027 (a 4-day weekend for 1 leave day on Monday 25 January), Easter runs 26–29 March, and substitute days for Christmas and Boxing Day fall on Monday 27 and Tuesday 28 December 2027.'
  },
  SE: {
    name: 'Sweden',
    key: 'SE',
    scope: 'National public holidays',
    url: 'https://www.government.se/contentassets/eaf3467d4f484c9fb7274a067484c759/1977_480-annual-leave-act.pdf',
    authority: 'Government Offices of Sweden',
    note: 'Many Swedish collective agreements grant half-days or de facto days off on Midsummer Eve, Christmas Eve and New Year’s Eve, plus “klämdagar” (squeeze days). Confirm your agreement before booking.',
    focus: 'Epiphany falls on Wednesday 6 January 2027 (allowing a 9-day break for 4 leave days), Easter combines Good Friday and Easter Monday (26–29 March), and Ascension Day falls on Thursday 6 May.'
  },
  NO: {
    name: 'Norway',
    key: 'NO',
    scope: 'National public holidays',
    url: 'https://www.arbeidstilsynet.no/en/working-hours-and-organisation-of-work/holiday/',
    authority: 'Norwegian Labour Inspection Authority (Arbeidstilsynet)',
    note: 'Norway’s statutory holiday law counts 25 working days including Saturdays (4 weeks + 1 day, or 5 weeks under most collective agreements). Maundy Thursday and Good Friday are both full public holidays.',
    focus: 'Easter 2027 in Norway includes Maundy Thursday (25 March), Good Friday (26 March) and Easter Monday (29 March), turning 3 leave days (22–24 March) into 10 consecutive days off.'
  },
  FI: {
    name: 'Finland',
    key: 'FI',
    scope: 'National public holidays',
    url: 'https://www.suomi.fi/citizen/work-unemployment-and-finances/rules-of-working-life/guide/working-time-annual-holidays-and-time-off/earning-annual-holiday',
    authority: 'Suomi.fi',
    note: 'Finnish collective agreements frequently treat Midsummer Eve and Christmas Eve as paid days off even where statutory rules differ, and annual leave accrual is often counted on a 6-day Mon–Sat basis.',
    focus: 'Epiphany (Wednesday 6 January 2027), Easter (26–29 March), Ascension Day (Thursday 6 May) and Independence Day (Monday 6 December) create four high-leverage breaks across the Finnish calendar.'
  }
};

async function walkHtml(dir) {
  let out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkHtml(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const fmtDate = s => new Date(s + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtWeekday = s => new Date(s + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' });
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function main() {
  console.log('1. Loading holiday data...');
  const data = JSON.parse(await fs.readFile(`${V12_SRC}/data/holidays-v12.json`, 'utf8'));
  const verifiedLeave = JSON.parse(await fs.readFile(`${V12_SRC}/data/leave-verified.json`, 'utf8'));

  // Write holidays-v13.json
  await fs.writeFile(`${ROOT}/data/holidays-v13.json`, JSON.stringify(data));

  console.log('2. Building assets/app-v13.js and assets/style-v13.css...');
  const appV13 = `const HM={data:null,countries:[],subs:{},lang:'en',cache:{},lastTrips:[],lastPlan:null};
const $=s=>document.querySelector(s);

const ADSTERRA_CONFIG={
  enabled:true,
  domainId:6176073,
  units:${JSON.stringify(ADSTERRA_UNITS)}
};

function iso(d){return \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`}
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
  en=en.replace(/\\/{2,}/g,'/');
  fr=fr.replace(/\\/{2,}/g,'/');
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
  let cc=baseCode(code),key=\`\${cc}-\${year}\`;
  if(HM.cache[key])return HM.cache[key];
  const storageKey=\`hm-holidays-v13-\${key}\`;
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
    let r=await fetch(\`https://nagerholidays.com/api/v4/Holidays/\${cc}/\${year}\`,{signal:AbortSignal.timeout(8000)});
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
  return \`\${d.getFullYear()}\${String(d.getMonth()+1).padStart(2,'0')}\${String(d.getDate()).padStart(2,'0')}\`;
}

function generateIcsContent(tripList,titlePrefix){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HolidayMaximizer.com//Annual Leave Planner//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}/,'');
  tripList.forEach((t,idx)=>{
    const dtStart=toIcsDate(t.start);
    const dtEnd=toIcsDate(addDays(t.end,1));
    const leaveDays=t.days.filter(x=>x.type==='work').map(x=>fmt(x.date,true)).join('; ');
    const hols=[...new Set(t.days.filter(x=>x.type==='holiday').map(x=>x.name))].join(', ');
    const summary=\`\${titlePrefix}: \${t.total} days off (\${t.leave} leave day\${t.leave===1?'':'s'})\`;
    const desc=\`Book annual leave on: \${leaveDays}.\\nPublic holidays included: \${hols||'None'}.\\nEfficiency multiplier: \${t.efficiency.toFixed(2)}x.\\nPlanned via https://holidaymaximizer.com/\`;
    lines.push(
      'BEGIN:VEVENT',
      \`UID:hm-\${dtStart}-\${dtEnd}-\${idx}@holidaymaximizer.com\`,
      \`DTSTAMP:\${stamp}\`,
      \`DTSTART;VALUE=DATE:\${dtStart}\`,
      \`DTEND;VALUE=DATE:\${dtEnd}\`,
      \`SUMMARY:\${summary.replace(/[,;]/g,'')}\`,
      \`DESCRIPTION:\${desc}\`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\\r\\n');
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
  return \`<aside class="annual-plan-card" aria-label="\${fr?'Plan annuel combiné':'Combined annual leave plan'}">
    <div class="annual-plan-top">
      <div>
        <span class="eyebrow">✦ \${fr?'Plan annuel combiné sans chevauchement':'Combined non-overlapping annual plan'}</span>
        <h4>\${plan.totalOff} \${fr?'jours de repos au total avec':'total days off using'} \${plan.usedLeave} \${fr?'jours posés sur':'of'} \${plan.budget} (\${plan.picks.length} \${fr?'séjours':'breaks'})</h4>
        <p class="annual-plan-sub">\${fr?\`Il vous reste \${plan.left} jour(s) de congé libre(s) · \${plan.totalHol} jours fériés mobilisés\`:\`\${plan.left} leave day\${plan.left===1?'':'s'} still unallocated · \${plan.totalHol} public holidays leveraged\`}</p>
      </div>
      <div class="score">
        <strong>\${fmtEfficiency(plan.multiplier)}×</strong>
        <span>\${fr?'multiplicateur annuel':'combined multiplier'}</span>
      </div>
    </div>
    <ul class="annual-plan-list">
      \${plan.picks.map(t=>{
        const L=t.days.filter(x=>x.type==='work');
        return \`<li><strong>\${fmt(t.start,true)} → \${fmt(t.end,true)}</strong> (\${t.total} \${fr?'jours':'days off'}, \${t.leave} \${fr?'congés':'leave'}) — \${fr?'Poser :':'Book:'} \${L.map(x=>fmt(x.date)).join(', ')}</li>\`;
      }).join('')}
    </ul>
    <div class="trip-actions">
      <button type="button" class="chip-btn primary" data-action="export-plan-ics">📅 \${fr?'Exporter tout le plan (.ics)':'Export full-year plan (.ics)'}</button>
      <button type="button" class="chip-btn" data-action="copy-plan">📋 \${fr?'Copier le résumé annuel':'Copy full-year summary'}</button>
    </div>
  </aside>\`;
}

function render(t,idx){
  let L=t.days.filter(x=>x.type==='work'),hn=[...new Set(t.days.filter(x=>x.type==='holiday').map(x=>x.name))],crossYear=t.start.getFullYear()!==t.end.getFullYear(),boundary=t.crossesPrev?(HM.lang==='fr'?\`Commence en \${t.start.getFullYear()}\`:\`Starts in \${t.start.getFullYear()}\`):t.crossesNext?(HM.lang==='fr'?\`Continue en \${t.end.getFullYear()}\`:\`Continues into \${t.end.getFullYear()}\`):'',holidayLabel=hn.length<=3?hn.join(' + '):hn.slice(0,2).join(' + ')+\` + \${hn.length-2} \${HM.lang==='fr'?'autre'+(hn.length-2>1?'s':''):'more'}\`;
  const fr=HM.lang==='fr';
  return \`<article class="trip-card" data-trip-idx="\${idx}">
    <div class="trip-top">
      <div>
        <div class="trip-title">\${t.total} \${fr?'jours de repos avec':'days off using'} \${t.leave} \${fr?'jour(s) de congé':'leave day'+(t.leave===1?'':'s')}</div>
        <div class="trip-sub">\${fmt(t.start,true)} → \${fmt(t.end,true)}\${holidayLabel?' · '+holidayLabel:''}</div>
      </div>
      <div class="score">
        <strong>\${fmtEfficiency(t.efficiency)}×</strong>
        <span>\${fr?'multiplicateur':'days-off multiplier'}</span>
      </div>
    </div>
    <div class="trip-metrics">
      <span class="pill orange">\${fr?'Poser':'Book'} \${L.length}</span>
      <span class="pill green">\${t.hol} \${fr?'jours fériés':'public holidays'}</span>
      <span class="pill">\${t.weekend} \${fr?'jours de week-end':'weekend days'}</span>
      \${boundary?\`<span class="pill">\${boundary}</span>\`:''}
    </div>
    <p class="book-dates"><strong>\${fr?'Jours à poser :':'Book these dates:'}</strong> \${L.map(x=>fmt(x.date,true)).join('; ')}</p>
    <div class="trip-days">\${t.days.map(x=>\`<div class="date-chip \${x.type==='work'?'leave':x.type}" title="\${x.name||''}"><small>\${fmt(x.date).split(' ')[0]}</small><b>\${x.date.getDate()}</b><small>\${x.date.toLocaleString(fr?'fr-FR':'en-GB',{month:'short'})}</small>\${crossYear?\`<small class="chip-year">\${x.date.getFullYear()}</small>\`:''}</div>\`).join('')}</div>
    <div class="trip-actions">
      <button type="button" class="chip-btn" data-action="export-ics" data-idx="\${idx}">📅 \${fr?'Ajouter au calendrier (.ics)':'Add to calendar (.ics)'}</button>
      <button type="button" class="chip-btn" data-action="copy-trip" data-idx="\${idx}">📋 \${fr?'Copier les dates':'Copy dates for HR'}</button>
    </div>
  </article>\`;
}

async function updateRegions(){
  let c=$('#locale'),r=$('#region');
  if(!c||!r)return;
  let cc=baseCode(c.value);
  let names=HM.subs[cc]||[];
  let year=+($('#year')?.value||new Date().getFullYear());
  let api=await apiHolidays(cc,year);
  let used=new Set(api.flatMap(h=>h.subdivisionCodes||[]));
  let local=Object.values(HM.data.locales).filter(x=>x.code.startsWith(cc+'-')).map(x=>({code:x.code,name:x.label.replace(/^.*?—\\s*/,''),local:true}));
  let opts=[...local];
  for(let x of names)if(used.has(x.code)&&!opts.some(o=>o.code===x.code))opts.push(x);
  opts.sort((a,b)=>a.name.localeCompare(b.name));
  let prev=new URLSearchParams(location.search).get('region')||'';
  r.innerHTML=\`<option value="">\${HM.lang==='fr'?'National / toutes les régions':'National / all regions'}</option>\`+opts.map(x=>\`<option value="\${x.code}">\${x.name}</option>\`).join('');
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
  div.innerHTML=\`<label for="workPattern">\${fr?'Rythme de travail':'Workweek pattern'}</label>
    <select id="workPattern">
      <option value="mon-fri" selected>\${fr?'Lun–Ven (week-end Sam–Dim)':'Mon–Fri (Sat–Sun weekend)'}</option>
      <option value="mon-thu">\${fr?'Semaine de 4 jours Lun–Jeu (Ven–Dim off)':'4-day week Mon–Thu (Fri–Sun off)'}</option>
      <option value="sun-thu">\${fr?'Dim–Jeu (week-end Ven–Sam)':'Sun–Thu (Fri–Sat weekend)'}</option>
      <option value="tue-sat">\${fr?'Mar–Sam (week-end Dim–Lun)':'Tue–Sat (Sun–Mon weekend)'}</option>
    </select>\`;
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
  loc.innerHTML=entries.map(e=>\`<option value="\${e.code}">\${HM.lang==='en'&&e.code==='GB'?'UK':e.label}</option>\`).join('');
  loc.value=baseCode(current);
  if(!loc.value)loc.value='DK';
  let y=$('#year'),now=new Date().getFullYear(),defaultYear=(new Date().getMonth()>=9)?now+1:now;
  y.innerHTML=[0,1,2,3,4,5].map(n=>\`<option>\${now+n}</option>\`).join('');
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
    if(note)note.innerHTML=(meta?\`<strong>\${meta.label}:</strong> \${meta.note} \`:'')+(region?\`\${HM.lang==='fr'?'Calendrier régional sélectionné.':'Regional calendar selected.'} \`:'')+(note.dataset.note||'');
    let today=new Date();today.setHours(0,0,0,0);
    let trips=current.items.length?optimize(hs,year,budget,min,max,year===today.getFullYear()?today:null,pattern):[];
    HM.lastTrips=trips;
    HM.lastPlan=trips.length?buildAnnualPlan(trips,budget,year):null;
    let cn=$('#locale').selectedOptions[0].text,rn=region&&$('#region').selectedOptions[0].text;
    let labelTitle=\`\${cn}\${rn?' — '+rn:''} · \${year}\`;
    $('#resultsTitle').textContent=labelTitle;
    $('#resultsMeta').textContent=\`\${budget} \${HM.lang==='fr'?'jours de congé':'leave days'} · \${min}–\${max} \${HM.lang==='fr'?'jours':'day trips'} · \${HM.lang==='fr'?'options indépendantes + plan annuel combiné':'independent options + combined annual plan'}\`;
    results.innerHTML=trips.length?(renderAnnualPlanCard(HM.lastPlan,cn,year)+trips.map((t,i)=>render(t,i)).join('')):\`<div class="empty"><strong>\${HM.lang==='fr'?'Aucune combinaison utile trouvée.':'No useful combination found.'}</strong> \${current.items.length?(HM.lang==='fr'?'Essayez une autre durée de voyage ou un autre budget de congés.':'Try another trip length or leave budget.'):(HM.lang==='fr'?'Aucune donnée de jour férié prise en charge n’a été renvoyée pour ce pays/cette année. Consultez le guide du pays et les sources officielles.':'No supported public-holiday data was returned for this country/year. Check the country guide and official sources.')}</div>\`;
    let q=\`?country=\${code}&year=\${year}&leave=\${budget}&range=\${min}-\${max}\`+(region?\`&region=\${encodeURIComponent(region)}\`:'')+(pattern!=='mon-fri'?\`&pattern=\${pattern}\`:'');
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
      const ics=generateIcsContent([t],\`\${cn} Leave Break\`);
      downloadIcs(ics,\`holidaymaximizer-\${iso(t.start)}-to-\${iso(t.end)}.ics\`);
    }else if(action==='export-plan-ics'){
      if(!HM.lastPlan||!HM.lastPlan.picks.length)return;
      const ics=generateIcsContent(HM.lastPlan.picks,\`\${cn} \${year} Leave Plan\`);
      downloadIcs(ics,\`holidaymaximizer-\${cn.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-\${year}-plan.ics\`);
    }else if(action==='copy-trip'){
      const idx=+btn.dataset.idx;
      const t=HM.lastTrips[idx];
      if(!t)return;
      const L=t.days.filter(x=>x.type==='work').map(x=>fmt(x.date,true)).join('; ');
      const txt=\`\${t.total} days off (\${fmt(t.start,true)} – \${fmt(t.end,true)}, \${t.efficiency.toFixed(2)}x value) using \${t.leave} leave day(s). Book: \${L}\`;
      try{await navigator.clipboard.writeText(txt);}catch(_){}
      const orig=btn.textContent;
      btn.textContent=HM.lang==='fr'?'✓ Copié !':'✓ Copied!';
      setTimeout(()=>{btn.textContent=orig},1800);
    }else if(action==='copy-plan'){
      if(!HM.lastPlan||!HM.lastPlan.picks.length)return;
      const lines=HM.lastPlan.picks.map(t=>{
        const L=t.days.filter(x=>x.type==='work').map(x=>fmt(x.date)).join(', ');
        return \`• \${fmt(t.start,true)} – \${fmt(t.end,true)} (\${t.total} days off, \${t.leave} leave): Book \${L}\`;
      });
      const txt=\`\${cn} \${year} Annual Leave Plan (\${HM.lastPlan.totalOff} days off using \${HM.lastPlan.usedLeave}/\${HM.lastPlan.budget} leave days):\\n\`+lines.join('\\n');
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
      iframe.style.cssText=\`border:0;overflow:hidden;width:\${unit.width}px;height:\${unit.height}px;max-width:100%;display:block;margin:0 auto;\`;
      iframe.srcdoc=\`<!doctype html><html><body style="margin:0;padding:0;background:transparent;overflow:hidden;"><script>atOptions={'key':'\${unit.key}','format':'iframe','height':\${unit.height},'width':\${unit.width},'params':{}};<\\/script><script src="\${unit.scriptUrl}" async onerror="window.parent.postMessage({type:'hm-ad-error',slot:'\${slotId}'},'*')"><\\/script></body></html>\`;

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
      const slot=document.querySelector(\`.ad-slot[data-ad-slot="\${e.data.slot}"]\`);
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
      banner.innerHTML=\`
        <div class="wrap consent-inner">
          <p class="consent-text"><strong>\${fr?'Confidentialité et cookies :':'Privacy &amp; cookies:'}</strong> \${fr?'HolidayMaximizer fonctionne dans votre navigateur. Avec votre accord, notre partenaire publicitaire (Adsterra) peut utiliser des cookies pour afficher des bannières qui financent cet outil gratuit. Voir notre <a href="/fr/privacy/">Politique de confidentialité</a>.':'HolidayMaximizer runs in your browser. With your consent, our advertising partner (Adsterra) may use cookies and device data to show display banners that keep this planner free. See our <a href="/privacy/">Privacy Policy</a>.'}</p>
          <div class="consent-actions">
            <button type="button" class="btn consent-btn-accept" id="consent-accept">\${fr?'Accepter les cookies publicitaires':'Accept advertising cookies'}</button>
            <button type="button" class="btn consent-btn-decline" id="consent-decline">\${fr?'Essentiels uniquement':'Essential only'}</button>
          </div>
        </div>
      \`;
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
`;

  await fs.writeFile(`${ROOT}/assets/app-v13.js`, appV13);

  const baseCss = await fs.readFile(`${V12_SRC}/assets/style-v12.css`, 'utf8');
  const v13CssExtra = `
/* V13 Combined Annual Plan, Interactive Actions, Regional Switchers & Adsterra Slots */
.annual-plan-card{background:linear-gradient(135deg,#eef7f0 0%,#ffffff 100%);border:2px solid #2b6b4f;border-radius:22px;padding:22px;margin-bottom:18px;box-shadow:0 12px 30px rgba(23,60,46,.08)}
.annual-plan-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.annual-plan-card h4{font-size:21px;font-weight:900;letter-spacing:-.03em;margin:10px 0 4px;color:#173c2e}
.annual-plan-sub{margin:0;font-size:13px;color:#4a5d52;font-weight:600}
.annual-plan-list{margin:14px 0;padding-left:18px;font-size:14px;color:#24352c;line-height:1.65}
.annual-plan-list li{margin-bottom:4px}
.trip-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;padding-top:12px;border-top:1px dashed #dce5dd}
.chip-btn{border:1px solid #cdd8cf;background:#f7faf7;color:#173c2e;border-radius:10px;padding:7px 12px;font:inherit;font-size:12px;font-weight:750;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:6px}
.chip-btn:hover{background:#e8f5ec;border-color:#9fc5ac}
.chip-btn.primary{background:#173c2e;color:#fff;border-color:#173c2e}
.chip-btn.primary:hover{background:#215440}
.year-pills{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}
.year-pills a{padding:9px 15px;border-radius:999px;background:#fff;border:1px solid #d5e0d7;text-decoration:none;font-weight:800;font-size:13px;color:#2b3d34;transition:.15s}
.year-pills a:hover,.year-pills a.active{background:#173c2e;color:#fff;border-color:#173c2e}
.ad-slot{display:none;margin:24px auto;text-align:center;max-width:100%;overflow:hidden}
.ad-slot.ad-active{display:block;padding:10px 0}
.ad-slot-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#76837b;margin-bottom:6px;font-weight:700}
.consent-banner{position:fixed;bottom:0;left:0;right:0;z-index:99;background:#173c2e;color:#fff;border-top:2px solid #2e6950;padding:16px 0;box-shadow:0 -12px 32px rgba(0,0,0,.22)}
.consent-inner{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.consent-text{margin:0;font-size:13px;line-height:1.5;color:#e3efe8;max-width:780px}
.consent-text a{color:#ffd5c2;text-decoration:underline}
.consent-actions{display:flex;gap:10px;flex-wrap:wrap;flex:0 0 auto}
.consent-btn-accept{width:auto;min-height:40px;padding:9px 16px;font-size:13px;background:#f1783e}
.consent-btn-decline{width:auto;min-height:40px;padding:9px 16px;font-size:13px;background:transparent;border:1px solid #8ab09d;box-shadow:none}
html,body{overflow-x:hidden;max-width:100%}
@media(max-width:600px){.annual-plan-top{display:block}.consent-inner{flex-direction:column;align-items:stretch}.consent-actions button{width:100%}}
@media(max-width:380px){.wrap{padding:0 12px}.ad-slot{margin:16px -12px}}
`;
  await fs.writeFile(`${ROOT}/assets/style-v13.css`, baseCss + v13CssExtra);

  // Create VM context to run the exact optimizer for static worked guides
  const ctx = vm.createContext({
    document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } },
    window: { addEventListener() {}, location: { search: '' }, innerWidth: 1280 },
    localStorage: { getItem() { return null; }, setItem() {} },
    navigator: {},
    console,
    Intl,
    Date,
    Map,
    Set,
    URLSearchParams
  });
  vm.runInContext(appV13, ctx);

  function calcTrips(localKey, year, budget = 20, min = 3, max = 16) {
    const a = [year - 1, year, year + 1].flatMap(y => data.holidays[localKey]?.[String(y)] || []);
    return ctx.optimize(a, year, budget, min, max);
  }

  function renderStaticTripCard(t) {
    const leaveDates = t.days.filter(x => x.type === 'work').map(x => fmtDate(iso(x.date))).join('; ');
    const usedHols = t.days.filter(x => x.type === 'holiday').map(x => `${esc(x.name)} (${fmtDate(iso(x.date))})`).join('; ');
    return `<article class="trip-card">
      <div class="trip-top">
        <div>
          <h3>${t.leave} leave ${t.leave === 1 ? 'day' : 'days'} → ${t.total} consecutive days off</h3>
          <p class="trip-sub"><strong>${fmtDate(iso(t.start))} – ${fmtDate(iso(t.end))}</strong></p>
        </div>
        <div class="score"><strong>${t.efficiency.toFixed(2)}×</strong><span>multiplier</span></div>
      </div>
      <div class="trip-metrics">
        <span class="pill orange">Book ${t.leave} leave ${t.leave === 1 ? 'day' : 'days'}</span>
        <span class="pill green">${t.hol} public ${t.hol === 1 ? 'holiday' : 'holidays'}</span>
        <span class="pill">${t.weekend} weekend days</span>
      </div>
      <p class="book-dates"><strong>Request leave:</strong> ${leaveDates}.</p>
      <p><strong>Holidays used:</strong> ${usedHols}.</p>
    </article>`;
  }

  console.log('3. Generating 15 Flagship Country Worked Guides (/country/<iso2>/)...');
  for (const [cc, v] of Object.entries(FLAGSHIP_CFG)) {
    const f = `${ROOT}/country/${cc.toLowerCase()}/index.html`;
    let h = await fs.readFile(f, 'utf8');

    const lv = verifiedLeave[cc];
    const entitlementText = lv ? lv.display : 'See the official national employment authority';
    const authorityBox = lv && lv.url
      ? `<div class="sourcebox"><strong>Official employment source:</strong> ${esc(lv.source || v.authority)}. <a class="official-link" href="${esc(lv.url)}" rel="nofollow noopener" target="_blank">Open official guidance ↗</a></div>`
      : '';

    const best = [[3, 5], [6, 9], [10, 16]].flatMap(([min, max]) =>
      calcTrips(v.key, 2027, 20, min, max).filter(t => t.start.getFullYear() === 2027 && t.end.getFullYear() === 2027).slice(0, 1)
    );
    const yearEnd = calcTrips(v.key, 2027, 10, 6, 16).filter(t => t.start.getMonth() === 11 && t.start.getFullYear() === 2027)[0];
    const annual = [];
    for (const budget of [10, 20]) {
      let left = budget, picks = [];
      const overlaps = (a, b) => Math.max(a.start, b.start) <= Math.min(a.end, b.end);
      for (const t of calcTrips(v.key, 2027, budget, 6, 16).filter(t => t.start.getFullYear() === 2027 && t.end.getFullYear() === 2027)) {
        if (t.leave <= left && !picks.some(p => overlaps(t, p))) {
          picks.push(t);
          left -= t.leave;
        }
      }
      annual.push({ budget, left, picks });
    }

    // Find related regional/year slugs for this country
    const relatedRegions = Object.entries(REGION_SLUGS).filter(([k]) => k === cc || k.startsWith(cc + '-'));
    const regionalLinksHtml = relatedRegions.length
      ? `<h2>Multi-year &amp; regional calendars (2026–2031)</h2>
         <p>Explore year-by-year holiday tables and leave combinations for ${v.name}:</p>
         <div class="featured-guides">
           ${relatedRegions.flatMap(([k, slug]) => {
             const regLabel = data.locales[k]?.label || v.name;
             return [2026, 2027, 2028].map(yr => `<a href="/${slug}/${yr}/">${esc(regLabel)} (${yr})</a>`);
           }).join('')}
         </div>`
      : '';

    const plannerLink = `/?country=${cc}&amp;year=2027&amp;leave=20&amp;range=3-30${v.key.includes('-') ? '&amp;region=' + v.key : ''}#planner`;

    const mainHtml = `<main id="main-content">
      <section class="country-hero">
        <div class="wrap">
          <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/countries/">Countries</a> / ${v.name}</nav>
          <p class="eyebrow">2027 leave planning · ${esc(v.scope)}</p>
          <h1>${v.name}: make your 2027 leave go further</h1>
          <p class="section-intro">Exact dates to book, the holidays behind each result, and full-year schedule examples for your leave allowance.</p>
          <p>${esc(v.focus)}</p>
          <div class="country-note"><strong>Before using these dates:</strong> ${esc(v.note)}</div>
          <p><a class="btn" href="${plannerLink}">Open ${v.name} in the interactive planner →</a></p>
          <p class="method-note">Calculations verified ${TODAY}. Saturday–Sunday weekends; all listed calendar holidays assumed off. Examples use the same ranking calculation as the interactive planner.</p>
        </div>
      </section>
      <div class="wrap"><div class="ad-slot" data-ad-slot="H1"></div></div>
      <section class="section guide-section">
        <div class="wrap">
          <h2>Three high-value breaks in 2027</h2>
          <p>Compare a long weekend (3–5 days), a one-week break (6–9 days) and an extended trip (10–16 days). Each option is ranked by total days off per leave day used.</p>
          ${best.map(renderStaticTripCard).join('')}
          <h2>Christmas and New Year 2027/2028</h2>
          ${yearEnd ? renderStaticTripCard(yearEnd) : '<p>No holiday-assisted 6–16 day year-end break was returned within a ten-day leave allowance. Try a different trip length in the planner.</p>'}
          <p>For a break crossing years, count leave against the correct employer leave year and check the next year’s calendar.</p>
          <div class="ad-slot" data-ad-slot="M1"></div>
          <h2>Ways to use a 10-day or 20-day allowance</h2>
          <p>The sample schedules below combine non-overlapping 6–16 day breaks from the planner, taking the highest-ranked affordable options in order.</p>
          ${annual.map(a => `<article class="trip-card">
            <h3>${a.budget} leave days available</h3>
            <p><strong>${a.budget - a.left} leave days used · ${a.picks.reduce((s, t) => s + t.total, 0)} days off across ${a.picks.length} breaks · ${a.left} leave days remaining.</strong></p>
            <ul>${a.picks.map(t => `<li><strong>${fmtDate(iso(t.start))} – ${fmtDate(iso(t.end))}</strong>: ${t.total} days off using ${t.leave} leave days. Book ${t.days.filter(x => x.type === 'work').map(x => fmtDate(iso(x.date))).join(', ')}.</li>`).join('')}</ul>
            <a href="/?country=${cc}&amp;year=2027&amp;leave=${a.budget}&amp;range=6-9${v.key.includes('-') ? '&amp;region=' + v.key : ''}#planner">Customize this ${a.budget}-day allowance in the planner →</a>
          </article>`).join('')}
          <h2>2027 public holiday dates used in this calculation</h2>
          <p>This is the model’s calendar for ${esc(v.scope.toLowerCase())}. Sundays already treated as weekends may be omitted. Employer replacement days and local exceptions are not silently added.</p>
          <div class="table-scroll">
            <table class="calendar-table">
              <caption>${v.name} · 2027 public holidays &amp; weekday savings</caption>
              <thead><tr><th scope="col">Date</th><th scope="col">Day</th><th scope="col">Holiday</th><th scope="col">Weekday saved?</th></tr></thead>
              <tbody>${data.holidays[v.key]['2027'].map(x => `<tr><td>${fmtDate(x.date)}</td><td>${fmtWeekday(x.date)}</td><td>${esc(x.name)}</td><td>${[0, 6].includes(new Date(x.date + 'T12:00:00').getDay()) ? 'No — weekend' : 'Yes, if off work'}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <p>Calendar reference: <a href="${v.url}" rel="noopener" target="_blank">${esc(v.authority)} ↗</a>${v.extra ? ` · <a href="${v.extra}" rel="noopener" target="_blank">Law establishing the 4 October holiday ↗</a>` : ''}.</p>
          ${regionalLinksHtml}
          <h2>Annual leave entitlement and local rules</h2>
          <p><strong>Statutory baseline:</strong> ${esc(entitlementText)}. The statutory minimum is context; enter your actual remaining bookable allowance in the planner.</p>
          ${authorityBox}
          <p>${esc(v.note)}</p>
          <p><a href="/how-it-works/">Read the calculation methodology</a> · <a href="/compare/">Compare ${v.name} with another country</a> · <a href="/ranking/">Global annual-leave ranking</a></p>
        </div>
      </section>
      <div class="wrap"><div class="ad-slot" data-ad-slot="B1"></div></div>
    </main>`;

    // Remove noindex from flagship country guides (for CA, AU, SE, NO, FI which were previously noindexed)
    h = h.replace(/<meta[^>]*name="robots"[^>]*>/g, '');
    h = h.replace(/<main[^>]*>[\s\S]*?<\/main>/, mainHtml);
    h = h.replace(/<title>.*?<\/title>/, `<title>${v.name} 2027 Annual Leave Planner: Best Dates &amp; Public Holidays | HolidayMaximizer</title>`);
    h = h.replace(/<meta[^>]*name="description"[^>]*>/, `<meta name="description" content="Maximize your ${v.name} annual leave in 2027: exact workdays to book, public holiday calendar, high-value bridge breaks and 10-day / 20-day schedule examples."/>`);
    h = h.replace(/<link[^>]*hreflang="fr"[^>]*>/g, '');
    await fs.writeFile(f, h);
  }

  console.log('3b. Upgrading primary-source verified country guides for SEO indexability & Adsterra slots...');
  for (const [cc, lv] of Object.entries(verifiedLeave)) {
    if (FLAGSHIP_CFG[cc]) continue;
    const f = `${ROOT}/country/${cc.toLowerCase()}/index.html`;
    try {
      await fs.stat(f);
    } catch {
      continue;
    }
    let h = await fs.readFile(f, 'utf8');
    // Make primary-source verified country guides indexable in Google Search Console
    if (lv && lv.url && lv.source_tier !== 'secondary' && lv.source_tier !== 'territory') {
      h = h.replace(/<meta[^>]*name="robots"[^>]*>/g, '');
    }
    if (!h.includes('data-ad-slot="H1"')) {
      h = h.replace('</section><section class="section">', '</section><div class="wrap"><div class="ad-slot" data-ad-slot="H1"></div></div><section class="section">');
      h = h.replace('</main>', '<div class="wrap"><div class="ad-slot" data-ad-slot="B1"></div></div></main>');
    }
    await fs.writeFile(f, h);
  }

  console.log('4. Rebuilding all 138 Regional/Year pages (2026–2031) & 23 Regional Hub pages...');
  for (const [localKey, slug] of Object.entries(REGION_SLUGS)) {
    const locMeta = data.locales[localKey];
    const baseCC = localKey.split('-')[0];
    const years = data.years; // [2026, 2027, 2028, 2029, 2030, 2031]

    for (const yr of years) {
      const topTrips = calcTrips(localKey, yr, 20, 3, 16).filter(t => t.start.getFullYear() === yr || t.end.getFullYear() === yr).slice(0, 6);
      const hols = data.holidays[localKey][String(yr)] || [];
      const plannerUrl = `/?country=${baseCC}&amp;year=${yr}&amp;leave=20&amp;range=3-16${localKey.includes('-') ? '&amp;region=' + localKey : ''}#planner`;
      const pageUrl = `https://holidaymaximizer.com/${slug}/${yr}/`;
      const title = `${locMeta.label} Annual Leave Maximizer ${yr} — Best Days to Book Off | HolidayMaximizer`;
      const desc = `Best days to take annual leave in ${locMeta.label} in ${yr}. Combine ${hols.length} public holidays and weekends into longer breaks using fewer leave days.`;

      const yearPills = `<nav class="year-pills" aria-label="Select planning year">${years.map(y => `<a href="/${slug}/${y}/" class="${y === yr ? 'active' : ''}">${y}Calendar</a>`.replace('Calendar', '')).join('')}</nav>`;

      const pageHtml = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="google-site-verification" content="${GSC_VERIFICATION}"/>
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"/>
<link rel="canonical" href="${pageUrl}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(desc)}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${pageUrl}"/>
<meta property="og:site_name" content="HolidayMaximizer"/>
<meta property="og:image" content="https://holidaymaximizer.com/assets/og-card.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="theme-color" content="#173c2e"/>
<link rel="icon" href="/assets/logo.svg"/>
<link rel="stylesheet" href="/assets/style-v13.css"/>
<script defer src="/assets/app-v13.js"></script>
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://holidaymaximizer.com/" },
    { "@type": "ListItem", "position": 2, "name": "Countries", "item": "https://holidaymaximizer.com/countries/" },
    { "@type": "ListItem", "position": 3, "name": locMeta.country, "item": `https://holidaymaximizer.com/country/${baseCC.toLowerCase()}/` },
    { "@type": "ListItem", "position": 4, "name": `${locMeta.label} (${yr})`, "item": pageUrl }
  ]
})}</script>
</head><body>
<header class="site-header"><div class="wrap nav"><a class="brand" href="/"><span class="brand-mark">✓</span><span>HolidayMaximizer</span></a><nav aria-label="Primary navigation" class="navlinks"><a href="/#planner">Planner</a><a href="/countries/">Countries</a><a href="/compare/">Compare</a><a href="/ranking/">Global ranking</a><a href="/how-it-works/">How it works</a></nav><button aria-expanded="false" aria-label="Open navigation" class="menu-toggle" type="button">Menu</button><div class="lang-switch"><a href="/${slug}/${yr}/">EN</a><a href="/fr/">FR</a></div></div></header>
<a class="skip-link" href="#main-content">Skip to content</a>
<main id="main-content">
  <section class="country-hero">
    <div class="wrap">
      <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/countries/">Countries</a> / <a href="/country/${baseCC.toLowerCase()}/">${esc(locMeta.country)}</a> / ${esc(locMeta.label)} ${yr}</nav>
      <p class="eyebrow">${esc(locMeta.region)} · ${yr} Calendar</p>
      <h1>Best days to take annual leave in ${esc(locMeta.label)} in ${yr}</h1>
      <p class="section-intro">Use public holidays and weekends to stretch your ${yr} annual leave further. Below are the highest-value date combinations and the exact workdays to request.</p>
      ${yearPills}
      <div class="country-note"><strong>Coverage note:</strong> ${esc(locMeta.note)} Always confirm entitlement with official/local sources and your employer.</div>
      <p><a class="btn" href="${plannerUrl}">Customize ${esc(locMeta.label)} ${yr} in the interactive planner →</a></p>
    </div>
  </section>
  <div class="wrap"><div class="ad-slot" data-ad-slot="H1"></div></div>
  <section class="section guide-section">
    <div class="wrap">
      <h2>Top ${yr} leave combinations for ${esc(locMeta.label)}</h2>
      <p>Each recommendation below is a standalone break option assuming a Monday–Friday workweek. Open the interactive planner above to adjust your leave allowance, workweek pattern, or export a <code>.ics</code> calendar file.</p>
      ${topTrips.map(renderStaticTripCard).join('')}
      <div class="ad-slot" data-ad-slot="M1"></div>
      <h2>${yr} public holidays in ${esc(locMeta.label)}</h2>
      <p>These ${hols.length} public-holiday dates feed the ${yr} optimization above.</p>
      <div class="table-scroll">
        <table class="calendar-table">
          <caption>${esc(locMeta.label)} · ${yr} public holidays</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Day</th><th scope="col">Holiday</th><th scope="col">Weekday saved?</th></tr></thead>
          <tbody>${hols.map(x => `<tr><td>${fmtDate(x.date)}</td><td>${fmtWeekday(x.date)}</td><td>${esc(x.name)}</td><td>${[0, 6].includes(new Date(x.date + 'T12:00:00').getDay()) ? 'No — weekend' : 'Yes, if off work'}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <p style="margin-top:20px"><a href="/country/${baseCC.toLowerCase()}/">← Back to ${esc(locMeta.country)} main guide</a> · <a href="${plannerUrl}">Open interactive planner →</a></p>
    </div>
  </section>
  <div class="wrap"><div class="ad-slot" data-ad-slot="B1"></div></div>
</main>
<footer class="footer"><div class="wrap footer-grid"><div><strong>HolidayMaximizer.com</strong><div>Make your annual leave go further</div></div><div><a href="/about/">About</a><a href="/how-it-works/">Methodology</a><a href="/privacy/">Privacy</a><a href="#" data-open-consent>Cookie preferences</a><a href="/contact/">Contact</a><a href="/sources/">Sources &amp; data</a><a href="/legal/">Legal</a></div><div class="legal">Planning aid: confirm public-holiday dates and your entitlement with official/local sources and your employer.</div><div class="business-mini">Operated by Kattegat Studio · CVR 46761952</div></div></footer>
</body></html>`;

      const outDir = `${ROOT}/${slug}/${yr}`;
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(`${outDir}/index.html`, pageHtml);

      // Also write /<slug>/index.html hub page (pointing to 2027 as canonical or overview)
      if (yr === 2027) {
        const hubUrl = `https://holidaymaximizer.com/${slug}/`;
        const hubHtml = pageHtml
          .replace(`<link rel="canonical" href="${pageUrl}"/>`, `<link rel="canonical" href="https://holidaymaximizer.com/${slug}/2027/"/>`)
          .replace(`<meta property="og:url" content="${pageUrl}"/>`, `<meta property="og:url" content="${hubUrl}"/>`);
        await fs.writeFile(`${ROOT}/${slug}/index.html`, hubHtml);
      }
    }
  }

  console.log('5. Updating Homepage, Countries directory, Privacy policy, and global HTML pages...');
  // Update homepage featured guides to include all 15 flagship countries + ad slots + FAQ schema
  for (const homeRel of ['index.html', 'fr/index.html']) {
    const isFr = homeRel.startsWith('fr/');
    const f = `${ROOT}/${homeRel}`;
    let h = await fs.readFile(f, 'utf8');
    if (!isFr) {
      h = h.replace(
        /<nav class="featured-guides" aria-label="Detailed country guides">[\s\S]*?<\/nav>/,
        `<nav class="featured-guides" aria-label="Detailed country guides">${Object.entries(FLAGSHIP_CFG).map(([c, v]) => `<a href="/country/${c.toLowerCase()}/">${v.name}</a>`).join('')}</nav>`
      );
    }
    // Insert ad slots on homepage if not present
    if (!h.includes('data-ad-slot="H1"')) {
      h = h.replace('</section><section class="hero">', '</section><div class="wrap"><div class="ad-slot" data-ad-slot="H1"></div></div><section class="hero">');
      h = h.replace('</main>', '<div class="wrap"><div class="ad-slot" data-ad-slot="B1"></div></div></main>');
    }
    await fs.writeFile(f, h);
  }

  // Update countries/index.html featured guides to all 15 flagship guides
  {
    const f = `${ROOT}/countries/index.html`;
    let h = await fs.readFile(f, 'utf8');
    h = h.replace(
      /<nav class="featured-guides" aria-label="2027 planning guides">[\s\S]*?<\/nav>/,
      `<nav class="featured-guides" aria-label="2027 planning guides">${Object.entries(FLAGSHIP_CFG).map(([c, v]) => `<a href="/country/${c.toLowerCase()}/">${v.name} 2027</a>`).join('')}</nav>`
    );
    await fs.writeFile(f, h);
  }

  // Update Privacy Policy (EN and FR) to disclose Adsterra and cookie controls accurately
  {
    const enPriv = `${ROOT}/privacy/index.html`;
    let h = await fs.readFile(enPriv, 'utf8');
    h = h.replace(
      /<h2>Advertising and cookies<\/h2>[\s\S]*?(?=<h2>Why data may be processed<\/h2>)/,
      `<h2>Advertising and cookies</h2><p>To keep HolidayMaximizer free without requiring accounts or subscriptions, selected pages display banner advertisements provided by our advertising partner, <strong>Adsterra</strong>. We do not use popunders, disguised social bars or adult advertisements.</p><p>For visitors in the European Economic Area (EEA) and the United Kingdom, non-essential advertising scripts are not loaded unless you grant consent via the privacy banner. You can change or withdraw your choice at any time using the <a href="#" data-open-consent>Cookie preferences</a> link in the site footer. Downloaded holiday calendars may also be cached in browser local storage for up to 24 hours purely to support the calculator.</p>`
    );
    h = h.replace(/<h2>Third-party information<\/h2>[\s\S]*?<\/p>/, `<h2>Third-party information</h2><p>Adsterra, Cloudflare and Nager.Holidays publish their own privacy policies for technical or advertising data they process as independent service providers.</p>`);
    h = h.replace('19 October 2026', '4 November 2026');
    await fs.writeFile(enPriv, h);

    const frPriv = `${ROOT}/fr/privacy/index.html`;
    let hf = await fs.readFile(frPriv, 'utf8');
    hf = hf.replace(
      /<h2>Publicité et cookies<\/h2>[\s\S]*?(?=<h2>Base du traitement<\/h2>)/,
      `<h2>Publicité et cookies</h2><p>Pour maintenir HolidayMaximizer gratuit sans création de compte ni abonnement, certaines pages affichent des bannières publicitaires fournies par notre partenaire <strong>Adsterra</strong>. Aucun format intrusif (popunder) ni publicité pour adultes n’est activé.</p><p>Pour les visiteurs situés dans l’Espace économique européen (EEE) et au Royaume-Uni, les scripts publicitaires non essentiels ne sont chargés qu’après votre consentement explicite. Vous pouvez modifier votre choix à tout moment via le lien <a href="#" data-open-consent>Préférences cookies</a> situé en pied de page. Les calendriers téléchargés peuvent être mis en cache dans le stockage local du navigateur pendant 24 heures pour le fonctionnement du calculateur.</p>`
    );
    hf = hf.replace(/<h2>Services tiers<\/h2>[\s\S]*?<\/p>/, `<h2>Services tiers</h2><p>Adsterra, Cloudflare et Nager.Holidays publient leurs propres politiques de confidentialité concernant les données qu’ils traitent en tant que prestataires indépendants.</p>`);
    hf = hf.replace('19 octobre 2026', '4 novembre 2026');
    await fs.writeFile(frPriv, hf);
  }

  // Fix truncated meta description in how-it-works/index.html
  {
    const f = `${ROOT}/how-it-works/index.html`;
    let h = await fs.readFile(f, 'utf8');
    h = h.replaceAll(
      'The planner scans continuous date windows, marks weekends and public holidays, counts the ordinary working days that would need annual leave, and ranks com',
      'Learn how HolidayMaximizer scans continuous date windows, combines public holidays and weekends, calculates efficiency multipliers, and builds annual leave plans.'
    );
    await fs.writeFile(f, h);
  }

  // Make /compare/ and /ranking/ indexable (they are rich, unique value-add tools!) and add ad slots
  for (const toolRel of ['compare/index.html', 'ranking/index.html', 'fr/compare/index.html', 'fr/ranking/index.html']) {
    const f = `${ROOT}/${toolRel}`;
    let h = await fs.readFile(f, 'utf8');
    if (!toolRel.startsWith('fr/')) {
      h = h.replace(/<meta[^>]*name="robots"[^>]*>/g, '');
    }
    if (!h.includes('data-ad-slot="H1"')) {
      h = h.replace('</section></main>', '<div class="ad-slot" data-ad-slot="B1"></div></section></main>');
    }
    await fs.writeFile(f, h);
  }

  // Global pass across all HTML files in ROOT
  const allHtmlFiles = await walkHtml(ROOT);
  const indexedUrls = new Set();

  for (const f of allHtmlFiles) {
    let h = await fs.readFile(f, 'utf8');
    const rel = path.relative(ROOT, f).replaceAll('\\', '/');
    const isFr = rel.startsWith('fr/');

    // Upgrade CSS & JS references to v13
    h = h
      .replaceAll('/assets/style-v12.css', '/assets/style-v13.css')
      .replaceAll('/assets/style-v10.css', '/assets/style-v13.css')
      .replaceAll('/assets/style.css', '/assets/style-v13.css')
      .replaceAll('/assets/app-v12.js', '/assets/app-v13.js')
      .replaceAll('/assets/app-v11.js', '/assets/app-v13.js')
      .replaceAll('/assets/app.js', '/assets/app-v13.js');

    // Remove all AdSense meta tags and scripts
    h = h.replace(/<meta[^>]*name="google-adsense-account"[^>]*>/gi, '');
    h = h.replace(/<script[^>]*pagead2\.googlesyndication\.com[^>]*><\/script>/gi, '');

    // Ensure Google Search Console verification tag is present
    if (!h.includes('google-site-verification')) {
      h = h.replace(/(<meta[^>]*name="viewport"[^>]*>)/i, `$1<meta name="google-site-verification" content="${GSC_VERIFICATION}"/>`);
    }

    // Ensure robots meta tag on indexable pages has max-image-preview:large,max-snippet:-1
    if (!h.includes('noindex') && rel !== '404.html') {
      if (!h.includes('name="robots"')) {
        h = h.replace('</head>', '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/></head>');
      }
      const canonical = h.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1] || h.match(/<link[^>]*href="([^"]+)"[^>]*rel="canonical"/i)?.[1];
      if (canonical && canonical === `https://holidaymaximizer.com/${rel === 'index.html' ? '' : rel.replace(/index\.html$/, '')}`) {
        indexedUrls.add(canonical);
      }
    }

    // Ensure Cookie preferences link is in the footer
    if (!h.includes('data-open-consent')) {
      if (isFr) {
        h = h.replace('<a href="/fr/privacy/">Confidentialité</a>', '<a href="/fr/privacy/">Confidentialité</a><a href="#" data-open-consent>Préférences cookies</a>');
      } else {
        h = h.replace('<a href="/privacy/">Privacy</a>', '<a href="/privacy/">Privacy</a><a href="#" data-open-consent>Cookie preferences</a>');
      }
    }

    await fs.writeFile(f, h);
  }

  // Write updated sitemap.xml
  const sortedUrls = [...indexedUrls].sort();
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sortedUrls.map(u => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  await fs.writeFile(`${ROOT}/sitemap.xml`, sitemapXml);

  // Update ads.txt, robots.txt, _headers, BUILD-SUMMARY.json, llms.txt
  await fs.writeFile(`${ROOT}/ads.txt`, `# HolidayMaximizer.com — Adsterra Direct Publisher\n# Domain ID: 6176073 | Publisher ID: 3529548\n`);
  await fs.writeFile(`${ROOT}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: https://holidaymaximizer.com/sitemap.xml\n`);
  await fs.writeFile(`${ROOT}/_headers`, `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: geolocation=(), camera=(), microphone=()\n\n/assets/*\n  Cache-Control: public, max-age=604800\n\n/data/*\n  Cache-Control: public, max-age=86400\n\n/ads.txt\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: public, max-age=300\n\n/robots.txt\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: public, max-age=300\n`);

  const summary = {
    version: 'V13',
    releaseDate: TODAY,
    totalHtmlPages: allHtmlFiles.length,
    indexableSitemapUrls: sortedUrls.length,
    flagshipCountryGuides: Object.keys(FLAGSHIP_CFG).length,
    regionalMultiYearPages: Object.keys(REGION_SLUGS).length * 6,
    adsterraDomainId: 6176073,
    adsterraPlacements: ['728x90_1 (8da4f60a736e13046a9c88be9b8de6bd)', '300x250_1 (17d46e7ef75e864b11e99a78a4ef5046)', '320x50_1 (5302600cb2f933f200f0cf885a9bf708)']
  };
  await fs.writeFile(`${ROOT}/BUILD-SUMMARY.json`, JSON.stringify(summary, null, 2));
  console.log('BUILD SUMMARY:', summary);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
