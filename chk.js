const fs = require('fs');
const code = fs.readFileSync('backend.gs', 'utf8');
let o = 0;
for(let c of code) {
  if (c==='{') o++;
  if (c==='}') o--;
}
console.log("Brace balance:", o);
