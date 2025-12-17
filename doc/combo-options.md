# CSS GPS - Combo Options

These are the building blocks that can be combined to create CSS class names.

---

## Option 1: Project Prefix (Pre-text)

A custom text that applies to the entire project.

| Property | Value |
|----------|-------|
| **Max Length** | 50 characters |
| **Format** | User-defined string |
| **Scope** | Entire project |

### Examples

```
PROJECT-SAMPLE
CRM-ADMIN
my-app
ACME_CORP
frontend-v2
```

### Usage

```html
<div class="PROJECT-SAMPLE-...">
```

---

## Option 2: File Path MD5

MD5 hash of the file's relative path from workspace root.

| Property | Value |
|----------|-------|
| **Input** | Relative file path |
| **Output** | 32-character hex string (can be truncated) |
| **Deterministic** | Yes - same path always gives same hash |

### Examples

| Relative Path | MD5 Hash | Truncated (8 chars) |
|---------------|----------|---------------------|
| `src/components/Button.html` | `a3f2b9c1e4d7...` | `a3f2b9c1` |
| `templates/admin/users.tpl` | `7e4d2f8a1b5c...` | `7e4d2f8a` |
| `views/dashboard.phtml` | `c9b1e3f2d4a6...` | `c9b1e3f2` |

### Usage

```html
<div class="...-a3f2b9c1">
```

---

## Option 3: Reversed File Name

File name (without extension) reversed.

| Property | Value |
|----------|-------|
| **Input** | File name without extension |
| **Output** | Characters in reverse order |
| **Case** | Preserves original case (can be normalized) |

### Examples

| File Name | Without Extension | Reversed |
|-----------|-------------------|----------|
| `utility_bill.tpl` | `utility_bill` | `llib_ytilitu` |
| `dashboard.html` | `dashboard` | `draobhsad` |
| `UserProfile.phtml` | `UserProfile` | `eliforPresu` |
| `index.html` | `index` | `xedni` |

### Usage

```html
<div class="...-llib_ytilitu">
```

---

## Option 4: DOM Position Hash

MD5 hash of the element's position in the DOM hierarchy (ancestor chain).

| Property | Value |
|----------|-------|
| **Input** | Ancestor tag chain (e.g., `body>div>section>header>span`) |
| **Output** | 32-character hex string (can be truncated) |
| **Stability** | Stable until element is moved in DOM |

### How It Works

```html
<body>
    <div>                          <!-- depth 1 -->
        <section>                  <!-- depth 2 -->
            <header>               <!-- depth 3 -->
                <span>Hello</span> <!-- depth 4 - TARGET -->
            </header>
        </section>
    </div>
</body>
```

**DOM Path:** `body>div>section>header>span`  
**MD5 Hash:** `e7c3a1b9f2d4...`  
**Truncated:** `e7c3a1b9`

### Examples

| DOM Path | MD5 Hash (8 chars) |
|----------|-------------------|
| `body>div>span` | `f1a2b3c4` |
| `body>div>section>header>span` | `e7c3a1b9` |
| `body>main>article>p` | `d5e6f7a8` |
| `body>div>div>div>button` | `b9c1d2e3` |

### Stability

| Action | Hash Changes? |
|--------|---------------|
| Edit text inside element | ❌ No |
| Add/remove attributes | ❌ No |
| Move element to different parent | ✅ Yes |
| Wrap element in new container | ✅ Yes |
| Add sibling elements | ❌ No |

### Usage

```html
<span class="...-e7c3a1b9">Hello</span>
```

---

## Option 5: Abbreviated DOM Position

Human-readable DOM path using first 3 characters of each ancestor tag name.

| Property | Value |
|----------|-------|
| **Input** | Ancestor tag chain |
| **Output** | Abbreviated tags joined by hyphens |
| **Max Chars** | 3 per segment |
| **Case** | Lowercase |

### How It Works

