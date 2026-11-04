# HolidayMaximizer V11

Cloudflare Pages direct-upload build.

Key release changes:
- ranking defaults to annual-leave + public-holiday total benchmark
- sortable by total, annual leave, public holidays or country
- numeric public-holiday baseline for every ranked country; regional ranges are labelled
- UK comparison uses 20 annual-leave days + 8 England/Wales bank holidays to avoid double-counting the 28-day legal minimum
- ranking controls rebuilt as a spaced three-control grid
- CSS and JS filenames versioned to bypass the previous year-long immutable browser cache
- public-holiday baseline data exposed at /data/public-holiday-baselines.json
- EN/FR ranking and source methodology kept aligned

AdSense CMP remains an account-side Google Privacy & Messaging step for relevant regions.


## V10 final-pass changes
- Planner range subtitles show the year on both dates; cross-year day chips show years.
- Country-specific Christmas naming prevents Denmark from mixing St Stephen's Day with Second Day of Christmas.
- EN/FR language switch preserves the current page, query string and hash.
- Leave dataset expanded to all 249 directory jurisdictions: 201 numeric sourced benchmarks and territory-specific non-invented fallbacks.
- Zambia corrected to 24 days/year under Employment Code Act 2019 s36.
- Ranking expanded to 152 countries with both numeric leave and public-holiday benchmarks.

## V11 planner + ads.txt reliability changes
- Keeps separate Christmas windows when they are genuinely in different years (for example Dec 2025→Jan 2026 and Dec 2026→Jan 2027), but blocks overlapping/near-duplicate recommendations for the same date window.
- Adds an explicit boundary label to cross-year cards so the two Christmas seasons cannot be mistaken for duplicates.
- Shows all holiday names when a recommendation contains up to three public holidays, so the subtitle agrees with the holiday count.
- Adds explicit Cloudflare Pages response headers for `/ads.txt` and `/robots.txt` (`text/plain`, short cache).
- Normalizes `/ads.txt` to the exact AdSense line for publisher `pub-9924491158202170`.
- JavaScript asset bumped to `app-v11.js` so the planner fix is not hidden by the existing asset cache.
