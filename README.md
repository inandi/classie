# CSS GPS

A VS Code extension that standardizes CSS naming by automatically generating and inserting highly descriptive, hierarchical class names based on both the element's DOM structure and the file's location within the project.

## Features

- **Context Menu Integration**: Right-click on any HTML element to access the plugin
- **Intelligent Path Generation**: Creates `css-gps--file-path` attributes from file/folder paths
- **DOM-Based Class Names**: Generates class names based on element's position in the DOM hierarchy
- **Custom Rules**: Create and manage your own naming rules (global or project-specific)
- **Supported File Types**: `.html`, `.tpl`, `.phtml`

## Installation

### From Source

1. Clone or download this extension to your local machine
2. Open terminal in the extension directory
3. Run:
   ```bash
   npm install
   npm run compile
   ```
4. Press `F5` in VS Code to launch Extension Development Host, OR
5. Package and install:
   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```
   Then install the generated `.vsix` file via Extensions > Install from VSIX

## Usage

1. Open a supported file (`.html`, `.tpl`, or `.phtml`)
2. Place your cursor on or inside an HTML element's opening tag
3. Right-click to open the context menu
4. Select **CSS GPS** → **Rule 1: Consolidated Path Naming**

## Rule 1: Consolidated Path Naming

This rule generates and inserts two components onto the selected element:

### A. `css-gps--file-path` Attribute (File/Folder Path)

**Purpose**: Provides a unique, project-wide identifier for the element's location.

**Generation Logic**:
- Source: The file's directory path and base filename
- Parsing: Extracts the **first 3 characters** of every folder name and the base filename
- All characters converted to **lowercase**
- Segments separated by hyphens (`-`)

### B. Class Name (Filename + DOM Path)

**Purpose**: Provides a highly scoped identifier based on filename and element's structural position.

**Generation Logic**:
- **Filename prefix**: First 3 characters of filename (without extension), lowercase
- **DOM path**: Tag names of all ancestor elements (up to `<body>`)
- Parsing: Extracts the **first 3 characters** of each ancestor tag name
- All characters converted to **lowercase**
- Filename and DOM path separated by double hyphens (`--`)
- DOM segments separated by single hyphens (`-`)
- Format: `uti--div-div-sec-hea-div-spa`

## Example

### File Path
```
Interfaces/Templates/ClientAdmin/utilities/utility_bills/associate_utility_bill/utility_bill_association_escalation.tpl
```

### Original HTML
```html
<div class="utility-bill-association-escalation custom-escalation-accordion-div">
    <div class="mrdn-wrapper accordion-container">
        <section class="mrdn-box mrdn-accordian custom-light-gray open">
            <header class="mrdn-box-header">
                <div class="mrdn-box-header__block">
                    <span class="mrdn-box-header__title custom-text-red">
                        Association Escalation ID: {$bill_escalation->getId()}
                    </span>
                </div>
            </header>
        </section>
    </div>
</div>
```

### After Applying Rule 1 to the `<span>` Element

| Component | Source Segments | Generated String |
|-----------|-----------------|------------------|
| `css-gps--file-path` | Interfaces, Templates, ClientAdmin, utilities, utility_bills, associate_utility_bill, utility_bill_association_escalation | `int-tem-cli-uti-uti-ass-uti` |
| Class Name | **uti** (first 3 chars of filename) + div → div → section → header → div → span | `uti--div-div-sec-hea-div-spa` |

### Result
```html
<span class="mrdn-box-header__title custom-text-red uti--div-div-sec-hea-div-spa" css-gps--file-path="int-tem-cli-uti-uti-ass-uti">
    Association Escalation ID: {$bill_escalation->getId()}
</span>
```

## Scan & Validate Hierarchy

Access via **CSS GPS** → **Scan & Validate Hierarchy** to check all CSS GPS elements in the current file for hierarchy mismatches.

### What It Does

1. Scans the file for all elements with `css-gps--file-path` attribute
2. For each element, recalculates the expected class based on current DOM position
3. Compares with the actual CSS GPS class in the element
4. Highlights mismatches with warning underlines in the editor

### Mismatch Detection

If an element has been moved in the DOM hierarchy, the scan will detect that its class no longer matches its position:

| Scenario | Current Class | Expected Class | Result |
|----------|---------------|----------------|--------|
| Element moved deeper | `uti--div-sec` | `uti--div-div-sec` | ⚠️ Warning |
| Element moved up | `uti--div-div-sec` | `uti--div-sec` | ⚠️ Warning |
| Element unchanged | `uti--div-sec` | `uti--div-sec` | ✅ OK |

Mismatched elements are highlighted with warning squiggles in the editor, and hovering shows the expected vs. actual class names.

## Managing Custom Rules

Access the rule manager via **CSS GPS** → **Manage Custom Rules...** to:

- Toggle default `css-gps--file-path` attribute generation
- Create **Global Rules** (apply to all projects)
- Create **Local Rules** (project-specific)
- Enable/disable individual rules
- Configure `css-gps--file-path` per rule

## Development

### Project Structure
```
css-gps/
├── src/
│   └── extension.ts    # Main extension logic
├── out/                 # Compiled JavaScript (generated)
├── package.json        # Extension manifest
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

### Building
```bash
npm install
npm run compile
```

### Debugging
Press `F5` to launch the Extension Development Host with the extension loaded.

## Requirements

- VS Code version 1.74.0 or higher
- Node.js and npm for building from source

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
