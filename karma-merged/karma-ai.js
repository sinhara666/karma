// Karma — AI prompt processor (v1.0)
// Extracts and processes embedded AI prompts with full grammar context
// Usage: node karma-ai.js file.karma [--execute] [--model gpt-4]

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const arg = process.argv[2];
const execute = process.argv.includes("--execute");
const model = process.argv.includes("--model") 
  ? process.argv[process.argv.indexOf("--model") + 1] 
  : "gpt-4";

if (!arg) {
  console.error('Usage: node karma-ai.js <file.karma> [--execute] [--model gpt-4]');
  process.exit(1);
}

// ========== KARMA GRAMMAR SCHEMA ==========
// This defines all valid Karma constructs for AI context
const KARMA_GRAMMAR = {
  description: "Karma Language v1.7 - Schema for static page markup",
  
  // Tag definitions with grammar rules
  tags: {
    PAGE: {
      type: "container",
      description: "Root page container (required)",
      attributes: {
        TITLE: { type: "string", required: true, description: "Page title" },
        LAYOUT: { type: "string", required: false, description: "Layout template name" },
        BRAND: { type: "string", required: false, description: "Brand name for layout" },
        TAGLINE: { type: "string", required: false, description: "Short tagline" }
      },
      children: "any tag",
      example: '<PAGE TITLE="My Site"><HEADING TEXT="Welcome" LEVEL="1" /></PAGE>'
    },

    HEADING: {
      type: "inline",
      description: "Semantic heading (H1-H6)",
      attributes: {
        TEXT: { type: "string", required: true, description: "Heading content" },
        LEVEL: { type: "number", min: 1, max: 6, default: 2, description: "Heading level" },
        SIZE: { type: "enum", values: ["large"], required: false, description: "Size variant" }
      },
      selfClosing: true,
      example: '<HEADING TEXT="Title" LEVEL="1" />'
    },

    PARA: {
      type: "inline",
      description: "Paragraph text block",
      attributes: {
        TEXT: { type: "string", required: true, description: "Paragraph content" }
      },
      selfClosing: true,
      example: '<PARA TEXT="Your content here" />'
    },

    IMAGE: {
      type: "block",
      description: "Image display with variants",
      attributes: {
        SRC: { type: "string", required: true, description: "Image URL" },
        ALT: { type: "string", required: false, description: "Alt text" },
        TITLE: { type: "string", required: false, description: "Image title" },
        CAPTION: { type: "string", required: false, description: "Caption text" },
        VARIANT: { type: "enum", values: ["card", "split", "hero"], default: "card", description: "Display variant" },
        POSITION: { type: "enum", values: ["left", "right"], default: "left", description: "Image position" },
        LINK: { type: "string", required: false, description: "Click destination" }
      },
      selfClosing: true,
      example: '<IMAGE SRC="photo.jpg" ALT="Description" VARIANT="hero" />'
    },

    VIDEO: {
      type: "block",
      description: "Video embedding (local or URL)",
      attributes: {
        SRC: { type: "string", required: false, description: "Local video file path" },
        URL: { type: "string", required: false, description: "Embed URL (YouTube, etc)" },
        TITLE: { type: "string", required: false, description: "Video title" }
      },
      selfClosing: true,
      example: '<VIDEO SRC="video.mp4" TITLE="Demo" />'
    },

    SECTION: {
      type: "container",
      description: "Content section with background",
      attributes: {
        TITLE: { type: "string", required: false, description: "Section heading" },
        BG: { type: "enum", values: ["default", "dark", "light"], default: "default", description: "Background style" },
        PADDING: { type: "css", required: false, description: "Padding (CSS value)" }
      },
      children: "any tag",
      example: '<SECTION TITLE="Features" BG="dark"><PARA TEXT="Content" /></SECTION>'
    },

    GRID: {
      type: "layout",
      description: "Multi-column responsive grid",
      attributes: {
        COLS: { type: "number", min: 1, max: 4, default: 2, description: "Number of columns" },
        GAP: { type: "css", default: "14px", description: "Column gap (CSS value)" }
      },
      children: "any block element",
      responsive: "auto-stacks to 1 column on mobile",
      example: '<GRID COLS="3"><Card>Item 1</Card><Card>Item 2</Card></GRID>'
    },

    HEADING: {
      type: "text",
      description: "Semantic heading",
      attributes: {
        TEXT: { type: "string", required: true },
        LEVEL: { type: "number", min: 1, max: 6, default: 2 },
        SIZE: { type: "enum", values: ["large"] }
      },
      selfClosing: true
    },

    BADGE: {
      type: "inline",
      description: "Status badge/label",
      attributes: {
        TEXT: { type: "string", required: true, description: "Badge text" },
        TYPE: { type: "enum", values: ["default", "success", "warning", "error"], default: "default", description: "Badge style" }
      },
      selfClosing: true,
      example: '<BADGE TEXT="New" TYPE="success" />'
    },

    TAGS: {
      type: "inline",
      description: "Display multiple tags",
      attributes: {
        LIST: { type: "csv", required: false, description: "Comma-separated tag names" }
      },
      selfClosing: true,
      example: '<TAGS LIST="javascript, react, web" />'
    },

    ALERT: {
      type: "block",
      description: "Highlighted message box",
      attributes: {
        TEXT: { type: "string", required: true, description: "Alert message" },
        TYPE: { type: "enum", values: ["info", "success", "warning", "error"], default: "info", description: "Alert type" }
      },
      selfClosing: true,
      example: '<ALERT TEXT="Warning!" TYPE="warning" />'
    },

    CODE: {
      type: "block",
      description: "Code snippet display",
      attributes: {
        TEXT: { type: "string", required: true, description: "Code content" },
        LANG: { type: "enum", values: ["javascript", "bash", "html", "css", "python", "plaintext"], default: "plaintext", description: "Language" },
        TITLE: { type: "string", required: false, description: "Code block title" }
      },
      selfClosing: true,
      example: '<CODE TEXT="console.log(\'hi\');" LANG="javascript" />'
    },

    COLLAPSE: {
      type: "container",
      description: "Expandable/collapsible section",
      attributes: {
        TITLE: { type: "string", required: true, description: "Collapse header" },
        OPEN: { type: "boolean", default: false, description: "Initially open?" }
      },
      children: "any tag",
      example: '<COLLAPSE TITLE="Details"><PARA TEXT="Hidden content" /></COLLAPSE>'
    },

    TIMELINE: {
      type: "container",
      description: "Timeline container",
      attributes: {
        TITLE: { type: "string", required: false, description: "Timeline title" }
      },
      children: ["TIMELINE-ITEM"],
      example: '<TIMELINE TITLE="History"><TIMELINE-ITEM DATE="Jan" TITLE="Event" /></TIMELINE>'
    },

    "TIMELINE-ITEM": {
      type: "block",
      description: "Individual timeline entry",
      attributes: {
        DATE: { type: "string", required: false, description: "Date/time period" },
        TITLE: { type: "string", required: true, description: "Event name" },
        TEXT: { type: "string", required: false, description: "Event description" }
      },
      selfClosing: true,
      parent: "TIMELINE"
    },

    STAT: {
      type: "block",
      description: "Dashboard statistic box",
      attributes: {
        VALUE: { type: "string", required: true, description: "Stat value" },
        LABEL: { type: "string", required: true, description: "Stat label" },
        ICON: { type: "emoji", required: false, description: "Optional emoji icon" }
      },
      selfClosing: true,
      example: '<STAT VALUE="1,234" LABEL="Users" ICON="👥" />'
    },

    QUOTE: {
      type: "block",
      description: "Blockquote with attribution",
      attributes: {
        TEXT: { type: "string", required: true, description: "Quote text" },
        AUTHOR: { type: "string", required: false, description: "Quote author" },
        ROLE: { type: "string", required: false, description: "Author role" }
      },
      selfClosing: true,
      example: '<QUOTE TEXT="Be yourself." AUTHOR="Oscar Wilde" ROLE="Writer" />'
    },

    PROGRESS: {
      type: "block",
      description: "Progress bar indicator",
      attributes: {
        VALUE: { type: "number", min: 0, max: 100, default: 50, description: "Progress percentage" },
        LABEL: { type: "string", required: false, description: "Label text" },
        COLOR: { type: "enum", values: ["blue", "green", "red"], default: "blue", description: "Bar color" }
      },
      selfClosing: true,
      example: '<PROGRESS VALUE="75" LABEL="75% Complete" COLOR="blue" />'
    },

    NAV: {
      type: "block",
      description: "Navigation menu",
      attributes: {
        LINKS: { type: "string", required: false, description: "Links as 'Label:URL' pairs" },
        TITLE: { type: "string", required: false, description: "Menu title" },
        TYPE: { type: "enum", values: ["bar"], default: "bar", description: "Menu style" },
        POSITION: { type: "enum", values: ["top"], default: "top", description: "Menu position" }
      },
      selfClosing: true,
      example: '<NAV LINKS="Home:index.karma, About:about.karma" />'
    },

    LINK: {
      type: "inline",
      description: "Button/hyperlink",
      attributes: {
        TEXT: { type: "string", required: true, description: "Link text" },
        HREF: { type: "string", required: true, description: "Link URL (.karma → .html auto-converts)" },
        VARIANT: { type: "enum", values: ["primary", "secondary"], default: "primary", description: "Button style" }
      },
      selfClosing: true,
      example: '<LINK TEXT="Click Me" HREF="page.karma" VARIANT="primary" />'
    },

    EMAIL: {
      type: "inline",
      description: "Email link",
      attributes: {
        TO: { type: "email", required: true, description: "Email address" },
        TEXT: { type: "string", required: false, description: "Link text" },
        SUBJECT: { type: "string", required: false, description: "Pre-filled subject" },
        BODY: { type: "string", required: false, description: "Pre-filled message" }
      },
      selfClosing: true,
      example: '<EMAIL TO="hello@example.com" TEXT="Contact Us" />'
    },

    PHONE: {
      type: "inline",
      description: "Phone link (tel: protocol)",
      attributes: {
        NUMBER: { type: "phone", required: true, description: "Phone number" },
        TEXT: { type: "string", required: false, description: "Link text" }
      },
      selfClosing: true,
      example: '<PHONE NUMBER="+1 206 555 0123" TEXT="Call Us" />'
    },

    TABLE: {
      type: "block",
      description: "Data table",
      attributes: {
        TITLE: { type: "string", required: false, description: "Table heading" },
        COLS: { type: "number", min: 2, max: 6, default: 3, description: "Number of columns" },
        ROWS: { type: "number", min: 2, max: 10, default: 2, description: "Number of rows" }
      },
      selfClosing: true,
      example: '<TABLE TITLE="Data" COLS="3" ROWS="4" />'
    },

    FORM: {
      type: "block",
      description: "Contact/input form (placeholder - needs backend integration)",
      attributes: {
        TITLE: { type: "string", required: false, description: "Form heading" },
        FIELDS: { type: "csv", required: false, description: "Field names (comma-separated)" },
        SUBMIT: { type: "string", required: false, description: "Submit button text" }
      },
      selfClosing: true,
      note: "Textarea if field name contains 'message' or 'notes'",
      example: '<FORM TITLE="Contact" FIELDS="name, email, message" SUBMIT="Send" />'
    }
  },

  // Global rules
  rules: {
    "PAGE required": "Every .karma file MUST have exactly one <PAGE></PAGE> block",
    "self-closing": "Self-closing tags must use <TAG ... />",
    "nested containers": "Only SECTION, GRID, TIMELINE, COLLAPSE, and PAGE can contain other tags",
    "attribute format": "Attributes: UPPERCASE_NAME=\"value\"",
    "links auto-convert": ".karma file extensions automatically convert to .html",
    "nesting": "Tags must be properly nested - no overlapping tags",
    "comments": "Embedded prompts use <!-- @ai your prompt --> format"
  },

  // AI usage patterns
  aiPatterns: {
    "prompt_format": "<!-- @ai describe what you want here -->",
    "placement": "Can appear anywhere in the file to guide generation",
    "context": "AI has access to this full grammar schema for understanding"
  }
};

