import type { EditingMode } from '../../types/editing';

export const animationMode: EditingMode = {
  id: 'animation',

  enter(ctx) {
    const { editingInteractorRef, addModal, removeModal, animationContent } = ctx;

    editingInteractorRef.current.active = true;
    editingInteractorRef.current.type = 'animation';

    if (addModal && animationContent) {
      const id = `modal-animation-${Date.now()}`;
      addModal({
        id,
        isOpen: true,
        title: 'Animação de Elemento',
        formId: 'animation-form',
        content: animationContent,
        onClose: () => removeModal?.(id),
        stopWriting: () => {},
        buttonText: '',
        buttonColor: 'blue',
      });
    }
  },

  update() {},

  exit(ctx) {
    const { editingInteractorRef } = ctx;
    editingInteractorRef.current.active = false;
  },
};
