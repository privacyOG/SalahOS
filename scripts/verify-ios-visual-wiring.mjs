import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/ios.yml', import.meta.url), 'utf8');

const requiredContracts = [
  "name.startswith('iPhone')",
  "name.startswith('iPad')",
  'IPHONE_UDID=',
  'IPAD_UDID=',
  'capture_device "$IPHONE_UDID" iphone',
  'capture_device "$IPAD_UDID" ipad',
  'simctl bootstatus',
  'simctl install',
  'simctl launch',
  'simctl io "$udid" screenshot',
  '${label}-5s.png',
  '${label}-20s.png',
  'def png_size(path: Path)',
  "data[12:16] != b'IHDR'",
  "struct.unpack('>II', data[16:24])",
  'if first != second:',
  'uses: actions/upload-artifact@v4',
  'name: ios-simulator-visual-${{ github.sha }}',
  'path: simulator-evidence/*.png',
  'retention-days: 14',
];

for (const contract of requiredContracts) {
  if (!workflow.includes(contract)) {
    throw new Error(`iOS visual workflow contract is missing: ${contract}`);
  }
}

if (!workflow.includes("-destination 'generic/platform=iOS Simulator'")) {
  throw new Error('iOS visual evidence must use the same Simulator build product as the native build gate');
}
if (!workflow.includes('CODE_SIGNING_ALLOWED=NO')) {
  throw new Error('iOS Simulator visual evidence must remain independent of signing credentials');
}

console.log(
  'iOS visual wiring contract passed: exact built app, iPhone/iPad cold launches, validated stable PNG dimensions, dual screenshots, and retained artifacts are required.',
);
