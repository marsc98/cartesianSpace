import { describe, it, expect, vi } from 'vitest'
import { freeRepositionMode } from './freeRepositionMode'
import type { EditingModeContext } from '../../types/editing'

const makeCtx = (overrides: Partial<EditingModeContext> = {}): EditingModeContext => ({
  editingInteractorRef: { current: { type: '', active: false, previousX: 0, previousY: 0, initialX: null, initialY: null } } as any,
  lastIntersected: { current: {} } as any,
  originalColor: { current: null } as any,
  rotationRef: { current: { x: 0, y: 0, z: 0, active: false, previousX: 0, previousY: 0 } } as any,
  sceneRef: { current: {} } as any,
  editingArrowsRef: { current: { remove: vi.fn() } } as any,
  isDraggingRef: { current: false } as any,
  waitingForFirstInteractionRef: { current: false } as any,
  notify: vi.fn(),
  setEditingInteractorIsActive: vi.fn(),
  updateElementPosition: vi.fn(),
  ...overrides,
} as unknown as EditingModeContext)

vi.mock('../../components/organisms/Board3d/spaceElements', () => ({
  drawPositionIndicator: vi.fn(() => ({ remove: vi.fn() })),
}))

describe('freeRepositionMode', () => {
  it('id é "freeReposition"', () => {
    expect(freeRepositionMode.id).toBe('freeReposition')
  })

  it('enter define waitingForFirstInteractionRef como true', () => {
    const ctx = makeCtx()
    freeRepositionMode.enter(ctx)
    expect(ctx.waitingForFirstInteractionRef!.current).toBe(true)
  })

  it('enter chama notify com dragHand e duration: -1', () => {
    const ctx = makeCtx()
    freeRepositionMode.enter(ctx)
    expect(ctx.notify).toHaveBeenCalledWith('dragHand', 'neutral', { duration: -1 })
  })

  it('update não chama updateElementPosition quando isDragging é false', () => {
    const ctx = makeCtx()
    freeRepositionMode.update({ type: 'mousemove', clientX: 100, clientY: 200 }, ctx)
    expect(ctx.updateElementPosition).not.toHaveBeenCalled()
  })

  it('update chama updateElementPosition quando isDragging é true', () => {
    const ctx = makeCtx({ isDraggingRef: { current: true } as any })
    freeRepositionMode.update({ type: 'mousemove', clientX: 100, clientY: 200, controlPressed: false }, ctx)
    expect(ctx.updateElementPosition).toHaveBeenCalledWith(100, 200, false)
  })

  it('exit chama notify com universeNavigator', () => {
    const ctx = makeCtx()
    freeRepositionMode.exit(ctx)
    expect(ctx.notify).toHaveBeenCalledWith('universeNavigator', 'neutral')
  })
})
