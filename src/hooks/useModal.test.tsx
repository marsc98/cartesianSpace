import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { ModalProvider, useModal } from './useModal'
import type { ModalConfig } from '../types'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ModalProvider>{children}</ModalProvider>
)

const makeModalConfig = (overrides: Partial<ModalConfig> = {}): ModalConfig => ({
  formId: 'test-form',
  title: 'Test Modal',
  content: 'content',
  onClose: () => {},
  ...overrides,
})

describe('useModal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('começa com lista de modais vazia', () => {
    const { result } = renderHook(() => useModal(), { wrapper })
    expect(result.current.modalsList).toHaveLength(0)
  })

  it('addModal adiciona modal à lista', () => {
    const { result } = renderHook(() => useModal(), { wrapper })
    act(() => {
      result.current.addModal(makeModalConfig())
    })
    expect(result.current.modalsList).toHaveLength(1)
  })

  it('addModal não duplica modal do mesmo formId', () => {
    let tick = 200000
    vi.spyOn(Date, 'now').mockImplementation(() => tick++)
    const { result } = renderHook(() => useModal(), { wrapper })
    const config = makeModalConfig({ formId: 'unique-form' })
    // Separate act() so state updates between calls (modalTypeActive reads current state)
    act(() => { result.current.addModal(config) })
    act(() => { result.current.addModal(config) })
    vi.restoreAllMocks()
    expect(result.current.modalsList).toHaveLength(1)
  })

  it('removeModal remove modal pelo id', () => {
    const { result } = renderHook(() => useModal(), { wrapper })
    act(() => {
      result.current.addModal(makeModalConfig())
    })
    const id = result.current.modalsList[0].id
    act(() => {
      result.current.removeModal(id)
    })
    expect(result.current.modalsList).toHaveLength(0)
  })

  it('removeModal com id inexistente não causa erro', () => {
    const { result } = renderHook(() => useModal(), { wrapper })
    expect(() => {
      act(() => {
        result.current.removeModal('nao-existe')
      })
    }).not.toThrow()
  })

  it('múltiplos modais com formIds diferentes são empilhados', () => {
    const { result } = renderHook(() => useModal(), { wrapper })
    act(() => { result.current.addModal(makeModalConfig({ formId: 'form-a' })) })
    act(() => { result.current.addModal(makeModalConfig({ formId: 'form-b' })) })
    expect(result.current.modalsList).toHaveLength(2)
  })

  it('clearModaslList remove apenas modais não fixados', () => {
    // Mock Date.now to guarantee distinct ids even when calls happen in the same ms
    let tick = 100000
    vi.spyOn(Date, 'now').mockImplementation(() => tick++)
    const { result } = renderHook(() => useModal(), { wrapper })
    act(() => { result.current.addModal(makeModalConfig({ formId: 'form-a' })) })
    act(() => { result.current.addModal(makeModalConfig({ formId: 'form-b' })) })
    vi.restoreAllMocks()
    const idA = result.current.modalsList[0].id
    act(() => { result.current.fixModal(idA) })
    act(() => { result.current.clearModaslList() })
    expect(result.current.modalsList).toHaveLength(1)
    expect(result.current.modalsList[0].id).toBe(idA)
  })

  it('fixModal marca modal como fixo', () => {
    const { result } = renderHook(() => useModal(), { wrapper })
    act(() => {
      result.current.addModal(makeModalConfig())
    })
    const id = result.current.modalsList[0].id
    act(() => {
      result.current.fixModal(id)
    })
    expect(result.current.modalsList[0].fixed).toBe(true)
  })

  it('unfixModal desmarca modal fixo', () => {
    const { result } = renderHook(() => useModal(), { wrapper })
    act(() => {
      result.current.addModal(makeModalConfig())
    })
    const id = result.current.modalsList[0].id
    act(() => {
      result.current.fixModal(id)
      result.current.unfixModal(id)
    })
    expect(result.current.modalsList[0].fixed).toBe(false)
  })
})
