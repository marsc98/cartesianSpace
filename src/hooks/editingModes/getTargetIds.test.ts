import { describe, it, expect, vi } from 'vitest';
import { getTargetIds } from './getTargetIds';
import type { EditingModeContext } from '../../types/editing';

const makeCtx = (overrides: Partial<EditingModeContext> = {}): EditingModeContext => ({
  editingInteractorRef: { current: { type: '', active: false, previousX: 0, previousY: 0, initialX: null, initialY: null } } as any,
  lastIntersected: { current: null } as any,
  originalColor: { current: null } as any,
  rotationRef: { current: { x: 0, y: 0, z: 0, active: false, previousX: 0, previousY: 0 } } as any,
  sceneRef: { current: {} } as any,
  editingArrowsRef: { current: null } as any,
  isDraggingRef: { current: false } as any,
  ...overrides,
} as unknown as EditingModeContext);

describe('getTargetIds', () => {
  it('prioriza temporarySelectionIds quando preenchido', () => {
    const ctx = makeCtx({
      temporarySelectionIds: ['a', 'b', 'c'],
      lastIntersected: { current: { userData: { particleId: 'x', groupId: 'g1' } } } as any,
      getGroupMembers: vi.fn(() => [{ id: 'g-member' }] as any),
    });
    expect(getTargetIds(ctx)).toEqual(['a', 'b', 'c']);
  });

  it('retorna membros do grupo quando lastIntersected tem groupId e getGroupMembers disponível', () => {
    const getGroupMembers = vi.fn(() => [{ id: 'm1' }, { id: 'm2' }] as any);
    const ctx = makeCtx({
      lastIntersected: { current: { userData: { particleId: 'p1', groupId: 'g1' } } } as any,
      getGroupMembers,
    });
    expect(getTargetIds(ctx)).toEqual(['m1', 'm2']);
    expect(getGroupMembers).toHaveBeenCalledWith('g1');
  });

  it('ignora groupId quando individualMode=true', () => {
    const ctx = makeCtx({
      individualMode: true,
      lastIntersected: { current: { userData: { particleId: 'p1', groupId: 'g1' } } } as any,
      getGroupMembers: vi.fn(() => [{ id: 'm1' }] as any),
    });
    expect(getTargetIds(ctx)).toEqual(['p1']);
  });

  it('retorna particleId do elemento individual sem grupo', () => {
    const ctx = makeCtx({
      lastIntersected: { current: { userData: { particleId: 'p1' } } } as any,
    });
    expect(getTargetIds(ctx)).toEqual(['p1']);
  });

  it('retorna [] quando lastIntersected é null', () => {
    const ctx = makeCtx({
      lastIntersected: { current: null } as any,
    });
    expect(getTargetIds(ctx)).toEqual([]);
  });

  it('retorna [] quando temporarySelectionIds está vazio e sem intersecção', () => {
    const ctx = makeCtx({
      temporarySelectionIds: [],
      lastIntersected: { current: null } as any,
    });
    expect(getTargetIds(ctx)).toEqual([]);
  });
});
