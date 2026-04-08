import { drawPositionIndicator } from '../../components/organisms/Board3d/spaceElements';
import type { EditingMode, EditingModeContext } from '../../types/editing';

export const freeRepositionMode: EditingMode = {
  id: 'freeReposition',

  enter(ctx) {
    const { lastIntersected, sceneRef, editingArrowsRef, isDraggingRef, editingInteractorRef, fixModal } = ctx;

    editingInteractorRef.current.active = true;
    editingInteractorRef.current.type = 'freeReposition';
    isDraggingRef.current = true;

    const positionIndicator = drawPositionIndicator(lastIntersected.current, sceneRef);
    editingArrowsRef.current = positionIndicator;

    fixModal?.();
  },

  update(event?: any, ctx?: EditingModeContext) {
    if (event?.type !== 'mousemove' && event?.type !== 'touchmove') return;
    if (!ctx) return;
    const { updateElementPosition } = ctx;
    updateElementPosition?.(event.clientX, event.clientY, event.controlPressed);
  },

  exit(ctx) {
    const { isDraggingRef, editingInteractorRef, editingArrowsRef } = ctx;
    isDraggingRef.current = false;
    editingInteractorRef.current.active = false;
    editingArrowsRef?.current?.remove();
  },
};
