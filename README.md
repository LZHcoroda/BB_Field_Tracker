# BB Field Tracker

Interactive map and directory of **ActiveSG football fields and turf pitches for rent in Singapore**,
built from the public listing at
[activesgcircle.gov.sg/facilities/football](https://www.activesgcircle.gov.sg/facilities/football).

- 🗺️ **Interactive map** (Leaflet + OpenStreetMap — no API key, no billing) with marker
  clustering and colour‑coded pins by playing surface.
- 🔎 **Filter & sort** by region, surface, facility type, pitch size, online‑booking
  availability and free‑to‑play; sort A–Z, by region, by surface, or by distance from you.
- 📱 **Responsive** — split list/map on desktop, tabbed List / Map on mobile.
- 🔗 Every field links to **directions**, the **ActiveSG booking page** (deep link where
  available) and the official facility page.
- ⚙️ Data is scraped into a static JSON file and bundled at build time — the deployed
  site makes no server calls except for map tiles.

## Stack

Vue 3 + Vite · Leaflet · deployed to GitHub Pages via GitHub Actions.

## Local development

```bash
npm install
npm run dev
```

## Refreshing the data

```bash
npm run scrape      # re-scrapes ActiveSG -> src/data/facilities.json
```

The scraper (`scripts/scrape.mjs`) walks all 13 listing pages and each facility
detail page, pulling name, region, address, phone, opening hours, coordinates
(from the embedded Google Maps link) and the bookable sub‑facilities.

### ⚠️ About the "surface" field

**ActiveSG does not publish the playing surface.** `surface` is *inferred*:

| Signal | Inferred surface | Confidence |
| --- | --- | --- |
| Bookable as a "5/7‑a‑side Court" | Artificial turf | high |
| Sport‑centre outdoor courts | Artificial turf | medium |
| School field | Natural grass | medium |
| Neighbourhood free‑to‑play field | Natural grass | medium |
| Stadium main pitch | Natural grass | low (some are synthetic) |

Every surface label in the UI carries an **"inferred"** badge. Always confirm with
the venue before you rely on it. Corrections welcome — see `scripts/scrape.mjs`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with
`base: /BB_Field_Tracker/` and publishes `dist/` to GitHub Pages.
One-time setup: **Settings → Pages → Source: GitHub Actions**.

## Disclaimer

Not affiliated with ActiveSG or Sport Singapore. Data belongs to Sport Singapore
and is used here for informational purposes; it may be out of date (the source page
was last updated 1 October 2024).
