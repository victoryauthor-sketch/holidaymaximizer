const HM = {
  data: null,
  countries: [],
  subs: {},
  lang: 'en',
  cache: {},
  lastTrips: [],
  lastPlan: null,
  telemetry: { events: [], returnUser: false, visitCount: 1 }
};
const $ = s => document.querySelector(s);

const ADSTERRA_CONFIG = {
  enabled: true,
  domainId: 6176073,
  publisherId: 3529548,
  units: {
    desktopBanner: {
      id: 32097205,
      alias: '728x90_1',
      key: '8da4f60a736e13046a9c88be9b8de6bd',
      width: 728,
      height: 90,
      scriptUrl: 'https://bauval.org/22/8da4f60a736e13046a9c88be9b8de6bd'
    },
    rectangleBanner: {
      id: 32097166,
      alias: '300x250_1',
      key: '17d46e7ef75e864b11e99a78a4ef5046',
      width: 300,
      height: 250,
      scriptUrl: 'https://bauval.org/22/17d46e7ef75e864b11e99a78a4ef5046'
    },
    mobileBanner: {
      id: 32097241,
      alias: '320x50_1',
      key: '5302600cb2f933f200f0cf885a9bf708',
      width: 320,
      height: 50,
      scriptUrl: 'https://bauval.org/22/5302600cb2f933f200f0cf885a9bf708'
    }
  }
};

const REFERRAL_CONFIG = {
  enabled: true,
  partnerConfigured: false,
  buildUrl(countryName, startIso, endIso) {
    const q = encodeURIComponent(`${countryName} ${startIso} to ${endIso}`);
    return `https://www.google.com/travel/flights?q=${q}`;
  }
};

function makeDate(y, m, d) {
  return new Date(y, m, d, 12, 0, 0);
}
function parseIso(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return makeDate(y, m - 1, d);
}
function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(d, n) {
  return makeDate(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function getWorkPattern() {
  const el = $('#workPattern');
  return el ? el.value : 'mon-fri';
}
function isWeekend(d, pattern = 'mon-fri') {
  const day = d.getDay();
  if (pattern === 'sun-thu') return day === 5 || day === 6;
  if (pattern === 'mon-thu') return day === 5 || day === 6 || day === 0;
  if (pattern === 'tue-sat') return day === 0 || day === 1;
  return day === 0 || day === 6;
}
function getPatternMeta(pattern = 'mon-fri', lang = 'en') {
  const fr = lang === 'fr';
  const map = {
    'mon-fri': {
      workdaysPerWeek: 5,
      workLabel: fr ? 'Semaine Lun–Ven' : 'Mon–Fri workweek',
      restLabel: fr ? 'jours de week-end (Sam–Dim)' : 'weekend days (Sat–Sun)',
      restShort: fr ? 'jours de week-end' : 'weekend days',
      assumption: fr
        ? 'Hypothèse : jours ouvrés du lundi au vendredi, repos le samedi et le dimanche.'
        : 'Schedule assumption: Monday–Friday workdays with Saturday–Sunday rest days.'
    },
    'mon-thu': {
      workdaysPerWeek: 4,
      workLabel: fr ? 'Semaine de 4 jours Lun–Jeu' : '4-day Mon–Thu workweek',
      restLabel: fr ? 'jours de repos (Ven–Dim)' : 'rest days (Fri–Sun)',
      restShort: fr ? 'jours de repos (Ven–Dim)' : 'rest days (Fri–Sun)',
      assumption: fr
        ? 'Hypothèse : semaine de 4 jours (lundi–jeudi travaillés, vendredi–dimanche en repos). Les jours fériés tombant un vendredi, samedi ou dimanche ne sont pas comptés comme jours ouvrés économisés.'
        : 'Schedule assumption: 4-day Monday–Thursday workweek with Friday–Sunday rest days. Public holidays falling on Friday–Sunday are already rest days unless your contract grants a replacement day.'
    },
    'sun-thu': {
      workdaysPerWeek: 5,
      workLabel: fr ? 'Semaine Dim–Jeu' : 'Sun–Thu workweek',
      restLabel: fr ? 'jours de week-end (Ven–Sam)' : 'weekend days (Fri–Sat)',
      restShort: fr ? 'jours de week-end (Ven–Sam)' : 'weekend days (Fri–Sat)',
      assumption: fr
        ? 'Hypothèse : jours ouvrés du dimanche au jeudi, week-end le vendredi et le samedi.'
        : 'Schedule assumption: Sunday–Thursday workdays with Friday–Saturday weekend rest days.'
    },
    'tue-sat': {
      workdaysPerWeek: 5,
      workLabel: fr ? 'Semaine Mar–Sam' : 'Tue–Sat workweek',
      restLabel: fr ? 'jours de repos (Dim–Lun)' : 'rest days (Sun–Mon)',
      restShort: fr ? 'jours de repos (Dim–Lun)' : 'rest days (Sun–Mon)',
      assumption: fr
        ? 'Hypothèse : jours ouvrés du mardi au samedi, repos le dimanche et le lundi.'
        : 'Schedule assumption: Tuesday–Saturday workdays with Sunday–Monday rest days.'
    }
  };
  return map[pattern] || map['mon-fri'];
}

function fmt(d, withYear = false) {
  return new Intl.DateTimeFormat(HM.lang === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {})
  }).format(d);
}
function fmtEfficiency(n) {
  return new Intl.NumberFormat(HM.lang === 'fr' ? 'fr-FR' : 'en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}
function baseCode(code) {
  return code.includes('-') ? code.split('-')[0] : code;
}

function trackAggregateEvent(event, extra = {}) {
  try {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const payload = {
      event,
      device: isMobile ? 'mobile' : 'desktop',
      lang: HM.lang || 'en',
      countryPage: extra.countryPage || ($('#locale')?.value || ''),
      slot: extra.slot || '',
      unit: extra.unit || '',
      ts: Date.now()
    };
    HM.telemetry.events.push(payload);
    try {
      const key = 'hm_agg_counts_v13';
      const counts = JSON.parse(localStorage.getItem(key) || '{}');
      counts[event] = (counts[event] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(counts));
    } catch (_) {}
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && typeof location !== 'undefined' && location.protocol.startsWith('http')) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/event', blob);
    }
  } catch (_) {}
}

function initReturnUseTracking() {
  try {
    const key = 'hm_visit_meta_v13';
    const today = iso(makeDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify({ firstDate: today, lastDate: today, visits: 1 }));
    } else {
      const parsed = JSON.parse(raw);
      parsed.visits = (parsed.visits || 1) + 1;
      HM.telemetry.visitCount = parsed.visits;
      if (parsed.lastDate !== today || parsed.visits > 1) {
        HM.telemetry.returnUser = true;
        trackAggregateEvent('return_visit');
      }
      parsed.lastDate = today;
      localStorage.setItem(key, JSON.stringify(parsed));
    }
  } catch (_) {}
}

