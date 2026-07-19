````markdown
# Karma Tags Guide

Complete reference for all available Karma tags. Each tag compiles to semantic HTML with built-in styling.

---

## Core Tags

### PAGE
Container for all page content. Required on every `.karma` file.

```karma
<PAGE TITLE="My Page" LAYOUT="main" BRAND="Company" TAGLINE="Tagline here">
  <!-- Your content goes here -->
</PAGE>
```

**Attributes:**
- `TITLE` (required) — Page title shown in browser tab
- `LAYOUT` (optional) — Layout template name (requires `--pro` flag)
- Any custom attributes become available to layouts as `{{ATTRIBUTE_NAME}}`

---

## Typography

### HEADING
Semantic headings with automatic sizing.

```karma
<HEADING TEXT="My Title" LEVEL="1" />
<HEADING TEXT="Subtitle" LEVEL="2" SIZE="large" />
```

**Attributes:**
- `TEXT` — Heading content
- `LEVEL` — 1-6 (default: 2)
- `SIZE` — Optional: `large` for extra emphasis

**Example Output:**
```html
<h1 class="k-heading k-heading-1">My Title</h1>
<h2 class="k-heading k-heading-2 k-heading-large">Subtitle</h2>
```

---

### PARA
Paragraph text block.

```karma
<PARA TEXT="This is a paragraph of text." />
```

**Attributes:**
- `TEXT` — Paragraph content

---

## Layout & Containers

### SECTION
Flexible container for grouping content.

```karma
<SECTION TITLE="Section Title" BG="dark" PADDING="20px">
  <PARA TEXT="Content inside section" />
</SECTION>
```

**Attributes:**
- `TITLE` — Optional section heading
- `BG` — Background: `default`, `dark`, or `light` (default: default)
- `PADDING` — CSS padding value (default: 16px)

---

### GRID
Multi-column layout system. Automatically responsive.

```karma
<GRID COLS="3" GAP="20px">
  <Card title="Card 1">Content</Card>
  <Card title="Card 2">Content</Card>
  <Card title="Card 3">Content</Card>
</GRID>
```

**Attributes:**
- `COLS` — Number of columns: 1-4 (default: 2)
- `GAP` — Space between items in CSS units (default: 14px)

**Responsive Behavior:**
- 3-4 columns → 2 columns on tablets (max-width: 768px)
- All columns → 1 column on mobile (max-width: 520px)

---

## Information & Messaging

### BADGE
Small label or tag for categorization.

```karma
<BADGE TEXT="New" TYPE="success" />
<BADGE TEXT="Alert" TYPE="warning" />
<BADGE TEXT="Error" TYPE="error" />
```

**Attributes:**
- `TEXT` — Badge text
- `TYPE` — `default`, `success`, `warning`, or `error` (default: default)

**Usage Example:**
```karma
<HEADING TEXT="Product Features" />
<BADGE TEXT="v2.0" /> <BADGE TEXT="New" TYPE="success" />
```

---

### TAGS
Display multiple tags in a row.

```karma
<TAGS LIST="react, javascript, web, frontend" />
```

**Attributes:**
- `LIST` — Comma-separated tags

---

### ALERT
Highlighted callout message with icon and type.

```karma
<ALERT TEXT="Success! Your form was submitted." TYPE="success" />
<ALERT TEXT="Warning: This action cannot be undone." TYPE="warning" />
<ALERT TEXT="Error occurred. Please try again." TYPE="error" />
<ALERT TEXT="FYI: Here's some useful information." TYPE="info" />
```

**Attributes:**
- `TEXT` — Alert message
- `TYPE` — `info`, `success`, `warning`, or `error` (default: info)

**Icons:**
- info: ℹ️
- success: ✅
- warning: ⚠️
- error: ❌

---

## Media & Rich Content

### IMAGE
Image display with multiple variants.