```html
<body>
    <div>
        <section>
            <header>
                <span>Hello</span>  <!-- TARGET -->
            </header>
        </section>
    </div>
</body>
```

**DOM Path:** `div > section > header > span`  
**Abbreviated:** `div-sec-hea-spa`

### Examples

| DOM Path | Abbreviated (3 chars each) |
|----------|---------------------------|
| `div > span` | `div-spa` |
| `div > section > header > span` | `div-sec-hea-spa` |
| `main > article > paragraph` | `mai-art-par` |
| `div > div > div > button` | `div-div-div-but` |
| `nav > ul > li > a` | `nav-ul-li-a` |

### Excluded Tags

These generic tags are excluded from the path:
- `html`, `head`, `body`, `script`, `style`

### Usage

```html
<span class="...-div-sec-hea-spa">Hello</span>
```

---

## Option 6: Abbreviated File Path

Human-readable file path using first 3 characters of each folder/file name.

| Property | Value |
|----------|-------|
| **Input** | Relative file path from workspace |
| **Output** | Abbreviated segments joined by hyphens |
| **Max Chars** | 3 per segment |
| **Case** | Lowercase |

### How It Works

```
File: Interfaces/Templates/ClientAdmin/utilities/utility_bill.tpl

Segments: Interfaces, Templates, ClientAdmin, utilities, utility_bill
Abbreviated: int-tem-cli-uti-uti
```

### Examples

| File Path | Abbreviated (3 chars each) |
|-----------|---------------------------|
| `src/components/Button.html` | `src-com-but` |
| `templates/admin/users.tpl` | `tem-adm-use` |
| `views/dashboard/main.phtml` | `vie-das-mai` |
| `Interfaces/Templates/ClientAdmin/utilities/utility_bill.tpl` | `int-tem-cli-uti-uti` |

### Path Processing

- Starts from workspace-relative path
- Skips common root folders (`www`, `htdocs`, `public_html`)
- Includes filename (without extension)
- All lowercase

### Usage

```html
<div class="...-int-tem-cli-uti-uti">
```

---

## Option 7: Release Name/Number

A versioned identifier tied to release schedules with automatic expiry.

| Property | Value |
|----------|-------|
| **Input** | User-defined release names with expiry dates |
| **Output** | Current active release name |
| **Expiry** | UTC date-based, auto-removes when expired |
| **Default** | Required, never expires (NA) |

### How It Works

1. User defines multiple releases with future expiry dates
2. Extension uses the **earliest non-expired** release
3. Once a release expires (current date > expiry), it auto-removes
4. Falls back to **default** when no active releases remain

### Configuration

```json
{
  "cssGps.releases": [
    {
      "name": "release-1",
      "expiry": "2026-01-31"
    },
    {
      "name": "release-2", 
      "expiry": "2026-03-31"
    },
    {
      "name": "release-3",
      "expiry": "2026-06-30"
    }
  ],
  "cssGps.defaultRelease": "stable"
}
```

### Timeline Example

```
Today: 2025-12-17

Releases:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ release-1   │ release-2   │ release-3   │   stable    │
│ → 31 Jan 26 │ → 31 Mar 26 │ → 30 Jun 26 │  (default)  │
└─────────────┴─────────────┴─────────────┴─────────────┘
     ↑
   ACTIVE (earliest non-expired)
```

### Selection Logic

| Current Date | Active Release | Reason |
|--------------|----------------|--------|
| 2025-12-17 | `release-1` | Earliest non-expired |
| 2026-02-15 | `release-2` | release-1 expired |
| 2026-04-10 | `release-3` | release-1,2 expired |
| 2026-07-01 | `stable` | All releases expired, using default |

### Validation Rules

| Rule | Description |
|------|-------------|
| **No Overlapping** | Each date must be unique |
| **Future Dates Only** | Expiry must be in the future when adding |
| **Default Required** | Must have a default release (never expires) |
| **UTC Timezone** | All dates compared in UTC |

