import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { IDBFactory } from 'fake-indexeddb'
import { SceneProvider } from './contexts/SceneContext'
import { FunctionsProvider } from './contexts/FunctionsContext'
import { SketchProvider, useSketch } from './useSketch'

vi.mock('../components/organisms/Board3d/spaceElements', () => ({
  reconstructElements: vi.fn(),
}))

beforeEach(() => {
  // Reinicia o IndexedDB com instância limpa a cada teste
  Object.defineProperty(globalThis, 'indexedDB', {
    value: new IDBFactory(),
    writable: true,
    configurable: true,
  });
})

afterEach(() => {
  vi.useRealTimers();
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SceneProvider>
    <FunctionsProvider>
      <SketchProvider>{children}</SketchProvider>
    </FunctionsProvider>
  </SceneProvider>
)

const renderSketch = () => renderHook(() => useSketch(), { wrapper })

const waitForReady = (result: ReturnType<typeof renderSketch>['result']) =>
  waitFor(() => expect(result.current.isLoading).toBe(false))

describe('useSketch', () => {
  // ─── getAllSketches ───────────────────────────────────────────────────────

  describe('getAllSketches', () => {
    it('retorna array com a sketch inicial criada automaticamente', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      const sketches = await act(() => result.current.getAllSketches())
      // O provider cria uma sketch inicial ao montar quando o DB está vazio
      expect(sketches.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ─── addSketch ────────────────────────────────────────────────────────────

  describe('addSketch', () => {
    it('persiste sketch e retorna com id gerado', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      let sketch: Awaited<ReturnType<typeof result.current.addSketch>>
      await act(async () => {
        sketch = await result.current.addSketch('Meu Sketch')
      })
      expect(sketch!).toBeDefined()
      expect(sketch!.id).toBeDefined()
      expect(sketch!.name).toBe('Meu Sketch')
    })

    it('sketch adicionado aparece em getAllSketches', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      const beforeCount = (await act(() => result.current.getAllSketches())).length
      await act(async () => {
        await result.current.addSketch('Sketch A')
      })
      const sketches = await act(() => result.current.getAllSketches())
      expect(sketches.length).toBe(beforeCount + 1)
      expect(sketches.some((s) => s.name === 'Sketch A')).toBe(true)
    })

    it('múltiplos sketches têm ids únicos', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      let sketchA: Awaited<ReturnType<typeof result.current.addSketch>>
      let sketchB: Awaited<ReturnType<typeof result.current.addSketch>>
      await act(async () => {
        sketchA = await result.current.addSketch('Sketch A')
        sketchB = await result.current.addSketch('Sketch B')
      })
      expect(sketchA!.id).not.toBe(sketchB!.id)
    })
  })

  // ─── getSketchById ────────────────────────────────────────────────────────

  describe('getSketchById', () => {
    it('retorna sketch correto pelo id', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      let added: Awaited<ReturnType<typeof result.current.addSketch>>
      await act(async () => {
        added = await result.current.addSketch('Sketch X')
      })
      const found = await act(() => result.current.getSketchById(added!.id))
      expect(found).not.toBeNull()
      expect(found!.name).toBe('Sketch X')
    })

    it('retorna null para id inexistente', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      const found = await act(() => result.current.getSketchById('id-fantasma'))
      expect(found).toBeNull()
    })
  })

  // ─── updateSketch ─────────────────────────────────────────────────────────

  describe('updateSketch', () => {
    it('modifica o nome do sketch atual sem criar duplicata', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      const beforeCount = (await act(() => result.current.getAllSketches())).length
      await act(async () => {
        await result.current.updateSketch({ name: 'Atualizado' })
      })
      const all = await act(() => result.current.getAllSketches())
      expect(all).toHaveLength(beforeCount)
      expect(all.some((s) => s.name === 'Atualizado')).toBe(true)
    })

    it('currentSketch reflete o nome atualizado', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      await act(async () => {
        await result.current.updateSketch({ name: 'Novo Nome' })
      })
      expect(result.current.currentSketch?.name).toBe('Novo Nome')
    })
  })

  // ─── deleteSketch ─────────────────────────────────────────────────────────

  describe('deleteSketch', () => {
    it('remove sketch e não retorna mais em getAllSketches', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      let added: Awaited<ReturnType<typeof result.current.addSketch>>
      await act(async () => {
        added = await result.current.addSketch('Sketch Extra')
      })
      // Switch to added sketch to avoid auto-create when deleting current
      await act(async () => {
        await result.current.updateSketch({ id: added!.id })
      })
      const beforeAll = await act(() => result.current.getAllSketches())
      const beforeCount = beforeAll.length

      // Delete a sketch that is not current to avoid auto-creation side-effect
      const notCurrent = beforeAll.find((s) => s.id !== result.current.currentSketch?.id)
      if (notCurrent) {
        await act(async () => {
          await result.current.deleteSketch(notCurrent.id)
        })
        const all = await act(() => result.current.getAllSketches())
        expect(all).toHaveLength(beforeCount - 1)
        expect(all.some((s) => s.id === notCurrent.id)).toBe(false)
      }
    })

    it('deletar sketch inexistente não causa erro', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      await expect(
        act(() => result.current.deleteSketch('nao-existe'))
      ).resolves.not.toThrow()
    })
  })

  // ─── getLatestSketch ──────────────────────────────────────────────────────

  describe('getLatestSketch', () => {
    it('retorna um sketch após o provider criar o inicial', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      // Provider always creates a sketch on mount when DB is empty
      const latest = await act(() => result.current.getLatestSketch())
      expect(latest).not.toBeNull()
    })

    it('retorna o sketch mais recente após adicionar vários', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      // Use future timestamps to guarantee they're newer than the initial sketch
      const now = Date.now()
      vi.setSystemTime(now + 1000)
      await act(async () => { await result.current.addSketch('Primeiro Extra') })
      vi.setSystemTime(now + 2000)
      await act(async () => { await result.current.addSketch('Segundo Extra') })
      const latest = await act(() => result.current.getLatestSketch())
      expect(latest!.name).toBe('Segundo Extra')
    })
  })

  // ─── queueElement / flushQueue ────────────────────────────────────────────

  describe('queueElement e flushQueue', () => {
    it('queueElement não atualiza elements imediatamente', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      const elementsBefore = result.current.elements.length
      act(() => {
        result.current.queueElement({ id: 'el-1' } as any)
      })
      // elements state should not change yet
      expect(result.current.elements.length).toBe(elementsBefore)
    })

    it('flushQueue sincroniza elementos enfileirados para o state', async () => {
      const { result } = renderSketch()
      await waitForReady(result)
      act(() => {
        result.current.queueElement({ id: 'el-flush-1' } as any)
        result.current.queueElement({ id: 'el-flush-2' } as any)
      })
      act(() => {
        result.current.flushQueue()
      })
      await waitFor(() => {
        expect(result.current.elements.some((e) => e.id === 'el-flush-1')).toBe(true)
      })
      expect(result.current.elements.some((e) => e.id === 'el-flush-2')).toBe(true)
    })
  })
})
