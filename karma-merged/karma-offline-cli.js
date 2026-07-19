#!/usr/bin/env node

// karma-offline-cli.js
// Simple offline CLI: rule-based chatbot + lightweight linter with ANSI colorized error highlighting

import fs from 'fs';
import readline from 'readline';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${colors.cyan}karma-offline> ${colors.reset}`,
});

function printHelp() {
  console.log(`${colors.green}Karma Offline CLI (free, offline)${colors.reset}`);
  console.log('Commands:');
  console.log('  chat               Start simple rule-based chat (offline, free)');
  console.log('  lint <file>        Run a lightweight linter that highlights simple errors');
  console.log('  help               Show this help');
  console.log('  exit, quit         Exit the CLI');
}

// Very small ELIZA-like rule set
const responses = [
  {pattern: /hello|hi|hey/i, reply: "Hello! I'm a simple offline bot. How can I help?"},
  {pattern: /how are you|how's it going/i, reply: "I'm just code, but I'm here to help you. Tell me about your project."},
  {pattern: /error|bug|issue/i, reply: "Errors happen. Try running 'lint <file>' to highlight simple issues."},
  {pattern: /thank you|thanks/i, reply: "You're welcome!"},
  {pattern: /bye|goodbye|see you/i, reply: "Goodbye — happy coding!"},
];

function chatMode() {
  console.log(`${colors.magenta}Entering chat mode. Type 'exit' to return.${colors.reset}`);
  const chatRl = readline.createInterface({input: process.stdin, output: process.stdout, prompt: `${colors.magenta}you> ${colors.reset}`});
  chatRl.prompt();
  chatRl.on('line', (line) => {
    const t = line.trim();
    if (!t) { chatRl.prompt(); return; }
    if (t.toLowerCase() === 'exit' || t.toLowerCase() === 'quit') {
      chatRl.close();
      rl.prompt();
      return;
    }
    let matched = false;
    for (const r of responses) {
      if (r.pattern.test(t)) {
        console.log(`${colors.green}${r.reply}${colors.reset}`);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // fallback: simple mirrors and canned replies
      if (/\?$/.test(t)) {
        console.log(`${colors.green}That's a good question — tell me more about what you expect.${colors.reset}`);
      } else {
        console.log(`${colors.green}Tell me more — I can suggest running a simple linter: 'lint <file>'.${colors.reset}`);
      }
    }
    chatRl.prompt();
  }).on('close', () => {
    console.log(`${colors.cyan}Exited chat mode.${colors.reset}`);
  });
}

function highlightLine(line, issueRanges) {
  // issueRanges: array of {start:col,end:col,color,label}
  if (!issueRanges || issueRanges.length === 0) return line;
  let out = '';
  let idx = 0;
  for (const r of issueRanges) {
    const start = Math.max(0, r.start);
    const end = Math.min(line.length, r.end);
    out += line.slice(idx, start);
    out += r.color + line.slice(start, end) + colors.reset;
    idx = end;
  }
  out += line.slice(idx);
  return out;
}

