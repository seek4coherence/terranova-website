# Terra Nova Equity LLC — Website

Static marketing site for **Terra Nova Equity LLC**, a nationwide cash buyer of houses and
vacant land headquartered in Louisville, Kentucky.

- **Live site:** https://www.terranovaequityllc.com
- **Repo:** https://github.com/seek4coherence/terranova-website
- **Host:** cPanel / LiteSpeed, deployed to `/public_html/`
- **Stack:** hand-written HTML, CSS, and vanilla JavaScript. No build step, no framework, no package manager.

---

## 1. Project structure

```
/
├── index.html                     Homepage (hero, process, comparison, FAQ, lead forms)
├── about.html                     Company story and values
├── how-it-works.html              Step-by-step seller process
├── privacy.html                   Privacy policy
├── 404.html                       Custom error page
├── styles.css                     Single global stylesheet
├── script.js                      Nav, tabs, AJAX form submit, FAQ accordion, reveal animations
├── .htaccess                      HTTPS + www canonicalization, 404, gzip, cache headers
├── robots.txt                     Crawl rules + sitemap reference
├── sitemap.xml                    All indexable URLs
├── llms.txt                       Plain-text summary for AI crawlers
├── assets/                        logo.png, hero-bg.png, about-neighborhood.png
├── services/
│   ├── index.html                 Services hub
│   ├── sell-my-house-fast.html
│   ├── sell-house-for-cash.html
│   ├── cash-home-buyers.html
│   ├── sell-house-as-is.html
│   ├── sell-vacant-land.html
│   └── land-for-home-builders.html
├── locations/
│   ├── index.html                 Service areas hub
│   ├── louisville-ky.html         Home market
│   ├── lexington-ky.html
│   ├── elizabethtown-ky.html
│   ├── bowling-green-ky.html
│   └── southern-indiana.html
├── guides/
│   ├── index.html                 Seller guides hub
│   ├── sell-inherited-house.html  Probate, deed transfer, capital gains basics
│   ├── stop-foreclosure.html      Kentucky judicial foreclosure and options
│   └── sell-house-with-tenants.html  Leases, deposits, occupied sales
├── scripts/
│   ├── verify.ps1                 Link, nav, and email checks
│   └── verify-json.ps1            JSON-LD, H1, and form-tag checks
└── .github/workflows/deploy.yml   FTP deploy on push to master
```

Every page is self-contained. There is no templating layer, so shared markup (nav, footer,
analytics snippet) is duplicated by hand. When you change the nav or footer, change it in
**every** `.html` file.

---

## 2. Local preview

No tooling required. Serve the folder over HTTP so root-relative paths (`/styles.css`,
`/assets/logo.png`) resolve:

```powershell
# Python 3
python -m http.server 8080

# or Node
npx serve .
```

Then open http://localhost:8080.

Opening `index.html` directly via `file://` will break root-relative asset paths on the
subpages, so use a local server.

---

## 3. Deployment

Deployment is automatic.

1. Commit and push to `master`.
2. GitHub Actions runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
3. `SamKirkland/FTP-Deploy-Action` mirrors the repo to `/public_html/` on the cPanel host.

Required repository secrets:

| Secret | Purpose |
| --- | --- |
| `FTP_SERVER` | cPanel hostname |
| `FTP_USERNAME` | FTP account |
| `FTP_PASSWORD` | FTP password |

`.git`, `.github`, and anything matched by `.gitignore` are excluded from the upload.

**Rollback:** revert the offending commit on `master` and push. The action re-syncs the
previous state. There is no separate staging environment — verify locally before pushing.

---

## 4. Lead capture

Both homepage forms and every page-level lead form POST to **Formspree**:

```
https://formspree.io/f/xnjkeypr
```

- Forms are submitted via `fetch()` in [`script.js`](script.js) so the visitor never leaves the page.
- Each form carries a hidden `submission_type` field (`Property`, `Land`, or a page-specific
  value) and a `form_location` field identifying the page that captured the lead.
- On success the form is hidden and the sibling `.form-success` block is shown for 5 seconds.
- On failure the button reads "Error, Try Again" and re-enables.

To point at a different Formspree form, change the `action` attribute on every `<form>`.

**Spam:** Formspree's built-in filtering is active. If spam volume rises, add a honeypot
field (`_gotcha`) to each form rather than a CAPTCHA.

---

## 5. Analytics

Google Analytics 4, measurement ID `G-E1J346K6X6`, is loaded in the `<head>` of every page.

Events fired from [`script.js`](script.js):

| Event | When | Key parameters |
| --- | --- | --- |
| `generate_lead` | A form POST returns 2xx | `form_type`, `form_location`, `value: 1` |
| `cta_click` | A "Get a Cash Offer" style CTA is clicked | `cta_text`, `cta_location` |
| `phone_click` | A `tel:` link is clicked | `link_url` |

Mark `generate_lead` as a **key event** (conversion) in GA4 → Admin → Events. Without that,
lead volume will not appear in acquisition or ads reporting.

---

## 6. SEO conventions

