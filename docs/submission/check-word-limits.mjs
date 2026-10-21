import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const results = [];
for (const file of ['01_PRELIMINARY_PROPOSAL.md', '02_TECHNICAL_TOOLS_DECLARATION.md']) {
  const content = await readFile(resolve(import.meta.dirname, file), 'utf8');
  for (const match of content.matchAll(/<!-- word-limit: (\S+) (\d+) -->\s*([\s\S]*?)\s*<!-- \/word-limit -->/g)) {
    const words = match[3].trim().split(/\s+/).filter(Boolean).length;
    results.push({ file, section: match[1], limit: Number(match[2]), words });
  }
}
if (results.length !== 8) throw new Error(`Expected eight word-limited template answers; found ${results.length}.`);
const failures = results.filter(item => item.words > item.limit);
const output = ['# Official response word-limit check', '',
  'Counts use conservative whitespace-separated tokens within the marked response bodies, including inline citation markers. Headings, editorial notes, tables outside these answers and source appendices are excluded. All bodies retain margin for final edits. Repeat after changes and inspect the final PDFs for overflow.', '',
  '| Response | Count | Maximum | Status |', '| --- | ---: | ---: | --- |',
  ...results.map(item => `| ${item.section} | ${item.words} | ${item.limit} | ${item.words <= item.limit ? 'Pass' : 'OVER LIMIT'} |`), '',
  'Reproduce: `node docs/submission/check-word-limits.mjs`.', ''].join('\n');
await writeFile(resolve(import.meta.dirname, 'WORD_LIMITS.md'), output);
console.log(JSON.stringify(results, null, 2));
if (failures.length) throw new Error('One or more template responses exceed the maximum.');
