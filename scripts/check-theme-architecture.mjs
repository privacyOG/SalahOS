import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');
const palettes=read('src/theme-palettes.css');
const contract=read('src/platform/themePalette.ts');
const settings=read('src/platform/settingsStorage.ts');
const main=read('src/main.tsx');
const screen=read('src/ui/SettingsScreen.tsx');
const names=['salah-classic','midnight-gold','emerald-mosque','royal-blue','desert-sand','olive-heritage','monochrome','high-contrast'];
for(const name of names){if(!contract.includes(`'${name}'`))throw new Error(`Missing palette contract: ${name}`);if(!palettes.includes(`data-palette='${name}'`))throw new Error(`Missing palette CSS: ${name}`);}
for(const name of names.slice(1)){if(!palettes.includes(`data-theme='light'][data-palette='${name}'`))throw new Error(`Missing light variant: ${name}`);if(!palettes.includes(`data-theme='dark'][data-palette='${name}'`))throw new Error(`Missing dark variant: ${name}`);}
if(!settings.includes('readonly palette: ThemePalette'))throw new Error('Palette is not persisted');
if(!settings.includes('parseThemePalette(migrated.palette)'))throw new Error('Palette persistence is not validated');
if(!main.includes('applyThemePalette(settings.palette'))throw new Error('Palette is not bootstrapped globally');
if(!screen.includes('themePalettes.map'))throw new Error('Display settings do not expose palette selection');
if(!palettes.includes('@media (forced-colors: active)') && !read('src/theme-contrast-guard.css').includes('@media (forced-colors: active)'))throw new Error('Forced colours support missing');
console.log('Theme palette and cross-surface architecture checks passed.');