function setupLanguageSwitch() {
  const links = [...document.querySelectorAll('.lang-switch a')];
  if (!links.length) return;
  const tail = location.search + location.hash;
  const altEn = document.querySelector('link[rel="alternate"][hreflang="en"]')?.getAttribute('href');
  const altFr = document.querySelector('link[rel="alternate"][hreflang="fr"]')?.getAttribute('href');
  for (const a of links) {
    const t = a.textContent.trim().toUpperCase();
    if (t === 'EN' && altEn) {
      try {
        const u = new URL(altEn);
        a.href = u.pathname + tail;
      } catch (_) {}
    }
    if (t === 'FR' && altFr) {
      try {
        const u = new URL(altFr);
        a.href = u.pathname + tail;
      } catch (_) {}
    }
  }
}

function canonicalHolidayName(code, date, name) {
  const cc = baseCode(code), md = date.slice(5);
  const fr = HM.lang === 'fr';
  const map = {
    DK: { '12-25': fr ? 'Jour de Noël' : 'Christmas Day', '12-26': fr ? 'Deuxième jour de Noël' : 'Second Day of Christmas' },
    GB: { '12-25': fr ? 'Jour de Noël' : 'Christmas Day', '12-26': 'Boxing Day' },
    IE: { '12-25': fr ? 'Jour de Noël' : 'Christmas Day', '12-26': fr ? 'Saint-Étienne' : "St Stephen's Day" },
    AU: { '12-26': 'Boxing Day' },
    NZ: { '12-26': 'Boxing Day' },
    CA: { '12-26': 'Boxing Day' }
  };
  return map[cc]?.[md] || name;
}

