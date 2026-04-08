import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock do módulo de integridade para controlar o hash esperado
vi.mock('../../lib/wasm/integrity', () => ({
  WASM_INTEGRITY_HASH: 'sha384-placeholder',
}));

// Importar após o mock para que o módulo veja o hash correto
const { loadTraceWasm } = await import('../../lib/wasm/index.ts');

describe('WASM integrity check', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // Resetar o singleton para que cada teste carregue de novo
    vi.resetModules();
  });

  it('lança erro quando hash não confere', async () => {
    const tamperedBuffer = new ArrayBuffer(16);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/wasm' },
      arrayBuffer: () => Promise.resolve(tamperedBuffer),
    }));

    // WASM_INTEGRITY_HASH é 'sha384-placeholder' mas o buffer produzirá hash diferente
    await expect(loadTraceWasm()).rejects.toThrow(/integrity/i);
  });
});
