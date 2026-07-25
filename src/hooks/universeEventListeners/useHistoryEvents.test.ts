import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistoryEvents } from './useHistoryEvents'

vi.mock('../../components/organisms/Board3d/spaceElements', () => ({
  disposeMultipleObjects: vi.fn(),
  createTraceAlongPath: vi.fn(() => null),
}))

const makeHistory = () => ({ past: [] as any[], future: [] as any[] })

const makeDeps = (overrides: Record<string, any> = {}) => ({
  historyRef: { current: makeHistory() },
  setHistorySize: vi.fn(),
  elements: [],
  sceneRef: { current: { children: [] } },
  elementsStackRef: { current: new Map() },
  deleteElementsById: vi.fn(),
  notify: vi.fn(),
  particleRef: { current: { id: null, group: null } },
  addElement: vi.fn(),
  cartesianSpaceRef: { current: {} },
  handleCreativityOnSpace: vi.fn(),
  needsRenderRef: { current: false },
  setEditingInteractorIsActive: vi.fn(),
  updateMultipleElements: vi.fn(),
  updateElementById: vi.fn(),
  updateGroupsOnly: vi.fn(),
  sketchGroupsRef: { current: [] as any[] },
  ...overrides,
})

const render = (deps: ReturnType<typeof makeDeps>) =>
  renderHook(() => useHistoryEvents(deps))

describe('useHistoryEvents — comandos de agrupamento', () => {
  describe('GROUP_ELEMENTS', () => {
    it('undo: restaura snapshot e remove grupo', () => {
      const deps = makeDeps()
      const { result } = render(deps)

      const group = { id: 'g1', memberIds: ['a', 'b'] }
      const snapshot = [
        { id: 'a', groupId: undefined },
        { id: 'b', groupId: undefined },
      ]
      const command = { type: 'GROUP_ELEMENTS', group, snapshot }

      act(() => result.current.pushHistory(command))
      expect(deps.historyRef.current.past).toHaveLength(1)

      deps.sketchGroupsRef.current = [group]
      act(() => result.current.undo())

      expect(deps.updateMultipleElements).toHaveBeenCalledWith(snapshot)
      expect(deps.updateGroupsOnly).toHaveBeenCalledWith([])
    })

    it('redo: re-aplica groupId e re-adiciona grupo', () => {
      const deps = makeDeps()
      const { result } = render(deps)

      const group = { id: 'g1', memberIds: ['a', 'b'] }
      const snapshot = [{ id: 'a' }, { id: 'b' }]
      const command = { type: 'GROUP_ELEMENTS', group, snapshot }

      deps.historyRef.current.future.push(command)
      act(() => result.current.redo())

      expect(deps.updateMultipleElements).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'a', groupId: 'g1' }),
          expect.objectContaining({ id: 'b', groupId: 'g1' }),
        ]),
      )
      expect(deps.updateGroupsOnly).toHaveBeenCalledWith([group])
    })
  })

  describe('UNGROUP_ALL', () => {
    it('undo: re-aplica groupId a todos os membros e re-adiciona grupo', () => {
      const deps = makeDeps()
      const { result } = render(deps)

      const group = { id: 'g2', memberIds: ['x', 'y'] }
      const command = { type: 'UNGROUP_ALL', group }

      act(() => result.current.pushHistory(command))
      act(() => result.current.undo())

      expect(deps.updateMultipleElements).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'x', groupId: 'g2' }),
          expect.objectContaining({ id: 'y', groupId: 'g2' }),
        ]),
      )
      expect(deps.updateGroupsOnly).toHaveBeenCalledWith([group])
    })

    it('redo: remove groupId de todos os membros e remove grupo', () => {
      const deps = makeDeps()
      const { result } = render(deps)

      const group = { id: 'g2', memberIds: ['x', 'y'] }
      const snapshot = [{ id: 'x', groupId: undefined }, { id: 'y', groupId: undefined }]
      const command = { type: 'UNGROUP_ALL', group, snapshot }

      deps.historyRef.current.future.push(command)
      act(() => result.current.redo())

      expect(deps.updateMultipleElements).toHaveBeenCalledWith(snapshot)
      expect(deps.updateGroupsOnly).toHaveBeenCalledWith([])
    })
  })

  describe('UNGROUP_SINGLE', () => {
    it('undo: re-aplica groupId ao elemento', () => {
      const deps = makeDeps()
      const { result } = render(deps)

      const command = { type: 'UNGROUP_SINGLE', elementId: 'z', groupId: 'g3' }
      act(() => result.current.pushHistory(command))
      act(() => result.current.undo())

      expect(deps.updateElementById).toHaveBeenCalledWith('z', { groupId: 'g3' })
    })

    it('redo: remove groupId do elemento', () => {
      const deps = makeDeps()
      const { result } = render(deps)

      const command = { type: 'UNGROUP_SINGLE', elementId: 'z', groupId: 'g3' }
      deps.historyRef.current.future.push(command)
      act(() => result.current.redo())

      expect(deps.updateElementById).toHaveBeenCalledWith('z', { groupId: undefined })
    })
  })

  describe('REMOVE_GROUP', () => {
    it('undo: restaura elementos e grupo', () => {
      const deps = makeDeps()
      const { result } = render(deps)

      const group = { id: 'g4', memberIds: ['p', 'q'] }
      const elements = [{ id: 'p' }, { id: 'q' }]
      const command = { type: 'REMOVE_GROUP', group, elements }

      act(() => result.current.pushHistory(command))
      act(() => result.current.undo())

      expect(deps.handleCreativityOnSpace).toHaveBeenCalledTimes(2)
      expect(deps.updateGroupsOnly).toHaveBeenCalledWith([group])
    })

    it('redo: deleta elementos e remove grupo da lista', () => {
      const deps = makeDeps()
      const { result } = render(deps)

      const group = { id: 'g4', memberIds: ['p', 'q'] }
      const elements = [{ id: 'p' }, { id: 'q' }]
      const command = { type: 'REMOVE_GROUP', group, elements }

      deps.sketchGroupsRef.current = [group]
      deps.historyRef.current.future.push(command)
      act(() => result.current.redo())

      expect(deps.deleteElementsById).toHaveBeenCalledWith(['p', 'q'])
      expect(deps.updateGroupsOnly).toHaveBeenCalledWith([])
    })
  })

  describe('round-trip GROUP_ELEMENTS', () => {
    it('undo + redo restaura estado de grupo', () => {
      const deps = makeDeps()
      const { result } = render(deps)

      const group = { id: 'g5', memberIds: ['r', 's'] }
      const snapshot = [{ id: 'r' }, { id: 's' }]
      const command = { type: 'GROUP_ELEMENTS', group, snapshot }

      act(() => result.current.pushHistory(command))
      deps.sketchGroupsRef.current = [group]
      act(() => result.current.undo())

      expect(deps.updateGroupsOnly).toHaveBeenLastCalledWith([])

      deps.sketchGroupsRef.current = []
      act(() => result.current.redo())

      expect(deps.updateGroupsOnly).toHaveBeenLastCalledWith([group])
    })
  })
})
