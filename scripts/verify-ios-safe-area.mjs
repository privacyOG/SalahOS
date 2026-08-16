import { readFileSync } from 'node:fs';

function requireText(text, fragment, label) {
  if (!text.includes(fragment)) {
    throw new Error(`Missing ${label}`);
  }
}

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/safe-area.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');

requireText(index, 'viewport-fit=cover', 'viewport-fit=cover in the viewport meta tag');
requireText(main, "import './safe-area.css';", 'safe-area stylesheet import');
for (const edge of ['top', 'right', 'bottom', 'left']) {
  requireText(css, `env(safe-area-inset-${edge}, 0px)`, `safe-area-inset-${edge} handling`);
}

console.log('iOS safe-area contract passed.');
