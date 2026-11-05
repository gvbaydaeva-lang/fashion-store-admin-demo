import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const deliveryDirectory = fileURLToPath(new URL('../site/', import.meta.url));
const allowedExtensions = new Set(['.html', '.css', '.js']);
const forbidden = [
  /ghp_[A-Za-z0-9_]+/i,
  /github_pat_[A-Za-z0-9_]+/i,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /https?:\/\//i,
  /\bfetch\s*\(/i,
  /XMLHttpRequest/i,
  /WebSocket/i,
  /\bAPI\b/i,
  /Telegram/i,
  /Supabase/i,
  /Beget/i,
  /база данных/i,
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...await collectFiles(path));
    } else if (allowedExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
      results.push(path);
    }
  }

  return results;
}

const files = await collectFiles(deliveryDirectory);
const findings = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(content)) {
      findings.push(`${file}: ${pattern}`);
    }
  }
}

if (findings.length > 0) {
  console.error('Demo delivery audit failed:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log('Demo delivery audit passed.');
}