```karma
<IMAGE SRC="photo.jpg" ALT="Description" TITLE="Photo" CAPTION="Optional caption" />
<IMAGE SRC="photo.jpg" VARIANT="split" POSITION="right" />
<IMAGE SRC="hero.jpg" VARIANT="hero" />
```

**Attributes:**
- `SRC` — Image URL
- `ALT` — Alt text for accessibility
- `TITLE` — Optional heading above image
- `CAPTION` — Caption below image
- `VARIANT` — `card` (default), `split`, or `hero`
- `POSITION` — `left` or `right` (for split variant)
- `LINK` — Optional URL to open on click

**Variants:**
- `card` — Boxed image with border
- `split` — Side-by-side image and text layout
- `hero` — Full-width image with dark overlay

---

### VIDEO
Embed videos from file or URL.

```karma
<VIDEO SRC="video.mp4" TITLE="My Video" />
<VIDEO URL="https://youtube.com/embed/..." TITLE="YouTube Video" />
```

**Attributes:**
- `SRC` — Path to local video file
- `URL` — Embed URL (e.g., YouTube iframe URL)
- `TITLE` — Video heading

---

### CODE
Display code snippets with syntax highlighting support.

```karma
<CODE TEXT="console.log('Hello');" LANG="javascript" TITLE="Example" />
<CODE TEXT="npm install karma-lang" LANG="bash" />
```

**Attributes:**
- `TEXT` — Code content
- `LANG` — Language: `javascript`, `bash`, `html`, etc. (default: plaintext)
- `TITLE` — Optional code block heading

---

### QUOTE
Blockquote with author and role.

```karma
<QUOTE TEXT="The best way to predict the future is to invent it." AUTHOR="Alan Kay" ROLE="Computer Scientist" />
```

**Attributes:**
- `TEXT` — Quote text
- `AUTHOR` — Who said it
- `ROLE` — Author's title/role

---

## Navigation & Links

### NAV
Navigation menu with link items.

```karma
<NAV LINKS="Home:home.karma, About:about.karma, Contact:contact.karma" TITLE="Menu" />
```

**Attributes:**
- `LINKS` — Comma-separated pairs: `Label:URL`
- `TITLE` — Optional menu heading
- `TYPE` — Menu style: `bar` (default)
- `POSITION` — `top` (default)

**Format:**
```
LINKS="Home:home.karma, About:about.karma, Blog:https://example.com"
```

---

### LINK
Individual button/link element.

```karma
<LINK TEXT="Click Me" HREF="page.karma" VARIANT="primary" />
<LINK TEXT="Secondary" HREF="#" VARIANT="secondary" />
```

**Attributes:**
- `TEXT` — Link text
- `HREF` — URL (`.karma` files auto-convert to `.html`)
- `VARIANT` — `primary` (default) or `secondary`

---

### EMAIL
Email link.

```karma
<EMAIL TO="hello@example.com" TEXT="Send Email" SUBJECT="Hello" BODY="Message body" />
```

**Attributes:**
- `TO` — Email address
- `TEXT` — Link text (default: "Email")
- `SUBJECT` — Pre-filled subject line
- `BODY` — Pre-filled message body

---

### PHONE
Phone link (tel: protocol).

```karma
<PHONE NUMBER="+1 206 555 0123" TEXT="Call Us" />
```

**Attributes:**
- `NUMBER` — Phone number
- `TEXT` — Link text (default: "Call")

---

## Forms & Data

### FORM
Auto-generated form with fields.

```karma
<FORM TITLE="Contact Us" FIELDS="name, email, message" SUBMIT="Send" />
```

**Attributes:**
- `TITLE` — Form heading
- `FIELDS` — Comma-separated field names
- `SUBMIT` — Submit button text

**Special Field Names:**
- `message` or `notes` → renders as `<textarea>`
- All others → `<input type="text">`

**Note:** This is a placeholder form. Connect it to a backend with custom JavaScript in your layout.

---

### TABLE
Data table with customizable rows/columns.

```karma
<TABLE TITLE="Sales Data" COLS="4" ROWS="5" />
```

