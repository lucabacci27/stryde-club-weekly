// Bundles every raw edition scraped since the last digest into one
// weekly package for the rewrite step.

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'raw');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

function consolidate() {
  const files = fs
    .readdirSync(RAW_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort(); // filenames are date-prefixed, so this sorts chronologically

  const editions = files.map((f) => JSON.parse(fs.readFileSync(path.join(RAW_DIR, f), 'utf8')));

  if (editions.length === 0) {
    console.log('No raw editions found — run scrape.js first.');
    return null;
  }

  const dates = editions.map((e) => (e.publishedTime || '').slice(0, 10)).filter(Boolean);
  const weekLabel = `${dates[0]}_to_${dates[dates.length - 1]}`;

  const bundle = { weekLabel, editionCount: editions.length, editions };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outFile = path.join(OUTPUT_DIR, `week-${weekLabel}--raw-bundle.json`);
  fs.writeFileSync(outFile, JSON.stringify(bundle, null, 2));
  console.log(`Wrote ${editions.length} editions (${weekLabel}) to ${outFile}`);
  return outFile;
}

if (require.main === module) {
  consolidate();
}

module.exports = { consolidate };
