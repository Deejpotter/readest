const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = [
  'repro-3583.epub',
  'repro-3683.epub',
  'repro-3688.epub',
  'repro-4379.epub',
  'repro-bg-restore.epub',
  'sample-alice.epub',
  'sample-table-layout.epub',
  'sample-table-wide.epub',
];

const base = 'c:/Users/Deej/Repos/readest';
const dest = path.join(base, 'apps', 'readest-app', 'src', '__tests__', 'fixtures', 'data');

for (const f of files) {
  const src = 'apps/readest-app/src/__tests__/fixtures/data/' + f;
  try {
    const buf = execSync('git show HEAD:' + JSON.stringify(src), {
      cwd: base,
      maxBuffer: 5 * 1024 * 1024,
    });
    fs.writeFileSync(path.join(dest, f), buf);
    console.log('Restored', f, buf.length, 'bytes');
  } catch (e) {
    console.error('Failed', f, e.message);
  }
}
