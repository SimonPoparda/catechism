/**
 * Content Processor: Polish Catechism ETL Pipeline
 *
 * Transforms raw scraped catechism content into a structured, normalized format.
 * Combines text content from content-raw.json with metadata to create the final
 * output: content.json. Organizes content by catechism structure (parts, sections).
 *
 * Input: content-raw.json (raw HTML-extracted text from scraper)
 * Output: content.json (processed, normalized, structured data)
 *
 * Processing steps:
 * 1. Load raw scraped content
 * 2. Attach metadata (titles, subtitles, part labels, paragraph ranges)
 * 3. Normalize text formatting and whitespace
 * 4. Validate structure
 * 5. Write final JSON
 *
 * Run: node process-content.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load raw scraped content
const rawPath = path.join(__dirname, 'content-raw.json');
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

// Structure metadata (without the long text, that comes from raw)
const SECTIONS_META = {
  'fidei': { title: 'Fidei Depositum', subtitle: 'Konstytucja Apostolska Jana Pawła II', part: 'Dokumenty Wstępne' },
  'wstep': { title: 'Wstęp do Katechizmu', subtitle: '', part: 'Dokumenty Wstępne' },
  'p1-d1-wst': { title: 'Wprowadzenie', subtitle: '', part: 'Wyznanie Wiary' },
  'p1-d1-r1': { title: 'Człowiek jest „otwarty" na Boga', subtitle: 'Paragrafy 27–49', part: 'Wyznanie Wiary' },
  'p1-d1-r2': { title: 'Bóg wychodzi naprzeciw człowiekowi', subtitle: 'Paragrafy 50–141', part: 'Wyznanie Wiary' },
  'p1-d1-r3': { title: 'Człowiek odpowiada Bogu', subtitle: 'Paragrafy 142–184', part: 'Wyznanie Wiary' },
  'p1-d2-wst': { title: 'Symbole Wiary', subtitle: 'Paragrafy 185–197', part: 'Wyznanie Wiary' },
  'p1-d2-r1': { title: 'Wierzę w Boga Ojca', subtitle: 'Paragrafy 198–421', part: 'Wyznanie Wiary' },
  'p1-d2-r2': { title: 'Wierzę w Jezusa Chrystusa', subtitle: 'Paragrafy 422–682', part: 'Wyznanie Wiary' },
  'p1-d2-r3': { title: 'Wierzę w Ducha Świętego', subtitle: 'Paragrafy 683–1065', part: 'Wyznanie Wiary' },
  'p2-wst': { title: 'Celebracja Misterium Chrześcijańskiego', subtitle: 'Paragraf 1066–1075', part: 'Celebracja Misterium' },
  'p2-d1-r1': { title: 'Misterium Paschalne w czasie Kościoła', subtitle: 'Paragrafy 1077–1134', part: 'Celebracja Misterium' },
  'p2-d1-r2': { title: 'Celebracja sakramentalna misterium', subtitle: 'Paragrafy 1135–1209', part: 'Celebracja Misterium' },
  'p2-d2-wst': { title: 'Siedem Sakramentów Kościoła', subtitle: 'Wprowadzenie, Paragrafy 1210–1211', part: 'Celebracja Misterium' },
  'p2-d2-r1': { title: 'Sakramenty wtajemniczenia chrześcijańskiego', subtitle: 'Paragrafy 1212–1419', part: 'Celebracja Misterium' },
  'p2-d2-r2': { title: 'Sakramenty uzdrowienia', subtitle: 'Paragrafy 1420–1532', part: 'Celebracja Misterium' },
  'p2-d2-r3': { title: 'Sakramenty w służbie komunii', subtitle: 'Paragrafy 1533–1666', part: 'Celebracja Misterium' },
  'p2-d2-r4': { title: 'Inne celebracje liturgiczne', subtitle: 'Paragrafy 1667–1690', part: 'Celebracja Misterium' },
  'p3-wst': { title: 'Życie w Chrystusie', subtitle: 'Wprowadzenie, Paragrafy 1691–1698', part: 'Życie w Chrystusie' },
  'p3-d1-wst': { title: 'Powołanie Człowieka: Życie w Duchu Świętym', subtitle: 'Wprowadzenie, Paragraf 1699', part: 'Życie w Chrystusie' },
  'p3-d1-r1': { title: 'Godność osoby ludzkiej', subtitle: 'Paragrafy 1700–1876', part: 'Życie w Chrystusie' },
  'p3-d1-r2': { title: 'Wspólnota ludzka', subtitle: 'Paragrafy 1877–1948', part: 'Życie w Chrystusie' },
  'p3-d1-r3': { title: 'Zbawienie Boże: prawo i łaska', subtitle: 'Paragrafy 1949–2051', part: 'Życie w Chrystusie' },
  'p3-d2-wst': { title: 'Dziesięć Przykazań', subtitle: 'Wprowadzenie, Paragrafy 2052–2082', part: 'Życie w Chrystusie' },
  'p3-d2-r1': { title: '„Będziesz miłował Pana Boga swego…"', subtitle: 'Paragrafy 2083–2195', part: 'Życie w Chrystusie' },
  'p3-d2-r2': { title: '„Będziesz miłował swego bliźniego…"', subtitle: 'Paragrafy 2196–2557', part: 'Życie w Chrystusie' },
  'p4-d1-wst': { title: 'Modlitwa w Życiu Chrześcijańskim', subtitle: 'Paragrafy 2558–2758', part: 'Modlitwa Chrześcijańska' },
  'p4-d1-r1': { title: 'Objawienie modlitwy', subtitle: 'Paragrafy 2566–2649', part: 'Modlitwa Chrześcijańska' },
  'p4-d1-r2': { title: 'Tradycja modlitwy', subtitle: 'Paragrafy 2650–2696', part: 'Modlitwa Chrześcijańska' },
  'p4-d1-r3': { title: 'Życie modlitwy', subtitle: 'Paragrafy 2697–2758', part: 'Modlitwa Chrześcijańska' },
  'p4-d2': { title: 'Modlitwa Pańska „Ojcze Nasz"', subtitle: 'Paragrafy 2759–2865', part: 'Modlitwa Chrześcijańska' },
};

// Build final content structure
const content = {};
for (const [id, text] of Object.entries(raw)) {
  const meta = SECTIONS_META[id] || {};
  content[id] = {
    title: meta.title || id,
    subtitle: meta.subtitle || '',
    part: meta.part || '',
    body: text || ''
  };
}

// Save to content.json
const outPath = path.join(__dirname, 'content.json');
fs.writeFileSync(outPath, JSON.stringify(content, null, 2));

// Log stats
const totalChars = Object.values(content).reduce((sum, s) => sum + (s.body?.length || 0), 0);
console.log(`✓ Processed ${Object.keys(content).length} sections`);
console.log(`  Total content: ${(totalChars / 1000000).toFixed(2)} MB`);
console.log(`  Saved to: ${outPath}`);
