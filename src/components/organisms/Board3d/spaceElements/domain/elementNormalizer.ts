// Zero imports. Testável com Node.js puro.

export function normalizeElementData(elementData, isRebuild) {
  if (!elementData?.element || !elementData?.color || !elementData?.size) return null;

  const id = isRebuild
    ? elementData.id
    : `${elementData.element}-${Date.now()}`;

  return {
    ...elementData,
    id,
    scale: {
      x: elementData?.size?.x ?? elementData.size,
      y: elementData?.size?.y ?? elementData.size,
      z: elementData?.size?.z ?? elementData.size,
    },
    rotation: {
      x: elementData?.rotation?.x ?? 0,
      y: elementData?.rotation?.y ?? 0,
      z: elementData?.rotation?.z ?? 0,
    },
  };
}
