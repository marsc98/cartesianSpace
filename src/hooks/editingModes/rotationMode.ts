import type { EditingMode } from '../../types/editing';

export const rotationMode: EditingMode = {
  id: 'rotation',

  enter(ctx) {
    const { rotationRef, editingInteractorRef, setEditingInteractorIsActive, removeModal, modalId } = ctx;

    rotationRef.current.active = true;
    editingInteractorRef.current.active = true;
    editingInteractorRef.current.type = 'rotation';

    setEditingInteractorIsActive?.(true);
    if (modalId) removeModal?.(modalId);
  },

  update() {},

  exit(ctx) {
    const { rotationRef, editingInteractorRef, lastIntersected, originalColor, setEditingInteractorIsActive } = ctx;
    rotationRef.current.active = false;
    editingInteractorRef.current.active = false;
    setEditingInteractorIsActive?.(false);
    if (lastIntersected.current?.material && originalColor.current) {
      lastIntersected.current.material.color.copy(originalColor.current);
    }
  },
};
