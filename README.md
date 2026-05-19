# Katechizm — Polish Catholic Catechism Web App

A responsive, elegant web application displaying the complete Polish Catholic Catechism (*Katechism Kościoła Katolickiego*) with full-text search, sidebar navigation, and mobile support. The app features a sophisticated parchment-and-gold design inspired by traditional Catholic liturgical documents.

## Quick Start

```bash
# Install dependencies
npm install

# Start the local development server
node serve.mjs

# Open in browser
# http://localhost:3000
```

The app will load with full catechism content and be ready for navigation.

## Project Structure

```
katechizm/
├── index.html                 # Main single-page application (frontend)
├── content.json               # Rendered catechism content (output)
├── content-raw.json           # Raw scraped content (intermediate)
├── serve.mjs                  # Local development server
├── scrape-content.mjs         # Web scraper (fetches from opoka.org.pl)
├── process-content.mjs        # Content processor (cleans and organizes)
├── screenshot.mjs             # Puppeteer-based screenshot tool
├── package.json               # Dependencies (iconv-lite, jsdom, node-fetch, etc.)
└── .claude/                   # Claude Code configuration
```

## Content Pipeline

The catechism content follows a three-stage ETL (Extract, Transform, Load) pipeline:

### 1. **Scrape** (`scrape-content.mjs`)
- Fetches the full Polish Catechism from [opoka.org.pl](http://www.katechizm.opoka.org.pl)
- Handles ISO-8859-2 (Latin2) character encoding → UTF-8 conversion via `iconv-lite`
- Extracts structured content from 50+ catechism sections
- **Output:** `content-raw.json` (raw HTML text)

### 2. **Process** (`process-content.mjs`)
- Parses and organizes raw content
- Attaches metadata (section titles, parts, subtitles)
- Groups content by catechism structure:
  - **Preliminary Documents:** Fidei Depositum, Introduction
  - **Part 1:** Profession of Faith (Wyznanie Wiary)
  - **Part 2:** Celebration of the Christian Mystery (Celebracja Misterium)
  - **Part 3:** Life in Christ (Życie w Chrystusie)
  - **Part 4:** Christian Prayer (Modlitwa Chrześcijańska)
- **Output:** `content.json` (processed, structured data)

### 3. **Display** (`index.html` + `serve.mjs`)
- Single-page application loads `content.json`
- Renders formatted sections with paragraph numbers, navigation, and breadcrumbs
- Server delivers with proper MIME types and security headers
- Fallback content included for graceful degradation

## Features

- **Complete Polish Catechism** — Full text of all 2,865 paragraphs
- **Sidebar Navigation** — Hierarchical table of contents with collapsible sections
- **Full-Text Search** — Find any paragraph by content (built-in)
- **Responsive Design** — Mobile-first, adapts from 320px to 4K+ displays
- **Elegant Styling** — Parchment background, gold accents, serif typography (Cinzel + EB Garamond)
- **Accessibility** — ARIA labels, semantic HTML, keyboard navigation
- **Error Handling** — Fallback content if JSON fails to load
- **Fast Loading** — CSS + inline styles, no external dependencies except fonts

## Security

The application implements several security measures to prevent common web vulnerabilities:

- **CSP Headers** — Content Security Policy headers prevent inline script injections
- **Path Traversal Validation** — Server validates all file paths to prevent directory traversal attacks
- **HTML Entity Escaping** — User input and dynamic content are properly escaped to prevent XSS
- **HTTPS Ready** — Application is designed to work securely over HTTPS in production

For detailed security information, see the dependency analysis in `deps-security.md` (if present).

## Development

### Setup & Running

```bash
# Clone or enter the repository
cd katechizm

# Install dependencies
npm install

# Start development server
node serve.mjs

# Open http://localhost:3000
```

### Branch Naming

When contributing, follow these branch naming conventions:

- `feature/...` — New features (e.g., `feature/search-improvements`)
- `fix/...` — Bug fixes (e.g., `fix/mobile-layout`)
- `security-fixes/...` — Security patches (e.g., `security-fixes/xss-prevention`)
- `error-handling/...` — Error handling improvements (e.g., `error-handling/json-load-fallback`)
- `docs/...` — Documentation updates (e.g., `docs/api-reference`)

### Testing

Before submitting a pull request:

1. **Browser Check**
   - Test on Chrome/Firefox (desktop)
   - Test on Safari/Chrome (mobile)
   - Check sidebar navigation works on all screen sizes
   - Verify table of contents expands/collapses correctly

2. **Content Verification**
   - Verify all four parts load correctly
   - Check paragraph numbering is correct
   - Ensure navigation buttons work (prev/next)

3. **Performance**
   - Page should load in < 1 second on localhost
   - Sidebar collapse/expand should animate smoothly
   - No console errors

### File Roles

| File | Purpose |
|------|---------|
| `index.html` | Core SPA with all UI, CSS, and page logic |
| `content.json` | Master content file (auto-generated by `process-content.mjs`) |
| `content-raw.json` | Intermediate scraping output (auto-generated) |
| `serve.mjs` | Simple Node.js HTTP server for local dev |
| `scrape-content.mjs` | One-off scraper (run: `node scrape-content.mjs`) |
| `process-content.mjs` | Content processor (run: `node process-content.mjs`) |
| `screenshot.mjs` | Automation tool for PNG screenshots |

## License

This project displays the Polish Catholic Catechism from [opoka.org.pl](http://opoka.org.pl), originally published by Pallottinum (Poznań, 1994). The catechism text is in the public domain for non-commercial use.

The web application code is provided as-is for educational and devotional purposes. For questions about licensing and usage, consult the original publisher.

---

**Built with:** HTML5, CSS3 (Tailwind via CDN), vanilla JavaScript (no frameworks)  
**Data source:** [opoka.org.pl](http://www.katechizm.opoka.org.pl)  
**Created:** 2026
