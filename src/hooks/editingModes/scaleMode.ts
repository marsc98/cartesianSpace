import type { EditingMode } from '../../types/editing';

export const scaleMode: EditingMode = {
  id: 'scale',

  enter(ctx) {
    const { editingInteractorRef, setEditingInteractorIsActive, removeModal, modalId } = ctx;

    editingInteractorRef.current.active = true;
    editingInteractorRef.current.type = 'scale';

    setEditingInteractorIsActive?.(true);
    if (modalId) removeModal?.(modalId);
  },

  update() {},

  exit(ctx) {
    const { editingInteractorRef, lastIntersected, originalColor, setEditingInteractorIsActive } = ctx;
    editingInteractorRef.current.active = false;
    setEditingInteractorIsActive?.(false);
    if (lastIntersected.current?.material && originalColor.current) {
      lastIntersected.current.material.color.copy(originalColor.current);
    }
  },
};
