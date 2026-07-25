import { drawPositionIndicator } from '../../components/organisms/Board3d/spaceElements';
import type { EditingMode, EditingModeContext } from '../../types/editing';
import { getTargetIds } from './getTargetIds';

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

    const ids = getTargetIds(ctx);
    editingInteractorRef.current.targetIds = ids;

    const target = ids.length > 0
      ? (sceneRef.current.children.find((c: any) => c.userData?.particleId === ids[0]) ?? lastIntersected.current)
      : lastIntersected.current;

    const positionIndicator = drawPositionIndicator(target, sceneRef);
    editingArrowsRef.current = positionIndicator;
  },

  update(event?: any, ctx?: EditingModeContext) {
    if (!ctx?.isDraggingRef?.current) return;
    if (event?.type !== 'mousemove' && event?.type !== 'touchmove') return;

    const primary = (ctx.lastIntersected?.current as any)?.parent;
    const prevPos = primary
      ? { x: primary.position.x, y: primary.position.y, z: primary.position.z }
      : null;

    ctx.updateElementPosition?.(event.clientX, event.clientY, event.controlPressed);

    const targetIds = ctx.editingInteractorRef?.current?.targetIds;
    if (!prevPos || !targetIds || targetIds.length <= 1 || !ctx.sceneRef?.current) return;

    const dx = primary.position.x - prevPos.x;
    const dy = primary.position.y - prevPos.y;
    const dz = primary.position.z - prevPos.z;
    if (dx === 0 && dy === 0 && dz === 0) return;

    for (const id of targetIds.slice(1)) {
      const obj = ctx.sceneRef.current.children.find((c: any) => c.userData?.particleId === id);
      if (obj) {
        obj.position.x += dx;
        obj.position.y += dy;
        obj.position.z += dz;
      }
    }
  },

  exit(ctx) {
    const { isDraggingRef, editingInteractorRef, editingArrowsRef, notify } = ctx;
    isDraggingRef.current = false;
    editingInteractorRef.current.active = false;
    editingArrowsRef?.current?.remove();
    notify?.('universeNavigator', 'neutral');
  },
};
