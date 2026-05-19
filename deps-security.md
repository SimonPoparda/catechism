# Dependency Security and Audit

## Overview
This document tracks direct dependencies, their purpose, known security issues, and mitigation strategies. All dependencies are audited regularly with `npm audit` and pinned to stable versions.

## Direct Dependencies

### iconv-lite@0.7.2
- **Purpose:** Character encoding conversion for scraping Polish text (ISO-8859-2 to UTF-8)
- **Used in:** `scrape-content.mjs` only
- **Security Status:** Known historical encoding-related CVEs, but mitigated because:
  - Only used in offline scraping tool (not production server)
  - Never processes untrusted input directly
  - Output is stored locally in JSON
- **Recommendation:** Monitor for updates; consider native Node.js TextDecoder if encoding support expands
- **Latest:** 0.7.2 (stable)

### jsdom@29.1.1
- **Purpose:** DOM parsing and manipulation for HTML scraping
- **Used in:** `scrape-content.mjs` for parsing remote HTML
- **Security Status:** Actively maintained; large complex library with some historical CVEs
- **Mitigation:**
  - Only processes remote content from trusted source (opoka.org.pl)
  - Never executes JavaScript
  - All parsed content goes to local storage
- **Recommendation:** Keep updated to latest patch version; review JSDOM security advisories quarterly
- **Latest:** 29.1.1 (stable)

### node-fetch@3.3.2
- **Purpose:** HTTP client for scraping remote content
- **Used in:** `scrape-content.mjs` for fetching HTML pages
- **Security Status:** Actively maintained; v3 is the stable production version
- **Note:** v4 is currently in beta only; once stable, consider upgrade
- **Mitigation:**
  - Uses timeout (10s) to prevent hanging connections
  - HTTPS preferred for any authenticated requests
- **Recommendation:** Monitor v4 releases; upgrade when stable
- **Latest:** 3.3.2 (stable), 4.0.0-beta.4 (experimental)

### playwright-core@1.60.0
- **Purpose:** Browser automation for screenshot functionality
- **Used in:** `screenshot.mjs` for rendering pages to PNG
- **Security Status:** Actively maintained; pinned to specific stable version
- **Mitigation:**
  - Runs locally, never executes untrusted code
  - Uses system Chrome installation
  - Output is local PNG files
- **Version Policy:** Pinned (not caret) to prevent prerelease versions
- **Recommendation:** Check for updates quarterly; test new versions before pinning
- **Latest:** 1.60.0 (stable)

## Removed Dependencies

### puppeteer@25.0.4
- **Status:** Removed (unused)
- **Reason:** Project uses `playwright-core` for screenshots; maintaining both is redundant
- **Migration:** No changes needed - code already uses playwright-core exclusively
- **Savings:** ~45 MB from node_modules

## Security Audit Results

**Current Status:** No known vulnerabilities detected

```
npm audit results: 0 vulnerabilities found
Last audit: 2026-05-19
```

## Maintenance Schedule

- **Monthly:** Run `npm audit` and check for patches
- **Quarterly:** Review JSDOM and node-fetch security advisories
- **Bi-annually:** Evaluate major version updates for each dependency
- **Upon deployment:** Run full `npm install` and `npm audit` before production builds

## Running Security Checks

```bash
# Full audit
npm audit

# Audit with detailed fixes
npm audit --detailed

# Check for outdated packages
npm outdated

# List all dependencies
npm list --depth=0
```

## Notes on Encoding and Legacy Support

The project uses ISO-8859-2 character encoding (Central/Eastern European) for scraping Polish text. This is a legacy encoding specific to the source website (opoka.org.pl). While modern Node.js could potentially use TextDecoder, iconv-lite provides reliable conversion and is only used in the offline scraping tool.

## Production Build

The production server (`serve.mjs`) has **zero dependencies**—it uses only Node.js built-in modules (http, fs, path). Security exposure is minimal for the served application itself.

## Future Improvements

1. **Replace iconv-lite:** When scraping is fully stabilized, investigate native TextDecoder for ISO-8859-2 support
2. **Consider bundling:** For minimal deployment, consider bundling scraping tools separately from production server
3. **SBOM:** Generate Software Bill of Materials for compliance/audit purposes
4. **Dependency pinning:** Consider lock file verification for production builds