async function apiHolidays(code, year) {
  const cc = baseCode(code), key = `${cc}-${year}`;
  if (HM.cache[key]) return HM.cache[key];
  const storageKey = `hm-holidays-v13-${key}`;
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed.items) && Date.now() - parsed.saved < 86400000) {
        HM.cache[key] = parsed.items;
        return parsed.items;
      }
    }
  } catch (_) {}
  try {
    const r = await fetch(`https://nagerholidays.com/api/v4/Holidays/${cc}/${year}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const a = await r.json();
    HM.cache[key] = a;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ saved: Date.now(), items: a }));
    } catch (_) {}
    return a;
  } catch (_) {
    return [];
  }
}

function normalizeApi(a, region, code) {
  return a
    .filter(h => (!h.holidayTypes || h.holidayTypes.includes('Public')) && (region ? (h.nationalHoliday || !h.subdivisionCodes || h.subdivisionCodes.includes(region)) : h.nationalHoliday !== false))
    .map(h => ({ date: h.date, name: canonicalHolidayName(code, h.date, h.name) }));
}

function nextWorkingDay(afterDate, hmap, pattern = 'mon-fri') {
  let cur = addDays(afterDate, 1);
  for (let i = 0; i < 14; i++) {
    const k = iso(cur);
    if (!isWeekend(cur, pattern) && !hmap.has(k)) return cur;
    cur = addDays(cur, 1);
  }
  return cur;
}

function generateCandidates(hs, year, budget, minTrip, maxTrip, earliest = null, pattern = 'mon-fri') {
  const hmap = new Map(hs.map(h => [h.date, h.name]));
  const cand = [];
  const selectedStart = makeDate(year, 0, 1);
  const selectedEnd = makeDate(year, 11, 31);
  const start = makeDate(year - 1, 11, 1);
  const lastStart = makeDate(year, 11, 31);
  const searchEnd = makeDate(year + 1, 0, 31);
  const maxWorkdaysInWeek = getPatternMeta(pattern).workdaysPerWeek;

  for (let d = new Date(start); d <= lastStart; d = addDays(d, 1)) {
    if (earliest && d < earliest) continue;
    for (let len = minTrip; len <= maxTrip; len++) {
      const e = addDays(d, len - 1);
      if (e > searchEnd) break;
      if (e < selectedStart) continue;
      let leave = 0, hol = 0, weekend = 0, restHol = 0, curLeaveRun = 0, maxLeaveRun = 0;
      const days = [];
      const leaveByYear = {};
      for (let x = new Date(d); x <= e; x = addDays(x, 1)) {
        const key = iso(x);
        const isRest = isWeekend(x, pattern);
        const hName = hmap.get(key) || '';
        let type = 'work';
        if (hName && !isRest) {
          type = 'holiday';
          hol++;
          curLeaveRun = 0;
        } else if (isRest) {
          type = 'weekend';
          weekend++;
          if (hName) restHol++;
          curLeaveRun = 0;
        } else {
          leave++;
          curLeaveRun++;
          if (curLeaveRun > maxLeaveRun) maxLeaveRun = curLeaveRun;
          const yr = x.getFullYear();
          leaveByYear[yr] = (leaveByYear[yr] || 0) + 1;
        }
        days.push({ date: new Date(x), type, name: hName, onRestDay: Boolean(hName && isRest) });
      }
      if (leave < 1 || leave > budget || hol < 1) continue;
      const prevKey = iso(addDays(d, -1));
      const nextKey = iso(addDays(e, 1));
      const prevFree = isWeekend(addDays(d, -1), pattern) || hmap.has(prevKey);
      const nextFree = isWeekend(addDays(e, 1), pattern) || hmap.has(nextKey);
      const startsOnFree = days[0].type !== 'work';
      const endsOnFree = days[days.length - 1].type !== 'work';
      const isTrueBridge = startsOnFree && endsOnFree && !prevFree && !nextFree && maxLeaveRun < maxWorkdaysInWeek;
      const crossesPrev = d < selectedStart;
      const crossesNext = e > selectedEnd;
      const eff = len / leave;
      const boundaryBonus = (crossesPrev || crossesNext) ? 2.5 : 0;
      const bridgeBonus = isTrueBridge ? 3.5 : (startsOnFree && endsOnFree ? 1.5 : 0);
      const score = eff * 12 + len * 0.28 + hol * 0.45 - (leave / budget) * 0.15 + boundaryBonus + bridgeBonus;
      const returnDate = nextWorkingDay(e, hmap, pattern);
      cand.push({
        start: new Date(d),
        end: e,
        returnDate,
        leave,
        total: len,
        hol,
        weekend,
        restHol,
        efficiency: eff,
        score,
        days,
        leaveByYear,
        crossesPrev,
        crossesNext,
        isTrueBridge
      });
    }
  }
  return cand;
}

function optimize(hs, year, budget, minTrip, maxTrip, earliest = null, pattern = 'mon-fri') {
  const cand = generateCandidates(hs, year, budget, minTrip, maxTrip, earliest, pattern);
  cand.sort((a, b) => b.score - a.score || b.total - a.total || a.leave - b.leave);
  const out = [];
  const overlaps = (a, b) => Math.max(a.start, b.start) <= Math.min(a.end, b.end);
  for (const c of cand) {
    if (!out.some(o => overlaps(c, o))) out.push(c);
    if (out.length >= 10) break;
  }
  function ensureBoundary(flag) {
    const best = cand.find(c => c[flag]);
    if (!best || out.some(o => o.start.getTime() === best.start.getTime() && o.end.getTime() === best.end.getTime()) || out.some(o => overlaps(best, o))) return;
    if (out.length >= 10) out.pop();
    out.push(best);
  }
  ensureBoundary('crossesPrev');
  ensureBoundary('crossesNext');
  out.sort((a, b) => b.score - a.score || b.total - a.total || a.leave - b.leave);
  return out.slice(0, 10);
}

function buildAnnualPlan(hs, year, budget, earliest = null, pattern = 'mon-fri') {
  const fr = HM.lang === 'fr';
  const allCand = generateCandidates(hs, year, budget, 3, 16, earliest, pattern)
    .filter(c => c.isTrueBridge && (c.leaveByYear[year] || 0) >= 1 && !c.crossesPrev);

  allCand.sort((a, b) => a.end - b.end || a.start - b.start);

  const n = allCand.length;
  if (!n) {
    return {
      budget,
      usedLeave: 0,
      left: budget,
      totalOff: 0,
      totalHol: 0,
      totalWeekend: 0,
      picks: [],
      multiplier: 0,
      leaveByYear: { [year]: 0 },
      boundaryNote: '',
      unusedReason: fr
        ? 'Aucun pont de jour férié disponible sur cette période avec ce rythme de travail.'
        : 'No public-holiday bridge windows were found for this period and workweek pattern.'
    };
  }

  const prevIdx = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const minPrevEnd = addDays(allCand[i].start, -2);
    for (let j = i - 1; j >= 0; j--) {
      if (allCand[j].end <= minPrevEnd) {
        prevIdx[i] = j;
        break;
      }
    }
  }

  const dp = Array.from({ length: n + 1 }, () => new Float64Array(budget + 1).fill(0));
  const take = Array.from({ length: n + 1 }, () => new Uint8Array(budget + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const c = allCand[i - 1];
    const p = prevIdx[i - 1] + 1;
    const val = (c.total - c.leave) * 10 + c.hol * 2.5 + c.efficiency * 0.5 - c.leave * 0.05;
    for (let b = 0; b <= budget; b++) {
      let bestVal = dp[i - 1][b];
      let took = 0;
      if (c.leave <= b) {
        const candVal = dp[p][b - c.leave] + val;
        if (candVal > bestVal + 1e-9) {
          bestVal = candVal;
          took = 1;
        }
      }
      dp[i][b] = bestVal;
      take[i][b] = took;
    }
  }

  const picks = [];
  let currI = n, currB = budget;
  while (currI > 0 && currB > 0) {
    if (take[currI][currB] === 1) {
      const c = allCand[currI - 1];
      picks.push(c);
      currB -= c.leave;
      currI = prevIdx[currI - 1] + 1;
    } else {
      currI--;
    }
  }
  picks.reverse();

  const usedLeave = picks.reduce((s, t) => s + t.leave, 0);
  const left = budget - usedLeave;
  const totalOff = picks.reduce((s, t) => s + t.total, 0);
  const totalHol = picks.reduce((s, t) => s + t.hol, 0);
  const totalWeekend = picks.reduce((s, t) => s + t.weekend, 0);

  const combinedLeaveByYear = {};
  for (const t of picks) {
    for (const [yr, cnt] of Object.entries(t.leaveByYear)) {
      combinedLeaveByYear[yr] = (combinedLeaveByYear[yr] || 0) + cnt;
    }
  }

  const otherYears = Object.keys(combinedLeaveByYear).filter(y => Number(y) !== Number(year) && combinedLeaveByYear[y] > 0);
  const boundaryNote = otherYears.length
    ? (fr
      ? `Frontière d’exercice : ${combinedLeaveByYear[year] || 0} jour(s) posé(s) en ${year} et ${otherYears.map(y => `${combinedLeaveByYear[y]} jour(s) en ${y}`).join(', ')}. Vérifiez la période de référence de votre employeur.`
      : `Leave-year boundary: ${combinedLeaveByYear[year] || 0} booked leave day(s) fall in ${year} and ${otherYears.map(y => `${combinedLeaveByYear[y]} leave day(s) fall in ${y}`).join(', ')}. Confirm which employer leave year each date is deducted from.`)
    : (fr
      ? `Frontière d’exercice : les ${usedLeave} jours posés se situent tous sur l’année civile ${year} (vérifiez si votre exercice de congés court de janv. à déc., d’avr. à mars ou de mai à avr.).`
      : `Leave-year boundary: all ${usedLeave} booked leave days fall within calendar year ${year} (check whether your employer leave year runs Jan–Dec, Apr–Mar or May–Apr).`);

  // Determine exact reason if left > 0
  const overlaps = (a, b) => Math.max(a.start, b.start) <= Math.min(a.end, b.end);
  const nextUnpicked = allCand.find(c => !picks.some(p => overlaps(c, p)) && c.leave > left);
  let unusedReason = '';
  if (left === 0) {
    unusedReason = fr
      ? `100 % du budget de ${budget} jours est utilisé sur des ponts sans chevauchement.`
      : `All ${budget} leave days in your allowance are allocated across non-overlapping holiday bridges.`;
  } else if (earliest) {
    unusedReason = fr
      ? `Pourquoi ${left} jour(s) restent libres : les dates passées de ${year} sont exclues et tous les ponts fériés restants de ${year} sont déjà couverts.`
      : `Why ${left} leave day${left === 1 ? ' remains' : 's remain'} unused: past dates in ${year} are excluded and all remaining ${year} public-holiday bridges have been captured.`;
  } else if (nextUnpicked) {
    unusedReason = fr
      ? `Pourquoi ${left} jour(s) restent libres : le prochain pont férié sans chevauchement nécessite ${nextUnpicked.leave} jours de congé (${fmt(nextUnpicked.start)} – ${fmt(nextUnpicked.end)}). Gardez ces ${left} jour(s) pour des journées isolées ou un week-end prolongé.`
      : `Why ${left} leave day${left === 1 ? ' remains' : 's remain'} unused: the next non-overlapping holiday bridge requires ${nextUnpicked.leave} leave days (${fmt(nextUnpicked.start)} – ${fmt(nextUnpicked.end)}). Keep ${left === 1 ? 'this day' : `these ${left} days`} for standalone personal days or a long weekend.`;
  } else {
    unusedReason = fr
      ? `Pourquoi ${left} jour(s) restent libres : tous les groupes de jours fériés ouvrés de ${year} sont déjà pontés avec les week-ends adjacents (les autres jours fériés tombent le week-end). Utilisez ces ${left} jour(s) pour une semaine de vacances d’été ou des congés libres.`
      : `Why ${left} leave day${left === 1 ? ' remains' : 's remain'} unused: every weekday public-holiday cluster in this ${year} calendar has already been bridged across its adjacent weekends (any remaining holidays fall on rest days). Use ${left === 1 ? 'this day' : `these ${left} days`} for standalone summer vacation or personal time.`;
  }

  return {
    budget,
    usedLeave,
    left,
    totalOff,
    totalHol,
    totalWeekend,
    picks,
    multiplier: usedLeave > 0 ? totalOff / usedLeave : 0,
    leaveByYear: combinedLeaveByYear,
    boundaryNote,
    unusedReason
  };
}

function toIcsDate(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
function escIcsText(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function generateIcsContent(tripList, titlePrefix) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HolidayMaximizer.com//Annual Leave Planner V13//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escIcsText(titlePrefix)}`
  ];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  tripList.forEach((t, idx) => {
    const dtStart = toIcsDate(t.start);
    const dtEnd = toIcsDate(addDays(t.end, 1));
    const leaveDays = t.days.filter(x => x.type === 'work').map(x => fmt(x.date, true)).join('; ');
    const hols = [...new Set(t.days.filter(x => x.type === 'holiday').map(x => x.name))].join(', ');
    const retDay = t.returnDate ? fmt(t.returnDate, true) : '';
    const summary = `${titlePrefix}: ${t.total} days off (${t.leave} leave day${t.leave === 1 ? '' : 's'})`;
    const desc = `Book annual leave on: ${leaveDays}.\nPublic holidays included: ${hols || 'None'}.\nReturn to work: ${retDay}.\nEfficiency multiplier: ${t.efficiency.toFixed(2)}x.\nPlanned via https://holidaymaximizer.com/`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:hm-${dtStart}-${dtEnd}-${idx}@holidaymaximizer.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      'TRANSP:OPAQUE',
      `SUMMARY:${escIcsText(summary)}`,
      `DESCRIPTION:${escIcsText(desc)}`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadIcs(icsText, filename) {
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 200);
}

function formatHrRequestSummary(plan, cn, year, pattern) {
  const fr = HM.lang === 'fr';
  const patMeta = getPatternMeta(pattern, HM.lang);
  const header = fr
    ? `Demande de congés annuels — ${cn} (${year}) · ${patMeta.workLabel}\nTotal : ${plan.usedLeave} jour(s) posé(s) sur ${plan.budget} (${plan.left} jour(s) restant(s)) → ${plan.totalOff} jours de repos sur ${plan.picks.length} période(s) (${fmtEfficiency(plan.multiplier)}×)`
    : `Annual Leave Request Summary — ${cn} (${year}) · ${patMeta.workLabel}\nTotal: ${plan.usedLeave} of ${plan.budget} leave days requested (${plan.left} remaining) → ${plan.totalOff} total days off across ${plan.picks.length} break(s) (${fmtEfficiency(plan.multiplier)}×)`;
  const rows = plan.picks.map((t, i) => {
    const L = t.days.filter(x => x.type === 'work').map(x => fmt(x.date, true)).join(', ');
    const H = [...new Set(t.days.filter(x => x.type === 'holiday').map(x => x.name))].join(' + ');
    const ret = t.returnDate ? fmt(t.returnDate, true) : '';
    return fr
      ? `${i + 1}. Du ${fmt(t.start, true)} au ${fmt(t.end, true)} (${t.total} jours de repos, ${t.leave} jour(s) de congé)\n   • Jours ouvrés à poser : ${L}\n   • Jour(s) férié(s) inclus : ${H}\n   • Reprise du travail : ${ret}`
      : `${i + 1}. ${fmt(t.start, true)} – ${fmt(t.end, true)} (${t.total} days off, ${t.leave} leave day${t.leave === 1 ? '' : 's'})\n   • Workdays to book off: ${L}\n   • Public holidays in window: ${H}\n   • Return to work: ${ret}`;
  });
  return `${header}\n\n${rows.join('\n\n')}\n\n${plan.boundaryNote}\n${plan.unusedReason}`;
}

function renderAnnualPlanCard(plan, cn, year, pattern = 'mon-fri') {
  if (!plan || plan.picks.length < 1) return '';
  const fr = HM.lang === 'fr';
  const patMeta = getPatternMeta(pattern, HM.lang);
  const hrText = formatHrRequestSummary(plan, cn, year, pattern);
  const firstBreak = plan.picks[0];
  const refUrl = REFERRAL_CONFIG.buildUrl(cn, iso(firstBreak.start), iso(firstBreak.end));
  return `<aside class="annual-plan-card" id="annualPlanSection" aria-label="${fr ? 'Plan annuel combiné sans chevauchement' : 'Combined non-overlapping annual leave schedule'}">
    <div class="annual-plan-top">
      <div>
        <span class="eyebrow">✦ ${fr ? 'Mode 1 · Plan annuel combiné (sans chevauchement)' : 'Mode 1 · Combined full-year schedule (non-overlapping)'}</span>
        <h4>${plan.totalOff} ${fr ? 'jours de repos au total avec' : 'total days off using'} ${plan.usedLeave} ${fr ? 'jours posés sur' : 'of'} ${plan.budget} (${plan.picks.length} ${fr ? 'période(s)' : `break${plan.picks.length === 1 ? '' : 's'}`})</h4>
        <p class="annual-plan-sub"><strong>${plan.left} ${fr ? 'jour(s) de congé non utilisé(s)' : `leave day${plan.left === 1 ? '' : 's'} unused`}</strong> · ${plan.totalHol} ${fr ? 'jours fériés ouvrés économisés' : 'workday-saving public holidays'} · ${plan.totalWeekend} ${patMeta.restShort}</p>
      </div>
      <div class="score">
        <strong>${fmtEfficiency(plan.multiplier)}×</strong>
        <span>${fr ? 'multiplicateur annuel' : 'combined multiplier'}</span>
      </div>
    </div>
    <ul class="annual-plan-list">
      ${plan.picks.map(t => {
        const L = t.days.filter(x => x.type === 'work');
        const hn = [...new Set(t.days.filter(x => x.type === 'holiday').map(x => x.name))].join(' + ');
        const ret = t.returnDate ? fmt(t.returnDate, true) : '';
        return `<li><strong>${fmt(t.start, true)} → ${fmt(t.end, true)}</strong> (${t.total} ${fr ? 'jours de repos' : 'days off'}, ${t.leave} ${fr ? 'congé(s)' : `leave day${t.leave === 1 ? '' : 's'}`} · ${ hn })<br/><span><strong>${fr ? 'Jours à poser :' : 'Book:'}</strong> ${L.map(x => fmt(x.date, true)).join('; ')}${ret ? ` · <strong>${fr ? 'Reprise :' : 'Return:'}</strong> ${ret}` : ''}</span></li>`;
      }).join('')}
    </ul>
    <div class="plan-meta-notes">
      <p class="plan-note-item"><strong>${fr ? 'Solde restant :' : 'Unused allowance:'}</strong> ${plan.unusedReason}</p>
      <p class="plan-note-item">${plan.boundaryNote}</p>
    </div>
    <div class="trip-actions">
      <button type="button" class="chip-btn primary" data-action="export-plan-ics">📅 ${fr ? 'Exporter le calendrier annuel (.ics)' : 'Export full-year calendar (.ics)'}</button>
      <button type="button" class="chip-btn" data-action="copy-plan">📋 ${fr ? 'Copier la demande RH' : 'Copy employer leave request'}</button>
      <button type="button" class="chip-btn" data-action="copy-share-url">🔗 ${fr ? 'Copier le lien de ce plan' : 'Copy shareable plan link'}</button>
      <a class="chip-btn referral-link" href="${refUrl}" target="_blank" rel="nofollow sponsored noopener" data-action="referral-click">✈️ ${fr ? 'Comparer les vols pour ces dates (lien partenaire test)' : 'Check flights for these dates (disclosed referral test)'}</a>
    </div>
    <details class="hr-summary-box">
      <summary>${fr ? 'Afficher / copier le texte complet pour votre employeur ou RH' : 'Preview / copy formatted employer leave-request text'}</summary>
      <pre class="hr-summary-pre">${hrText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </details>
  </aside>`;
}

function render(t, idx, pattern = 'mon-fri', cn = '') {
  const L = t.days.filter(x => x.type === 'work');
  const hn = [...new Set(t.days.filter(x => x.type === 'holiday').map(x => x.name))];
  const restHn = [...new Set(t.days.filter(x => x.onRestDay).map(x => x.name))];
  const crossYear = t.start.getFullYear() !== t.end.getFullYear();
  const fr = HM.lang === 'fr';
  const patMeta = getPatternMeta(pattern, HM.lang);
  const yearSplit = Object.entries(t.leaveByYear || {}).map(([y, c]) => `${c} ${fr ? 'en' : 'in'} ${y}`).join(' + ');
  const boundary = (t.crossesPrev || t.crossesNext || Object.keys(t.leaveByYear || {}).length > 1)
    ? (fr ? `Frontière d’exercice : ${yearSplit}` : `Leave-year split: ${yearSplit}`)
    : '';
  const holidayLabel = hn.length <= 3 ? hn.join(' + ') : hn.slice(0, 2).join(' + ') + ` + ${hn.length - 2} ${fr ? 'autre' + (hn.length - 2 > 1 ? 's' : '') : 'more'}`;
  const refUrl = REFERRAL_CONFIG.buildUrl(cn || 'Destination', iso(t.start), iso(t.end));
  return `<article class="trip-card" data-trip-idx="${idx}">
    <div class="trip-top">
      <div>
        <div class="trip-title">${t.total} ${fr ? 'jours de repos avec' : 'days off using'} ${t.leave} ${fr ? 'jour(s) de congé' : 'leave day' + (t.leave === 1 ? '' : 's')}</div>
        <div class="trip-sub">${fmt(t.start, true)} → ${fmt(t.end, true)}${holidayLabel ? ' · ' + holidayLabel : ''}</div>
      </div>
      <div class="score">
        <strong>${fmtEfficiency(t.efficiency)}×</strong>
        <span>${fr ? 'multiplicateur' : 'days-off multiplier'}</span>
      </div>
    </div>
    <div class="trip-metrics">
      <span class="pill orange">${fr ? 'Poser' : 'Book'} ${L.length}</span>
      <span class="pill green">${t.hol} ${fr ? 'jour(s) férié(s) ouvré(s)' : `workday public holiday${t.hol === 1 ? '' : 's'}`}</span>
      <span class="pill">${t.weekend} ${patMeta.restShort}</span>
      ${boundary ? `<span class="pill">${boundary}</span>` : ''}
    </div>
    <p class="book-dates"><strong>${fr ? 'Jours ouvrés à poser :' : 'Book these workdays:'}</strong> ${L.map(x => fmt(x.date, true)).join('; ')}${t.returnDate ? ` · <strong>${fr ? 'Reprise :' : 'Return to work:'}</strong> ${fmt(t.returnDate, true)}` : ''}</p>
    ${restHn.length ? `<p class="rest-holiday-note"><small>${fr ? `Note : ${restHn.join(', ')} tombe sur un jour de repos habituel (${patMeta.restShort}) et n’est pas compté comme jour ouvré économisé.` : `Note: ${restHn.join(', ')} falls on a scheduled rest day (${patMeta.restShort}) and is not counted as a saved workday unless a replacement day applies.`}</small></p>` : ''}
    <div class="trip-days">${t.days.map(x => `<div class="date-chip ${x.type === 'work' ? 'leave' : x.type}" title="${x.name || ''}"><small>${fmt(x.date).split(' ')[0]}</small><b>${x.date.getDate()}</b><small>${x.date.toLocaleString(fr ? 'fr-FR' : 'en-GB', { month: 'short' })}</small>${crossYear ? `<small class="chip-year">${x.date.getFullYear()}</small>` : ''}</div>`).join('')}</div>
    <div class="trip-actions">
      <button type="button" class="chip-btn" data-action="export-ics" data-idx="${idx}">📅 ${fr ? 'Ajouter au calendrier (.ics)' : 'Add to calendar (.ics)'}</button>
      <button type="button" class="chip-btn" data-action="copy-trip" data-idx="${idx}">📋 ${fr ? 'Copier pour les RH' : 'Copy dates for HR'}</button>
      <a class="chip-btn referral-link" href="${refUrl}" target="_blank" rel="nofollow sponsored noopener" data-action="referral-click">✈️ ${fr ? 'Vols pour ces dates (lien test)' : 'Flights for these dates (referral test)'}</a>
    </div>
  </article>`;
}

async function updateRegions() {
  const c = $('#locale'), r = $('#region');
  if (!c || !r) return;
  const cc = baseCode(c.value);
  const names = HM.subs[cc] || [];
  const year = +($('#year')?.value || new Date().getFullYear());
  const local = Object.values(HM.data.locales).filter(x => x.code.startsWith(cc + '-')).map(x => ({ code: x.code, name: x.label.replace(/^.*?—\s*/, ''), local: true }));
  const opts = [...local];
  // Only call external API if no local subdivisions exist or to supplement
  const api = await apiHolidays(cc, year);
  const used = new Set(api.flatMap(h => h.subdivisionCodes || []));
  for (const x of names) {
    if (used.has(x.code) && !opts.some(o => o.code === x.code)) opts.push(x);
  }
  opts.sort((a, b) => a.name.localeCompare(b.name));
  const prev = new URLSearchParams(location.search).get('region') || '';
  r.innerHTML = `<option value="">${HM.lang === 'fr' ? 'National / toutes les régions' : 'National / all regions'}</option>` + opts.map(x => `<option value="${x.code}">${x.name}</option>`).join('');
  r.disabled = !opts.length;
  if (prev && [...r.options].some(o => o.value === prev)) r.value = prev;
}

function ensureWorkPatternField() {
  const form = $('#plannerForm');
  if (!form || $('#workPattern')) return;
  const fr = HM.lang === 'fr';
  const tripRangeField = $('#tripRange')?.closest('.field');
  if (!tripRangeField) return;
  const div = document.createElement('div');
  div.className = 'field';
  div.innerHTML = `<label for="workPattern">${fr ? 'Rythme de travail' : 'Workweek pattern'}</label>
    <select id="workPattern">
      <option value="mon-fri" selected>${fr ? 'Lun–Ven (week-end Sam–Dim)' : 'Mon–Fri (Sat–Sun weekend)'}</option>
      <option value="mon-thu">${fr ? 'Semaine de 4 jours Lun–Jeu (Ven–Dim off)' : '4-day week Mon–Thu (Fri–Sun off)'}</option>
      <option value="sun-thu">${fr ? 'Dim–Jeu (week-end Ven–Sam)' : 'Sun–Thu (Fri–Sat weekend)'}</option>
      <option value="tue-sat">${fr ? 'Mar–Sam (repos Dim–Lun)' : 'Tue–Sat (Sun–Mon off)'}</option>
    </select>`;
  tripRangeField.after(div);
}

async function populate() {
  const loc = $('#locale');
  if (!loc) return;
  ensureWorkPatternField();
  const p = new URLSearchParams(location.search);
  const current = p.get('country') || loc.dataset.default || 'DK';
  let displayNames;
  try {
    displayNames = new Intl.DisplayNames([HM.lang === 'fr' ? 'fr' : 'en'], { type: 'region' });
  } catch (_) {}
  const entries = HM.countries.map(x => ({ code: x.code, label: (displayNames && displayNames.of(x.code)) || x.name }));
  entries.sort((a, b) => a.label.localeCompare(b.label, HM.lang === 'fr' ? 'fr' : 'en'));
  loc.innerHTML = entries.map(e => `<option value="${e.code}">${HM.lang === 'en' && e.code === 'GB' ? 'UK' : e.label}</option>`).join('');
  loc.value = baseCode(current);
  if (!loc.value) loc.value = 'DK';
  const y = $('#year');
  const now = new Date().getFullYear();
  const defaultYear = new Date().getMonth() >= 9 ? now + 1 : now;
  y.innerHTML = [0, 1, 2, 3, 4, 5].map(n => `<option>${now + n}</option>`).join('');
  y.value = p.get('year') || defaultYear;
  if (!y.value) y.value = String(defaultYear);
  const savedRange = p.get('range');
  if (savedRange && [...$('#tripRange').options].some(o => o.value === savedRange)) $('#tripRange').value = savedRange;
  const savedPattern = p.get('pattern');
  if (savedPattern && $('#workPattern') && [...$('#workPattern').options].some(o => o.value === savedPattern)) $('#workPattern').value = savedPattern;
  $('#leave').value = p.get('leave') || 20;
  await updateRegions();
  const regionParam = p.get('region') || (current.includes('-') ? current : '');
  if (regionParam && $('#region') && [...$('#region').options].some(o => o.value === regionParam)) {
    $('#region').value = regionParam;
  }
}

async function holidayList(code, region, year) {
  const localKey = region && HM.data.holidays[region]?.[String(year)]
    ? region
    : (!region && HM.data.holidays[code]?.[String(year)] ? code : null);
  if (localKey) {
    return {
      items: HM.data.holidays[localKey][String(year)].map(h => ({ ...h, name: canonicalHolidayName(code, h.date, h.name) })),
      localKey
    };
  }
  return { items: normalizeApi(await apiHolidays(code, year), region, code), localKey: null };
}

async function run() {
  const results = $('#results');
  if (!results) return;
  results.setAttribute('aria-busy', 'true');
  try {
    const code = $('#locale').value;
    const region = $('#region')?.value || '';
    const year = +$('#year').value;
    const budget = Math.min(90, Math.max(1, Math.floor(+$('#leave').value || 1)));
    const range = $('#tripRange').value.split('-').map(Number);
    const min = range[0] || 3;
    const max = range[1] || 30;
    const pattern = getWorkPattern();
    const patMeta = getPatternMeta(pattern, HM.lang);
    const fr = HM.lang === 'fr';

    const [previous, current, next] = await Promise.all([
      holidayList(code, region, year - 1),
      holidayList(code, region, year),
      holidayList(code, region, year + 1)
    ]);
    const seen = new Map();
    [...previous.items, ...current.items, ...next.items].forEach(h => seen.set(h.date, h));
    const hs = [...seen.values()];
    const meta = HM.data.locales[current.localKey || code];
    const note = $('#countryNote');
    if (note) {
      note.innerHTML =
        (meta ? `<strong>${meta.label}:</strong> ${meta.note} ` : '') +
        (region ? `${fr ? 'Calendrier régional sélectionné.' : 'Regional calendar selected.'} ` : '') +
        `<strong>${patMeta.workLabel}:</strong> ${patMeta.assumption} ` +
        (note.dataset.note || '');
    }

    // Update legend to match selected workweek pattern
    const legendSpans = document.querySelectorAll('.legend span');
    if (legendSpans.length >= 3) {
      legendSpans[0].textContent = fr ? 'Jours de congé à poser' : 'Leave days to book';
      legendSpans[1].textContent = fr ? 'Jours fériés ouvrés' : 'Workday public holidays';
      legendSpans[2].textContent = patMeta.restLabel;
    }

    const now = new Date();
    const today = makeDate(now.getFullYear(), now.getMonth(), now.getDate());
    const earliest = year === today.getFullYear() ? today : null;
    const trips = current.items.length ? optimize(hs, year, budget, min, max, earliest, pattern) : [];
    HM.lastTrips = trips;
    HM.lastPlan = current.items.length ? buildAnnualPlan(hs, year, budget, earliest, pattern) : null;

    const cn = $('#locale').selectedOptions[0].text;
    const rn = region && $('#region').selectedOptions[0].text;
    const labelTitle = `${cn}${rn ? ' — ' + rn : ''} · ${year}`;
    $('#resultsTitle').textContent = labelTitle;
    $('#resultsMeta').textContent = `${budget} ${fr ? 'jours de congé' : 'leave days'} · ${min}–${max} ${fr ? 'jours' : 'day trips'} · ${patMeta.workLabel} · ${fr ? 'plan annuel combiné + options individuelles' : 'combined annual schedule + individual break alternatives'}`;

    if (trips.length || (HM.lastPlan && HM.lastPlan.picks.length)) {
      const planHtml = renderAnnualPlanCard(HM.lastPlan, cn, year, pattern);
      const singleHeader = `<div class="single-breaks-header" id="singleBreaksSection">
        <h4>${fr ? 'Mode 2 · Options de coupures individuelles (alternatives indépendantes)' : 'Mode 2 · Individual break alternatives (pick any single window)'}</h4>
        <p>${fr ? `Chaque carte ci-dessous est une option indépendante de ${min} à ${max} jours respectant votre budget de ${budget} jour(s). Comparez ces périodes séparément du plan annuel combiné ci-dessus.` : `Each card below is a standalone ${min}–${max} day break option within your ${budget}-day allowance. Compare these individual alternatives separately from the combined annual schedule above.`}</p>
      </div>`;
      results.innerHTML = planHtml + singleHeader + trips.map((t, i) => render(t, i, pattern, cn)).join('');
      trackAggregateEvent('planner_complete', { countryPage: region || code });
    } else {
      results.innerHTML = `<div class="empty"><strong>${fr ? 'Aucune combinaison utile trouvée.' : 'No useful combination found.'}</strong> ${current.items.length ? (fr ? 'Essayez une autre durée de séjour, une autre année ou un autre budget de congés.' : 'Try another trip length, year or leave budget.') : (fr ? 'Aucune donnée de jour férié prise en charge n’a été renvoyée pour ce pays/cette année. Consultez le guide du pays et les sources officielles.' : 'No supported public-holiday data was returned for this country/year. Check the country guide and official sources.')}</div>`;
    }

    const q =
      `?country=${code}&year=${year}&leave=${budget}&range=${min}-${max}` +
      (region ? `&region=${encodeURIComponent(region)}` : '') +
      (pattern !== 'mon-fri' ? `&pattern=${pattern}` : '');
    history.replaceState(null, '', location.pathname + q);
  } finally {
    results.setAttribute('aria-busy', 'false');
  }
}

function setupResultActions() {
  const results = $('#results');
  if (!results) return;
  results.addEventListener('click', async e => {
    const refLink = e.target.closest('a[data-action="referral-click"]');
    if (refLink) {
      trackAggregateEvent('referral_click');
      return;
    }
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const cn = $('#locale')?.selectedOptions?.[0]?.text || 'HolidayMaximizer';
    const year = $('#year')?.value || '2027';
    const pattern = getWorkPattern();
    if (action === 'export-ics') {
      const idx = +btn.dataset.idx;
      const t = HM.lastTrips[idx];
      if (!t) return;
      const ics = generateIcsContent([t], `${cn} Leave Break`);
      downloadIcs(ics, `holidaymaximizer-${iso(t.start)}-to-${iso(t.end)}.ics`);
      trackAggregateEvent('ics_export_single');
    } else if (action === 'export-plan-ics') {
      if (!HM.lastPlan || !HM.lastPlan.picks.length) return;
      const ics = generateIcsContent(HM.lastPlan.picks, `${cn} ${year} Leave Plan`);
      downloadIcs(ics, `holidaymaximizer-${cn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${year}-plan.ics`);
      trackAggregateEvent('ics_export_plan');
    } else if (action === 'copy-trip') {
      const idx = +btn.dataset.idx;
      const t = HM.lastTrips[idx];
      if (!t) return;
      const L = t.days.filter(x => x.type === 'work').map(x => fmt(x.date, true)).join('; ');
      const ret = t.returnDate ? fmt(t.returnDate, true) : '';
      const txt = `${cn} Leave Request: ${t.total} days off (${fmt(t.start, true)} – ${fmt(t.end, true)}, ${t.efficiency.toFixed(2)}x multiplier) using ${t.leave} leave day(s). Workdays to book off: ${L}.${ret ? ` Return to work: ${ret}.` : ''}`;
      try {
        await navigator.clipboard.writeText(txt);
      } catch (_) {}
      trackAggregateEvent('hr_summary_copy');
      const orig = btn.textContent;
      btn.textContent = HM.lang === 'fr' ? '✓ Copié !' : '✓ Copied!';
      setTimeout(() => {
        btn.textContent = orig;
      }, 1800);
    } else if (action === 'copy-plan') {
      if (!HM.lastPlan || !HM.lastPlan.picks.length) return;
      const txt = formatHrRequestSummary(HM.lastPlan, cn, year, pattern);
      try {
        await navigator.clipboard.writeText(txt);
      } catch (_) {}
      trackAggregateEvent('plan_summary_copy');
      const orig = btn.textContent;
      btn.textContent = HM.lang === 'fr' ? '✓ Copié !' : '✓ Copied!';
      setTimeout(() => {
        btn.textContent = orig;
      }, 1800);
    } else if (action === 'copy-share-url') {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch (_) {}
      trackAggregateEvent('share_url_copy');
      const orig = btn.textContent;
      btn.textContent = HM.lang === 'fr' ? '✓ Lien copié !' : '✓ Link copied!';
      setTimeout(() => {
        btn.textContent = orig;
      }, 1800);
    }
  });
}

function setupNav() {
  const b = $('.menu-toggle'), n = $('.navlinks');
  if (!b || !n) return;
  b.addEventListener('click', () => {
    const open = n.classList.toggle('open');
    b.setAttribute('aria-expanded', String(open));
    b.textContent = open ? (HM.lang === 'fr' ? 'Fermer' : 'Close') : 'Menu';
  });
  n.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      n.classList.remove('open');
      b.setAttribute('aria-expanded', 'false');
      b.textContent = 'Menu';
    })
  );
}