**Attributes:**
- `TITLE` — Table heading
- `COLS` — Number of columns (2-6, default: 3)
- `ROWS` — Number of rows (2-10, default: 2)

---

## Interactive Elements

### COLLAPSE
Expandable/collapsible section.

```karma
<COLLAPSE TITLE="Click to expand" OPEN="false">
  <PARA TEXT="Hidden content that expands on click" />
</COLLAPSE>

<COLLAPSE TITLE="Already open" OPEN="true">
  <PARA TEXT="This section starts expanded" />
</COLLAPSE>
```

**Attributes:**
- `TITLE` — Section heading
- `OPEN` — `true` or `false` (default: false)

---

## Dashboard & Stats

### STAT
Dashboard statistic box.

```karma
<STAT VALUE="1,234" LABEL="Total Users" ICON="👥" />
<STAT VALUE="98%" LABEL="Uptime" ICON="✅" />
```

**Attributes:**
- `VALUE` — The statistic value
- `LABEL` — What it represents
- `ICON` — Emoji or symbol

---

### PROGRESS
Progress bar with value.

```karma
<PROGRESS VALUE="75" LABEL="75% Complete" COLOR="blue" />
<PROGRESS VALUE="100" LABEL="Done" COLOR="green" />
```

**Attributes:**
- `VALUE` — 0-100 (default: 50)
- `LABEL` — Text to display (default: percentage)
- `COLOR` — `blue` (default), `green`, or `red`

---

## Timeline

### TIMELINE
Container for chronological events.

```karma
<TIMELINE TITLE="Project History">
  <TIMELINE-ITEM DATE="Jan 2024" TITLE="Started" TEXT="Project kickoff meeting" />
  <TIMELINE-ITEM DATE="Mar 2024" TITLE="Beta Launch" TEXT="Released beta version" />
  <TIMELINE-ITEM DATE="Jun 2024" TITLE="v1.0 Live" TEXT="Official release" />
</TIMELINE>
```

---

### TIMELINE-ITEM
Individual timeline entry.

```karma
<TIMELINE-ITEM DATE="December 2024" TITLE="Milestone Reached" TEXT="Shipped new features to production" />
```

**Attributes:**
- `DATE` — Date or time period
- `TITLE` — Event name
- `TEXT` — Event description

---

## Complete Example

```karma
import "components/card.karma"

<PAGE TITLE="Product Dashboard" BRAND="MyApp" TAGLINE="Analytics & Insights">
  <HEADING TEXT="Dashboard Overview" LEVEL="1" />
  
  <GRID COLS="3">
    <STAT VALUE="12,434" LABEL="Active Users" ICON="👥" />
    <STAT VALUE="$45,231" LABEL="Revenue" ICON="💰" />
    <STAT VALUE="98%" LABEL="Uptime" ICON="✅" />
  </GRID>

  <SECTION TITLE="Recent Activity" BG="dark">
    <ALERT TEXT="Server maintenance scheduled for Sunday 2am" TYPE="warning" />
    
    <TIMELINE TITLE="Updates">
      <TIMELINE-ITEM DATE="Today" TITLE="New Feature" TEXT="Dark mode support added" />
      <TIMELINE-ITEM DATE="Yesterday" TITLE="Bug Fix" TEXT="Fixed login issue" />
    </TIMELINE>
  </SECTION>

  <SECTION TITLE="Resources">
    <TAGS LIST="documentation, tutorials, api, community" />
    
    <GRID COLS="2">
      <Card title="Getting Started">
        <PARA TEXT="New? Start here with our guide." />
        <LINK TEXT="Learn More" HREF="docs.karma" />
      </Card>
      
      <Card title="API Reference">
        <PARA TEXT="Complete API documentation." />
        <LINK TEXT="View Docs" HREF="api.karma" />
      </Card>
    </GRID>
  </SECTION>

  <SECTION TITLE="Code Example">
    <CODE TEXT="const karma = require('karma-lang');" LANG="javascript" TITLE="Installation" />
  </SECTION>

  <QUOTE TEXT="Simple tools lead to better code." AUTHOR="You" ROLE="Developer" />
</PAGE>
```

