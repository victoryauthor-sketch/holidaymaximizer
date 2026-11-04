# HolidayMaximizer V13

Global Annual Leave & Public Holiday Planner (`https://holidaymaximizer.com`), deployed on Cloudflare Pages (`holidaymaximizer-live2`) and backed by GitHub (`victoryauthor-sketch/holidaymaximizer`).

## V13 Release Highlights (4 November 2026)

1. **Unified V13 Architecture (680 HTML Pages, 236 Indexed Canonical URLs)**:
   - Merged the V12 bilingual (`EN` / `FR`) 249-jurisdiction architecture with the V1 multi-year regional guides (`/<region-slug>/<year>/` for 23 regions across 2026–2031 = 138 regional-year pages + 23 regional hub pages).
   - Expanded worked Flagship Country Guides from 10 to **15 countries**: Denmark (`dk`), UK (`gb`), Ireland (`ie`), Germany (`de`), France (`fr`), Netherlands (`nl`), Italy (`it`), United States (`us`), Austria (`at`), Belgium (`be`), Canada (`ca`), Australia (`au`), Sweden (`se`), Norway (`no`), and Finland (`fi`).
   - Upgraded all primary-source verified country guides (`/country/<iso2>/`), `/compare/`, and `/ranking/` to `index,follow,max-image-preview:large,max-snippet:-1` and included them in `sitemap.xml` (`236` canonical URLs).

2. **Interactive Planner Upgrades (`assets/app-v13.js` & `assets/style-v13.css`)**:
   - **Combined Non-Overlapping Annual Leave Plan Card**: Automatically constructs a full-year non-overlapping break schedule within the user's leave budget, displaying total days off, leave days used, remaining unallocated leave, public holidays leveraged, and combined efficiency multiplier.
   - **Calendar Export (`.ics`) & One-Click HR Summary Copy**: Export any individual break or the entire full-year non-overlapping plan as an RFC 5545 `.ics` file for Google Calendar, Apple Calendar, or Outlook, or copy a formatted HR booking summary to the clipboard.
   - **Workweek Pattern Selector**: Supports standard `Mon–Fri (Sat–Sun weekend)`, `4-day week Mon–Thu (Fri–Sun off)`, `Sun–Thu (Fri–Sat weekend)`, and `Tue–Sat (Sun–Mon weekend)`.
   - **Smart Q4 Year Default**: Automatically defaults the planner year to the upcoming calendar year (`2027`) during Q4 when no `?year=` query parameter is specified.

3. **Adsterra Monetization & EEA/UK Privacy Consent**:
   - Replaced all legacy Google AdSense scripts and meta tags with Adsterra display banners registered under Publisher ID `3529548` / Domain ID `6176073` (adult/erotic ads excluded, no popunders):
     - Desktop Leaderboard (`728×90`, Unit ID `32097205`, key `8da4f60a736e13046a9c88be9b8de6bd`)
     - Medium Rectangle (`300×250`, Unit ID `32097166`, key `17d46e7ef75e864b11e99a78a4ef5046`)
     - Mobile Banner (`320×50`, Unit ID `32097241`, key `5302600cb2f933f200f0cf885a9bf708`)
   - Responsive viewport-aware slot loader (`H1`, `M1`, `B1`) with EEA/UK consent banner (`#consent-banner`) and footer `Cookie preferences` (`[data-open-consent]`) control.

4. **SEO & Google Search Console Verification**:
   - Embedded `<meta name="google-site-verification" content="uBlwh9aRM-wKTubHzWG6-WVt3_PWccE_kHOQRorzKEE"/>` across all 680 HTML pages (matching the live Cloudflare DNS TXT verification token).
   - Fixed truncated meta descriptions and added `BreadcrumbList` and `WebPage` JSON-LD structured data across regional and country guides.

## Rebuilding Locally

```bash
node scripts/build_v13.mjs
```
