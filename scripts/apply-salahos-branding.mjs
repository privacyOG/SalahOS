import { readFileSync, writeFileSync } from 'node:fs';

function replaceOnce(path, search, replacement) {
  const source = readFileSync(path, 'utf8');
  if (!source.includes(search)) {
    throw new Error(`Branding anchor not found in ${path}`);
  }
  writeFileSync(path, source.replace(search, replacement));
}

replaceOnce(
  'src/App.tsx',
  `<p className="eyebrow">{translate(locale, 'appName')}</p>`,
  `<img className="brand-wordmark" src="/icons/salahos-wordmark.svg" alt={translate(locale, 'appName')} />`,
);

replaceOnce(
  'src/ui/SmartDisplay.tsx',
  `<p className="eyebrow">{translate(locale, 'appName')}</p>`,
  `<img className="smart-display-brand" src="/icons/salahos-wordmark.svg" alt={translate(locale, 'appName')} />`,
);

replaceOnce(
  'src/styles.css',
  `.live-clock {\n`,
  `.brand-wordmark {\n  display: block;\n  width: clamp(9rem, 21vw, 14rem);\n  height: auto;\n  margin: 0 0 0.45rem;\n  border-radius: 0.55rem;\n}\n\n.live-clock {\n`,
);

replaceOnce(
  'src/smart-display.css',
  `.smart-display-clock {\n`,
  `.smart-display-brand {\n  display: block;\n  width: clamp(10rem, 18vw, 18rem);\n  height: auto;\n  margin-block-end: clamp(0.5rem, 1vw, 1rem);\n  border-radius: 0.65rem;\n}\n\n.smart-display-clock {\n`,
);

replaceOnce('public/manifest.webmanifest', '"background_color": "#0d120e"', '"background_color": "#00543e"');
replaceOnce('public/manifest.webmanifest', '"theme_color": "#101510"', '"theme_color": "#00543e"');
replaceOnce('index.html', '<meta name="theme-color" content="#101510" />', '<meta name="theme-color" content="#00543e" />');
replaceOnce(
  'android/app/src/main/res/values/ic_launcher_background.xml',
  '<color name="ic_launcher_background">#FFFFFF</color>',
  '<color name="ic_launcher_background">#00543E</color>',
);

replaceOnce(
  'public/sw.js',
  `const CACHE_NAME = \`${'${CACHE_PREFIX}'}v2\`;`,
  `const CACHE_NAME = \`${'${CACHE_PREFIX}'}v3\`;`,
);
replaceOnce(
  'public/sw.js',
  `  '/icons/salahos-maskable.svg',\n`,
  `  '/icons/salahos-maskable.svg',\n  '/icons/salahos-wordmark.svg',\n`,
);

replaceOnce(
  'README.md',
  '# SalahOS\n',
  '# SalahOS\n\n![SalahOS logo](public/icons/salahos-wordmark.svg)\n',
);