---

## Styling & Customization

All Karma tags use CSS classes that you can override in custom layouts:

```html
<!-- layouts/main.html -->
<!doctype html>
<html>
  <head>
    {{style}}
    <style>
      /* Override default colors */
      :root {
        --k-bg: #1a1a1a;
        --k-card: #2d2d2d;
        --k-border: #444;
        --k-text: #f0f0f0;
      }
      
      /* Custom button styling */
      .k-btn {
        border-radius: 24px;
        font-size: 1.1rem;
      }
    </style>
  </head>
  <body>
    {{content}}
  </body>
</html>
```

---

## Tag Availability

| Tag | Version | Status |
|-----|---------|--------|
| PAGE | 1.0 | Core |
| HEADING | 1.7 | New |
| PARA | 1.0 | Core |
| IMAGE | 1.0 | Core |
| VIDEO | 1.0 | Core |
| LINK | 1.0 | Core |
| NAV | 1.0 | Core |
| TABLE | 1.0 | Core |
| FORM | 1.0 | Core |
| EMAIL | 1.0 | Core |
| PHONE | 1.0 | Core |
| SECTION | 1.7 | New |
| GRID | 1.7 | New |
| BADGE | 1.7 | New |
| TAGS | 1.7 | New |
| ALERT | 1.7 | New |
| CODE | 1.7 | New |
| COLLAPSE | 1.7 | New |
| TIMELINE | 1.7 | New |
| TIMELINE-ITEM | 1.7 | New |
| STAT | 1.7 | New |
| QUOTE | 1.7 | New |
| PROGRESS | 1.7 | New |

---

## Component Library

Create reusable components:

```karma
// components/features.karma
component Feature(icon, title) {
  <div class="feature">
    <div class="feature-icon">{{icon}}</div>
    <h3>{{title}}</h3>
    <slot/>
  </div>
}
```

Use in your pages:

```karma
import "components/features.karma"

<PAGE TITLE="Features">
  <GRID COLS="3">
    <Feature icon="⚡" title="Fast">
      <PARA TEXT="Lightning quick builds and deploys." />
    </Feature>
    
    <Feature icon="🔒" title="Secure">
      <PARA TEXT="Production-ready security features." />
    </Feature>
    
    <Feature icon="📦" title="Simple">
      <PARA TEXT="No complex configuration needed." />
    </Feature>
  </GRID>
</PAGE>
```

---

## Tips & Tricks

1. **Auto-linking**: `.karma` extensions automatically convert to `.html`
   ```karma
   <LINK HREF="about.karma" /> <!-- becomes: about.html -->
   ```

2. **Nested Grids**: Create complex layouts
   ```karma
   <GRID COLS="2">
     <SECTION>
       <GRID COLS="2">
         <STAT VALUE="10" LABEL="A" />
         <STAT VALUE="20" LABEL="B" />
       </GRID>
     </SECTION>
   </GRID>
   ```

3. **Responsive Images**: 
   ```karma
   <IMAGE SRC="big.jpg" VARIANT="hero" /> <!-- Full width on mobile -->
   <IMAGE SRC="pic.jpg" VARIANT="split" POSITION="right" /> <!-- Stacks on mobile -->
   ```

4. **Accessible Links**:
   ```karma
   <EMAIL TO="help@example.com" TEXT="Get Help" />
   <PHONE NUMBER="+1 555 0123" TEXT="Call Support" />
   ```

---

## Need Help?

- 📖 Read the [README](README.md)
- 🐛 Report issues on [GitHub](https://github.com/Mrs-bonds/karma-lang)
- 💬 Discussions & questions in [GitHub Discussions](https://github.com/Mrs-bonds/karma-lang/discussions)
````
