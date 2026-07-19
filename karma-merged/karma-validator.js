// Karma — validator & linter (v1.0)
// Validates .karma files and provides intelligent error reporting
// Usage: node karma-validator.js file.karma [--ai] [--fix]

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const arg = process.argv[2];
const useAI = process.argv.includes("--ai");
const autoFix = process.argv.includes("--fix");
const verbose = process.argv.includes("--verbose");

if (!arg) {
  console.error('Usage: node karma-validator.js <file.karma> [--ai] [--fix] [--verbose]');
  process.exit(1);
}

// ========== ERROR DEFINITIONS ==========
const ERRORS = {
  MISSING_PAGE: {
    code: "E001",
    severity: "error",
    message: "Missing required <PAGE> tag",
    suggestion: "Every .karma file must have exactly one <PAGE>...</PAGE> block"
  },
  MISSING_TITLE: {
    code: "E002",
    severity: "error",
    message: "PAGE tag missing TITLE attribute",
    suggestion: 'Add TITLE="Page Title" to your <PAGE> tag'
  },
  UNCLOSED_TAG: {
    code: "E003",
    severity: "error",
    message: "Unclosed tag detected",
    suggestion: "Make sure all tags have proper closing tags or are self-closing"
  },
  INVALID_ATTRIBUTE: {
    code: "E004",
    severity: "warning",
    message: "Invalid attribute for tag",
    suggestion: "Check the TAGS_GUIDE.md for valid attributes"
  },
  EMPTY_TEXT: {
    code: "E005",
    severity: "warning",
    message: "Empty TEXT attribute",
    suggestion: "Add meaningful content to the TEXT attribute"
  },
  INVALID_TAG: {
    code: "E006",
    severity: "error",
    message: "Unknown tag used",
    suggestion: "Check the TAGS_GUIDE.md for a list of valid tags"
  },
  BROKEN_LINK: {
    code: "E007",
    severity: "warning",
    message: "Link references non-existent file",
    suggestion: "Make sure the linked .karma file exists"
  },
  MISSING_REQUIRED_ATTR: {
    code: "E008",
    severity: "error",
    message: "Missing required attribute",
    suggestion: "This tag requires specific attributes"
  },
  INVALID_GRID_COLS: {
    code: "E009",
    severity: "warning",
    message: "GRID COLS value out of range",
    suggestion: "COLS must be between 1 and 4"
  },
  INVALID_HEADING_LEVEL: {
    code: "E010",
    severity: "warning",
    message: "HEADING LEVEL out of range",
    suggestion: "LEVEL must be between 1 and 6"
  }
};

// ========== VALID TAGS & ATTRIBUTES ==========
const VALID_TAGS = {
  PAGE: { required: ["TITLE"], optional: ["LAYOUT", "BRAND", "TAGLINE"] },
  HEADING: { required: ["TEXT"], optional: ["LEVEL", "SIZE"] },
  PARA: { required: ["TEXT"], optional: [] },
  IMAGE: { required: ["SRC"], optional: ["ALT", "TITLE", "CAPTION", "VARIANT", "POSITION", "LINK"] },
  VIDEO: { required: [], optional: ["SRC", "URL", "TITLE"] },
  LINK: { required: ["TEXT", "HREF"], optional: ["VARIANT"] },
  NAV: { required: [], optional: ["LINKS", "TITLE", "TYPE", "POSITION"] },
  TABLE: { required: [], optional: ["TITLE", "COLS", "ROWS"] },
  FORM: { required: [], optional: ["TITLE", "FIELDS", "SUBMIT"] },
  EMAIL: { required: ["TO"], optional: ["TEXT", "SUBJECT", "BODY"] },
  PHONE: { required: ["NUMBER"], optional: ["TEXT"] },
  SECTION: { required: [], optional: ["TITLE", "BG", "PADDING"] },
  GRID: { required: [], optional: ["COLS", "GAP"] },
  BADGE: { required: ["TEXT"], optional: ["TYPE"] },
  TAGS: { required: [], optional: ["LIST"] },
  ALERT: { required: ["TEXT"], optional: ["TYPE"] },
  CODE: { required: ["TEXT"], optional: ["LANG", "TITLE"] },
  COLLAPSE: { required: ["TITLE"], optional: ["OPEN"] },
  TIMELINE: { required: [], optional: ["TITLE"] },
  "TIMELINE-ITEM": { required: ["TITLE"], optional: ["DATE", "TEXT"] },
  STAT: { required: ["VALUE", "LABEL"], optional: ["ICON"] },
  QUOTE: { required: ["TEXT"], optional: ["AUTHOR", "ROLE"] },
  PROGRESS: { required: ["VALUE"], optional: ["LABEL", "COLOR"] }
};

