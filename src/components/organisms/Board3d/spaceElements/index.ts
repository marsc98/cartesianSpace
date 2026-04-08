// TODO: Fase 5 — modularizar _legacy.ts
export { createRealisticStarfield } from './starfield';
export { addTextToScene, addPaperToScene } from './textHandling';
export { 
  removeParticlesByid,
  disposeMultipleObjects,
  reconstructElements,
  detectClickIntersection
} from './interaction';
export { createTraceAlongPath, createOptimizedTrace } from './drawingHelpers';

export {
  handleCreativityOnSpace,
  addImageToScene,
  drawRuler,
  drawPositionIndicator,
  drawElementSelectionIndicator,
  drawBlackboard,
} from './geometryHelpers';
