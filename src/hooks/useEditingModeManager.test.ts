import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEditingModeManager } from './useEditingModeManager'
import type { EditingMode, EditingModeContext } from '../types/editing'

const makeMode = (id: string): EditingMode => ({
  id,
  enter: vi.fn(),
  update: vi.fn(),
  exit: vi.fn(),
})

const fakeContext = {
  editingInteractorRef: { current: { type: '', active: true, previousX: 0, previousY: 0, initialX: null, initialY: null } },
  lastIntersected: { current: null },
  originalColor: { current: null },
  rotationRef: { current: { x: 0, y: 0, z: 0, active: false, previousX: 0, previousY: 0 } },
  sceneRef: { current: {} },
  editingArrowsRef: { current: null },
  isDraggingRef: { current: false },
} as unknown as EditingModeContext

describe('useEditingModeManager', () => {
  it('começa sem modo ativo', () => {
    const { result } = renderHook(() => useEditingModeManager())
    expect(result.current.activeMode).toBeNull()
  })

  it('activate muda o modo ativo', () => {
    const modeA = makeMode('mode-a')
    const { result } = renderHook(() => useEditingModeManager([modeA]))
    act(() => {
      result.current.activate('mode-a', fakeContext)
    })
    expect(result.current.activeMode).toBe('mode-a')
  })

  it('activate chama enter() do modo ativado', () => {
    const modeA = makeMode('mode-a')
    const { result } = renderHook(() => useEditingModeManager([modeA]))
    act(() => {
      result.current.activate('mode-a', fakeContext)
    })
    expect(modeA.enter).toHaveBeenCalledWith(fakeContext)
  })

  it('activate chama exit() do modo anterior antes de ativar o novo', () => {
    const modeA = makeMode('mode-a')
    const modeB = makeMode('mode-b')
    const { result } = renderHook(() => useEditingModeManager([modeA, modeB]))
    act(() => {
      result.current.activate('mode-a', fakeContext)
    })
    act(() => {
      result.current.activate('mode-b', fakeContext)
    })
    expect(modeA.exit).toHaveBeenCalledOnce()
    expect(modeB.enter).toHaveBeenCalledOnce()
    expect(result.current.activeMode).toBe('mode-b')
  })

  it('deactivate limpa o modo ativo', () => {
    const modeA = makeMode('mode-a')
    const { result } = renderHook(() => useEditingModeManager([modeA]))
    act(() => {
      result.current.activate('mode-a', fakeContext)
      result.current.deactivate()
    })
    expect(result.current.activeMode).toBeNull()
  })

  it('deactivate chama exit() do modo ativo', () => {
    const modeA = makeMode('mode-a')
    const { result } = renderHook(() => useEditingModeManager([modeA]))
    act(() => {
      result.current.activate('mode-a', fakeContext)
      result.current.deactivate()
    })
    expect(modeA.exit).toHaveBeenCalledWith(fakeContext)
  })

  it('deactivate sem modo ativo não causa erro', () => {
    const { result } = renderHook(() => useEditingModeManager())
    expect(() => {
      act(() => {
        result.current.deactivate()
      })
    }).not.toThrow()
  })

  it('dispatch encaminha evento para o modo ativo', () => {
    const modeA = makeMode('mode-a')
    const { result } = renderHook(() => useEditingModeManager([modeA]))
    const fakeEvent = { type: 'click' }
    act(() => {
      result.current.activate('mode-a', fakeContext)
      result.current.dispatch(fakeEvent)
    })
    expect(modeA.update).toHaveBeenCalledWith(fakeEvent, fakeContext)
  })

  it('dispatch sem modo ativo não causa erro', () => {
    const { result } = renderHook(() => useEditingModeManager())
    expect(() => {
      act(() => {
        result.current.dispatch({ type: 'click' })
      })
    }).not.toThrow()
  })

  it('register adiciona modo em tempo de execução', () => {
    const { result } = renderHook(() => useEditingModeManager())
    const dynamicMode = makeMode('dynamic')
    act(() => {
      result.current.register(dynamicMode)
      result.current.activate('dynamic', fakeContext)
    })
    expect(result.current.activeMode).toBe('dynamic')
    expect(dynamicMode.enter).toHaveBeenCalledOnce()
  })
})
