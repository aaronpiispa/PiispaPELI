// Loads game scripts into an isolated VM context, the same way the browser loads them
// (classic scripts sharing one global scope), and returns a helper to read values back.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

function load(files, globals = {}) {
  const context = vm.createContext({ Math, Date, console, Float64Array, Int32Array, Array, Object, JSON, Number, String, ...globals });
  for (const f of files) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    vm.runInContext(code, context, { filename: f });
  }
  // top-level const/let are not properties of the context, so read them through an expression
  return expr => vm.runInContext(expr, context);
}

module.exports = { load, ROOT };