### Auto-Cleanup

When extension activates or file is saved:
1. Check all release expiry dates against current UTC date
2. Remove expired releases from active list
3. Notify user of expired releases (optional)

### Examples

| Release Config | Output |
|----------------|--------|
| `release-1` (active) | `release-1` |
| `v2.5-beta` (active) | `v2.5-beta` |
| `sprint-42` (active) | `sprint-42` |
| All expired → default | `stable` |

### Usage

```html
<div class="...-release-1-...">
<!-- After Jan 31, 2026 -->
<div class="...-release-2-...">
<!-- After all expire -->
<div class="...-stable-...">
```

### UI for Managing Releases

```
┌─────────────────────────────────────────────────┐
│  Release Management                             │
├─────────────────────────────────────────────────┤
│  ● release-1     31 Jan 2026    [Edit] [Delete] │
│  ○ release-2     31 Mar 2026    [Edit] [Delete] │
│  ○ release-3     30 Jun 2026    [Edit] [Delete] │
├─────────────────────────────────────────────────┤
│  Default: stable                    [Edit]      │
├─────────────────────────────────────────────────┤
│  [+ Add Release]                                │
└─────────────────────────────────────────────────┘
● = Currently Active
```

---

## Combination Examples

| Combo | Pattern | Result |
|-------|---------|--------|
| 1 + 5 | `{prefix}--{domAbbr}` | `PROJECT-SAMPLE--div-sec-hea-spa` |
| 1 + 6 | `{prefix}--{pathAbbr}` | `PROJECT-SAMPLE--int-tem-cli-uti` |
| 5 + 6 | `{pathAbbr}--{domAbbr}` | `int-tem-cli-uti--div-sec-hea-spa` |
| 1 + 7 | `{prefix}-{release}` | `PROJECT-SAMPLE-release-1` |
| 7 + 5 | `{release}--{domAbbr}` | `release-1--div-sec-hea-spa` |
| 7 + 6 | `{release}--{pathAbbr}` | `release-1--int-tem-cli-uti` |
| 1 + 7 + 6 + 5 | `{prefix}-{release}--{pathAbbr}--{domAbbr}` | `PROJECT-SAMPLE-release-1--int-tem-cli--div-sec-hea-spa` |
| 2 + 4 | `{pathMd5:8}-{domMd5:8}` | `a3f2b9c1-e7c3a1b9` |
| 7 + 2 + 4 | `{release}-{pathMd5:8}-{domMd5:8}` | `release-1-a3f2b9c1-e7c3a1b9` |

---

## Configuration

```json
{
  "cssGps.projectPrefix": "PROJECT-SAMPLE",
  "cssGps.pathMd5Length": 8,
  "cssGps.domMd5Length": 8,
  "cssGps.abbrLength": 3,
  "cssGps.reversedNameCase": "lowercase",
  "cssGps.releases": [
    { "name": "release-1", "expiry": "2026-01-31" },
    { "name": "release-2", "expiry": "2026-03-31" }
  ],
  "cssGps.defaultRelease": "stable"
}
```

---

## Summary

| # | Option | Input | Output Example | Stable? |
|---|--------|-------|----------------|---------|
| 1 | Project Prefix | User-defined | `PROJECT-SAMPLE` | ✅ Always |
| 2 | File Path MD5 | Relative path | `a3f2b9c1` | ✅ Until file moved |
| 3 | Reversed File Name | File name | `llib_ytilitu` | ✅ Until renamed |
| 4 | DOM Position Hash | Ancestor chain | `e7c3a1b9` | ✅ Until DOM changes |
| 5 | Abbreviated DOM Position | Ancestor chain | `div-sec-hea-spa` | ✅ Until DOM changes |
| 6 | Abbreviated File Path | Relative path | `int-tem-cli-uti` | ✅ Until file moved |
| 7 | Release Name | Scheduled releases | `release-1` | ⏱️ Until expiry date |