function isEeaOrUkVisitor() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('eea') === '1') return true;
    if (params.get('eea') === '0') return false;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return tz.startsWith('Europe/') || tz === 'Atlantic/Reykjavik' || tz === 'Atlantic/Faroe' || tz === 'Atlantic/Canary' || tz === 'Atlantic/Madeira';
  } catch (_) {
    return true;
  }
}

function clearAdSlots() {
  document.querySelectorAll('.ad-slot').forEach(slot => {
    slot.classList.remove('ad-active', 'ad-size-728', 'ad-size-320', 'ad-size-300');
    delete slot.dataset.adLoaded;
    slot.innerHTML = '';
  });
}

function renderAdSlots() {
  try {
    if (!ADSTERRA_CONFIG.enabled) {
      clearAdSlots();
      return;
    }
    const isMobile = window.innerWidth < 768;
    const fr = HM.lang === 'fr';
    const slots = document.querySelectorAll('.ad-slot[data-ad-slot]');
    slots.forEach(slot => {
      if (slot.dataset.adLoaded === '1') return;
      const slotId = slot.getAttribute('data-ad-slot');
      let unit = null;
      let sizeClass = 'ad-size-728';
      if (slotId === 'M1') {
        unit = ADSTERRA_CONFIG.units.rectangleBanner;
        sizeClass = 'ad-size-300';
      } else if (isMobile) {
        unit = ADSTERRA_CONFIG.units.mobileBanner;
        sizeClass = 'ad-size-320';
      } else {
        unit = ADSTERRA_CONFIG.units.desktopBanner;
        sizeClass = 'ad-size-728';
      }
      if (!unit || !unit.key || !unit.scriptUrl) {
        slot.classList.remove('ad-active');
        return;
      }
      slot.dataset.adLoaded = '1';
      slot.classList.add('ad-active', sizeClass);

      const label = document.createElement('div');
      label.className = 'ad-slot-label';
      label.textContent = fr ? 'Publicité · Adsterra' : 'Advertisement · Adsterra';

      const frameWrap = document.createElement('div');
      frameWrap.className = 'ad-frame-reserve';
      frameWrap.style.cssText = `min-height:${unit.height}px;width:100%;display:flex;align-items:center;justify-content:center;`;

      const iframe = document.createElement('iframe');
      iframe.className = 'adsterra-frame';
      iframe.width = String(unit.width);
      iframe.height = String(unit.height);
      iframe.scrolling = 'no';
      iframe.frameBorder = '0';
      iframe.loading = 'lazy';
      iframe.title = fr ? 'Publicité' : 'Advertisement';
      iframe.style.cssText = `border:0;overflow:hidden;width:${unit.width}px;height:${unit.height}px;max-width:100%;display:block;margin:0 auto;`;
      iframe.srcdoc = `<!doctype html><html><body style="margin:0;padding:0;background:transparent;overflow:hidden;"><script>atOptions={'key':'${unit.key}','format':'iframe','height':${unit.height},'width':${unit.width},'params':{}};<\/script><script src="${unit.scriptUrl}" async onload="window.parent.postMessage({type:'hm-ad-loaded',slot:'${slotId}',unit:'${unit.alias}'},'*')" onerror="window.parent.postMessage({type:'hm-ad-error',slot:'${slotId}',unit:'${unit.alias}'},'*')"><\/script></body></html>`;

      frameWrap.appendChild(iframe);
      slot.innerHTML = '';
      slot.appendChild(label);
      slot.appendChild(frameWrap);
    });
  } catch (_) {
    clearAdSlots();
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.HM = HM;
  HM.getTelemetrySummary = () => {
    try {
      return {
        sessionEvents: HM.telemetry.events,
        storedCounts: JSON.parse(localStorage.getItem('hm_agg_counts_v13') || '{}'),
        visitMeta: JSON.parse(localStorage.getItem('hm_visit_meta_v13') || '{}')
      };
    } catch (_) {
      return { sessionEvents: HM.telemetry.events };
    }
  };
  window.addEventListener('message', e => {
    if (!e || !e.data) return;
    if (e.data.type === 'hm-ad-error' && e.data.slot) {
      const slot = document.querySelector(`.ad-slot[data-ad-slot="${e.data.slot}"]`);
      if (slot) {
        slot.classList.remove('ad-active', 'ad-size-728', 'ad-size-320', 'ad-size-300');
        delete slot.dataset.adLoaded;
        slot.innerHTML = '';
      }
      trackAggregateEvent('ad_slot_blocked', { slot: e.data.slot, unit: e.data.unit || '' });
    } else if (e.data.type === 'hm-ad-loaded' && e.data.slot) {
      trackAggregateEvent('ad_slot_rendered', { slot: e.data.slot, unit: e.data.unit || '' });
    }
  });
}

function initConsentAndAds() {
  const STORAGE_KEY = 'hm_ad_consent';
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (_) {}
  const fr = HM.lang === 'fr';

  function showConsentBanner() {
    let banner = $('#consent-banner');
    if (!banner) {
      banner = document.createElement('aside');
      banner.id = 'consent-banner';
      banner.className = 'consent-banner';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', fr ? 'Préférences de confidentialité et de cookies' : 'Cookie and advertising preferences');
      banner.innerHTML = `
        <div class="wrap consent-inner">
          <p class="consent-text"><strong>${fr ? 'Confidentialité et cookies :' : 'Privacy &amp; cookies:'}</strong> ${fr ? 'HolidayMaximizer fonctionne dans votre navigateur sans transmettre vos dates personnelles. Avec votre accord, notre partenaire publicitaire (Adsterra) peut utiliser des cookies pour afficher des bannières qui financent cet outil gratuit. Voir notre <a href="/fr/privacy/">Politique de confidentialité</a>.' : 'HolidayMaximizer runs in your browser without transmitting your personal leave dates. With your consent, our advertising partner (Adsterra) may use cookies and device data to show display banners that keep this planner free. See our <a href="/privacy/">Privacy Policy</a>.'}</p>
          <div class="consent-actions">
            <button type="button" class="btn consent-btn-accept" id="consent-accept">${fr ? 'Accepter les bannières publicitaires' : 'Accept advertising cookies'}</button>
            <button type="button" class="btn consent-btn-decline" id="consent-decline">${fr ? 'Essentiels uniquement (sans pub)' : 'Essential only (no ads)'}</button>
          </div>
        </div>
      `;
      document.body.appendChild(banner);
      document.body.classList.add('has-consent-banner');
      $('#consent-accept')?.addEventListener('click', () => {
        try {
          localStorage.setItem(STORAGE_KEY, 'granted');
        } catch (_) {}
        banner.remove();
        document.body.classList.remove('has-consent-banner');
        trackAggregateEvent('consent_granted');
        renderAdSlots();
      });
      $('#consent-decline')?.addEventListener('click', () => {
        try {
          localStorage.setItem(STORAGE_KEY, 'declined');
        } catch (_) {}
        banner.remove();
        document.body.classList.remove('has-consent-banner');
        trackAggregateEvent('consent_declined');
        clearAdSlots();
      });
    }
  }

  document.querySelectorAll('[data-open-consent]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      showConsentBanner();
    });
  });

  if (saved === 'granted') {
    renderAdSlots();
  } else if (saved === 'declined') {
    clearAdSlots();
  } else if (isEeaOrUkVisitor()) {
    showConsentBanner();
  } else {
    renderAdSlots();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  HM.lang = document.documentElement.lang || 'en';
  setupNav();
  setupLanguageSwitch();
  initReturnUseTracking();
  initConsentAndAds();
  if (!document.querySelector('#plannerForm')) return;
  setupResultActions();
  try {
    const [d, c, s] = await Promise.all([
      fetch('/data/holidays-v13.json').then(r => r.json()),
      fetch('/data/countries.json').then(r => r.json()),
      fetch('/data/subdivisions.json').then(r => r.json())
    ]);
    HM.data = d;
    HM.countries = c;
    HM.subs = s;
    await populate();
    $('#locale')?.addEventListener('change', async () => {
      await updateRegions();
      run();
    });
    $('#region')?.addEventListener('change', run);
    $('#year')?.addEventListener('change', async () => {
      await updateRegions();
      run();
    });
    $('#leave')?.addEventListener('change', run);
    $('#tripRange')?.addEventListener('change', run);
    $('#workPattern')?.addEventListener('change', run);
    $('#plannerForm').addEventListener('submit', e => {
      e.preventDefault();
      run();
    });
    window.addEventListener('popstate', async () => {
      await populate();
      run();
    });
    run();
  } catch (e) {
    console.error(e);
    const results = $('#results');
    if (results) {
      results.setAttribute('aria-busy', 'false');
      results.textContent =
        HM.lang === 'fr'
          ? 'Impossible de charger le calendrier. Rechargez la page ou consultez les guides.'
          : 'The calendar could not load. Reload this page or use the dated country guides below.';
    }
  }
});
