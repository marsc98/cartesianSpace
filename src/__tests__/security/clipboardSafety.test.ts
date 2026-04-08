import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClipboardEvents } from '../../hooks/universeEventListeners/useClipboardEvents';

const makeRefs = () => ({
  rendererRef: { current: { domElement: document.createElement('canvas') } },
  editingElementRef: { current: { active: false } },
});

// jsdom não implementa ClipboardEvent — usamos plain object compatível com a interface
const makePasteEvent = (overrides: Partial<DataTransfer> = {}) => {
  const clipboardData = {
    getData: vi.fn((type: string) => {
      if (type === 'text/plain') return 'texto sensível do usuário';
      if (type === 'text/html') return '<script>alert("xss")</script>';
      return '';
    }),
    items: [],
    ...overrides,
  } as unknown as DataTransfer;

  return {
    clipboardData,
    preventDefault: vi.fn(),
    type: 'paste',
  } as unknown as ClipboardEvent;
};

describe('useClipboardEvents — privacidade', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('não loga texto colado pelo usuário', () => {
    const refs = makeRefs();
    const { result } = renderHook(() => useClipboardEvents(refs));
    result.current.handlePaste(makePasteEvent());
    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining('texto sensível'),
    );
  });

  it('não loga HTML colado pelo usuário', () => {
    const refs = makeRefs();
    const { result } = renderHook(() => useClipboardEvents(refs));
    result.current.handlePaste(makePasteEvent());
    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining('<script>'),
    );
  });

  it('não loga nenhum dado de clipboard como string', () => {
    const refs = makeRefs();
    const { result } = renderHook(() => useClipboardEvents(refs));
    result.current.handlePaste(makePasteEvent());
    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    // Nenhuma chamada deve conter dados do clipboard
    calls.forEach((args) => {
      expect(String(args[0])).not.toMatch(/texto sensível|<script>/);
    });
  });

  it('desativa editingElement ao fazer paste', () => {
    const refs = makeRefs();
    refs.editingElementRef.current.active = true;
    const { result } = renderHook(() => useClipboardEvents(refs));
    result.current.handlePaste(makePasteEvent());
    expect(refs.editingElementRef.current.active).toBe(false);
  });
});
