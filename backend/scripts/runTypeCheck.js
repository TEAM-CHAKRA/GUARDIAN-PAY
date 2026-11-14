import ts from '../../frontend/node_modules/typescript/lib/typescript.js';
import path from 'node:path';

const tsconfigPath = path.resolve('frontend/tsconfig.json');
const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

if (configFile.error) {
  console.error('Error reading tsconfig.json:', configFile.error.messageText);
  process.exit(1);
}

const parsedConfig = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(tsconfigPath)
);

// Focus type checking on source files in frontend/src
const srcFiles = parsedConfig.fileNames.filter((f) => f.includes('/src/'));
console.log(`Checking ${srcFiles.length} application files in frontend/src...`);

const program = ts.createProgram({
  rootNames: srcFiles,
  options: {
    ...parsedConfig.options,
    noEmit: true,
    skipLibCheck: true,
    skipDefaultLibCheck: true,
  },
});

const diagnostics = ts.getPreEmitDiagnostics(program);

if (diagnostics.length === 0) {
  console.log(`✓ TypeScript check PASSED: 0 errors across all ${srcFiles.length} frontend source files!`);
  process.exit(0);
} else {
  console.error(`✗ TypeScript check FAILED with ${diagnostics.length} diagnostic error(s):\n`);
  for (const diag of diagnostics) {
    const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
    if (diag.file) {
      const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
      console.error(`${diag.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.error(message);
    }
  }
  process.exit(1);
}
