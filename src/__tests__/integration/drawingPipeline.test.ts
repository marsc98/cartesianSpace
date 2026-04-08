import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { createTraceDescriptor } from '../../lib/drawing/traceDescriptor'
import { optimizeTraceDescriptor } from '../../lib/drawing/traceOptimizer'
import { runTracePipeline } from '../../lib/drawing/tracePipeline'
import { optimizeTrace } from '../../lib/wasm/index.js'

vi.mock('../../lib/wasm/index.js')

describe('Drawing Pipeline — Integração', () => {
  const mockOptimizeTrace = vi.mocked(optimizeTrace)

  const makeRawCoords = (count: number): Float32Array => {
    const coords = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      coords[i * 3] = i * 0.1
      coords[i * 3 + 1] = Math.sin(i * 0.5)
      coords[i * 3 + 2] = 0
    }
    return coords
  }

  const makeDeps = () => ({
    sceneRef: { current: new THREE.Scene() } as any,
    particleRef: { current: { id: null, group: null } } as any,
    persist: vi.fn(),
    onBeforeRender: vi.fn(),
    onAfterRender: vi.fn(),
  })

  beforeEach(() => {
    mockOptimizeTrace.mockReset()
  })

  it('pipeline completo: descriptor → optimizer → renderer → persist', () => {
    const rawCount = 10
    const fakePositions = new Float32Array(rawCount * 3).fill(1)
    mockOptimizeTrace.mockReturnValue(fakePositions)
    const deps = makeDeps()

    const descriptor = createTraceDescriptor({
      color: '#ff0000',
      size: 8,
      rawCoords: makeRawCoords(rawCount),
      rawCount,
    })

    const result = runTracePipeline(descriptor, deps)

    expect(mockOptimizeTrace).toHaveBeenCalledOnce()
    expect(deps.persist).toHaveBeenCalledOnce()
    expect(result).toEqual(
      expect.objectContaining({
        descriptor: expect.objectContaining({
          color: '#ff0000',
          size: 8,
        }),
        element: expect.objectContaining({
          element: 'optimizedTrace',
          type: 'traces',
          color: '#ff0000',
          positions: expect.any(Array),
        }),
      }),
    )
  })

  it('descriptor criado tem campos corretos que o optimizer usa', () => {
    const rawCount = 5
    const fakePositions = new Float32Array([1, 2, 3])
    mockOptimizeTrace.mockReturnValue(fakePositions)

    const descriptor = createTraceDescriptor({
      color: '#00ff00',
      size: 12,
      rawCoords: makeRawCoords(rawCount),
      rawCount,
    })

    // radius = size * 0.003 = 12 * 0.003 = 0.036
    optimizeTraceDescriptor(descriptor)

    const [, opts] = mockOptimizeTrace.mock.calls[0]
    expect((opts as any).radius).toBeCloseTo(0.036, 5)
  })

  it('pipeline não executa renderer quando optimizer retorna vazio', () => {
    mockOptimizeTrace.mockReturnValue(new Float32Array(0))
    const deps = makeDeps()

    const descriptor = createTraceDescriptor({
      color: '#ffffff',
      size: 5,
      rawCoords: makeRawCoords(3),
      rawCount: 3,
    })

    const result = runTracePipeline(descriptor, deps)

    expect(result).toBeNull()
    expect(deps.persist).not.toHaveBeenCalled()
    expect(deps.onAfterRender).not.toHaveBeenCalled()
  })

  it('ids de descriptors são únicos entre execuções do pipeline', () => {
    const fakePositions = new Float32Array([1, 2, 3])
    mockOptimizeTrace.mockReturnValue(fakePositions)

    const rawCoords = makeRawCoords(5)
    const params = { color: '#fff', size: 5, rawCoords, rawCount: 5 }

    const d1 = createTraceDescriptor(params)
    const d2 = createTraceDescriptor(params)

    expect(d1.id).not.toBe(d2.id)
  })

  it('pipeline com source "remote" propaga source no resultado', () => {
    const fakePositions = new Float32Array([1, 2, 3])
    mockOptimizeTrace.mockReturnValue(fakePositions)
    const deps = makeDeps()

    const descriptor = createTraceDescriptor({
      color: '#fff',
      size: 5,
      rawCoords: makeRawCoords(3),
      rawCount: 3,
      source: 'remote',
    })

    const result = runTracePipeline(descriptor, deps)

    expect(result!.descriptor.source).toBe('remote')
  })

  it('onAfterRender recebe o elemento real gerado pelo renderer', () => {
    const fakePositions = new Float32Array([1, 2, 3])
    mockOptimizeTrace.mockReturnValue(fakePositions)
    const deps = makeDeps()

    const descriptor = createTraceDescriptor({
      color: '#fff',
      size: 5,
      rawCoords: makeRawCoords(3),
      rawCount: 3,
    })

    runTracePipeline(descriptor, deps)

    expect(deps.onAfterRender).toHaveBeenCalledWith(
      expect.objectContaining({ positions: expect.any(Float32Array) }),
      expect.objectContaining({ element: 'optimizedTrace', type: 'traces', color: '#fff' }),
    )
  })
})
