import { useCallback } from 'react';

export const useClipboardEvents = ({
  rendererRef,
  editingElementRef,
}: any) => {
  const handlePaste = useCallback(
    (e: any) => {
      const canvas = rendererRef.current?.domElement;
      if (!canvas) return;

      const clipboardData = e.clipboardData || (window as any).clipboardData;

      if (!clipboardData) {
        console.error('Clipboard data não disponível');
        return;
      }

      const text = clipboardData.getData('text/plain');
      const html = clipboardData.getData('text/html');
      const items = clipboardData.items;

      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            const imageUrl = URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
              URL.revokeObjectURL(imageUrl);
            };
            img.src = imageUrl;
          }
        }
      }

      // Suppress unused variable warnings — data is read but not logged
      void text;
      void html;

      if (editingElementRef.current.active) {
        editingElementRef.current.active = false;
      }

      e.preventDefault();
    },
    [rendererRef, editingElementRef],
  );

  return { handlePaste };
};
