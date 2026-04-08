import { describe, it, expect, beforeEach, vi } from 'vitest'
import { safeGetItem, safeSetItem } from './storage'

describe('safeGetItem', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('retorna null para chave inexistente', () => {
    expect(safeGetItem('nao-existe')).toBeNull()
  })

  it('retorna o fallback fornecido para chave inexistente', () => {
    expect(safeGetItem('nao-existe', 'default')).toBe('default')
  })

  it('retorna o valor armazenado', () => {
    localStorage.setItem('key', 'value')
    expect(safeGetItem('key')).toBe('value')
  })

  it('retorna null (não lança) quando localStorage está indisponível', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceeded')
    })
    expect(safeGetItem('key')).toBeNull()
  })

  it('retorna fallback (não lança) quando localStorage está indisponível', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceeded')
    })
    expect(safeGetItem('key', 'fallback')).toBe('fallback')
  })
})

describe('safeSetItem', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persiste valor no localStorage', () => {
    safeSetItem('myKey', 'myValue')
    expect(localStorage.getItem('myKey')).toBe('myValue')
  })

  it('não lança quando localStorage está indisponível (modo privado)', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => safeSetItem('key', 'value')).not.toThrow()
  })

  it('sobrescreve valor existente', () => {
    localStorage.setItem('key', 'old')
    safeSetItem('key', 'new')
    expect(localStorage.getItem('key')).toBe('new')
  })
})