Each page must include:

- A unique `<title>` and `<meta name="description">`.
- A self-referencing `<link rel="canonical">` using the `https://www.` host.
- Open Graph and Twitter card tags.
- JSON-LD: `Service` (or `RealEstateAgent` on the homepage), `BreadcrumbList`, and `FAQPage`
  where the page has a visible FAQ.
- A visible breadcrumb trail matching the `BreadcrumbList` schema.

Canonicalization rules live in [`.htaccess`](.htaccess): HTTPS is forced, the `www` host is
forced, and `/index.html` 301s to `/`. Do not add pages that violate these rules.

### Adding a new page

1. Copy the closest existing page in the same folder and rewrite the content.
2. Update `title`, `description`, `og:*`, `canonical`, and all JSON-LD blocks.
3. Add the URL to [`sitemap.xml`](sitemap.xml) with today's `lastmod`.
4. Add it to [`llms.txt`](llms.txt) under "Key Pages".
5. Link to it from the relevant hub page and from the footer if it is a top-level section.
6. Add a lead form section (see section 4) so the page can convert on its own.

### Search Console

The domain property `sc-domain:terranovaequityllc.com` is verified. The sitemap is submitted
at `https://www.terranovaequityllc.com/sitemap.xml`. After adding pages, re-submit the sitemap
and use URL Inspection to request indexing for each new URL.

---

## 7. Verification

Two PowerShell scripts check the site before you push. Run both from the repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\verify.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\verify-json.ps1"
```

- [`scripts/verify.ps1`](scripts/verify.ps1) — every internal `href="/..."` resolves to a real
  file or directory index, every page has exactly one Locations nav link, pages with a footer
  grid link to the locations hub, and no `mailto:` address is misspelled.
- [`scripts/verify-json.ps1`](scripts/verify-json.ps1) — every `application/ld+json` block
  parses as valid JSON, each page has exactly one `<h1>`, and `<form>` tags are balanced.

Both exit 0 and print `OK` when clean. Run them after adding or renaming any page.

---

## 8. Keyword strategy

Volumes below are Google Ads averages pulled for the Louisville DMA (location ID `200529`) and
the US (`2840`). They are directional, not guarantees.

| Term | Volume | Competition | Where it is targeted |
| --- | --- | --- | --- |
| sell my house fast | 9,900 US / 140 Louisville | LOW (index 6 local) | Homepage title + H1 |
| we buy houses | 8,100 US / 140 Louisville | LOW / HIGH local | Homepage, Louisville H2 |
| cash home buyers | 8,100 US | LOW | [`cash-home-buyers.html`](services/cash-home-buyers.html) |
| sell house as is for cash | 2,900 US | LOW | [`sell-house-as-is.html`](services/sell-house-as-is.html) |
| sell inherited house | 390 US | LOW | [`sell-inherited-house.html`](guides/sell-inherited-house.html) |
| stop foreclosure | 720 US | LOW | [`stop-foreclosure.html`](guides/stop-foreclosure.html) |
| sell house with tenants | 320 US | LOW | [`sell-house-with-tenants.html`](guides/sell-house-with-tenants.html) |
| sell vacant land | 90 US | LOW | [`sell-vacant-land.html`](services/sell-vacant-land.html) |

Two things this data makes clear:

1. **Local head terms are small but winnable.** "Sell my house fast" in the Louisville DMA is
   only ~140 searches a month, but the local competition index is 6 out of 100. A new site can
   realistically reach page one. City-level terms for Lexington, Elizabethtown, and Bowling
   Green are ~10/month each — worth having for coverage and trust, not for traffic volume.
2. **Informational terms are the volume play.** "Stop foreclosure" and "sell inherited house"
   each outdraw every city-level term combined. The guides exist to capture that demand and
   funnel it to the service pages.

Do not chase national head terms with a new domain. Build local relevance, neighborhood and
county coverage, and the guide cluster first.

---

## 9. Conventions

- **Paths:** root-relative (`/styles.css`, `/services/...`) on every page except the homepage,
  which uses relative paths. Keep it that way — the site is served from the domain root.
- **CSS:** all styles live in `styles.css`. Reuse existing classes (`.content-section`,
  `.card-grid`, `.info-card`, `.prose`, `.cta-band`, `.related-links`, `.form-container`)
  before adding new ones.
- **JavaScript:** one file, `script.js`, wrapped in a single `DOMContentLoaded` handler.
  Guard any new code against missing elements, since not every page has every component.
- **Accessibility:** interactive controls need `aria-expanded` / `aria-label`; the FAQ
  accordion and mobile nav already follow this pattern.
- **Copy:** plain, specific, no hype. State the trade-off of a cash offer honestly — the
  existing pages do this deliberately and it is a differentiator.

---

## 10. Known follow-ups

- Add `sameAs` social profile URLs to the `RealEstateAgent` schema in
  [`index.html`](index.html) once profiles exist.
- Add city pages for additional markets as buy-box coverage expands.
- Consider a `locations/index.html` map or county list as the number of markets grows.
