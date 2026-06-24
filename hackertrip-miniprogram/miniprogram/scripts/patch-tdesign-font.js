const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '..');
const fontFile = path.join(miniprogramRoot, 'assets/fonts/tdesign-icon.woff');
const targets = [
  path.join(miniprogramRoot, 'node_modules/tdesign-miniprogram/miniprogram_dist/icon/icon.wxss'),
  path.join(miniprogramRoot, 'miniprogram_npm/tdesign-miniprogram/icon/icon.wxss'),
];

if (!fs.existsSync(fontFile)) {
  throw new Error(`Missing local TDesign icon font: ${fontFile}`);
}

const fontBase64 = fs.readFileSync(fontFile).toString('base64');
const fontFace = `@font-face{font-family:t;src:url('data:font/woff;base64,${fontBase64}') format('woff');font-weight:400;font-style:normal;}`;

let patched = 0;
targets.forEach((target) => {
  if (!fs.existsSync(target)) return;
  const text = fs.readFileSync(target, 'utf8');
  const next = text.replace(/@font-face\{font-family:t;src:[^}]+\}/, fontFace);
  if (next === text) {
    if (text.includes('data:font/woff;base64,')) return;
    throw new Error(`Unable to patch TDesign icon font in ${target}`);
  }
  fs.writeFileSync(target, next);
  patched += 1;
});

console.log(`TDesign icon font patched: ${patched} file(s)`);
