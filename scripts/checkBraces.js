const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, '..', 'src', 'app', 'admin', 'orders', 'page.js');
const code = fs.readFileSync(filePath, 'utf8');
const startIndex = code.indexOf('export default function GoldSmithOrders');
if (startIndex === -1) {
  throw new Error('Function GoldSmithOrders not found');
}
let line = 1;
let col = 0;
let inSingle = false;
let inDouble = false;
let inTemplate = false;
let inSLComment = false;
let inMLComment = false;
let curly = 0;
let started = false;
for (let i = 0; i < code.length; i++) {
  const ch = code[i];
  const next = code[i + 1];
  const prev = code[i - 1];
  if (i < startIndex) {
    if (ch === '\n') {
      line++;
      col = 0;
    } else {
      col++;
    }
    continue;
  }
  if (ch === '\n') {
    line++;
    col = 0;
    if (inSLComment) {
      inSLComment = false;
    }
    continue;
  }
  col++;
  if (inSLComment) continue;
  if (inMLComment) {
    if (prev === '*' && ch === '/') {
      inMLComment = false;
    }
    continue;
  }
  if (inSingle) {
    if (ch === "'" && prev !== '\\') {
      inSingle = false;
    }
    continue;
  }
  if (inDouble) {
    if (ch === '"' && prev !== '\\') {
      inDouble = false;
    }
    continue;
  }
  if (inTemplate) {
    if (ch === '`' && prev !== '\\') {
      inTemplate = false;
    }
    continue;
  }
  if (ch === '/' && next === '/') {
    inSLComment = true;
    continue;
  }
  if (ch === '/' && next === '*') {
    inMLComment = true;
    continue;
  }
  if (ch === "'") {
    inSingle = true;
    continue;
  }
  if (ch === '"') {
    inDouble = true;
    continue;
  }
  if (ch === '`') {
    inTemplate = true;
    continue;
  }
  if (ch === '{') {
    curly++;
    if (!started) started = true;
    continue;
  }
  if (ch === '}') {
    curly--;
    if (curly < 0) {
      console.log('Curly negative at line', line, 'col', col);
      break;
    }
    if (started && curly === 0) {
      console.log('Curly returned to zero at line', line, 'col', col);
      break;
    }
  }
}
console.log('Final curly count', curly, 'line', line, 'col', col);
