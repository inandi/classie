# Release v2.1.1 - 2026-04-07

## New Features
- Release workflow now supports publishing to both Visual Studio Marketplace and Open VSX Registry in the same run.

## Improvements
- Added release pre-checks to ensure the release argument matches the package manifest version before continuing.
- Improved publishing-token handling and error flow so skipped/failed marketplace steps are reported clearly.
- Marked the extension package as preview in manifest metadata.

---

# Release v1.1.4 - 2026-03-01

## Improvements
- Bumped version to 1.1.3 and updated author URL in package.json.
---

# Release v1.1.2 - 2026-02-25

## Improvements
- Enhanced README with detailed usage instructions (getting started, preset rules, seven options, managing rules, team consistency).
- Added logo image for the extension (`media/logo.png`).
- Cleaned up release notes (removed trailing whitespace).

---

# Release v1.1.1 - 2026-02-25

## New Features
- Beta release: Generate and apply CSS class names to HTML elements from the editor context menu (`.html`, `.tpl`, `.phtml`).
- Preset rules: Rule Alpha (prefix + path abbr + path hash), Rule Beta (prefix + DOM abbr + DOM hash), Rule Gamma (prefix + reversed file name).
- Custom rules: Combine any of the 7 options with a chosen separator via **Manage Rules**.
- Configuration panel: Options (7), preset rules, custom rules, and release schedule with expiry dates.

## Improvements
- File-level JSDoc comments added across the codebase (version 1.1.1, author/since/copyright).

---
