const fs = require('fs');

// Check if node-app-service fix applied
let c = fs.readFileSync(
  'c:/Users/Deej/Repos/readest/apps/readest-app/src/services/nodeAppService.ts',
  'utf8',
);
console.log('Has nodePath.resolve(raw) fix:', c.includes('nodePath.resolve(raw)'));
console.log('Has nodePath.join in getCustomBasePrefix:', c.includes('nodePath.join(customRootDir'));
console.log('Still has template literal:', c.includes('${customRootDir}/${leafDir}'));

// Check series-metadata fix
let c2 = fs.readFileSync(
  'c:/Users/Deej/Repos/readest/apps/readest-app/src/__tests__/document/series-metadata.test.ts',
  'utf8',
);
console.log('Has .metadata.title check:', c2.includes('.metadata.title'));
console.log('Still has toMatchObject:', c2.includes('toMatchObject'));
