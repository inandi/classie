<div align="center">
  <h1>Classie [Beta]</h1>
  <p><strong>Smart CSS Class Names for HTML</strong></p>
</div>

Tired of inventing class names or keeping them consistent? Classie generates context-aware CSS class names from your file path, DOM position, and settings—right where your cursor is.

## What is Classie?

Classie is a VS Code extension that creates and applies CSS class names to HTML elements using customizable rules. Right-click in `.html`, `.tpl`, or `.phtml` files and pick a rule to insert a generated class into the element at your cursor.

## Why Use Classie?

- **Save Time**: No more typing or copy-pasting class names—generate them in one click
- **Stay Consistent**: Same file or DOM position always yields the same class (when using the same rule)
- **Flexible Naming**: Choose preset rules (Alpha, Beta, Gamma) or build your own from 7 options
- **Context-Aware**: Classes can include path hash, DOM path, reversed filename, release name, and more
- **Easy Configuration**: Set project prefix, hash lengths, abbreviations, and release schedule in the config panel
- **Team-Wide Consistency**: Organizations can define a standard rule (and options) so every engineer follows the same naming pattern across the codebase

## Getting Started

### Installation

1. Open VS Code or Cursor
2. Go to the Extensions view
3. Search for **Classie**
4. Click Install

### First Steps

1. **Open a supported file**: `.html`, `.tpl`, or `.phtml`
2. **Place your cursor** inside an opening tag of the element you want to add a class to
3. **Right-click** → **Classie** → choose **Rule Alpha**, **Rule Beta**, or **Rule Gamma**
4. The generated class is added to that element (or appended if it already has a `class` attribute)

## How It Works

### Preset Rules

- **Rule Alpha**: Project prefix + abbreviated file path + path hash  
  Example: `my-project--tem-adm-use--a3f2b9c1`
- **Rule Beta**: Project prefix + abbreviated DOM position + DOM hash  
  Example: `my-project--div-sec-hea-spa--e7c3a1b9`
- **Rule Gamma**: Project prefix + reversed file name  
  Example: `my-project--llib_ytilitu`

### The Seven Options

You can combine these in **Manage Rules** to create custom rules:

1. **Project Prefix** – Custom text for the whole project (e.g. `my-app`)
2. **Path Hash** – MD5 of the file’s relative path (configurable length)
3. **Reversed File Name** – Filename without extension, reversed
4. **DOM Hash** – MD5 of the element’s ancestor chain
5. **Abbreviated DOM Position** – Short path like `div-sec-hea-spa`
6. **Abbreviated File Path** – Short path like `tem-adm-use`
7. **Release Name** – Active release from a schedule with expiry dates

### Managing Rules and Settings

1. Right-click in a supported file → **Classie** → **Manage Rules...**
2. In the panel you can:
   - **Options**: Set project prefix, hash lengths, abbreviation length, reversed-name case, default release
   - **Preset Rules**: View Alpha, Beta, Gamma (read-only)
   - **Custom Rules**: Add rules by choosing options and a separator (e.g. `--`, `-`, `_`)
   - **Releases**: Add release names with expiry dates for option 7

**For teams**: Share the same project prefix and preferred rule (or custom rule) via workspace settings or docs so everyone generates class names the same way and keeps the codebase consistent.

## Development

```bash
npm install
npm run compile
```

Press **F5** to launch the Extension Development Host.

## Support the Project

If Classie helps your workflow, you can support the project (no pressure):

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/igobinda)

## Need Help?

- **Option reference**: See [Combo Options](doc/combo-options.md) for detailed descriptions of all 7 options
- **Issues**: Found a bug or have an idea? Open an issue on GitHub
- **Repository**: [github.com/iNandi/classie](https://github.com/iNandi/classie)

## License

This project is licensed under the MIT License.

---

**Made with ❤️ by Gobinda Nandi**
