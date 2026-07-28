const f = require('fs');
const c = f.readFileSync('d:/Ai_tools/Muf_Labs/packages/tbit-core/src/documentExtractors.ts', 'utf8');
const lines = c.split('\n').filter(l => l.includes('from "') || l.includes('import'));
console.log(lines.join('\n'));