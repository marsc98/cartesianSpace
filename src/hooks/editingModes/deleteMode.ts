import { disposeMultipleObjects } from '../../components/organisms/Board3d/spaceElements';
import type { EditingMode } from '../../types/editing';
import { getParticleId } from './getParticleId';
import { getTargetIds } from './getTargetIds';

export const deleteMode: EditingMode = {
  id: 'delete',

  enter(ctx) {
    const { editingInteractorRef, lastIntersected, addModal, removeModal, deleteElement,
      sceneRef, elementsStackRef, pushHistory, deleteElementsById } = ctx;

    editingInteractorRef.current.type = 'delete';

    const ids = getTargetIds(ctx);
    if (ids.length === 0) return;

    if (ids.length > 1) {
      const id = `modal-delete-${Date.now()}`;
      addModal?.({
        id,
        isOpen: true,
        formId: 'delete-element-form',
        title: `Deseja realmente excluir esses ${ids.length} elementos?`,
        content: '',
        onClose: () => removeModal?.(id),
        stopWriting: () => {},
        action: () => {
          const groupId = lastIntersected.current?.userData?.groupId
            ?? lastIntersected.current?.parent?.userData?.groupId;
          const group = groupId ? { id: groupId, memberIds: ids } : null;
          pushHistory?.({ type: 'REMOVE_GROUP', group, elements: [] });
          if (elementsStackRef) {
            ids.forEach((particleId) => {
              disposeMultipleObjects(sceneRef, elementsStackRef, particleId);
            });
          }
          deleteElementsById?.(ids);
          removeModal?.(id);
        },
        buttonText: 'Deletar',
        buttonColor: 'green',
      });
      return;
    }

    if (!lastIntersected.current) return;
    const particleId = getParticleId(lastIntersected.current);
    if (!particleId) return;
    const id = `modal-delete-${Date.now()}`;

    addModal?.({
      id,
      isOpen: true,
      formId: 'delete-element-form',
      title: 'Deseja realmente excluir esse elemento?',
      content: '',
      onClose: () => removeModal?.(id),
      stopWriting: () => {},
      action: () => {
        deleteElement?.(particleId);
        removeModal?.(id);
      },
      buttonText: 'Deletar',
      buttonColor: 'green',
    });
  },

  update() {},

  exit(ctx) {
    const { editingInteractorRef } = ctx;
    editingInteractorRef.current.active = false;
  },
};
