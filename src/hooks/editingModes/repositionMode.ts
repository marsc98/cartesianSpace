import { drawPositionIndicator } from '../../components/organisms/Board3d/spaceElements';
import type { EditingMode } from '../../types/editing';

export const repositionMode: EditingMode = {
  id: 'reposition',

  enter(ctx) {
    const { lastIntersected, sceneRef, editingArrowsRef, editingInteractorRef, setEditingInteractorIsActive, removeModal, modalId } = ctx;

    editingInteractorRef.current.active = true;
    editingInteractorRef.current.type = 'reposition';

    const positionIndicator = drawPositionIndicator(lastIntersected.current, sceneRef);
    editingArrowsRef.current = positionIndicator;

    setEditingInteractorIsActive?.(true);
    if (modalId) removeModal?.(modalId);
  },

  update() {},

  exit(ctx) {
    const { editingInteractorRef, editingArrowsRef } = ctx;
    editingInteractorRef.current.active = false;
    editingArrowsRef?.current?.remove();
  },
};
