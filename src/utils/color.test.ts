import { describe, it, expect } from 'vitest';
import { rgbToHex, parseColorToHex } from './color';

describe('rgbToHex', () => {
  it('converte vermelho', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('converte branco', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });
});

describe('parseColorToHex', () => {
  it('#abc → #aabbcc', () => {
    expect(parseColorToHex('#abc')).toBe('#aabbcc');
  });

  it('#FF0000 → #ff0000', () => {
    expect(parseColorToHex('#FF0000')).toBe('#ff0000');
  });

  it('rgb(255, 0, 0) → #ff0000', () => {
    expect(parseColorToHex('rgb(255, 0, 0)')).toBe('#ff0000');
  });

  it('rgba(255, 0, 0, 0.5) → #ff0000', () => {
    expect(parseColorToHex('rgba(255, 0, 0, 0.5)')).toBe('#ff0000');
  });

  it('string vazia → null', () => {
    expect(parseColorToHex('')).toBeNull();
  });

  it('# → null', () => {
    expect(parseColorToHex('#')).toBeNull();
  });

  it('rgb(999,0,0) → null', () => {
    expect(parseColorToHex('rgb(999, 0, 0)')).toBeNull();
  });

  it('texto inválido → null', () => {
    expect(parseColorToHex('notacolor')).toBeNull();
  });
});
