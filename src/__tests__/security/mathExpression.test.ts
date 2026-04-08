import { describe, it, expect } from 'vitest';
import { evaluate as mathEvaluate } from 'mathjs';

// mathjs usa parser próprio (não eval JS) — proteção real vem da whitelist + error handling
const evaluate = (expr: string, scope: Record<string, number> = {}) =>
  mathEvaluate(expr, scope);

describe('avaliação de expressões matemáticas — segurança', () => {
  describe('expressões válidas', () => {
    it('calcula expressão aritmética simples', () => {
      expect(evaluate('2 + 2')).toBe(4);
    });

    it('usa variáveis do scope', () => {
      expect(evaluate('x * 2', { x: 3 })).toBe(6);
    });

    it('avalia sin e cos com x', () => {
      expect(evaluate('sin(x)', { x: 0 })).toBeCloseTo(0);
      expect(evaluate('cos(x)', { x: 0 })).toBeCloseTo(1);
    });

    it('avalia expressões com potência', () => {
      expect(evaluate('x^2', { x: 3 })).toBe(9);
    });

    it('avalia expressões compostas', () => {
      expect(evaluate('x + y * 2', { x: 1, y: 3 })).toBe(7);
    });
  });

  describe('proteção contra injeção', () => {
    it('não acessa process via expressão', () => {
      expect(() => evaluate('process.exit(0)')).toThrow();
    });

    it('não acessa globalThis', () => {
      expect(() => evaluate('globalThis.alert("pwned")')).toThrow();
    });

    it('não executa código JS via constructor', () => {
      expect(() => evaluate('constructor.constructor("return 1")()')).toThrow();
    });

    it('não acessa window', () => {
      expect(() => evaluate('window.location')).toThrow();
    });

    it('não acessa import', () => {
      expect(() => evaluate('import("fs")')).toThrow();
    });
  });

  describe('proteção contra DoS', () => {
    it('expressão inválida lança erro sem travar', () => {
      expect(() => evaluate('x +++')).toThrow();
    });

    it('expressão vazia retorna undefined (sem travar)', () => {
      // mathjs retorna undefined para string vazia — não lança, apenas retorna falsy
      expect(evaluate('')).toBeFalsy();
    });

    it('whitelist rejeita caracteres fora do alfabeto matemático', () => {
      // A whitelist bloqueia chars de injeção como aspas, ponto-e-vírgula, colchetes
      // A segurança real contra process.exit() etc. vem do parser próprio do mathjs (não usa eval JS)
      const MATH_SAFE_PATTERN = /^[0-9xyzts\s+\-*/^().,sincotgalbeqrtpifSvahg]+$/i;
      expect(MATH_SAFE_PATTERN.test('alert("pwned")')).toBe(false);   // " bloqueado
      expect(MATH_SAFE_PATTERN.test("require('fs')")).toBe(false);    // ' bloqueado
      expect(MATH_SAFE_PATTERN.test('x; drop table')).toBe(false);   // ; bloqueado
      expect(MATH_SAFE_PATTERN.test('sin(x) + x^2')).toBe(true);
    });
  });
});
