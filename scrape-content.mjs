/**
 * Web Scraper: Polish Catechism Content Extraction
 *
 * Fetches the full Polish Catholic Catechism (*Katechismus Catholicae Ecclesiae*)
 * from opoka.org.pl and extracts text content from 50+ sections. Handles character
 * encoding conversion (ISO-8859-2 to UTF-8) and saves the raw content to JSON.
 *
 * Input: Web pages at http://www.katechizm.opoka.org.pl/[filename]
 * Output: content-raw.json (raw HTML-extracted text)
 *
 * Dependencies:
 * - node-fetch: HTTP requests
 * - jsdom: HTML parsing and DOM traversal
 * - iconv-lite: ISO-8859-2 → UTF-8 character encoding
 *
 * Run: node scrape-content.mjs
 */

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

    // Extract leaf-level text nodes only (skip parent containers to avoid duplication)
    const paragraphs = Array.from(doc.querySelectorAll('p, div'))
      .filter(el => !el.querySelector('p, div')) // only elements with no p/div children
      .map(el => el.innerHTML?.trim() || '')
      .filter(text => text && text.length > 20);

    if (paragraphs.length === 0) {
      // Fallback: use all body text
      const bodyText = doc.body?.textContent || '';
      const lines = bodyText
        .split(/[\n\r]+/)
        .map(l => l.trim())
        .filter(l => l.length > 20);
      if (lines.length > 0) {
        return { text: lines.join('\n\n'), footnotes: {} };
      }
      return null;
    }

    // Combine HTML content into one string
    let combinedHtml = paragraphs.join('\n\n');

    // Extract footnotes from HTML and replace with markers
    const footnotes = {};
    const footnoteLinkPattern = /<a\s+href="([^"]+)"\s+target="[^"]*"><sup>(?:<font[^>]*>)?<b>(\d+)<\/b>(?:<\/font>)?<\/sup><\/a>/gi;

    let footnoteFilename = null;
    combinedHtml = combinedHtml.replace(footnoteLinkPattern, (match, href, num) => {
      // Extract footnotes filename from first match (e.g., "články-1-1.htm" from "články-1-1.htm#18")
      if (!footnoteFilename) {
        const fileMatch = href.match(/^([^#]+)\.htm/i);
        if (fileMatch) {
          footnoteFilename = fileMatch[1] + '.htm';
        }
      }
      // Replace footnote link with marker
      return `[[FN:${num}]]`;
    });

    // Try to fetch and parse footnotes if we found any
    if (footnoteFilename) {
      await extractFootnotes(footnoteFilename, footnotes);
    }

    // Convert HTML to plain text
    const tempDom = new JSDOM(combinedHtml);
    const plainText = tempDom.window.document.body?.textContent || combinedHtml;

    return { text: plainText, footnotes };
  } catch (err) {
    console.warn(`  ✗ Error: ${err.message}`);
    return null;
  }
}

async function extractFootnotes(filename, footnotes) {
  try {
    const url = `${BASE}/${filename}`;
    console.log(`  → Fetching footnotes from ${filename}...`);

    const res = await fetch(url, { timeout: 10000 });
    if (!res.ok) {
      console.warn(`    ⚠ Footnotes HTTP ${res.status}`);
      return;
    }

    const buffer = await res.arrayBuffer();
    const html = iconv.decode(Buffer.from(buffer), 'ISO-8859-2');

    // Regex-based parsing: match patterns like:
    // <a name="..."></a>...<b>N</b>...citation text...<br>
    const footnotePattern = /<a\s+name="[^"]*"><\/a>[\s\S]*?<b>(\d+)<\/b>([\s\S]*?)<br>/gi;
    let match;

    while ((match = footnotePattern.exec(html)) !== null) {
      const num = match[1];
      let text = match[2];

      // Clean up the text: remove HTML tags, decode entities, trim whitespace
      text = text
        .replace(/<[^>]*>/g, '') // remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim()
        .replace(/\s+/g, ' '); // normalize whitespace

      if (text) {
        footnotes[num] = text;
      }
    }

    if (Object.keys(footnotes).length > 0) {
      console.log(`    ✓ Found ${Object.keys(footnotes).length} footnotes`);
    }
  } catch (err) {
    console.warn(`    ✗ Footnotes error: ${err.message}`);
  }
}

async function scrapeAll() {
  const content = {};
  let count = 0;
  let footnoteCount = 0;

  for (const [id, file] of Object.entries(SECTIONS)) {
    const result = await fetchAndParse(id, file);
    if (result) {
      content[id] = result;
      count++;
      footnoteCount += Object.keys(result.footnotes || {}).length;
    }
    // Polite throttle
    await new Promise(r => setTimeout(r, 500));
  }

  const outPath = path.join(__dirname, 'content-raw.json');
  fs.writeFileSync(outPath, JSON.stringify(content, null, 2));
  console.log(`\n✓ Scraped ${count}/${Object.keys(SECTIONS).length} sections`);
  console.log(`  Total footnotes found: ${footnoteCount}`);
  console.log(`Saved to: ${outPath}`);
}

scrapeAll().catch(console.error);
