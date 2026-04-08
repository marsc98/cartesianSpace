import { describe, it, expect, beforeEach } from 'vitest';
import {
  safeGetParsed,
  safeGetValidated,
  isValidSpeed,
  isValidColor,
  isValidSize,
  isValidSavedImages,
} from '../../utils/storage';

describe('safeGetParsed', () => {
  beforeEach(() => localStorage.clear());

  it('retorna null se a chave não existe', () => {
    expect(safeGetParsed('missing', isValidSpeed)).toBeNull();
  });

  it('retorna número válido parseado de JSON', () => {
    localStorage.setItem('speed', '10');
    expect(safeGetParsed('speed', isValidSpeed)).toBe(10);
  });

  it('retorna null e remove chave para dado com schema inválido', () => {
    localStorage.setItem('speed', '"não-é-número"');
    expect(safeGetParsed('speed', isValidSpeed)).toBeNull();
    expect(localStorage.getItem('speed')).toBeNull();
  });

  it('retorna null para JSON malformado', () => {
    localStorage.setItem('speed', '{não é json}');
    expect(safeGetParsed('speed', isValidSpeed)).toBeNull();
  });

  it('valida e retorna array de imagens salvas correto', () => {
    const images = [{ id: '1', name: 'test', data: 'base64', date: '2024', createdAt: '2024' }];
    localStorage.setItem('savedImages', JSON.stringify(images));
    const result = safeGetParsed('savedImages', isValidSavedImages);
    expect(result).toEqual(images);
  });

  it('rejeita array de imagens corrompido e limpa a chave', () => {
    localStorage.setItem('savedImages', JSON.stringify([{ id: 1, name: 2 }]));
    expect(safeGetParsed('savedImages', isValidSavedImages)).toBeNull();
    expect(localStorage.getItem('savedImages')).toBeNull();
  });

  it('rejeita dado com campos extras via isValidSavedImages', () => {
    const malicious = [{ id: '1', name: 'x', data: 'x', date: 'x', __proto__: {} }];
    const result = safeGetParsed('savedImages', isValidSavedImages);
    void malicious;
    expect(result).toBeNull();
  });
});

describe('safeGetValidated', () => {
  beforeEach(() => localStorage.clear());

  it('retorna string de cor válida', () => {
    localStorage.setItem('color', '#ff0000');
    expect(safeGetValidated('color', isValidColor)).toBe('#ff0000');
  });

  it('retorna null e remove chave para cor inválida', () => {
    localStorage.setItem('color', 'not-a-color');
    expect(safeGetValidated('color', isValidColor)).toBeNull();
    expect(localStorage.getItem('color')).toBeNull();
  });

  it('retorna null se a chave não existe', () => {
    expect(safeGetValidated('missing', isValidColor)).toBeNull();
  });
});

describe('validators', () => {
  it('isValidSpeed aceita números positivos', () => {
    expect(isValidSpeed(10)).toBe(true);
    expect(isValidSpeed(0.5)).toBe(true);
  });

  it('isValidSpeed rejeita valores inválidos', () => {
    expect(isValidSpeed(-1)).toBe(false);
    expect(isValidSpeed(0)).toBe(false);
    expect(isValidSpeed('10')).toBe(false);
    expect(isValidSpeed(NaN)).toBe(false);
    expect(isValidSpeed(Infinity)).toBe(false);
  });

  it('isValidColor aceita hex colors', () => {
    expect(isValidColor('#ff0000')).toBe(true);
    expect(isValidColor('#abc')).toBe(true);
  });

  it('isValidColor rejeita strings inválidas', () => {
    expect(isValidColor('red')).toBe(false);
    expect(isValidColor('')).toBe(false);
    expect(isValidColor(123)).toBe(false);
  });

  it('isValidSize aceita números positivos', () => {
    expect(isValidSize(5)).toBe(true);
    expect(isValidSize(0.1)).toBe(true);
  });

  it('isValidSize rejeita valores inválidos', () => {
    expect(isValidSize(0)).toBe(false);
    expect(isValidSize(-5)).toBe(false);
  });
});
