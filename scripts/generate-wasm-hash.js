import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

const wasmPath = 'public/wasm/trace_opt.wasm';

let wasm;
try {
  wasm = readFileSync(wasmPath);
} catch {
  console.error(`Erro: arquivo não encontrado em ${wasmPath}`);
  process.exit(1);
}

const hash = createHash('sha384').update(wasm).digest('base64');

const content = `// Auto-gerado por scripts/generate-wasm-hash.js — não editar manualmente
export const WASM_INTEGRITY_HASH = 'sha384-${hash}';
`;

writeFileSync('src/lib/wasm/integrity.ts', content);
console.log(`Hash WASM gerado: sha384-${hash}`);
