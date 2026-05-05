const fs = require('fs');
const lines = fs.readFileSync('backend.gs', 'utf8').split('\n');
let o = 0;
lines.forEach((l, i) => {
  let prev = o;
  for (let c of l) {
    if (c === '{') o++;
    if (c === '}') o--;
  }
  if (o !== prev) console.log(`Line ${i + 1}: ${o} | ${l}`);
});
console.log('Final open braces:', o);
