import type { EditingMode } from '../../types/editing';
import { getTargetIds } from './getTargetIds';

export const scaleMode: EditingMode = {
  id: 'scale',

  enter(ctx) {
    const { editingInteractorRef, setEditingInteractorIsActive, removeModal, modalId } = ctx;

    editingInteractorRef.current.active = true;
    editingInteractorRef.current.type = 'scale';
    editingInteractorRef.current.targetIds = getTargetIds(ctx);

    setEditingInteractorIsActive?.(true);
    if (modalId) removeModal?.(modalId);
  },

  update() {},

  exit(ctx) {
    const { editingInteractorRef, lastIntersected, originalColor, setEditingInteractorIsActive } = ctx;
    editingInteractorRef.current.active = false;
    editingInteractorRef.current.targetIds = undefined;
    setEditingInteractorIsActive?.(false);
    if (lastIntersected.current?.material && originalColor.current) {
      lastIntersected.current.material.color.copy(originalColor.current);
    }
  },
};