// ========== PROMPT PROCESSOR ==========
class AIPromptProcessor {
  constructor(filepath) {
    this.filepath = filepath;
    this.content = fs.readFileSync(filepath, "utf8");
    this.prompts = this.extractPrompts();
  }

  // Extract embedded prompts with context
  extractPrompts() {
    const promptPattern = /<!--\s*@ai\s*(.*?)\s*-->/gi;
    const prompts = [];
    let match;

    while ((match = promptPattern.exec(this.content))) {
      const lineNum = this.content.substring(0, match.index).split("\n").length;
      const promptText = match[1].trim();
      
      // Get context (surrounding lines)
      const lines = this.content.split("\n");
      const contextStart = Math.max(0, lineNum - 3);
      const contextEnd = Math.min(lines.length, lineNum + 2);
      const context = lines.slice(contextStart, contextEnd).join("\n");

      prompts.push({
        line: lineNum,
        text: promptText,
        context: context,
        grammarSchema: KARMA_GRAMMAR
      });
    }

    return prompts;
  }

  // Generate AI prompt with full context
  generateAIContext(prompt) {
    return `
You are a Karma Language code generator. You have the following schema:

${JSON.stringify(KARMA_GRAMMAR, null, 2)}

User Request: "${prompt.text}"

Context (surrounding code):
\`\`\`karma
${prompt.context}
\`\`\`

Rules:
1. Only use tags defined in the KARMA_GRAMMAR schema
2. All attributes must match the defined types and constraints
3. Self-closing tags must use /> syntax
4. Nested tags must follow parent-child rules
5. Generate valid .karma code that compiles without errors

Respond with ONLY the generated Karma code, no explanations.
`;
  }

