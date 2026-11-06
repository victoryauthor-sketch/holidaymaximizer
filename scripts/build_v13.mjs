import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = 'C:/Users/HP-User/.gemini/antigravity/scratch/holidaymaximizer';
const V12_SRC = 'C:/Users/HP-User/Documents/Codex/2026-10-17/yo/work/release';
const TODAY = '2026-11-06';
const GSC_VERIFICATION = 'uBlwh9aRM-wKTubHzWG6-WVt3_PWccE_kHOQRorzKEE';
const INDEXNOW_KEY = '4f8b9c2d1e6a7f3b5c8d9e0f1a2b3c4d';

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
    nameFr: 'Danemark',
    key: 'DK',
    scope: 'National calendar',
    scopeFr: 'Calendrier national',
    url: 'https://www.nationalbanken.dk/en/what-we-do/stable-prices-monetary-policy-and-the-danish-economy/bank-holidays',
    authority: 'Danmarks Nationalbank',
    note: 'Bank closure dates are not all statutory general days off. This model excludes 5 June (Constitution Day), 24 December, 31 December and the Friday after Ascension, as well as the abolished Store bededag holiday. Many Danish collective agreements grant 5 extra contract leave days (feriefridage) and paid time off on 24 December; confirm your contract before booking.',
    noteFr: 'Les fermetures bancaires ne sont pas toutes des jours fériés légaux chômés. Ce modèle exclut le 5 juin (Constitution), les 24 et 31 décembre ainsi que le vendredi suivant l’Ascension. De nombreuses conventions collectives accordent 5 jours supplémentaires (feriefridage) ; vérifiez votre contrat.',
    focus: 'Easter combines three weekday public holidays in 2027 (Maundy Thursday 25 March, Good Friday 26 March and Easter Monday 29 March). Ascension Day on Thursday 6 May and Whit Monday on 17 May create strong May bridge windows.',
    focusFr: 'En 2027, Pâques réunit trois jours fériés en semaine (jeudi saint 25 mars, vendredi saint 26 mars et lundi de Pâques 29 mars). L’Ascension (jeudi 6 mai) et le lundi de Pentecôte (17 mai) offrent deux ponts majeurs au printemps.'
  },
  GB: {
    name: 'UK',
    nameFr: 'Royaume-Uni',
    key: 'GB-ENG',
    scope: 'England and Wales',
    scopeFr: 'Angleterre et Pays de Galles',
    url: 'https://www.gov.uk/bank-holidays',
    authority: 'GOV.UK',
    note: 'These examples use the England and Wales bank-holiday calendar (8 bank holidays). Choose Scotland (9 bank holidays) or Northern Ireland (10 bank holidays) below or in the planner for regional dates. Under UK law, statutory minimum leave is 5.6 weeks (28 days) which may include bank holidays depending on your employment contract—enter only the bookable leave days remaining in your allowance.',
    noteFr: 'Ces exemples utilisent le calendrier d’Angleterre et du Pays de Galles (8 bank holidays). Choisissez l’Écosse ou l’Irlande du Nord dans le planificateur pour les dates régionales. Le minimum légal britannique de 28 jours peut inclure les jours fériés selon votre contrat : saisissez uniquement votre solde de congés à poser.',
    focus: 'In 2027, Good Friday (26 March) and Easter Monday (29 March) turn 4 leave days into a 10-day spring break, while official substitute bank holidays for Christmas Day and Boxing Day fall on Monday 27 and Tuesday 28 December 2027.',
    focusFr: 'En 2027, le Vendredi saint (26 mars) et le lundi de Pâques (29 mars) transforment 4 jours posés en 10 jours de repos, tandis que les jours fériés de substitution pour Noël et Boxing Day tombent les lundi 27 et mardi 28 décembre 2027.'
  },
  IE: {
    name: 'Ireland',
    nameFr: 'Irlande',
    key: 'IE',
    scope: 'National calendar',
    scopeFr: 'Calendrier national',
    url: 'https://www.workplacerelations.ie/en/what_you_should_know/public-holidays/',
    authority: 'Workplace Relations Commission',
    note: 'Good Friday is a bank/school closure in some sectors but is not a statutory public holiday in Ireland. When a public holiday falls on a weekend, there is no automatic legal right to the next Monday off, though employers must provide a paid day off within a month, an additional day of annual leave, or an additional day’s pay.',
    noteFr: 'Le Vendredi saint n’est pas un jour férié légal en Irlande. Lorsqu’un jour férié tombe le week-end, le lundi suivant n’est pas automatiquement chômé de plein droit, mais l’employeur doit accorder une contrepartie légale (jour de repos, congé supplémentaire ou majoration).',
    focus: 'St Brigid’s Day (Monday 1 February), St Patrick’s Day (Wednesday 17 March), and Easter Monday (29 March) provide three distinct spring leverage windows in 2027.',
    focusFr: 'La Sainte-Brigitte (lundi 1er février), la Saint-Patrick (mercredi 17 mars) et le lundi de Pâques (29 mars) offrent trois fenêtres d’optimisation au printemps 2027.'
  },
  DE: {
    name: 'Germany',
    nameFr: 'Allemagne',
    key: 'DE-BE',
    scope: 'Berlin & regional calendars',
    scopeFr: 'Berlin et calendriers des Länder',
    url: 'https://www.berlin.de/en/tourism/travel-information/1887651-2862820-public-holidays-school-holidays.en.html',
    authority: 'Berlin.de',
    note: 'German public holidays are governed by state (Land) law. These baseline examples use Berlin (which observes International Women’s Day on 8 March). Select Bavaria, North Rhine-Westphalia, Hamburg or Saxony below or in the planner for state-specific holidays such as Epiphany (6 January), Corpus Christi (27 May), Reformation Day (31 October), All Saints’ Day (1 November) or Repentance and Prayer Day (17 November). Germany does not grant substitute weekday holidays when a statutory holiday falls on a weekend.',
    noteFr: 'Les jours fériés allemands relèvent des Länder. Ces calculs utilisent Berlin (incluant le 8 mars). Sélectionnez la Bavière, la Rhénanie-du-Nord-Westphalie, Hambourg ou la Saxe pour les fêtes régionales (Épiphanie, Fête-Dieu, Toussaint). Les jours fériés tombant un week-end ne sont pas reportés en Allemagne.',
    focus: 'International Women’s Day falls on Monday 8 March 2027 in Berlin, while Good Friday (26 March), Easter Monday (29 March), Ascension Day (Thursday 6 May) and Whit Monday (17 May) create high-multiplier bridge weeks across Germany.',
    focusFr: 'La Journée internationale des droits des femmes tombe le lundi 8 mars 2027 à Berlin, suivie du Vendredi saint (26 mars), du lundi de Pâques (29 mars), de l’Ascension (jeudi 6 mai) et de la Pentecôte (17 mai).'
  },
  FR: {
    name: 'France',
    nameFr: 'France',
    key: 'FR',
    scope: 'Metropolitan national calendar',
    scopeFr: 'Calendrier national métropolitain',
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2405',
    authority: 'Service-Public.fr',
    note: 'In France, only 1 May (Labour Day) is statutorily required to be non-working for all employees, though most collective agreements treat the other 10 national public holidays as paid days off. Whit Monday may be worked as the unpaid solidarity day (journée de solidarité). Alsace-Moselle (Good Friday and 26 December) and overseas departments have additional statutory holidays. Enter your 5-day-week congés payés or RTT allowance.',
    noteFr: 'En France, seul le 1er mai est légalement chômé pour tous, mais la plupart des conventions collectives chôment les 10 autres jours fériés nationaux. Le lundi de Pentecôte peut être travaillé au titre de la journée de solidarité. L’Alsace-Moselle et l’Outre-mer disposent de jours fériés supplémentaires.',
    focus: 'Ascension Day (Thursday 6 May 2027), Bastille Day (Wednesday 14 July) and Armistice Day (Thursday 11 November) provide prime French “faire le pont” bridge opportunities.',
    focusFr: 'Le jeudi de l’Ascension (6 mai 2027), la Fête nationale (mercredi 14 juillet) et l’Armistice (jeudi 11 novembre) offrent d’excellentes opportunités de ponts en 2027.'
  },
  NL: {
    name: 'Netherlands',
    nameFr: 'Pays-Bas',
    key: 'NL',
    scope: 'National public holidays',
    scopeFr: 'Jours fériés nationaux',
    url: 'https://www.government.nl/themes/work/working-hours/question-and-answer/work/public-holidays-in-the-netherlands',
    authority: 'Government.nl',
    note: 'Under Dutch law, there is no automatic statutory right to a paid day off on a public holiday; your collective labour agreement (CAO) or employment contract determines which holidays are off. This calendar includes King’s Day (27 April), Liberation Day (5 May) and Ascension Day (6 May), and excludes Good Friday (often worked in the private sector). Verify your CAO before booking.',
    noteFr: 'Aux Pays-Bas, la loi n’accorde pas automatiquement un jour chômé payé les jours fériés : votre convention collective (CAO) ou votre contrat détermine les jours chômés (notamment pour le 5 mai et le Vendredi saint). Vérifiez votre CAO avant de poser vos congés.',
    focus: 'King’s Day falls on Tuesday 27 April 2027, followed the next week by Liberation Day (Wednesday 5 May) and Ascension Day (Thursday 6 May) for workers whose CAO grants Liberation Day off.',
    focusFr: 'La Fête du Roi tombe le mardi 27 avril 2027, suivie la semaine suivante par le Jour de la Libération (mercredi 5 mai) et l’Ascension (jeudi 6 mai).'
  },
  IT: {
    name: 'Italy',
    nameFr: 'Italie',
    key: 'IT',
    scope: 'National calendar',
    scopeFr: 'Calendrier national',
    url: 'https://www.italia.it/en/italy/practical-information/time-zones-and-public-holidays-italy',
    authority: 'Italia.it',
    extra: 'https://www.normattiva.it/eli/id/2025/10/10/25G00153/CONSOLIDATED',
    note: 'Local municipal patron-saint holidays (such as 29 June in Rome or 7 December in Milan) are not included in the national baseline. The calendar includes 4 October, the restored national public holiday for St Francis of Assisi effective from 2026 under Law 151/2025. In Italy, public holidays falling on Sunday usually confer additional pay (festività non goduta) rather than a replacement Monday off.',
    noteFr: 'Les fêtes patronales municipales ne sont pas incluses dans le calendrier national. Le calendrier intègre le 4 octobre (Saint François d’Assise), rétabli comme jour férié national par la loi 151/2025. Les jours fériés tombant un dimanche donnent généralement lieu à une indemnité plutôt qu’à un report.',
    focus: 'Epiphany falls on Wednesday 6 January 2027, Republic Day on Wednesday 2 June, St Francis of Assisi on Monday 4 October, and Immaculate Conception on Wednesday 8 December—creating strong mid-week “ponte” bridges throughout 2027.',
    focusFr: 'L’Épiphanie (mercredi 6 janvier 2027), la Fête de la République (mercredi 2 juin), la Saint-François (lundi 4 octobre) et l’Immaculée Conception (mercredi 8 décembre) permettent de nombreux ponts en 2027.'
  },
  US: {
    name: 'United States',
    nameFr: 'États-Unis',
    key: 'US',
    scope: 'Federal observed calendar, Monday–Friday schedule',
    scopeFr: 'Calendrier fédéral observé (horaire Lun–Ven)',
    url: 'https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/',
    authority: 'U.S. Office of Personnel Management',
    note: 'The United States has no federal statutory paid vacation minimum for private-sector workers, and federal holidays apply by law only to federal employees. Private employers decide which holidays are paid days off (for example, many private employers grant the Friday after Thanksgiving off while not observing Columbus Day or Veterans Day). Check your employer handbook.',
    noteFr: 'Les États-Unis n’imposent pas de congé payé légal fédéral dans le secteur privé, et les jours fériés fédéraux (OPM) ne s’imposent légalement qu’aux employés fédéraux. Vérifiez les jours effectivement chômés par votre employeur.',
    focus: 'In 2027, OPM observed federal holidays include Friday 18 June (Juneteenth observed), Monday 5 July (Independence Day observed), Thursday 11 November (Veterans Day), Thursday 25 November (Thanksgiving) and Friday 24 December (Christmas Day observed).',
    focusFr: 'En 2027, les jours fériés fédéraux observés incluent le vendredi 18 juin (Juneteenth), le lundi 5 juillet (Independence Day), le jeudi 11 novembre (Veterans Day), le jeudi 25 novembre (Thanksgiving) et le vendredi 24 décembre (Noël observé).'
  },
  AT: {
    name: 'Austria',
    nameFr: 'Autriche',
    key: 'AT',
    scope: 'National calendar',
    scopeFr: 'Calendrier national',
    url: 'https://www.bmeia.gv.at/fileadmin/user_upload/Vertretungen/Kopenhagen/Aktuelles/Feiertage_2025-2027.pdf',
    authority: 'Austrian Foreign Ministry holiday calendar',
    note: 'These examples use Austria’s 13 statutory national public holidays under the Arbeitsruhegesetz. State patron-saint days (which mainly affect schools and state offices) and collective-agreement half-days on 24 and 31 December are not assumed off. Weekend public holidays do not shift to Monday in Austria.',
    noteFr: 'Ces exemples utilisent les 13 jours fériés nationaux autrichiens (Arbeitsruhegesetz). Les fêtes régionales et les demi-journées des 24 et 31 décembre ne sont pas présumées chômées, et les jours fériés du week-end ne sont pas reportés au lundi.',
    focus: 'Austria’s 2027 calendar features Epiphany on Wednesday 6 January, Ascension on Thursday 6 May, Corpus Christi on Thursday 27 May, National Day on Tuesday 26 October (classic “Fenstertag” on Monday 25 October) and Immaculate Conception on Wednesday 8 December.',
    focusFr: 'Le calendrier autrichien 2027 compte l’Épiphanie (mercredi 6 janvier), l’Ascension (jeudi 6 mai), la Fête-Dieu (jeudi 27 mai), la Fête nationale (mardi 26 octobre, idéal pour un « Fenstertag » le lundi 25) et le mercredi 8 décembre.'
  },
  BE: {
    name: 'Belgium',
    nameFr: 'Belgique',
    key: 'BE',
    scope: 'National dates before employer replacement days',
    scopeFr: 'Dates nationales avant jours de remplacement',
    url: 'https://employment.belgium.be/en/themes/international/posting/working-conditions-be-respected-case-posting-belgium/public-holidays',
    authority: 'Belgian FPS Employment',
    note: 'Under Belgian law, when one of the 10 statutory public holidays falls on a Sunday or a normal non-working day (such as Saturday on a Mon–Fri schedule — in 2027: 1 May, 15 August and 25 December), it must be replaced by a working day. Because joint committees or employers often fix replacement days onto bridge Fridays (such as Friday 7 May after Ascension), this model does not guess those dates: check your employer’s posted replacement-day notice.',
    noteFr: 'En Belgique, lorsqu’un des 10 jours fériés légaux tombe un dimanche ou un jour habituellement non travaillé (en 2027 : 1er mai, 15 août et 25 décembre), il doit être remplacé par un jour ouvrable fixé par l’entreprise ou la commission paritaire. Vérifiez l’avis affiché par votre employeur.',
    focus: 'Ascension Day (Thursday 6 May 2027), Whit Monday (17 May), Belgian National Day (Wednesday 21 July) and Armistice Day (Thursday 11 November) anchor Belgium’s highest-value weekday combinations.',
    focusFr: 'L’Ascension (jeudi 6 mai 2027), le lundi de Pentecôte (17 mai), la Fête nationale belge (mercredi 21 juillet) et l’Armistice (jeudi 11 novembre) constituent les meilleurs ponts en Belgique.'
  },
  CA: {
    name: 'Canada',
    nameFr: 'Canada',
    key: 'CA',
    scope: 'Federal holiday calendar',
    scopeFr: 'Calendrier fédéral',
    url: 'https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html',
    authority: 'Government of Canada',
    note: 'Most Canadian employees are governed by provincial or territorial employment standards rather than the federal Canada Labour Code. Provincial statutory holidays differ (for example Family Day, Victoria Day, St. Jean Baptiste Day, Civic Holiday and Boxing Day). Select your province in the interactive planner for provincial rules.',
    noteFr: 'La majorité des salariés canadiens relèvent des normes du travail provinciales et non du Code canadien du travail fédéral. Utilisez le sélecteur de province dans le planificateur pour inclure les jours fériés provinciaux.',
    focus: 'Canada Day falls on Thursday 1 July 2027, National Day for Truth and Reconciliation on Thursday 30 September, Remembrance Day on Thursday 11 November, and the federal Christmas substitute day on Monday 27 December.',
    focusFr: 'La Fête du Canada tombe le jeudi 1er juillet 2027, la Journée nationale de la vérité et de la réconciliation le jeudi 30 septembre, le Jour du Souvenir le jeudi 11 novembre et le congé fédéral de Noël observé le lundi 27 décembre.'
  },
  AU: {
    name: 'Australia',
    nameFr: 'Australie',
    key: 'AU-NSW',
    scope: 'New South Wales & state calendars',
    scopeFr: 'Nouvelle-Galles du Sud et États',
    url: 'https://www.fairwork.gov.au/employment-conditions/public-holidays',
    authority: 'Fair Work Ombudsman',
    note: 'Australian public holidays are declared at the state and territory level alongside the National Employment Standards (minimum 4 weeks paid annual leave for full-time workers). These examples use New South Wales; dedicated calendars for Victoria and Queensland are linked below and selectable in the planner.',
    noteFr: 'Les jours fériés australiens sont fixés par chaque État et territoire (le minimum légal fédéral étant de 4 semaines de congés payés). Ces exemples utilisent la Nouvelle-Galles du Sud ; les calendriers du Victoria et du Queensland sont liés ci-dessous.',
    focus: 'Australia Day falls on Tuesday 26 January 2027 (a 4-day weekend for 1 leave day on Monday 25 January), Easter runs 26–29 March, and substitute days for Christmas and Boxing Day fall on Monday 27 and Tuesday 28 December 2027.',
    focusFr: 'Australia Day tombe le mardi 26 janvier 2027 (pont de 4 jours en posant le lundi 25 janvier), Pâques s’étend du 26 au 29 mars, et les jours de substitution pour Noël et Boxing Day tombent les lundi 27 et mardi 28 décembre 2027.'
  },
  SE: {
    name: 'Sweden',
    nameFr: 'Suède',
    key: 'SE',
    scope: 'National public holidays',
    scopeFr: 'Jours fériés nationaux',
    url: 'https://www.government.se/contentassets/eaf3467d4f484c9fb7274a067484c759/1977_480-annual-leave-act.pdf',
    authority: 'Government Offices of Sweden',
    note: 'Sweden’s Annual Leave Act (Semesterlagen) provides at least 25 vacation days per year. Many collective agreements also treat Midsummer Eve, Christmas Eve and New Year’s Eve as de facto paid days off and grant “klämdagar” (squeeze days such as the Friday after Ascension). Check your collective agreement.',
    noteFr: 'La loi suédoise sur les congés (Semesterlagen) prévoit au moins 25 jours de congés payés par an. De nombreuses conventions collectives accordent également les veilles de fête (Midsummer, 24 et 31 décembre) et des « klämdagar » (jours de pont).',
    focus: 'Epiphany falls on Wednesday 6 January 2027 (allowing a 9-day break for 4 leave days), Easter combines Good Friday and Easter Monday (26–29 March), and Ascension Day falls on Thursday 6 May.',
    focusFr: 'L’Épiphanie tombe le mercredi 6 janvier 2027 (9 jours de repos pour 4 jours posés), suivie de Pâques (26–29 mars) et de l’Ascension (jeudi 6 mai).'
  },
  NO: {
    name: 'Norway',
    nameFr: 'Norvège',
    key: 'NO',
    scope: 'National public holidays',
    scopeFr: 'Jours fériés nationaux',
    url: 'https://www.arbeidstilsynet.no/en/working-hours-and-organisation-of-work/holiday/',
    authority: 'Norwegian Labour Inspection Authority (Arbeidstilsynet)',
    note: 'Norway’s Holiday Act (Ferieloven) expresses statutory leave as 25 working days (virkedager) including Saturdays (= 4 weeks + 1 day, or ~21 Mon–Fri workdays), while most collective agreements grant 5 weeks (30 virkedager = 25 Mon–Fri workdays). Enter your 5-day-week equivalent in the planner.',
    noteFr: 'La loi norvégienne (Ferieloven) exprime le congé légal en 25 jours ouvrables (samedis compris, soit 4 semaines + 1 jour), tandis que la plupart des conventions collectives accordent 5 semaines (25 jours sur une base Lun–Ven).',
    focus: 'Easter 2027 in Norway includes Maundy Thursday (25 March), Good Friday (26 March) and Easter Monday (29 March), turning 3 leave days (22–24 March) into 10 consecutive days off, and Constitution Day + Whit Monday both fall on Monday 17 May 2027.',
    focusFr: 'Pâques 2027 en Norvège inclut les jeudi saint (25 mars), vendredi saint (26 mars) et lundi de Pâques (29 mars), offrant 10 jours de repos pour 3 jours posés (22–24 mars).'
  },
  FI: {
    name: 'Finland',
    nameFr: 'Finlande',
    key: 'FI',
    scope: 'National public holidays',
    scopeFr: 'Jours fériés nationaux',
    url: 'https://www.suomi.fi/citizen/work-unemployment-and-finances/rules-of-working-life/guide/working-time-annual-holidays-and-time-off/earning-annual-holiday',
    authority: 'Suomi.fi',
    note: 'Under Finland’s Annual Holidays Act, holiday accrual is counted in 6-day Mon–Sat working days (arkipäivä: up to 30 arkipäivää = 5 weeks / 25 Mon–Fri days after one year). Collective agreements frequently treat Midsummer Eve and Christmas Eve as paid days off. Enter your Mon–Fri workday equivalent in the planner.',
    noteFr: 'En Finlande, les congés légaux sont décomptés sur 6 jours ouvrables du lundi au samedi (arkipäivä : 30 jours = 5 semaines, soit 25 jours du lundi au vendredi). Saisissez votre équivalent semaine de 5 jours dans le planificateur.',
    focus: 'Epiphany (Wednesday 6 January 2027), Easter (26–29 March), Ascension Day (Thursday 6 May) and Independence Day (Monday 6 December) create four high-leverage breaks across the Finnish calendar.',
    focusFr: 'L’Épiphanie (mercredi 6 janvier 2027), Pâques (26–29 mars), l’Ascension (jeudi 6 mai) et le Jour de l’Indépendance (lundi 6 décembre) offrent quatre fenêtres majeures en Finlande.'
  }
};

