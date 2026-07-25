import { drawPositionIndicator } from '../../components/organisms/Board3d/spaceElements';
import type { EditingMode } from '../../types/editing';
import { getTargetIds } from './getTargetIds';

export const repositionMode: EditingMode = {
  id: 'reposition',

  enter(ctx) {
    const { lastIntersected, sceneRef, editingArrowsRef, editingInteractorRef, setEditingInteractorIsActive, removeModal, modalId } = ctx;

    editingInteractorRef.current.active = true;
    editingInteractorRef.current.type = 'reposition';

    const ids = getTargetIds(ctx);
    editingInteractorRef.current.targetIds = ids;
    const target = ids.length > 0
      ? (sceneRef.current.children.find((c: any) => c.userData?.particleId === ids[0]) ?? lastIntersected.current)
      : lastIntersected.current;

    const positionIndicator = drawPositionIndicator(target, sceneRef);
    editingArrowsRef.current = positionIndicator;

    setEditingInteractorIsActive?.(true);
    if (modalId) removeModal?.(modalId);
  },

  update() {},

  exit(ctx) {
    const { editingInteractorRef, editingArrowsRef, setEditingInteractorIsActive } = ctx;
    editingInteractorRef.current.active = false;
    editingInteractorRef.current.targetIds = undefined;
    setEditingInteractorIsActive?.(false);
    editingArrowsRef?.current?.remove();
  },
};
