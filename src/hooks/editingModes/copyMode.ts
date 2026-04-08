import type { EditingMode } from '../../types/editing';

export const copyMode: EditingMode = {
  id: 'copy',

  enter(ctx) {
    const { lastIntersected, sceneRef, editingInteractorRef } = ctx;

    let targetGroup = lastIntersected.current;
    while (targetGroup.parent && targetGroup.parent.type !== 'Scene') {
      if (
        targetGroup.parent.userData.isGroup ||
        targetGroup.parent.name.includes('group')
      ) {
        targetGroup = targetGroup.parent;
        break;
      }
      targetGroup = targetGroup.parent;
    }

    const groupCopy = targetGroup.clone();
    groupCopy.position.set(
      targetGroup.position.x + 10,
      targetGroup.position.y,
      targetGroup.position.z,
    );

    sceneRef.current.add(groupCopy);

    editingInteractorRef.current.type = 'copy';
    editingInteractorRef.current.active = true;
    lastIntersected.current = groupCopy;
  },

  update() {},

  exit(ctx) {
    const { editingInteractorRef } = ctx;
    editingInteractorRef.current.active = false;
  },
};
