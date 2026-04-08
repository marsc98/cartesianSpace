import type { EditingMode } from '../../types/editing';

export const deleteMode: EditingMode = {
  id: 'delete',

  enter(ctx) {
    const { editingInteractorRef, lastIntersected, addModal, removeModal, deleteElement } = ctx;

    editingInteractorRef.current.type = 'delete';

    const particleId = lastIntersected.current.parent.userData.particleId;
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