  // Print prompts for review
  printPrompts() {
    console.log("\n📋 AI Prompts Found\n");
    console.log("=".repeat(60) + "\n");

    this.prompts.forEach((prompt, idx) => {
      console.log(`Prompt ${idx + 1} (Line ${prompt.line}):`);
      console.log(`\n  Request: "${prompt.text}"\n`);
      console.log(`  Context:`);
      console.log("  ```karma");
      prompt.context.split("\n").forEach(line => {
        console.log(`  ${line}`);
      });
      console.log("  ```\n");
    });

    console.log("=".repeat(60));
    console.log(`\nTotal prompts: ${this.prompts.length}\n`);
  }

  // Export prompts for API processing
  exportForAPI() {
    return this.prompts.map(p => ({
      line: p.line,
      request: p.text,
      context: p.context,
      schema: KARMA_GRAMMAR,
      model: model
    }));
  }
}

// ========== MAIN ==========
function main() {
  const inputPath = path.resolve(process.cwd(), arg);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    process.exit(1);
  }

  const processor = new AIPromptProcessor(inputPath);

  if (processor.prompts.length === 0) {
    console.log(`✅ No embedded AI prompts found in ${arg}\n`);
    process.exit(0);
  }

  processor.printPrompts();

  if (execute) {
    console.log("🤖 Processing with AI...\n");
    const context = processor.exportForAPI();
    console.log("API Ready JSON:\n");
    console.log(JSON.stringify(context, null, 2));
    console.log("\nTo execute: Send this to OpenAI/Claude API with the model:", model);
  }
}

main();