// ========== VALIDATOR CLASS ==========
class KarmaValidator {
  constructor(filepath) {
    this.filepath = filepath;
    this.content = fs.readFileSync(filepath, "utf8");
    this.lines = this.content.split(/\r?\n/);
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  // Check if file has PAGE tag
  checkPageTag() {
    const hasPage = /<PAGE/i.test(this.content);
    if (!hasPage) {
      this.errors.push({
        ...ERRORS.MISSING_PAGE,
        line: 1,
        fix: `<PAGE TITLE="Page Title">\n  <!-- content -->\n</PAGE>`
      });
      return false;
    }

    const pageMatch = this.content.match(/<PAGE\s+([^>]*)>/i);
    if (!pageMatch) return false;

    const attrs = pageMatch[1];
    if (!/TITLE\s*=/i.test(attrs)) {
      this.errors.push({
        ...ERRORS.MISSING_TITLE,
        line: this.getLineNumber("<PAGE"),
        fix: 'Add TITLE="Your Page Title"'
      });
    }

    return true;
  }

  // Check for unclosed tags
  checkUnclosedTags() {
    const tagPattern = /<([A-Z\-]+)([^>]*)>(?!\/)/gi;
    let match;

    while ((match = tagPattern.exec(this.content))) {
      const tagName = match[1].toUpperCase();
      
      // Self-closing tags don't need closing tags
      if (this.isSelfClosing(tagName)) continue;

      const closePattern = new RegExp(`</${tagName}>`, "i");
      if (!closePattern.test(this.content)) {
        this.errors.push({
          ...ERRORS.UNCLOSED_TAG,
          line: this.getLineNumber(`<${tagName}`),
          tag: tagName,
          fix: `Add </${tagName}> before the end of the file`
        });
      }
    }
  }

  // Check for unknown tags
  checkUnknownTags() {
    const tagPattern = /<([A-Z\-]+)/gi;
    let match;

    while ((match = tagPattern.exec(this.content))) {
      const tagName = match[1].toUpperCase();
      if (tagName !== "PAGE" && !VALID_TAGS[tagName]) {
        this.errors.push({
          ...ERRORS.INVALID_TAG,
          line: this.getLineNumber(`<${tagName}`),
          tag: tagName,
          suggestion: `Did you mean one of these? ${Object.keys(VALID_TAGS).slice(0, 5).join(", ")}`
        });
      }
    }
  }

  // Check required attributes
  checkRequiredAttributes() {
    for (const [tagName, attrs] of Object.entries(VALID_TAGS)) {
      const pattern = new RegExp(`<${tagName}([^>]*)\\s*/?\\s*>`, "gi");
      let match;

      while ((match = pattern.exec(this.content))) {
        const attrStr = match[1];

        for (const required of attrs.required) {
          if (!new RegExp(`${required}\\s*=`, "i").test(attrStr)) {
            this.errors.push({
              ...ERRORS.MISSING_REQUIRED_ATTR,
              line: this.getLineNumber(`<${tagName}`),
              tag: tagName,
              attribute: required,
              fix: `Add ${required}="value" to <${tagName}>`
            });
          }
        }
      }
    }
  }

  // Check attribute values
  checkAttributeValues() {
    // Check GRID COLS
    const gridColsPattern = /<GRID[^>]*COLS\s*=\s*"([^"]+)"/gi;
    let match;
    while ((match = gridColsPattern.exec(this.content))) {
      const value = parseInt(match[1]);
      if (value < 1 || value > 4) {
        this.warnings.push({
          ...ERRORS.INVALID_GRID_COLS,
          line: this.getLineNumber(match[0]),
          current: value,
          fix: "Change COLS to a value between 1 and 4"
        });
      }
    }

