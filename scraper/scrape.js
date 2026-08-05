// Scrapes daily-playbook.com (a beehiiv-hosted newsletter) for new editions
// and saves each one as structured JSON in ../raw/.
//
// The site has no RSS feed (confirmed: rss_feed_map is null in its own page
// config) and the homepage's "Load more" button is a client-side fetch with
// no discoverable API, so we rely on the homepage always listing the most
// recent 5 editions server-rendered in the initial HTML. Daily Playbook
// publishes on weekdays only, so a weekly run comfortably covers a full week
// before older editions roll off that list.

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.daily-playbook.com';
const RAW_DIR = path.join(__dirname, '..', 'raw');
const STATE_FILE = path.join(__dirname, '..', 'state.json');

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StrydeDigestBot/1.0)' },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return res.text();
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { lastScrapedDate: null, seenUrls: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Parses the homepage to find recent edition links, titles, teaser text, and dates.
function parseHomepageEditions(html) {
  const $ = cheerio.load(html);
  const editions = [];

  $('a[href*="/p/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || !href.includes('/p/')) return;
    const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    if (editions.some((e) => e.url === url)) return;

    // Walk up to find the surrounding card so we can grab its date text.
    const card = $(el).closest('article, div');
    const dateText = card
      .find('time')
      .first()
      .text()
      .trim();

    editions.push({ url, dateText: dateText || null });
  });

  return editions;
}

// Parses a single edition page into structured sections/stories.
function parseEditionPage(html, url) {
  const $ = cheerio.load(html);

  const title = $('h1').first().text().trim();
  const publishedTime = $('meta[property="article:published_time"]').attr('content') || null;

  const doc = $('.dream-post-content-doc').first();
  const elements = doc.find('h3, p.dream-post-content-paragraph');

  const sections = [];
  let currentSection = null;
  let currentStory = null;
  let started = false;

  const pushStory = () => {
    if (currentStory && currentSection) {
      currentSection.stories.push(currentStory);
      currentStory = null;
    }
  };
  const pushSection = () => {
    pushStory();
    if (currentSection) sections.push(currentSection);
    currentSection = null;
  };

  // Category headers render as h3.hynlcx1 ("💸 Finance & Investments").
  // Each story is a paragraph containing a link (the source citation) —
  // that link marks a new headline; plain paragraphs after it are the
  // story's body sentences. Everything before the first category header
  // (ad slot, date stamp) and after the sign-off is boilerplate.
  for (const el of elements.toArray()) {
    const $el = $(el);
    const tag = el.tagName.toLowerCase();
    const text = $el.text().trim().replace(/\s+/g, ' ');

    if (tag === 'h3') {
      const isCategory = ($el.attr('class') || '').includes('hynlcx1');
      if (!isCategory) break; // reached the footer ("How was today's edition?")
      pushSection();
      currentSection = { category: text, stories: [] };
      started = true;
      continue;
    }

    if (!started || !text) continue;
    if (/^if you have any comments/i.test(text)) break;
    if (/^was this email forwarded/i.test(text)) break;

    const link = $el.find('a').first();
    if (link.length) {
      pushStory();
      currentStory = { headline: text, sourceUrl: link.attr('href') || null, body: [] };
    } else if (currentStory) {
      currentStory.body.push(text);
    }
  }
  pushSection();

  return { url, title, publishedTime, sections };
}

async function main() {
  const state = loadState();
  console.log('Fetching homepage...');
  const homepageHtml = await fetchHtml(BASE_URL);
  const editions = parseHomepageEditions(homepageHtml);
  console.log(`Found ${editions.length} editions on homepage.`);

  const newEditions = editions.filter((e) => !state.seenUrls.includes(e.url));
  if (newEditions.length === 0) {
    console.log('No new editions since last run.');
    fs.writeFileSync(path.join(RAW_DIR, '.last-scrape-manifest.json'), JSON.stringify([]));
    return [];
  }

  const results = [];
  for (const edition of newEditions) {
    console.log(`Scraping ${edition.url}`);
    const html = await fetchHtml(edition.url);
    const parsed = parseEditionPage(html, edition.url);
    results.push(parsed);

    const dateForFilename = (parsed.publishedTime || '').slice(0, 10) || 'unknown-date';
    const slug = edition.url.split('/p/')[1] || 'unknown';
    const outFile = path.join(RAW_DIR, `${dateForFilename}--${slug}.json`);
    fs.writeFileSync(outFile, JSON.stringify(parsed, null, 2));
  }

  state.seenUrls = Array.from(new Set([...state.seenUrls, ...newEditions.map((e) => e.url)])).slice(-100);
  state.lastScrapedDate = new Date().toISOString();
  saveState(state);

  // consolidate.js reads this to know which raw/ files belong to *this* run,
  // instead of re-bundling every edition still sitting in raw/ from prior weeks.
  const manifestFile = path.join(RAW_DIR, '.last-scrape-manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(results.map((r) => r.url)));

  console.log(`Scraped ${results.length} new edition(s).`);
  return results;
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main, parseHomepageEditions, parseEditionPage };
