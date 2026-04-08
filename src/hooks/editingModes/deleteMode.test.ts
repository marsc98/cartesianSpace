import { describe, it, expect, vi } from 'vitest'
import { deleteMode } from './deleteMode'
import type { EditingModeContext } from '../../types/editing'

const makeCtx = (overrides: Partial<EditingModeContext> = {}): EditingModeContext => ({
  editingInteractorRef: { current: { type: '', active: true, previousX: 0, previousY: 0, initialX: null, initialY: null } } as any,
  lastIntersected: { current: { parent: { userData: { particleId: 'particle-123' } } } } as any,
  originalColor: { current: null } as any,
  rotationRef: { current: { x: 0, y: 0, z: 0, active: false, previousX: 0, previousY: 0 } } as any,
  sceneRef: { current: {} } as any,
  editingArrowsRef: { current: null } as any,
  isDraggingRef: { current: false } as any,
  addModal: vi.fn(),
  removeModal: vi.fn(),
  deleteElement: vi.fn(),
  ...overrides,
} as unknown as EditingModeContext)

describe('deleteMode', () => {
  it('id é "delete"', () => {
    expect(deleteMode.id).toBe('delete')
  })

  it('enter define editingInteractorRef.type como "delete"', () => {
    const ctx = makeCtx()
    deleteMode.enter(ctx)
    expect(ctx.editingInteractorRef.current.type).toBe('delete')
  })

  it('enter chama addModal com formId "delete-element-form"', () => {
    const ctx = makeCtx()
    deleteMode.enter(ctx)
    expect(ctx.addModal).toHaveBeenCalledOnce()
    const [modalConfig] = (ctx.addModal as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(modalConfig.formId).toBe('delete-element-form')
  })

  it('ação do modal chama deleteElement com particleId correto', () => {
    const ctx = makeCtx()
    deleteMode.enter(ctx)
    const [modalConfig] = (ctx.addModal as ReturnType<typeof vi.fn>).mock.calls[0]
    modalConfig.action()
    expect(ctx.deleteElement).toHaveBeenCalledWith('particle-123')
  })

  it('ação do modal chama removeModal', () => {
    const ctx = makeCtx()
    deleteMode.enter(ctx)
    const [modalConfig] = (ctx.addModal as ReturnType<typeof vi.fn>).mock.calls[0]
    modalConfig.action()
    expect(ctx.removeModal).toHaveBeenCalledOnce()
  })

  it('onClose do modal chama removeModal', () => {
    const ctx = makeCtx()
    deleteMode.enter(ctx)
    const [modalConfig] = (ctx.addModal as ReturnType<typeof vi.fn>).mock.calls[0]
    modalConfig.onClose()
    expect(ctx.removeModal).toHaveBeenCalledOnce()
  })

  it('exit define editingInteractorRef.active como false', () => {
    const ctx = makeCtx()
    deleteMode.exit(ctx)
    expect(ctx.editingInteractorRef.current.active).toBe(false)
  })

  // deleteMode.update is intentionally a no-op — delete is handled via modal action, not update loop
  it('update é no-op (não altera estado)', () => {
    const ctx = makeCtx()
    const activeBefore = ctx.editingInteractorRef.current.active
    deleteMode.update({} as any, ctx)
    expect(ctx.editingInteractorRef.current.active).toBe(activeBefore)
    expect(ctx.deleteElement).not.toHaveBeenCalled()
  })
})
