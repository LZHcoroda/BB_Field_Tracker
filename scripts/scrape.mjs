/**
 * Scrapes ActiveSG Circle football facilities into src/data/facilities.json
 *
 * Source: https://www.activesgcircle.gov.sg/facilities/football  (Last updated 1 Oct 2024)
 *
 * The site does NOT publish a machine-readable surface type. We infer
 * `surface` ("artificial" | "grass" | "unknown") plus a `surfaceConfidence`
 * and `surfaceBasis` from the facility category and the names of its
 * bookable sub-facilities, then expose it as a filter with an
 * "inferred" badge in the UI.
 *
 * Run:  node scripts/scrape.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.activesgcircle.gov.sg';
const LIST = `${BASE}/facilities/football`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
      console.warn(`  ${res.status} ${url} (retry ${i + 1})`);
    } catch (e) {
      console.warn(`  ${e.message} ${url} (retry ${i + 1})`);
    }
    await sleep(800 * (i + 1));
  }
  throw new Error(`failed: ${url}`);
}

const clean = (s) =>
  (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Parse one listing page into [{slug,name,region,address,category}] */
function parseList(html) {
  const out = [];
  const chunks = html.split('class="view-page-link"').slice(1);
  for (const chunk of chunks) {
    const slug = chunk.match(/href="https:\/\/www\.activesgcircle\.gov\.sg\/facilities\/([a-z0-9-]+)"/)?.[1];
    if (!slug) continue;
    const card = chunk.slice(0, 4000);
    const name = card.match(/<h2>\s*([\s\S]*?)\s*<\/h2>/)?.[1];
    if (!name) continue;
    out.push({
      slug,
      name: clean(name),
      region: clean(card.match(/cst-direction[\s\S]*?<span>\s*([\s\S]*?)\s*<\/span>/)?.[1] || ''),
      address: clean(card.match(/cst-address">\s*([\s\S]*?)\s*<\/div>/)?.[1] || ''),
      category: clean(card.match(/cst-type-of-facility">\s*([\s\S]*?)\s*<\/div>/)?.[1] || ''),
    });
  }
  return out;
}

/** Parse a facility detail page */
function parseDetail(html) {
  const coord = html.match(/maps\.google\.com\/maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const lat = coord ? parseFloat(coord[1]) : null;
  const lng = coord ? parseFloat(coord[2]) : null;

  let phone = '';
  const phIdx = html.indexOf('Phone Number');
  if (phIdx > -1) phone = (clean(html.slice(phIdx, phIdx + 400)).match(/Phone Number\s*([0-9]{6,}[0-9 ]*)/)?.[1] || '').trim();

  let hours = '';
  const hIdx = html.indexOf('Operating Hours');
  if (hIdx > -1) {
    hours = clean(html.slice(hIdx, hIdx + 600))
      .replace(/^Operating Hours\s*/, '')
      .split(/Please refer|Phone Number|Address/)[0]
      .trim();
  }

  // All online booking links on the page (activesg.gov.sg deep links).
  // Markup: <span ...>Soccer 5 A Side Court</span>
  //         <a class="... masg_plus-facilities-bookinglink-btn"
  //            aria-label="<Facility> <Sport group> - <Sub-facility>"
  //            href="https://activesg.gov.sg/venues/.../activities/.../timeslots">Book</a>
  const bookings = [];
  const re =
    /<span[^>]*>\s*([^<]{2,60}?)\s*<\/span>\s*<a class="[^"]*masg_plus-facilities-bookinglink-btn[^"]*"\s+aria-label="([^"]*)"\s+href="(https:\/\/activesg\.gov\.sg\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const label = clean(m[1]);
    const aria = clean(m[2]);
    const group = aria.includes(' - ') ? aria.split(' - ')[0].replace(/^.*?\b(Football Field|Soccer Field|Field)\b.*$/i, '$1') : '';
    bookings.push({ label, group: clean(aria.split(' - ')[0]), url: m[3] });
  }

  // "This facility is managed by" -> linked sport centre
  let managedBy = '';
  const mgIdx = html.indexOf('cst-related-managed-by');
  if (mgIdx > -1) {
    const slug = html.slice(mgIdx, mgIdx + 800).match(/\/facilities\/([a-z0-9-]+)"/)?.[1];
    if (slug) managedBy = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return { lat, lng, phone, hours, bookings, managedBy };
}

const SIZE_RES = [
  [/\b3\s*a\s*side\b/i, '3-a-side'],
  [/\b5\s*a\s*side\b/i, '5-a-side'],
  [/\b7\s*a\s*side\b/i, '7-a-side'],
  [/\b8\s*a\s*side\b/i, '8-a-side'],
  [/\b9\s*a\s*side\b/i, '9-a-side'],
  [/\b11\s*a\s*side\b/i, '11-a-side'],
];

/** Infer facility type, surface, pitch sizes, bookability */
function classify(f) {
  const cat = f.category.toLowerCase();
  const n = f.name.toLowerCase();
  const footballBookings = f.bookings.filter(
    (b) => /soccer|football|futsal|field/i.test(b.label) || /soccer|football|futsal/i.test(b.group),
  );
  const bookText = footballBookings.map((b) => b.label).join(' | ').toLowerCase();

  let facilityType = 'Sport Centre';
  if (cat.includes('school')) facilityType = 'School Field';
  else if (cat.includes('stadium')) facilityType = 'Stadium';
  else if (cat.includes('free to play')) facilityType = 'Free-to-play Field';
  else if (n.includes('stadium')) facilityType = 'Stadium';
  else if (/school|college|institute/.test(n)) facilityType = 'School Field';

  const pitchSizes = [];
  for (const [re, label] of SIZE_RES) if (re.test(bookText) || re.test(n)) pitchSizes.push(label);

  const isCourt = /\bcourt\b|futsal/i.test(bookText);
  const isFreeToPlay = facilityType === 'Free-to-play Field' || /free to play/i.test(bookText);
  const bookable = footballBookings.length > 0;
  const bookingUrl = footballBookings[0]?.url || '';

  let surface = 'unknown';
  let surfaceConfidence = 'low';
  let surfaceBasis = 'Not stated by ActiveSG';

  if (isCourt || pitchSizes.some((s) => s === '3-a-side' || s === '5-a-side' || s === '7-a-side')) {
    surface = 'artificial';
    surfaceConfidence = 'high';
    surfaceBasis = 'Bookable as a 5/7-a-side "court" — these are artificial turf';
  } else if (/outdoor court|sport village|futsal/i.test(n)) {
    surface = 'artificial';
    surfaceConfidence = 'medium';
    surfaceBasis = 'Sport-centre outdoor courts are artificial turf';
  } else if (facilityType === 'School Field') {
    surface = 'grass';
    surfaceConfidence = 'medium';
    surfaceBasis = 'School fields are natural grass';
  } else if (facilityType === 'Free-to-play Field') {
    surface = 'grass';
    surfaceConfidence = 'medium';
    surfaceBasis = 'Neighbourhood free-to-play fields are natural grass';
  } else if (facilityType === 'Stadium') {
    surface = 'grass';
    surfaceConfidence = 'low';
    surfaceBasis = 'Most ActiveSG stadium pitches are natural grass (a few are synthetic — verify)';
  }

  return {
    facilityType,
    surface,
    surfaceConfidence,
    surfaceBasis,
    pitchSizes,
    free: isFreeToPlay,
    bookable,
    bookingUrl,
    bookingOptions: footballBookings.map((b) => b.label),
  };
}

async function main() {
  console.log('Fetching listing pages…');
  const first = await get(`${LIST}?page_num=1`);
  const total = parseInt(first.match(/of\s+(\d+)\s+results/)?.[1] || '0', 10);
  const perPage = parseList(first).length || 10;
  const pages = Math.max(1, Math.ceil(total / perPage));
  console.log(`  ${total} facilities across ${pages} pages`);

  const listItems = [...parseList(first)];
  for (let p = 2; p <= pages; p++) {
    listItems.push(...parseList(await get(`${LIST}?page_num=${p}`)));
    await sleep(350);
  }
  const bySlug = new Map(listItems.map((i) => [i.slug, i]));
  console.log(`  parsed ${bySlug.size} unique facilities`);

  const facilities = [];
  let i = 0;
  for (const item of bySlug.values()) {
    i++;
    process.stdout.write(`\rDetail ${i}/${bySlug.size} ${item.slug.slice(0, 46).padEnd(46)}`);
    const html = await get(`${BASE}/facilities/${item.slug}`);
    if (!html) continue;
    const d = parseDetail(html);
    const merged = {
      slug: item.slug,
      name: item.name,
      region: item.region,
      address: item.address,
      phone: d.phone,
      hours: d.hours,
      lat: d.lat,
      lng: d.lng,
      managedBy: d.managedBy,
      infoUrl: `${BASE}/facilities/${item.slug}`,
      category: item.category,
    };
    Object.assign(merged, classify({ ...merged, bookings: d.bookings }));
    facilities.push(merged);
    await sleep(250);
  }
  process.stdout.write('\n');

  facilities.sort((a, b) => a.name.localeCompare(b.name));

  const payload = {
    source: LIST,
    scrapedAt: new Date().toISOString(),
    note:
      'Surface type is inferred from facility category and booking names — ActiveSG does not publish it. ' +
      'Treat "grass"/"artificial" as best-effort; check surfaceConfidence.',
    count: facilities.length,
    facilities,
  };

  mkdirSync(resolve(ROOT, 'src/data'), { recursive: true });
  writeFileSync(resolve(ROOT, 'src/data/facilities.json'), JSON.stringify(payload, null, 2));

  const tally = (key) => facilities.reduce((a, f) => ((a[f[key]] = (a[f[key]] || 0) + 1), a), {});
  console.log(`\nWrote ${facilities.length} facilities -> src/data/facilities.json`);
  console.log('  missing coords:', facilities.filter((f) => f.lat == null).map((f) => f.slug).join(', ') || 'none');
  console.log('  by surface:', tally('surface'));
  console.log('  by type:', tally('facilityType'));
  console.log('  bookable online:', facilities.filter((f) => f.bookable).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
