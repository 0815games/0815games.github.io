import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
assert.match(html,/<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/);
assert.doesNotMatch(html,/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
assert.match(css,/body, button, summary, a, dialog, \.tower-sheet\s*\{\s*touch-action:\s*manipulation;/);
assert.match(css,/\.map-viewport canvas\s*\{\s*touch-action:\s*pan-x pan-y pinch-zoom;/);
console.log('Touch gesture configuration checks passed.');
