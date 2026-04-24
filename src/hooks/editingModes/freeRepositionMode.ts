import { drawPositionIndicator } from '../../components/organisms/Board3d/spaceElements';
import type { EditingMode, EditingModeContext } from '../../types/editing';

export const freeRepositionMode: EditingMode = {
  id: 'freeReposition',

  enter(ctx) {
    const {
      lastIntersected, sceneRef, editingArrowsRef, isDraggingRef,
      editingInteractorRef, waitingForFirstInteractionRef,
      notify, setEditingInteractorIsActive,
    } = ctx;

    editingInteractorRef.current.active = true;
    editingInteractorRef.current.type = 'freeReposition';
    isDraggingRef.current = false;
    if (waitingForFirstInteractionRef) waitingForFirstInteractionRef.current = true;

    setEditingInteractorIsActive?.(false);
    notify?.('dragHand', 'neutral', { duration: -1 });

    const positionIndicator = drawPositionIndicator(lastIntersected.current, sceneRef);
    editingArrowsRef.current = positionIndicator;
  },

  update(event?: any, ctx?: EditingModeContext) {
    if (!ctx?.isDraggingRef?.current) return;
    if (event?.type !== 'mousemove' && event?.type !== 'touchmove') return;
    ctx.updateElementPosition?.(event.clientX, event.clientY, event.controlPressed);
  },

  exit(ctx) {
    const { isDraggingRef, editingInteractorRef, editingArrowsRef, notify } = ctx;
    isDraggingRef.current = false;
    editingInteractorRef.current.active = false;
    editingArrowsRef?.current?.remove();
    notify?.('universeNavigator', 'neutral');
  },
};
