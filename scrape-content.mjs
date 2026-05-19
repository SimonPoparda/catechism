import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import iconv from 'iconv-lite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://www.katechizm.opoka.org.pl';

// Map of section IDs to their content file paths on opoka
// Note: the 'r' prefixed files are framesets; 'k' prefixed are the actual content
const SECTIONS = {
  // Preliminary
  'fidei': 'kkkap.htm',
  'wstep': 'kkkwstep.htm',
  // Part 1
  'p1-d1-wst': 'kkkI-1wst.htm',
  'p1-d1-r1': 'kkkI-1-1.htm',
  'p1-d1-r2': 'kkkI-1-2.htm',
  'p1-d1-r3': 'kkkI-1-3.htm',
  'p1-d2-wst': 'kkkI-2wst.htm',
  'p1-d2-r1': 'kkkI-2-1.htm',
  'p1-d2-r2': 'kkkI-2-2.htm',
  'p1-d2-r3': 'kkkI-2-3.htm',
  // Part 2
  'p2-wst': 'kkkII-wst.htm',
  'p2-d1-r1': 'kkkII-1-1.htm',
  'p2-d1-r2': 'kkkII-1-2.htm',
  'p2-d2-wst': 'kkkII-2wst.htm',
  'p2-d2-r1': 'kkkII-2-1.htm',
  'p2-d2-r2': 'kkkII-2-2.htm',
  'p2-d2-r3': 'kkkII-2-3.htm',
  'p2-d2-r4': 'kkkII-2-4.htm',
  // Part 3
  'p3-wst': 'kkkIII-wst.htm',
  'p3-d1-wst': 'kkkIII-1wst.htm',
  'p3-d1-r1': 'kkkIII-1-1.htm',
  'p3-d1-r2': 'kkkIII-1-2.htm',
  'p3-d1-r3': 'kkkIII-1-3.htm',
  'p3-d2-wst': 'kkkIII-2wst.htm',
  'p3-d2-r1': 'kkkIII-2-1.htm',
  'p3-d2-r2': 'kkkIII-2-2.htm',
  // Part 4
  'p4-d1-wst': 'kkkIV-wst.htm',
  'p4-d1-r1': 'kkkIV-1-1.htm',
  'p4-d1-r2': 'kkkIV-1-2.htm',
  'p4-d1-r3': 'kkkIV-1-3.htm',
  'p4-d2': 'kkkIV-2.htm',
};

async function fetchAndParse(id, filename) {
  try {
    const url = `${BASE}/${filename}`;
    console.log(`Fetching: ${id} from ${filename}...`);

    const res = await fetch(url, { timeout: 10000 });
    if (!res.ok) { console.warn(`  ⚠ HTTP ${res.status}`); return null; }

    const buffer = await res.arrayBuffer();
    // Properly decode ISO-8859-2 (Central/Eastern European) to UTF-8
    const html = iconv.decode(Buffer.from(buffer), 'ISO-8859-2');

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Remove script, style, and navigation elements
    doc.querySelectorAll('script, style, nav, [role="navigation"]').forEach(el => el.remove());

    // Extract paragraphs, divs with content
    const paragraphs = Array.from(doc.querySelectorAll('p, div'))
      .map(el => el.textContent?.trim())
      .filter(text => text && text.length > 20); // Filter out tiny fragments

    if (paragraphs.length === 0) {
      // Fallback: use all body text
      const bodyText = doc.body?.textContent || '';
      const lines = bodyText
        .split(/[\n\r]+/)
        .map(l => l.trim())
        .filter(l => l.length > 20);
      if (lines.length > 0) return lines.join('\n\n');
      return null;
    }

    return paragraphs.join('\n\n');
  } catch (err) {
    console.warn(`  ✗ Error: ${err.message}`);
    return null;
  }
}

async function scrapeAll() {
  const content = {};
  let count = 0;

  for (const [id, file] of Object.entries(SECTIONS)) {
    const text = await fetchAndParse(id, file);
    if (text) {
      content[id] = text;
      count++;
    }
    // Polite throttle
    await new Promise(r => setTimeout(r, 500));
  }

  const outPath = path.join(__dirname, 'content-raw.json');
  fs.writeFileSync(outPath, JSON.stringify(content, null, 2));
  console.log(`\n✓ Scraped ${count}/${Object.keys(SECTIONS).length} sections`);
  console.log(`Saved to: ${outPath}`);
}

scrapeAll().catch(console.error);
