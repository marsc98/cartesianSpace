import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useNotifications from './useNotifications'

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('começa sem notificação', () => {
    const { result } = renderHook(() => useNotifications())
    expect(result.current.notification).toBeNull()
  })

  it('notify define uma notificação', () => {
    const { result } = renderHook(() => useNotifications())
    act(() => {
      result.current.notify('check', 'success')
    })
    expect(result.current.notification).not.toBeNull()
    expect(result.current.notification!.iconName).toBe('check')
    expect(result.current.notification!.variant).toBe('success')
    expect(result.current.notification!.exiting).toBe(false)
  })

  it('notificação recebe id único', () => {
    const { result } = renderHook(() => useNotifications())
    act(() => {
      result.current.notify('icon', 'info')
    })
    expect(typeof result.current.notification!.id).toBe('number')
  })

  it('notificação entra em estado exiting após duration', () => {
    const { result } = renderHook(() => useNotifications())
    act(() => {
      result.current.notify('icon', 'info', { duration: 1000 })
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.notification!.exiting).toBe(true)
  })

  it('notificação é null após duration + 400ms', () => {
    const { result } = renderHook(() => useNotifications())
    act(() => {
      result.current.notify('icon', 'info', { duration: 1000 })
    })
    act(() => {
      vi.advanceTimersByTime(1400)
    })
    expect(result.current.notification).toBeNull()
  })

  it('segunda chamada a notify substitui a primeira', () => {
    const { result } = renderHook(() => useNotifications())
    act(() => {
      result.current.notify('icon-a', 'info')
    })
    act(() => {
      result.current.notify('icon-b', 'warning')
    })
    expect(result.current.notification!.iconName).toBe('icon-b')
    expect(result.current.notification!.variant).toBe('warning')
  })

  it('segunda chamada a notify reseta os timers', () => {
    const { result } = renderHook(() => useNotifications())
    act(() => {
      result.current.notify('icon-a', 'info', { duration: 500 })
    })
    act(() => {
      vi.advanceTimersByTime(400)
    })
    act(() => {
      result.current.notify('icon-b', 'success', { duration: 1000 })
    })
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(result.current.notification!.iconName).toBe('icon-b')
    expect(result.current.notification!.exiting).toBe(false)
  })

  it('aceita style customizado', () => {
    const { result } = renderHook(() => useNotifications())
    act(() => {
      result.current.notify('icon', 'info', { style: 'custom-style' })
    })
    expect(result.current.notification!.style).toBe('custom-style')
  })
})
