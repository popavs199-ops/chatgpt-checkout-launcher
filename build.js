/**
 * Build script: reads the readable userscript at src/launcher.js,
 * obfuscates the body (everything below the // ==UserScript== block),
 * and writes the public deliverable to chatgpt-checkout.user.js.
 *
 * The userscript metadata header is left in plain text because Tampermonkey
 * needs to parse it -- obfuscating it would break installs.
 */

const fs = require('fs');
const path = require('path');
const JsObfuscator = require('javascript-obfuscator');

const SRC = path.join(__dirname, 'src', 'launcher.js');
const OUT = path.join(__dirname, 'chatgpt-checkout.user.js');

const source = fs.readFileSync(SRC, 'utf8');

const headerEnd = source.indexOf('// ==/UserScript==');
if (headerEnd === -1) {
  console.error('build: source is missing the userscript metadata header.');
  process.exit(1);
}
const headerLineEnd = source.indexOf('\n', headerEnd) + 1;
const header = source.slice(0, headerLineEnd);
const body = source.slice(headerLineEnd);

console.log('build: header bytes =', header.length, '/ body bytes =', body.length);

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.7,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 6,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.75,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  target: 'browser',
};

const obfuscated = JsObfuscator.obfuscate(body, obfuscationOptions).getObfuscatedCode();

fs.writeFileSync(OUT, header + '\n' + obfuscated + '\n', 'utf8');

const outSize = fs.statSync(OUT).size;
console.log('build: wrote', OUT, '(' + outSize + ' bytes)');
