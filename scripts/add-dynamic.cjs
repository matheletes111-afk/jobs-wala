const { readFileSync, writeFileSync, readdirSync, statSync } = require('fs');
const path = require('path');

function walk(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      try {
        if (statSync(full).isDirectory()) {
          results.push(...walk(full));
        } else if (entry === 'route.ts') {
          results.push(full);
        }
      } catch(e) {}
    }
  } catch(e) {}
  return results;
}

const apiDir = path.resolve(process.cwd(), 'app', 'api');
const files = walk(apiDir);
let patched = 0, skipped = 0, empty = 0;

for (const absPath of files) {
  const size = statSync(absPath).size;
  if (size === 0) {
    console.log('EMPTY (skipped):', path.relative(process.cwd(), absPath));
    empty++;
    continue;
  }

  const content = readFileSync(absPath, 'utf-8');
  
  if (content.includes('force-dynamic')) {
    skipped++;
    continue;
  }

  // Prepend directive after the very first import line (handles CRLF & LF)
  // Strategy: find first occurrence of "import" at line start, insert after that line
  const lines = content.split(/\r?\n/);
  let insertIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('import ')) {
      insertIdx = i;
      break;
    }
  }

  if (insertIdx === -1) {
    console.log('SKIPPED (no import found):', path.relative(process.cwd(), absPath));
    continue;
  }

  lines.splice(insertIdx + 1, 0, 'export const dynamic = "force-dynamic";');
  const newContent = lines.join('\r\n'); // preserve CRLF for Windows
  writeFileSync(absPath, newContent, 'utf-8');
  console.log('PATCHED:', path.relative(process.cwd(), absPath));
  patched++;
}

console.log(`\nDone: ${patched} patched, ${skipped} already had directive, ${empty} empty files skipped.`);