    // Check HEADING LEVEL
    const headingLevelPattern = /<HEADING[^>]*LEVEL\s*=\s*"([^"]+)"/gi;
    while ((match = headingLevelPattern.exec(this.content))) {
      const value = parseInt(match[1]);
      if (value < 1 || value > 6) {
        this.warnings.push({
          ...ERRORS.INVALID_HEADING_LEVEL,
          line: this.getLineNumber(match[0]),
          current: value,
          fix: "Change LEVEL to a value between 1 and 6"
        });
      }
    }

    // Check PROGRESS VALUE
    const progressPattern = /<PROGRESS[^>]*VALUE\s*=\s*"([^"]+)"/gi;
    while ((match = progressPattern.exec(this.content))) {
      const value = parseInt(match[1]);
      if (value < 0 || value > 100) {
        this.warnings.push({
          ...ERRORS.INVALID_GRID_COLS,
          line: this.getLineNumber(match[0]),
          message: "PROGRESS VALUE must be between 0 and 100",
          current: value,
          fix: "Change VALUE to a number between 0 and 100"
        });
      }
    }
  }

  // Check for empty TEXT attributes
  checkEmptyAttributes() {
    const emptyPattern = /(TEXT|TITLE|LABEL|VALUE)\s*=\s*""/gi;
    let match;

    while ((match = emptyPattern.exec(this.content))) {
      this.warnings.push({
        ...ERRORS.EMPTY_TEXT,
        line: this.getLineNumber(match[0]),
        attribute: match[1],
        fix: `Add a value to ${match[1]}="your content"`
      });
    }
  }

  // Check for broken links
  checkBrokenLinks() {
    const linkPattern = /HREF\s*=\s*"([^"]+\.karma)"/gi;
    let match;

    while ((match = linkPattern.exec(this.content))) {
      const linkedFile = path.resolve(path.dirname(this.filepath), match[1]);
      if (!fs.existsSync(linkedFile)) {
        this.warnings.push({
          ...ERRORS.BROKEN_LINK,
          line: this.getLineNumber(match[0]),
          file: match[1],
          fix: `Make sure the file exists at: ${linkedFile}`
        });
      }
    }
  }

  // Detect embedded prompts
  detectPrompts() {
    const promptPattern = /<!--\s*@ai\s*(.*?)\s*-->/gi;
    let match;

    while ((match = promptPattern.exec(this.content))) {
      this.suggestions.push({
        type: "prompt",
        line: this.getLineNumber(match[0]),
        prompt: match[1].trim(),
        description: "Found embedded AI prompt"
      });
    }
  }

  // Helper to check if tag is self-closing
  isSelfClosing(tag) {
    const selfClosing = [
      "PARA", "IMAGE", "VIDEO", "LINK", "NAV", "TABLE", "FORM", 
      "EMAIL", "PHONE", "BADGE", "TAGS", "ALERT", "CODE", 
      "STAT", "PROGRESS", "QUOTE", "COLLAPSE"
    ];
    return selfClosing.includes(tag);
  }

  // Get line number of content
  getLineNumber(content) {
    const index = this.content.indexOf(content);
    return this.content.substring(0, index).split("\n").length;
  }

  // Run all checks
  validate() {
    this.checkPageTag();
    this.checkUnclosedTags();
    this.checkUnknownTags();
    this.checkRequiredAttributes();
    this.checkAttributeValues();
    this.checkEmptyAttributes();
    this.checkBrokenLinks();
    this.detectPrompts();
  }

  // Generate suggestions
  generateSuggestions() {
    const suggestions = [];

    // Suggest missing HEADING for pages without structure
    if (!/HEADING|H[1-6]/i.test(this.content)) {
      suggestions.push({
        type: "structure",
        message: "Consider adding a HEADING tag for better page structure",
        example: '<HEADING TEXT="Welcome" LEVEL="1" />'
      });
    }

    // Suggest adding META tags
    if (!/META/i.test(this.content)) {
      suggestions.push({
        type: "seo",
        message: "Consider adding metadata for better SEO"
      });
    }

    // Suggest grid for better layout
    if (!/GRID/i.test(this.content) && this.lines.length > 20) {
      suggestions.push({
        type: "layout",
        message: "Consider using GRID for better layout organization",
        example: '<GRID COLS="2"><Card>Item 1</Card><Card>Item 2</Card></GRID>'
      });
    }

    return suggestions;
  }

  // Print report
  printReport() {
    console.log("\n🔍 Karma Validator Report\n");
    console.log(`📄 File: ${this.filepath}\n`);

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("✅ No errors found!\n");
    }

    if (this.errors.length > 0) {
      console.log(`❌ Errors (${this.errors.length}):`);
      this.errors.forEach(err => {
        console.log(`\n  [${err.code}] Line ${err.line}: ${err.message}`);
        console.log(`  💡 ${err.suggestion}`);
        if (err.fix) {
          console.log(`  🔧 Fix: ${err.fix}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach(warn => {
        console.log(`\n  [${warn.code}] Line ${warn.line}: ${warn.message}`);
        console.log(`  💡 ${warn.suggestion}`);
        if (warn.fix) {
          console.log(`  🔧 Fix: ${warn.fix}`);
        }
      });
    }

    if (this.suggestions.length > 0) {
      console.log(`\n💬 AI Prompts Detected (${this.suggestions.length}):`);
      this.suggestions.filter(s => s.type === "prompt").forEach(sugg => {
        console.log(`\n  Line ${sugg.line}: "${sugg.prompt}"`);
      });
    }

    if (verbose) {
      const autoSuggestions = this.generateSuggestions();
      if (autoSuggestions.length > 0) {
        console.log(`\n🚀 Suggestions:`);
        autoSuggestions.forEach(sugg => {
          console.log(`\n  [${sugg.type.toUpperCase()}] ${sugg.message}`);
          if (sugg.example) {
            console.log(`  Example: ${sugg.example}`);
          }
        });
      }
    }

    console.log("\n" + "=".repeat(50) + "\n");

    return {
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      promptCount: this.suggestions.filter(s => s.type === "prompt").length
    };
  }

  // Apply fixes
  applyFixes() {
    let fixed = this.content;

    this.errors.forEach(err => {
      if (err.code === "E001") {
        fixed = `<PAGE TITLE="New Page">\n  ${fixed}\n</PAGE>`;
      }
    });

    return fixed;
  }
}

// ========== MAIN ==========
function main() {
  const inputPath = path.resolve(process.cwd(), arg);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    process.exit(1);
  }

  const validator = new KarmaValidator(inputPath);
  validator.validate();
  const report = validator.printReport();

  if (autoFix && report.errorCount > 0) {
    console.log("🔧 Applying auto-fixes...\n");
    const fixed = validator.applyFixes();
    const fixedPath = inputPath.replace(/\.karma$/, ".fixed.karma");
    fs.writeFileSync(fixedPath, fixed, "utf8");
    console.log(`✅ Fixed file written to: ${fixedPath}\n`);
  }

  process.exit(report.errorCount > 0 ? 1 : 0);
}

main();