function lintFile(path) {
  try {
    const src = fs.readFileSync(path, 'utf8');
    const lines = src.split('\n');
    const issues = [];

    // Check for unbalanced brackets/braces/parentheses
    const stack = [];
    const pairs = {')':'(', ']':'[', '}':'{'};
    for (let i=0;i<lines.length;i++) {
      const l = lines[i];
      for (let j=0;j<l.length;j++) {
        const ch = l[j];
        if (ch === '(' || ch === '[' || ch === '{') stack.push({ch, line:i, col:j});
        if (ch === ')' || ch === ']' || ch === '}') {
          if (stack.length === 0 || stack[stack.length-1].ch !== pairs[ch]) {
            issues.push({type:'error', message:`Unmatched '${ch}'`, line:i, col:j});
          } else {
            stack.pop();
          }
        }
      }
    }
    for (const s of stack) {
      issues.push({type:'error', message:`Unclosed '${s.ch}'`, line:s.line, col:s.col});
    }

    // Check for trailing whitespace, tabs, long lines
    for (let i=0;i<lines.length;i++) {
      const l = lines[i];
      if (/\t/.test(l)) {
        issues.push({type:'warn', message:'Tab character found (use spaces)', line:i, col:l.indexOf('\t')});
      }
      if (/\s+$/.test(l)) {
        issues.push({type:'warn', message:'Trailing whitespace', line:i, col:l.length-1});
      }
      if (l.length > 120) {
        issues.push({type:'warn', message:`Line too long (${l.length} > 120)`, line:i, col:120});
      }
    }

    // Report
    if (issues.length === 0) {
      console.log(`${colors.green}No issues found.${colors.reset}`);
      return;
    }
    console.log(`${colors.red}Found ${issues.length} potential issue(s):${colors.reset}`);
    // Group by line
    const byLine = new Map();
    for (const it of issues) {
      const arr = byLine.get(it.line) || [];
      arr.push(it);
      byLine.set(it.line, arr);
    }
    for (const [ln, arr] of byLine.entries()) {
      const lnum = ln + 1;
      console.log(`${colors.yellow}L${lnum}:${colors.reset} ${highlightLine(lines[ln], arr.map(a=>({start:a.col, end: a.col+1, color: a.type==='error'? colors.red: colors.yellow, label: a.message})) )}`);
      for (const a of arr) {
        const prefix = a.type === 'error' ? `${colors.red}Error${colors.reset}` : `${colors.yellow}Warn${colors.reset}`;
        console.log(`  ${prefix}: ${a.message} (col ${a.col + 1})`);
      }
    }
  } catch (err) {
    console.error(`${colors.red}Failed to lint file:${colors.reset} ${err.message}`);
  }
}

// If invoked with command-line args (e.g. `karma-offline lint file.js`),
// run that command once and exit instead of dropping into the interactive prompt.
const cliArgs = process.argv.slice(2);
if (cliArgs.length > 0) {
  const cmd = cliArgs[0].toLowerCase();
  if (cmd === 'lint') {
    const path = cliArgs.slice(1).join(' ').trim();
    if (!path) {
      console.log(`${colors.yellow}Usage: karma-offline lint <file>${colors.reset}`);
      process.exit(1);
    }
    lintFile(path);
    process.exit(0);
  } else if (cmd === 'help') {
    printHelp();
    process.exit(0);
  } else if (cmd === 'chat') {
    // chat is inherently interactive; fall through to the REPL below
  } else {
    console.log(`${colors.yellow}Unknown command: ${cmd}${colors.reset}`);
    printHelp();
    process.exit(1);
  }
}

console.log(`${colors.cyan}Welcome to Karma Offline CLI — offline chatbot & lightweight linter${colors.reset}`);
console.log(`Type 'help' for commands.`);
rl.prompt();

rl.on('line', (input) => {
  const line = input.trim();
  if (!line) { rl.prompt(); return; }
  const parts = line.split(' ');
  const cmd = parts[0].toLowerCase();
  if (cmd === 'help') {
    printHelp();
  } else if (cmd === 'chat') {
    chatMode();
    // chatMode will return to rl when done
  } else if (cmd === 'lint') {
    const path = parts.slice(1).join(' ').trim();
    if (!path) {
      console.log(`${colors.yellow}Usage: lint <file>${colors.reset}`);
    } else {
      lintFile(path);
    }
  } else if (cmd === 'exit' || cmd === 'quit') {
    rl.close();
  } else {
    console.log(`${colors.yellow}Unknown command: ${cmd}${colors.reset}`);
    console.log(`Type 'help' for a list of commands.`);
  }
  rl.prompt();
}).on('close', () => {
  console.log(`${colors.cyan}Bye!${colors.reset}`);
  process.exit(0);
});