async function walkHtml(dir) {
  let out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'functions' || e.name === 'scripts' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkHtml(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const esc = s => String(s || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const fmtDate = (s, lang = 'en') => new Date(s + 'T12:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtWeekday = (s, lang = 'en') => new Date(s + 'T12:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long' });
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function main() {
  console.log('1. Loading holiday & statutory leave data...');
  const data = JSON.parse(await fs.readFile(`${V12_SRC}/data/holidays-v12.json`, 'utf8'));
  const verifiedLeave = JSON.parse(await fs.readFile(`${V12_SRC}/data/leave-verified.json`, 'utf8'));

  await fs.writeFile(`${ROOT}/data/holidays-v13.json`, JSON.stringify(data));

  console.log('2. Writing assets/app-v13.js and assets/style-v13.css...');
  const appV13 = await fs.readFile(`${ROOT}/scripts/client_bundle_src.js`, 'utf8');
  await fs.writeFile(`${ROOT}/assets/app-v13.js`, appV13);

  const baseCss = await fs.readFile(`${V12_SRC}/assets/style-v12.css`, 'utf8');
  const v13CssExtra = `
/* V13 Combined Annual Plan, Single-Break Separation, Reserved Ad Space & Responsive Consent */
html,body{overflow-x:hidden;max-width:100%}
body.has-consent-banner{padding-bottom:130px}
.annual-plan-card{background:linear-gradient(135deg,#eef7f0 0%,#ffffff 100%);border:2px solid #2b6b4f;border-radius:22px;padding:22px;margin-bottom:22px;box-shadow:0 12px 30px rgba(23,60,46,.08)}
.annual-plan-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.annual-plan-card h4{font-size:21px;font-weight:900;letter-spacing:-.03em;margin:10px 0 4px;color:#173c2e}
.annual-plan-sub{margin:0;font-size:13px;color:#4a5d52;font-weight:600}
.annual-plan-list{margin:14px 0;padding-left:18px;font-size:14px;color:#24352c;line-height:1.65}
.annual-plan-list li{margin-bottom:8px}
.plan-meta-notes{background:#f5f9f6;border:1px solid #d5e2d8;border-radius:12px;padding:10px 14px;margin:12px 0;font-size:13px;color:#2b3d34;line-height:1.5}
.plan-note-item{margin:4px 0}
.single-breaks-header{margin:24px 0 12px;padding-top:16px;border-top:2px solid #dce5dd}
.single-breaks-header h4{margin:0 0 4px;font-size:18px;font-weight:850;color:#173c2e}
.single-breaks-header p{margin:0;font-size:13px;color:#4a5d52}
.rest-holiday-note{margin:6px 0 10px;color:#5a6b60;font-size:12px}
.trip-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;padding-top:12px;border-top:1px dashed #dce5dd}
.chip-btn{border:1px solid #cdd8cf;background:#f7faf7;color:#173c2e;border-radius:10px;padding:7px 12px;font:inherit;font-size:12px;font-weight:750;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:6px;text-decoration:none}
.chip-btn:hover{background:#e8f5ec;border-color:#9fc5ac}
.chip-btn.primary{background:#173c2e;color:#fff;border-color:#173c2e}
.chip-btn.primary:hover{background:#215440}
.chip-btn.referral-link{background:#fff8f3;border-color:#f0cbb4;color:#7a3410}
.chip-btn.referral-link:hover{background:#ffefe5}
.hr-summary-box{margin-top:12px;border-top:1px solid #dce5dd;padding-top:10px;font-size:13px}
.hr-summary-box summary{cursor:pointer;font-weight:750;color:#173c2e}
.hr-summary-pre{background:#fff;border:1px solid #d5e0d7;border-radius:10px;padding:12px;margin-top:8px;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.5;color:#1e2d24}
.year-pills{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}
.year-pills a{padding:9px 15px;border-radius:999px;background:#fff;border:1px solid #d5e0d7;text-decoration:none;font-weight:800;font-size:13px;color:#2b3d34;transition:.15s}
.year-pills a:hover,.year-pills a.active{background:#173c2e;color:#fff;border-color:#173c2e}
.ad-slot{display:none;margin:24px auto;text-align:center;max-width:100%;overflow:hidden;box-sizing:border-box}
.ad-slot.ad-active{display:block;padding:10px 0}
.ad-slot.ad-active.ad-size-728{min-height:116px}
.ad-slot.ad-active.ad-size-320{min-height:76px}
.ad-slot.ad-active.ad-size-300{min-height:276px}
.ad-slot-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#76837b;margin-bottom:6px;font-weight:700}
.consent-banner{position:fixed;bottom:0;left:0;right:0;z-index:99;background:#173c2e;color:#fff;border-top:2px solid #2e6950;padding:16px 0;box-shadow:0 -12px 32px rgba(0,0,0,.22)}
.consent-inner{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.consent-text{margin:0;font-size:13px;line-height:1.5;color:#e3efe8;max-width:780px}
.consent-text a{color:#ffd5c2;text-decoration:underline}
.consent-actions{display:flex;gap:10px;flex-wrap:wrap;flex:0 0 auto}
.consent-btn-accept{width:auto;min-height:40px;padding:9px 16px;font-size:13px;background:#f1783e}
.consent-btn-decline{width:auto;min-height:40px;padding:9px 16px;font-size:13px;background:transparent;border:1px solid #8ab09d;box-shadow:none}
@media(max-width:600px){.annual-plan-top{display:block}.consent-inner{flex-direction:column;align-items:stretch}.consent-actions button{width:100%}}
@media(max-width:380px){.wrap{padding:0 12px}.ad-slot{margin:16px -12px}}
`;
  await fs.writeFile(`${ROOT}/assets/style-v13.css`, baseCss + v13CssExtra);

  // Create VM context to execute the exact optimizer and annual plan builder for static guides
  const ctx = vm.createContext({
    document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } },
    window: { addEventListener() {}, location: { search: '', href: 'https://holidaymaximizer.com/' }, innerWidth: 1280 },
    localStorage: { getItem() { return null; }, setItem() {} },
    navigator: {},
    location: { search: '', pathname: '/', protocol: 'https:' },
    console,
    Intl,
    Date,
    Map,
    Set,
    URL,
    URLSearchParams,
    Float64Array,
    Uint8Array
  });
  vm.runInContext(appV13, ctx);

  function getCombinedHolidays(localKey, year) {
    return [year - 1, year, year + 1].flatMap(y => data.holidays[localKey]?.[String(y)] || []);
  }

  function calcTrips(localKey, year, budget = 20, min = 3, max = 16, lang = 'en') {
    ctx.window.HM.lang = lang;
    return ctx.optimize(getCombinedHolidays(localKey, year), year, budget, min, max, null, 'mon-fri');
  }

  function calcAnnualPlan(localKey, year, budget = 20, lang = 'en') {
    ctx.window.HM.lang = lang;
    return ctx.buildAnnualPlan(getCombinedHolidays(localKey, year), year, budget, null, 'mon-fri');
  }

  function renderStaticTripCard(t, lang = 'en') {
    const fr = lang === 'fr';
    const leaveDates = t.days.filter(x => x.type === 'work').map(x => fmtDate(iso(x.date), lang)).join('; ');
    const usedHols = t.days.filter(x => x.type === 'holiday').map(x => `${esc(x.name)} (${fmtDate(iso(x.date), lang)})`).join('; ');
    const retDate = t.returnDate ? fmtDate(iso(t.returnDate), lang) : '';
    const yearSplit = Object.entries(t.leaveByYear || {}).map(([y, c]) => `${c} ${fr ? 'en' : 'in'} ${y}`).join(' + ');
    const hasCrossYearLeave = Object.keys(t.leaveByYear || {}).length > 1 || t.crossesPrev || t.crossesNext;
    return `<article class="trip-card">
      <div class="trip-top">
        <div>
          <h3>${t.leave} ${fr ? `jour${t.leave === 1 ? '' : 's'} posé${t.leave === 1 ? '' : 's'} → ${t.total} jours de repos consécutifs` : `leave ${t.leave === 1 ? 'day' : 'days'} → ${t.total} consecutive days off`}</h3>
          <p class="trip-sub"><strong>${fmtDate(iso(t.start), lang)} – ${fmtDate(iso(t.end), lang)}</strong></p>
        </div>
        <div class="score"><strong>${t.efficiency.toFixed(2)}×</strong><span>${fr ? 'multiplicateur' : 'multiplier'}</span></div>
      </div>
      <div class="trip-metrics">
        <span class="pill orange">${fr ? `Poser ${t.leave} jour${t.leave === 1 ? '' : 's'}` : `Book ${t.leave} leave ${t.leave === 1 ? 'day' : 'days'}`}</span>
        <span class="pill green">${t.hol} ${fr ? `jour${t.hol === 1 ? '' : 's'} férié${t.hol === 1 ? '' : 's'} ouvré${t.hol === 1 ? '' : 's'}` : `workday public ${t.hol === 1 ? 'holiday' : 'holidays'}`}</span>
        <span class="pill">${t.weekend} ${fr ? 'jours de week-end (Sam–Dim)' : 'weekend days (Sat–Sun)'}</span>
        ${hasCrossYearLeave ? `<span class="pill">${fr ? `Exercice : ${yearSplit}` : `Leave year: ${yearSplit}`}</span>` : ''}
      </div>
      <p class="book-dates"><strong>${fr ? 'Jours ouvrés à poser :' : 'Request leave on:'}</strong> ${leaveDates}.${retDate ? ` <strong>${fr ? 'Reprise du travail :' : 'Return to work:'}</strong> ${retDate}.` : ''}</p>
      <p><strong>${fr ? 'Jours fériés utilisés :' : 'Holidays used:'}</strong> ${usedHols}.</p>
    </article>`;
  }

  console.log('3. Generating 15 Flagship Country Worked Guides in BOTH EN (/country/<iso2>/) and FR (/fr/country/<iso2>/)...');
  for (const [cc, v] of Object.entries(FLAGSHIP_CFG)) {
    const lv = verifiedLeave[cc];
    const bestEn = [[3, 5], [6, 9], [10, 16]].flatMap(([min, max]) =>
      calcTrips(v.key, 2027, 20, min, max, 'en').filter(t => t.start.getFullYear() === 2027 && t.end.getFullYear() === 2027).slice(0, 1)
    );
    const yearEndEn = calcTrips(v.key, 2027, 10, 6, 16, 'en').filter(t => t.start.getMonth() === 11 && t.start.getFullYear() === 2027)[0];
    const annualEn = [10, 20].map(budget => calcAnnualPlan(v.key, 2027, budget, 'en'));

    const relatedRegions = Object.entries(REGION_SLUGS).filter(([k]) => k === cc || k.startsWith(cc + '-'));
    const plannerLinkEn = `/?country=${cc}&amp;year=2027&amp;leave=20&amp;range=3-30${v.key.includes('-') ? '&amp;region=' + v.key : ''}#planner`;
    const plannerLinkFr = `/fr/?country=${cc}&amp;year=2027&amp;leave=20&amp;range=3-30${v.key.includes('-') ? '&amp;region=' + v.key : ''}#planner`;

    // 3a. English Flagship Guide (/country/<cc>/)
    {
      const f = `${ROOT}/country/${cc.toLowerCase()}/index.html`;
      let h = await fs.readFile(f, 'utf8');
      const entitlementText = lv ? lv.display : 'See the official national employment authority';
      const authorityBox = lv && lv.url
        ? `<div class="sourcebox"><strong>Official statutory leave source:</strong> ${esc(lv.source || v.authority)}. <a class="official-link" href="${esc(lv.url)}" rel="nofollow noopener" target="_blank">Open official guidance ↗</a></div>`
        : '';
      const regionalLinksHtml = relatedRegions.length
        ? `<h2>Regional &amp; multi-year calendars (2026–2027)</h2>
           <p>Compare active and upcoming year holiday tables and worked date combinations for ${v.name}:</p>
           <div class="featured-guides">
             ${relatedRegions.flatMap(([k, slug]) => {
               const regLabel = data.locales[k]?.label || v.name;
               return [2026, 2027].map(yr => `<a href="/${slug}/${yr}/">${esc(regLabel)} (${yr})</a>`);
             }).join('')}
           </div>`
        : '';

      const mainHtml = `<main id="main-content">
      <section class="country-hero">
        <div class="wrap">
          <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/countries/">Countries</a> / ${v.name}</nav>
          <p class="eyebrow">2027 leave planning · ${esc(v.scope)}</p>
          <h1>${v.name}: make your 2027 leave go further</h1>
          <p class="section-intro">Exact workdays to book, the public holidays behind each result, and non-overlapping 10-day and 20-day annual schedule plans.</p>
          <p>${esc(v.focus)}</p>
          <div class="country-note"><strong>Statutory leave, public holidays &amp; local rules:</strong> ${esc(v.note)}</div>
          <p><a class="btn" href="${plannerLinkEn}">Customize ${v.name} in the interactive planner →</a></p>
          <p class="method-note">Calculations verified ${TODAY}. Default examples below assume a Monday–Friday workweek (Saturday–Sunday rest days) and that listed public holidays are non-working days; use the interactive planner to switch to a 4-day Mon–Thu, Sun–Thu or Tue–Sat workweek.</p>
        </div>
      </section>
      <section class="section guide-section">
        <div class="wrap">
          <h2>Three high-value single breaks in 2027</h2>
          <p>Compare a standalone long weekend (3–5 days), a one-week break (6–9 days) and an extended break (10–16 days). Each card is an independent single-break option ranked by total days off per leave day booked.</p>
          ${bestEn.map(t => renderStaticTripCard(t, 'en')).join('')}
          <h2>Christmas and New Year 2027/2028</h2>
          ${yearEndEn ? renderStaticTripCard(yearEndEn, 'en') : '<p>No holiday-assisted 6–16 day year-end break was returned within a ten-day leave allowance because the relevant holidays fall on weekends. Try another range in the planner.</p>'}
          <p><strong>Leave-year boundary rule:</strong> When a December/January break crosses calendar years, check whether your employer deducts January workdays from your 2027 carry-over or your 2028 leave allowance.</p>
          <div class="ad-slot" data-ad-slot="H1"></div>
          <h2>Full-year non-overlapping schedules: 10-day vs. 20-day allowance</h2>
          <p>Unlike the standalone single-break alternatives above, the schedules below optimize a combined, non-overlapping full-year plan across 2027 for a <strong>10-day</strong> versus a <strong>20-day</strong> bookable leave allowance.</p>
          ${annualEn.map(plan => `<article class="trip-card">
            <h3>${plan.budget}-day leave allowance → ${plan.totalOff} total days off (${plan.multiplier.toFixed(2)}× combined multiplier)</h3>
            <p><strong>${plan.usedLeave} of ${plan.budget} leave days used across ${plan.picks.length} non-overlapping breaks · ${plan.left} leave day${plan.left === 1 ? '' : 's'} unused · ${plan.totalHol} workday public holidays leveraged.</strong></p>
            <ul>${plan.picks.map(t => `<li><strong>${fmtDate(iso(t.start), 'en')} – ${fmtDate(iso(t.end), 'en')}</strong> (${t.total} days off using ${t.leave} leave day${t.leave === 1 ? '' : 's'}): Book <strong>${t.days.filter(x => x.type === 'work').map(x => fmtDate(iso(x.date), 'en')).join('; ')}</strong>.${t.returnDate ? ` Return to work: ${fmtDate(iso(t.returnDate), 'en')}.` : ''}</li>`).join('')}</ul>
            <p><strong>Unused allowance:</strong> ${esc(plan.unusedReason)}</p>
            <p><small>${esc(plan.boundaryNote)}</small></p>
            <a href="/?country=${cc}&amp;year=2027&amp;leave=${plan.budget}&amp;range=6-9${v.key.includes('-') ? '&amp;region=' + v.key : ''}#planner">Open this ${plan.budget}-day schedule in the planner (export .ics or copy HR summary) →</a>
          </article>`).join('')}
          <div class="ad-slot" data-ad-slot="M1"></div>
          <h2>2027 public holiday dates used in this calculation</h2>
          <p>This table lists the ${data.holidays[v.key]['2027'].length} public holidays in the model’s 2027 calendar for ${esc(v.scope.toLowerCase())}. Bank closures, employer-specific days and unannounced replacement days are not silently added.</p>
          <div class="table-scroll">
            <table class="calendar-table">
              <caption>${v.name} · 2027 public holidays &amp; Mon–Fri workday impact</caption>
              <thead><tr><th scope="col">Date</th><th scope="col">Day</th><th scope="col">Holiday</th><th scope="col">Saves a Mon–Fri workday?</th></tr></thead>
              <tbody>${data.holidays[v.key]['2027'].map(x => `<tr><td>${fmtDate(x.date, 'en')}</td><td>${fmtWeekday(x.date, 'en')}</td><td>${esc(x.name)}</td><td>${[0, 6].includes(new Date(x.date + 'T12:00:00').getDay()) ? 'No — falls on weekend (unless replacement day applies)' : 'Yes — weekday (if a non-working day under your contract)'}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <p>Official calendar source: <a href="${v.url}" rel="noopener" target="_blank">${esc(v.authority)} ↗</a>${v.extra ? ` · <a href="${v.extra}" rel="noopener" target="_blank">Law 151/2025 establishing 4 October holiday ↗</a>` : ''}.</p>
          ${regionalLinksHtml}
          <h2>Statutory leave vs. public holidays, bank closures &amp; replacement days</h2>
          <p><strong>Statutory paid annual leave baseline:</strong> ${esc(entitlementText)}. Statutory annual leave is distinct from public holidays: public holidays are calendar dates designated by law or collective agreement, whereas annual leave is your personal bookable allowance.</p>
          ${authorityBox}
          <p>${esc(v.note)}</p>
          <p><a href="/how-it-works/">Read the calculation methodology</a> · <a href="/compare/">Compare ${v.name} with another country</a> · <a href="/ranking/">Global annual-leave ranking</a></p>
        </div>
      </section>
      <div class="wrap"><div class="ad-slot" data-ad-slot="B1"></div></div>
    </main>`;

      h = h.replace(/<meta[^>]*name="robots"[^>]*>/g, '');
      h = h.replace(/<link[^>]*hreflang=[^>]*>/g, '');
      h = h.replace(
        /(<link[^>]*rel="canonical"[^>]*>)/i,
        `$1<link rel="alternate" hreflang="en" href="https://holidaymaximizer.com/country/${cc.toLowerCase()}/"/><link rel="alternate" hreflang="fr" href="https://holidaymaximizer.com/fr/country/${cc.toLowerCase()}/"/><link rel="alternate" hreflang="x-default" href="https://holidaymaximizer.com/country/${cc.toLowerCase()}/"/>`
      );
      h = h.replace(/<main[^>]*>[\s\S]*?<\/main>/, mainHtml);
      h = h.replace(/<title>.*?<\/title>/, `<title>${v.name} 2027 Annual Leave Planner: Best Dates &amp; Public Holidays | HolidayMaximizer</title>`);
      h = h.replace(/<meta[^>]*name="description"[^>]*>/, `<meta name="description" content="Maximize your ${v.name} annual leave in 2027: exact workdays to book, public holiday calendar, high-value bridge breaks and 10-day vs 20-day non-overlapping schedules."/>`);
      await fs.writeFile(f, h);
    }

    // 3b. French Flagship Guide (/fr/country/<cc>/)
    {
      const fFr = `${ROOT}/fr/country/${cc.toLowerCase()}/index.html`;
      let hf = await fs.readFile(fFr, 'utf8');
      const bestFr = [[3, 5], [6, 9], [10, 16]].flatMap(([min, max]) =>
        calcTrips(v.key, 2027, 20, min, max, 'fr').filter(t => t.start.getFullYear() === 2027 && t.end.getFullYear() === 2027).slice(0, 1)
      );
      const yearEndFr = calcTrips(v.key, 2027, 10, 6, 16, 'fr').filter(t => t.start.getMonth() === 11 && t.start.getFullYear() === 2027)[0];
      const annualFr = [10, 20].map(budget => calcAnnualPlan(v.key, 2027, budget, 'fr'));
      const entitlementFr = lv ? (lv.display_fr || lv.display) : 'Consultez l’autorité nationale du travail';
      const authorityBoxFr = lv && lv.url
        ? `<div class="sourcebox"><strong>Source officielle sur les congés :</strong> ${esc(lv.source || v.authority)}. <a class="official-link" href="${esc(lv.url)}" rel="nofollow noopener" target="_blank">Ouvrir la source officielle ↗</a></div>`
        : '';

      const mainHtmlFr = `<main id="main-content">
      <section class="country-hero">
        <div class="wrap">
          <nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> / <a href="/fr/countries/">Pays</a> / ${v.nameFr}</nav>
          <p class="eyebrow">Planification des congés 2027 · ${esc(v.scopeFr)}</p>
          <h1>${v.nameFr} : optimiser vos congés annuels en 2027</h1>
          <p class="section-intro">Jours ouvrés exacts à poser, calendrier des jours fériés 2027 et plannings annuels complets sans chevauchement pour un budget de 10 ou 20 jours.</p>
          <p>${esc(v.focusFr)}</p>
          <div class="country-note"><strong>Congé légal, jours fériés et règles locales :</strong> ${esc(v.noteFr)}</div>
          <p><a class="btn" href="${plannerLinkFr}">Personnaliser ${v.nameFr} dans le planificateur interactif →</a></p>
          <p class="method-note">Calculs vérifiés le ${TODAY}. Ces exemples reposent sur une semaine du lundi au vendredi (repos samedi–dimanche) ; utilisez le planificateur pour passer à une semaine de 4 jours (Lun–Jeu), Dim–Jeu ou Mar–Sam.</p>
        </div>
      </section>
      <section class="section guide-section">
        <div class="wrap">
          <h2>Trois coupures individuelles à fort multiplicateur en 2027</h2>
          <p>Comparez un week-end prolongé (3–5 jours), une coupure d’une semaine (6–9 jours) et un séjour long (10–16 jours). Chaque carte est une option individuelle indépendante.</p>
          ${bestFr.map(t => renderStaticTripCard(t, 'fr')).join('')}
          <h2>Noël et Nouvel An 2027/2028</h2>
          ${yearEndFr ? renderStaticTripCard(yearEndFr, 'fr') : '<p>Aucun pont de fin d’année de 6 à 16 jours n’est disponible avec ce calendrier car les fêtes tombent le week-end.</p>'}
          <p><strong>Frontière d’exercice :</strong> Lorsqu’une coupure de fin d’année chevauche 2027 et 2028, vérifiez sur quel exercice de congés votre employeur impute les jours de janvier.</p>
          <div class="ad-slot" data-ad-slot="H1"></div>
          <h2>Plannings annuels combinés sans chevauchement : 10 jours vs 20 jours</h2>
          <p>Contrairement aux coupures individuelles ci-dessus, ces deux plannings combinent des ponts sans aucun chevauchement sur l’ensemble de l’année 2027 pour un budget de <strong>10 jours</strong> contre <strong>20 jours</strong>.</p>
          ${annualFr.map(plan => `<article class="trip-card">
            <h3>Budget de ${plan.budget} jours de congé → ${plan.totalOff} jours de repos au total (multiplicateur combiné ${plan.multiplier.toFixed(2)}×)</h3>
            <p><strong>${plan.usedLeave} jour(s) posé(s) sur ${plan.budget} à travers ${plan.picks.length} périodes sans chevauchement · ${plan.left} jour(s) non utilisé(s) · ${plan.totalHol} jours fériés ouvrés mobilisés.</strong></p>
            <ul>${plan.picks.map(t => `<li><strong>${fmtDate(iso(t.start), 'fr')} – ${fmtDate(iso(t.end), 'fr')}</strong> (${t.total} jours de repos avec ${t.leave} jour${t.leave === 1 ? '' : 's'} posé${t.leave === 1 ? '' : 's'}) : Poser <strong>${t.days.filter(x => x.type === 'work').map(x => fmtDate(iso(x.date), 'fr')).join('; ')}</strong>.${t.returnDate ? ` Reprise : ${fmtDate(iso(t.returnDate), 'fr')}.` : ''}</li>`).join('')}</ul>
            <p><strong>Solde restant :</strong> ${esc(plan.unusedReason)}</p>
            <p><small>${esc(plan.boundaryNote)}</small></p>
            <a href="/fr/?country=${cc}&amp;year=2027&amp;leave=${plan.budget}&amp;range=6-9${v.key.includes('-') ? '&amp;region=' + v.key : ''}#planner">Ouvrir ce planning de ${plan.budget} jours dans le planificateur (.ics / résumé RH) →</a>
          </article>`).join('')}
          <div class="ad-slot" data-ad-slot="M1"></div>
          <h2>Dates des jours fériés 2027 prises en compte (${v.nameFr})</h2>
          <p>Ce tableau présente les ${data.holidays[v.key]['2027'].length} jours fériés du calendrier 2027 (${esc(v.scopeFr.toLowerCase())}). Les fermetures bancaires ou jours propres à un employeur ne sont pas ajoutés d’office.</p>
          <div class="table-scroll">
            <table class="calendar-table">
              <caption>${v.nameFr} · Jours fériés 2027 et impact sur une semaine Lun–Ven</caption>
              <thead><tr><th scope="col">Date</th><th scope="col">Jour</th><th scope="col">Jour férié</th><th scope="col">Économise un jour ouvré (Lun–Ven) ?</th></tr></thead>
              <tbody>${data.holidays[v.key]['2027'].map(x => `<tr><td>${fmtDate(x.date, 'fr')}</td><td>${fmtWeekday(x.date, 'fr')}</td><td>${esc(x.name)}</td><td>${[0, 6].includes(new Date(x.date + 'T12:00:00').getDay()) ? 'Non — tombe le week-end (sauf jour de remplacement)' : 'Oui — jour de semaine (si chômé selon votre contrat)'}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <p>Source officielle du calendrier : <a href="${v.url}" rel="noopener" target="_blank">${esc(v.authority)} ↗</a>.</p>
          <h2>Congé annuel légal, jours fériés et règles de remplacement</h2>
          <p><strong>Base légale des congés payés :</strong> ${esc(entitlementFr)}. Le congé annuel payé est distinct des jours fériés : saisissez votre solde réel de congés à poser dans le planificateur.</p>
          ${authorityBoxFr}
          <p>${esc(v.noteFr)}</p>
          <p><a href="/fr/how-it-works/">Lire la méthodologie</a> · <a href="/fr/compare/">Comparer ${v.nameFr} avec un autre pays</a> · <a href="/fr/ranking/">Classement mondial des congés</a></p>
        </div>
      </section>
      <div class="wrap"><div class="ad-slot" data-ad-slot="B1"></div></div>
    </main>`;

      hf = hf.replace(/<meta[^>]*name="robots"[^>]*>/g, '');
      hf = hf.replace(/<link[^>]*hreflang=[^>]*>/g, '');
      hf = hf.replace(
        /(<link[^>]*rel="canonical"[^>]*>)/i,
        `$1<link rel="alternate" hreflang="en" href="https://holidaymaximizer.com/country/${cc.toLowerCase()}/"/><link rel="alternate" hreflang="fr" href="https://holidaymaximizer.com/fr/country/${cc.toLowerCase()}/"/><link rel="alternate" hreflang="x-default" href="https://holidaymaximizer.com/country/${cc.toLowerCase()}/"/>`
      );
      hf = hf.replace(/<main[^>]*>[\s\S]*?<\/main>/, mainHtmlFr);
      hf = hf.replace(/<title>.*?<\/title>/, `<title>${v.nameFr} : Congés 2027, Ponts et Jours Fériés | HolidayMaximizer</title>`);
      hf = hf.replace(/<meta[^>]*name="description"[^>]*>/, `<meta name="description" content="Optimisez vos congés 2027 (${v.nameFr}) : jours exacts à poser, calendrier des jours fériés 2027, ponts et plannings annuels de 10 et 20 jours sans chevauchement."/>`);
      await fs.writeFile(fFr, hf);
    }
  }

  console.log('3c. Setting non-worked directory country pages (/country/<iso2>/) to noindex,follow with reciprocal hreflang...');
  for (const [cc] of Object.entries(verifiedLeave)) {
    if (FLAGSHIP_CFG[cc]) continue;
    for (const prefix of ['', 'fr/']) {
      const f = `${ROOT}/${prefix}country/${cc.toLowerCase()}/index.html`;
      try {
        await fs.stat(f);
      } catch {
        continue;
      }
      let h = await fs.readFile(f, 'utf8');
      h = h.replace(/<meta[^>]*name="robots"[^>]*>/g, '');
      h = h.replace('</head>', '<meta name="robots" content="noindex,follow"/></head>');
      h = h.replace(/<link[^>]*hreflang=[^>]*>/g, '');
      h = h.replace(
        /(<link[^>]*rel="canonical"[^>]*>)/i,
        `$1<link rel="alternate" hreflang="en" href="https://holidaymaximizer.com/country/${cc.toLowerCase()}/"/><link rel="alternate" hreflang="fr" href="https://holidaymaximizer.com/fr/country/${cc.toLowerCase()}/"/><link rel="alternate" hreflang="x-default" href="https://holidaymaximizer.com/country/${cc.toLowerCase()}/"/>`
      );
      await fs.writeFile(f, h);
    }
  }

  console.log('4. Rebuilding all 138 Regional/Year pages (2026–2031) & 23 Regional Hub pages...');
  for (const [localKey, slug] of Object.entries(REGION_SLUGS)) {
    const locMeta = data.locales[localKey];
    const baseCC = localKey.split('-')[0];
    const years = data.years; // [2026, 2027, 2028, 2029, 2030, 2031]

    for (const yr of years) {
      const topTrips = calcTrips(localKey, yr, 20, 3, 16, 'en').filter(t => t.start.getFullYear() === yr || t.end.getFullYear() === yr).slice(0, 6);
      const hols = data.holidays[localKey][String(yr)] || [];
      const plannerUrl = `/?country=${baseCC}&amp;year=${yr}&amp;leave=20&amp;range=3-16${localKey.includes('-') ? '&amp;region=' + localKey : ''}#planner`;
      const frPlannerUrl = `/fr/?country=${baseCC}&amp;year=${yr}&amp;leave=20&amp;range=3-16${localKey.includes('-') ? '&amp;region=' + localKey : ''}#planner`;
      const pageUrl = `https://holidaymaximizer.com/${slug}/${yr}/`;
      const title = `${locMeta.label} Annual Leave Maximizer ${yr} — Best Days to Book Off | HolidayMaximizer`;
      const desc = `Best days to take annual leave in ${locMeta.label} in ${yr}. Combine ${hols.length} public holidays and weekends into longer breaks using fewer leave days.`;
      // Active and upcoming planning years (2026 and 2027) are indexed; 2028-2031 remain live with noindex,follow to prevent multi-year crawl dilution
      const robotsDirective = (yr === 2026 || yr === 2027)
        ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
        : 'noindex,follow';

      const yearPills = `<nav class="year-pills" aria-label="Select planning year">${years.map(y => `<a href="/${slug}/${y}/" class="${y === yr ? 'active' : ''}">${y}</a>`).join('')}</nav>`;

      const pageHtml = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="google-site-verification" content="${GSC_VERIFICATION}"/>
<meta name="robots" content="${robotsDirective}"/>
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
  "@type": "WebPage",
  "name": title,
  "description": desc,
  "url": pageUrl,
  "BreadcrumbList": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://holidaymaximizer.com/" },
      { "@type": "ListItem", "position": 2, "name": "Countries", "item": "https://holidaymaximizer.com/countries/" },
      { "@type": "ListItem", "position": 3, "name": locMeta.country, "item": `https://holidaymaximizer.com/country/${baseCC.toLowerCase()}/` },
      { "@type": "ListItem", "position": 4, "name": `${locMeta.label} (${yr})`, "item": pageUrl }
    ]
  }
})}</script>
</head><body>
<header class="site-header"><div class="wrap nav"><a class="brand" href="/"><span class="brand-mark">✓</span><span>HolidayMaximizer</span></a><nav aria-label="Primary navigation" class="navlinks"><a href="/#planner">Planner</a><a href="/countries/">Countries</a><a href="/compare/">Compare</a><a href="/ranking/">Global ranking</a><a href="/how-it-works/">How it works</a></nav><button aria-expanded="false" aria-label="Open navigation" class="menu-toggle" type="button">Menu</button><div class="lang-switch"><a href="/${slug}/${yr}/">EN</a><a href="${frPlannerUrl}">FR</a></div></div></header>
<a class="skip-link" href="#main-content">Skip to content</a>
<main id="main-content">
  <section class="country-hero">
    <div class="wrap">
      <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/countries/">Countries</a> / <a href="/country/${baseCC.toLowerCase()}/">${esc(locMeta.country)}</a> / ${esc(locMeta.label)} ${yr}</nav>
      <p class="eyebrow">${esc(locMeta.region)} · ${yr} Calendar</p>
      <h1>Best days to take annual leave in ${esc(locMeta.label)} in ${yr}</h1>
      <p class="section-intro">Use public holidays and weekends to stretch your ${yr} annual leave further. Below are the highest-value date combinations and the exact workdays to request.</p>
      ${yearPills}
      <div class="country-note"><strong>Coverage &amp; rules note:</strong> ${esc(locMeta.note)} Always confirm statutory leave entitlement, bank closures and replacement days with official/local sources and your employer.</div>
      <p><a class="btn" href="${plannerUrl}">Customize ${esc(locMeta.label)} ${yr} in the interactive planner →</a></p>
    </div>
  </section>
  <section class="section guide-section">
    <div class="wrap">
      <h2>Top ${yr} leave combinations for ${esc(locMeta.label)}</h2>
      <p>Each recommendation below is a standalone break option assuming a Monday–Friday workweek (Saturday–Sunday rest days). Open the interactive planner above to build a combined non-overlapping annual schedule, switch workweek patterns, or export a <code>.ics</code> calendar file.</p>
      ${topTrips.map(t => renderStaticTripCard(t, 'en')).join('')}
      <div class="ad-slot" data-ad-slot="H1"></div>
      <h2>${yr} public holidays in ${esc(locMeta.label)}</h2>
      <p>These ${hols.length} public-holiday dates feed the ${yr} optimization above.</p>
      <div class="table-scroll">
        <table class="calendar-table">
          <caption>${esc(locMeta.label)} · ${yr} public holidays</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Day</th><th scope="col">Holiday</th><th scope="col">Saves a Mon–Fri workday?</th></tr></thead>
          <tbody>${hols.map(x => `<tr><td>${fmtDate(x.date, 'en')}</td><td>${fmtWeekday(x.date, 'en')}</td><td>${esc(x.name)}</td><td>${[0, 6].includes(new Date(x.date + 'T12:00:00').getDay()) ? 'No — falls on weekend' : 'Yes — weekday (if off work)'}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="ad-slot" data-ad-slot="M1"></div>
      <p style="margin-top:20px"><a href="/country/${baseCC.toLowerCase()}/">← Back to ${esc(locMeta.country)} 2027 main guide</a> · <a href="${plannerUrl}">Open interactive planner →</a></p>
    </div>
  </section>
  <div class="wrap"><div class="ad-slot" data-ad-slot="B1"></div></div>
</main>
<footer class="footer"><div class="wrap footer-grid"><div><strong>HolidayMaximizer.com</strong><div>Make your annual leave go further</div></div><div><a href="/about/">About</a><a href="/how-it-works/">Methodology</a><a href="/privacy/">Privacy</a><a href="#" data-open-consent>Cookie preferences</a><a href="/contact/">Contact</a><a href="/sources/">Sources &amp; data</a><a href="/legal/">Legal</a></div><div class="legal">Planning aid: confirm public-holiday dates and your entitlement with official/local sources and your employer.</div><div class="business-mini">Operated by Kattegat Studio · CVR 46761952</div></div></footer>
</body></html>`;

      const outDir = `${ROOT}/${slug}/${yr}`;
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(`${outDir}/index.html`, pageHtml);

      // Write self-canonical /<slug>/index.html hub page with noindex,follow so it never triggers duplicate canonical warnings
      if (yr === 2027) {
        const hubUrl = `https://holidaymaximizer.com/${slug}/`;
        const hubHtml = pageHtml
          .replace(`<meta name="robots" content="${robotsDirective}"/>`, `<meta name="robots" content="noindex,follow"/>`)
          .replace(`<link rel="canonical" href="${pageUrl}"/>`, `<link rel="canonical" href="${hubUrl}"/>`)
          .replace(`<meta property="og:url" content="${pageUrl}"/>`, `<meta property="og:url" content="${hubUrl}"/>`);
        await fs.writeFile(`${ROOT}/${slug}/index.html`, hubHtml);
      }
    }
  }

  console.log('5. Updating Homepage (EN/FR), Countries Hub (EN/FR), Methodology, Sources & Privacy...');
  // Update homepage supporting prose to reconcile workweek patterns + statutory/public/bank/replacement distinctions + regional links
  {
    const fEn = `${ROOT}/index.html`;
    let h = await fs.readFile(fEn, 'utf8');
    const regional2027Links = Object.entries(REGION_SLUGS)
      .map(([k, slug]) => `<a href="/${slug}/2027/">${esc(data.locales[k]?.label || k)} 2027</a>`)
      .join('');
    const homeGuideSection = `<section class="section guide-section"><div class="wrap">
      <h2>What does “maximizing leave” mean?</h2>
      <p>Choose a country, your state or region, a planning year, the leave days you can book, your preferred trip length and your <strong>workweek pattern</strong> (standard <strong>Monday–Friday</strong>, <strong>4-day Monday–Thursday</strong>, <strong>Sunday–Thursday</strong> or <strong>Tuesday–Saturday</strong>). The planner counts each ordinary working day in your selected workweek as leave, then bridges those workdays across your scheduled weekly rest days and the selected calendar’s public holidays.</p>
      <p>Your results are presented in two distinct modes: <strong>Mode 1 (Combined full-year schedule)</strong> uses dynamic programming to assemble a non-overlapping annual plan within your leave budget, while <strong>Mode 2 (Individual break alternatives)</strong> ranks standalone single breaks by efficiency multiplier (consecutive days off divided by leave days booked).</p>
      <h2>A real example: Ireland, 2027</h2>
      <div class="trip-card"><h3>4 leave days → 9 consecutive days off (2.25× multiplier)</h3><p>Book <strong>30 March–2 April 2027</strong> (Tuesday–Friday). With Easter Monday on <strong>29 March 2027</strong> and the weekends of 27–28 March and 3–4 April, your break runs <strong>27 March–4 April 2027</strong> (return to work: Monday 5 April 2027).</p><p>9 days = 4 leave days + 1 workday public holiday + 4 weekend days. Good Friday is not assumed off in Ireland because it is not a statutory public holiday. <a href="/country/ie/">See Ireland’s 2027 dates and local rules</a>.</p><a href="/?country=IE&amp;year=2027&amp;leave=4&amp;range=6-9#planner">Open this 4-day Ireland example in the planner →</a></div>
      <h2>Start with a worked 2027 country guide</h2>
      <nav class="featured-guides" aria-label="Detailed 2027 country guides">${Object.entries(FLAGSHIP_CFG).map(([c, v]) => `<a href="/country/${c.toLowerCase()}/">${v.name} 2027</a>`).join('')}</nav>
      <h2>Regional &amp; sub-national 2027 calendars</h2>
      <p>Public holidays differ by nation, state, province or Land in the UK, Germany, Australia, Canada and the US. Open a regional calendar directly:</p>
      <nav class="featured-guides" aria-label="Regional 2027 calendars">${regional2027Links}</nav>
      <h2>Statutory leave vs. public holidays, bank closures &amp; replacement days</h2>
      <p><strong>Statutory annual leave</strong> is your legal minimum paid vacation entitlement (for example 25 workdays in Denmark, France, Sweden and Austria, or 20 workdays in Germany, Italy, Belgium and the Netherlands). <strong>Public holidays</strong> are calendar dates set by law or collective agreement, which are distinct from <strong>bank closure days</strong> (such as 5 June or 24 December in Denmark) and <strong>employer-specific or collective-agreement days</strong> (such as French RTT, Danish feriefridage or Swedish klämdagar).</p>
      <p>Where a country’s law requires an employer-assigned <strong>replacement day</strong> when a public holiday falls on a rest day (such as in Belgium) or when you switch to a non-Monday–Friday workweek where a holiday falls on your scheduled rest day, the planner does not silently invent a substitute date—check your contract and adjust your booking accordingly.</p>
      <p><a href="/how-it-works/">How the ranking, workweek maths and annual schedules work</a> · <a href="/sources/">Official sources &amp; dataset notes</a></p>
    </div></section>`;
    h = h.replace(/<section class="section guide-section">[\s\S]*?<\/section>/, homeGuideSection);
    if (!h.includes('data-ad-slot="H1"')) {
      h = h.replace('</section><section class="hero">', '</section><div class="wrap"><div class="ad-slot" data-ad-slot="H1"></div></div><section class="hero">');
      h = h.replace('</main>', '<div class="wrap"><div class="ad-slot" data-ad-slot="B1"></div></div></main>');
    }
    await fs.writeFile(fEn, h);

    // French homepage (/fr/index.html)
    const fFr = `${ROOT}/fr/index.html`;
    let hf = await fs.readFile(fFr, 'utf8');
    const homeGuideSectionFr = `<section class="section guide-section"><div class="wrap">
      <h2>Que signifie « optimiser ses congés » ?</h2>
      <p>Choisissez un pays, votre région, une année, votre budget de congés, la durée souhaitée et votre <strong>rythme de travail</strong> (<strong>lundi–vendredi</strong> standard, <strong>semaine de 4 jours lundi–jeudi</strong>, <strong>dimanche–jeudi</strong> ou <strong>mardi–samedi</strong>). Le planificateur compte chaque jour ouvré habituel de votre rythme de travail comme un jour de congé à poser, puis le relie à vos jours de repos hebdomadaires et aux jours fériés du calendrier sélectionné.</p>
      <p>Les résultats sont présentés selon deux modes distincts : le <strong>Mode 1 (Plan annuel combiné)</strong> assemble un calendrier annuel sans chevauchement dans la limite de votre budget, tandis que le <strong>Mode 2 (Options individuelles)</strong> classe les coupures indépendantes selon leur multiplicateur d’efficacité.</p>
      <h2>Un exemple concret : Irlande, 2027</h2>
      <div class="trip-card"><h3>4 jours posés → 9 jours de repos consécutifs (multiplicateur 2,25×)</h3><p>Posez du <strong>30 mars au 2 avril 2027</strong> (mardi–vendredi). Avec le lundi de Pâques le <strong>29 mars 2027</strong> et les week-ends des 27–28 mars et 3–4 avril, votre coupure s’étend du <strong>27 mars au 4 avril 2027</strong> (reprise le lundi 5 avril 2027).</p><p>9 jours = 4 jours de congé + 1 jour férié ouvré + 4 jours de week-end. Le Vendredi saint n’est pas présumé chômé en Irlande. <a href="/fr/country/ie/">Voir les dates 2027 et règles locales en Irlande</a>.</p><a href="/fr/?country=IE&amp;year=2027&amp;leave=4&amp;range=6-9#planner">Essayer cet exemple de 4 jours dans le planificateur →</a></div>
      <h2>Guides pays 2027 détaillés</h2>
      <nav class="featured-guides" aria-label="Guides pays détaillés 2027">${Object.entries(FLAGSHIP_CFG).map(([c, v]) => `<a href="/fr/country/${c.toLowerCase()}/">${v.nameFr} 2027</a>`).join('')}</nav>
      <h2>Congé légal, jours fériés, fermetures bancaires et jours de remplacement</h2>
      <p>Le <strong>congé annuel payé légal</strong> est distinct des <strong>jours fériés</strong>, des <strong>fermetures bancaires</strong> (comme le 5 juin ou le 24 décembre au Danemark) et des jours conventionnels (RTT en France, feriefridage au Danemark, klämdagar en Suède). Lorsqu’un jour férié tombe sur un jour de repos habituel de votre rythme de travail, le modèle ne crée pas de jour de remplacement fictif : vérifiez les règles de votre employeur.</p>
      <p><a href="/fr/how-it-works/">Comprendre le calcul et les plannings annuels</a> · <a href="/fr/sources/">Sources officielles et données</a></p>
    </div></section>`;
    hf = hf.replace(/<section class="section guide-section">[\s\S]*?<\/section>/, homeGuideSectionFr);
    if (!hf.includes('data-ad-slot="H1"')) {
      hf = hf.replace('</section><section class="hero">', '</section><div class="wrap"><div class="ad-slot" data-ad-slot="H1"></div></div><section class="hero">');
      hf = hf.replace('</main>', '<div class="wrap"><div class="ad-slot" data-ad-slot="B1"></div></div></main>');
    }
    await fs.writeFile(fFr, hf);
  }

  // Update countries/index.html and fr/countries/index.html to link all 15 flagship guides AND all 46 regional 2026 & 2027 calendars
  {
    const f = `${ROOT}/countries/index.html`;
    let h = await fs.readFile(f, 'utf8');
    const regional2026And2027Html = `<section class="regional-hub-block" style="margin:24px 0">
      <h2>Regional &amp; Multi-Year Calendars (2026–2027)</h2>
      <p>Direct links to worked 2026 and 2027 public-holiday and annual-leave guides by region, state and nation:</p>
      <nav class="featured-guides" aria-label="Regional 2026 and 2027 planning calendars">
        ${Object.entries(REGION_SLUGS).flatMap(([k, slug]) => {
          const lbl = data.locales[k]?.label || k;
          return [`<a href="/${slug}/2027/">${esc(lbl)} 2027</a>`, `<a href="/${slug}/2026/">${esc(lbl)} 2026</a>`];
        }).join('')}
      </nav>
    </section>`;
    h = h.replace(/<section class="regional-hub-block"[\s\S]*?<\/section>/g, '');
    h = h.replace(
      /<nav class="featured-guides" aria-label="2027 planning guides">[\s\S]*?<\/nav>/,
      `<nav class="featured-guides" aria-label="2027 planning guides">${Object.entries(FLAGSHIP_CFG).map(([c, v]) => `<a href="/country/${c.toLowerCase()}/">${v.name} 2027</a>`).join('')}</nav>${regional2026And2027Html}`
    );
    await fs.writeFile(f, h);

    const fFr = `${ROOT}/fr/countries/index.html`;
    let hf = await fs.readFile(fFr, 'utf8');
    hf = hf.replace(
      /<nav class="featured-guides"[^>]*>[\s\S]*?<\/nav>/,
      `<nav class="featured-guides" aria-label="Guides 2027 détaillés">${Object.entries(FLAGSHIP_CFG).map(([c, v]) => `<a href="/fr/country/${c.toLowerCase()}/">${v.nameFr} 2027</a>`).join('')}</nav>`
    );
    await fs.writeFile(fFr, hf);
  }

  // Update Privacy Policy (EN and FR)
  {
    const enPriv = `${ROOT}/privacy/index.html`;
    let h = await fs.readFile(enPriv, 'utf8');
    h = h.replace(
      /<h2>Advertising and cookies<\/h2>[\s\S]*?(?=<h2>Why data may be processed<\/h2>)/,
      `<h2>Advertising, referrals and cookies</h2><p>To keep HolidayMaximizer free without requiring accounts or subscriptions, selected pages display banner advertisements provided by our advertising partner, <strong>Adsterra</strong> (Domain ID 6176073). We do not use popunders, disguised social bars or adult advertisements. After dates are calculated, results may also include clearly disclosed travel comparison links.</p><p>For visitors in the European Economic Area (EEA) and the United Kingdom, non-essential advertising scripts are not loaded unless you grant consent via the privacy banner. You can change or withdraw your choice at any time using the <a href="#" data-open-consent>Cookie preferences</a> link in the site footer. Downloaded holiday calendars and aggregate non-personal usage counts may be stored in browser local storage purely to support the calculator and measure feature reliability without transmitting personal leave dates.</p>`
    );
    h = h.replace('4 November 2026', '6 November 2026');
    await fs.writeFile(enPriv, h);
  }

  // Global pass across all HTML files in ROOT
  const allHtmlFiles = await walkHtml(ROOT);
  const indexedUrls = new Set();

  for (const f of allHtmlFiles) {
    let h = await fs.readFile(f, 'utf8');
    const rel = path.relative(ROOT, f).replaceAll('\\', '/');
    const isFr = rel.startsWith('fr/');

    h = h
      .replaceAll('/assets/style-v12.css', '/assets/style-v13.css')
      .replaceAll('/assets/style-v10.css', '/assets/style-v13.css')
      .replaceAll('/assets/style.css', '/assets/style-v13.css')
      .replaceAll('/assets/app-v12.js', '/assets/app-v13.js')
      .replaceAll('/assets/app-v11.js', '/assets/app-v13.js')
      .replaceAll('/assets/app.js', '/assets/app-v13.js');

    h = h.replace(/<meta[^>]*name="google-adsense-account"[^>]*>/gi, '');
    h = h.replace(/<script[^>]*pagead2\.googlesyndication\.com[^>]*><\/script>/gi, '');
    h = h.replace(/(<div class="ad-slot" data-ad-slot="B1"><\/div>\s*){2,}/g, '<div class="ad-slot" data-ad-slot="B1"></div>');

    // Ensure skip-link is the first focusable element inside <body> (before <header>)
    if (h.includes('<header class="site-header">') && h.includes('class="skip-link"')) {
      const skipMatch = h.match(/<a[^>]*class="skip-link"[^>]*>[\s\S]*?<\/a>/i);
      if (skipMatch) {
        const skipTag = skipMatch[0];
        h = h.replace(skipTag, '');
        h = h.replace(/<body([^>]*)>\s*/i, `<body$1>${skipTag}`);
      }
    }

    // Ensure reciprocal FR compare and ranking pages are indexable like their EN counterparts
    if (rel === 'fr/compare/index.html' || rel === 'fr/ranking/index.html') {
      h = h.replace('<meta name="robots" content="noindex,follow"/>', '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/>');
    }

    if (!h.includes('google-site-verification')) {
      h = h.replace(/(<meta[^>]*name="viewport"[^>]*>)/i, `$1<meta name="google-site-verification" content="${GSC_VERIFICATION}"/>`);
    }

    if (!h.includes('noindex') && rel !== '404.html') {
      if (!h.includes('name="robots"')) {
        h = h.replace('</head>', '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/></head>');
      }
      const canonical = h.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1] || h.match(/<link[^>]*href="([^"]+)"[^>]*rel="canonical"/i)?.[1];
      const expectedUrl = `https://holidaymaximizer.com/${rel === 'index.html' ? '' : rel.replace(/index\.html$/, '')}`;
      if (canonical && canonical === expectedUrl) {
        indexedUrls.add(canonical);
      }
    }

    if (!h.includes('data-open-consent')) {
      if (isFr) {
        h = h.replace('<a href="/fr/privacy/">Confidentialité</a>', '<a href="/fr/privacy/">Confidentialité</a><a href="#" data-open-consent>Préférences cookies</a>');
      } else {
        h = h.replace('<a href="/privacy/">Privacy</a>', '<a href="/privacy/">Privacy</a><a href="#" data-open-consent>Cookie preferences</a>');
      }
    }

    await fs.writeFile(f, h);
  }

  const sortedUrls = [...indexedUrls].sort();
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sortedUrls.map(u => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  await fs.writeFile(`${ROOT}/sitemap.xml`, sitemapXml);

  // Document ads.txt accurately: only include verified IAB seller records if supplied by retained partners
  await fs.writeFile(
    `${ROOT}/ads.txt`,
    `# HolidayMaximizer.com — Advertising Authorization Notice\n# Active display partner: Adsterra Direct Publisher (Domain ID: 6176073, Publisher ID: 3529548)\n# Note: Standard Adsterra direct display banner units (728x90, 300x250, 320x50) do not require or issue IAB ads.txt seller lines.\n`
  );
  await fs.writeFile(`${ROOT}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: https://holidaymaximizer.com/sitemap.xml\n`);
  await fs.writeFile(`${ROOT}/${INDEXNOW_KEY}.txt`, INDEXNOW_KEY);
  await fs.writeFile(
    `${ROOT}/_headers`,
    `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: geolocation=(), camera=(), microphone=()\n\n/assets/*\n  Cache-Control: public, max-age=604800\n\n/data/*\n  Cache-Control: public, max-age=86400\n\n/ads.txt\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: public, max-age=300\n\n/robots.txt\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: public, max-age=300\n\n/${INDEXNOW_KEY}.txt\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: public, max-age=86400\n`
  );

  const summary = {
    version: 'V13.2',
    releaseDate: TODAY,
    totalHtmlPages: allHtmlFiles.length,
    indexableSitemapUrls: sortedUrls.length,
    workedFlagshipGuidesEn: Object.keys(FLAGSHIP_CFG).length,
    workedFlagshipGuidesFr: Object.keys(FLAGSHIP_CFG).length,
    indexedRegionalYearPages2026_2027: Object.keys(REGION_SLUGS).length * 2,
    noindexFutureRegionalPages2028_2031: Object.keys(REGION_SLUGS).length * 4,
    indexNowKeyFile: `/${INDEXNOW_KEY}.txt`,
    adsterraDomainId: 6176073,
    adsterraPlacements: [
      '728x90_1 (8da4f60a736e13046a9c88be9b8de6bd)',
      '300x250_1 (17d46e7ef75e864b11e99a78a4ef5046)',
      '320x50_1 (5302600cb2f933f200f0cf885a9bf708)'
    ]
  };
  await fs.writeFile(`${ROOT}/BUILD-SUMMARY.json`, JSON.stringify(summary, null, 2));
  console.log('BUILD SUMMARY:', summary);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
