import { useCallback, useRef } from 'react';
import * as THREE from 'three';

export const useDrawEvents = ({
  drawingRef,
  controlsRef,
  elementsRef,
  raycasterRef,
  mouseRef,
  cameraRef,
  activeCreativityRef,
  particleRef,
  sizeRef,
  colorRef,
  sceneRef,
  currentTraceSegmentsRef,
  lastIntersected,
  rendererRef,
  accumulatePoint,
  createTraceAlongPath,
  addElement,
  resetTrace,
  commitTrace,
  pushHistory,
  elementsStackRef,
}: any) => {
  // Pre-allocated vectors to avoid per-event GC pressure
  const workVec = useRef(new THREE.Vector3());
  const movementVec = useRef(new THREE.Vector3());
  const movementPathRef = useRef<THREE.Vector3[]>([movementVec.current]);

  const handleDrawMouseMove = useCallback(() => {
    if (!drawingRef.current) return;
    if (!controlsRef.current?.mouseDown) return;
    if (elementsRef.current.active) return;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const distance = 10;
    workVec.current
      .copy(raycasterRef.current.ray.direction)
      .multiplyScalar(distance)
      .add(cameraRef.current.position);

    if (controlsRef.current.controlPressed) {
      const zOffset = -mouseRef.current.y * distance;
      const currentZ = workVec.current.z + zOffset;
      activeCreativityRef.current.lastZ = currentZ;
      movementVec.current.set(workVec.current.x, workVec.current.y, currentZ);
    } else {
      const zValue =
        activeCreativityRef.current.lastZ !== undefined
          ? activeCreativityRef.current.lastZ
          : workVec.current.z;
      movementVec.current.set(workVec.current.x, workVec.current.y, zValue);
    }

    const activeId = activeCreativityRef.current.id;
    if (activeId === 'optimizedTrace' || activeId === '3dTrace') {
      accumulatePoint(movementVec.current.x, movementVec.current.y, movementVec.current.z);
      if (activeId === 'optimizedTrace') return;
    }

    const elementData = {
      element: activeCreativityRef.current.id,
      id: particleRef.current.id,
      type: activeCreativityRef.current.type,
      size: sizeRef.current,
      color: colorRef.current,
      position: movementPathRef.current,
      origin: {
        x: movementVec.current.x,
        y: movementVec.current.y,
        z: movementVec.current.z,
      },
    };

    const particles = createTraceAlongPath(
      elementData,
      particleRef,
      activeCreativityRef.current.id === '3dTrace'
        ? () => { }
        : (segment: any) => {
          addElement(segment);
          currentTraceSegmentsRef.current.push(segment);
        },
      false,
    );
    sceneRef.current.add(particles);
  }, [
    drawingRef,
    controlsRef,
    elementsRef,
    raycasterRef,
    mouseRef,
    cameraRef,
    activeCreativityRef,
    particleRef,
    sizeRef,
    colorRef,
    sceneRef,
    currentTraceSegmentsRef,
    accumulatePoint,
    createTraceAlongPath,
    addElement,
  ]);

  const handleDrawMouseDown = useCallback(
    (e: any) => {
      if (!drawingRef.current) return false;

      const sceneLengthStart = sceneRef?.current?.children?.length;

      particleRef.current = {
        id: `trace-${new Date().getTime()}`,
        sceneLengthStart,
      };
      currentTraceSegmentsRef.current = [];
      resetTrace();

      if (rendererRef.current?.domElement) {
        const rect = rendererRef.current.domElement.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Skip expensive full-scene raycasting during free drawing — lastIntersected
        // is not needed for draw mode and intersecting all children causes a CPU spike
        // at the start of each stroke.
        if (!drawingRef.current) {
          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
          const intersects = raycasterRef.current.intersectObjects(
            sceneRef.current.children,
            true,
          );

          if (intersects.length > 0) {
            lastIntersected.current = intersects[0].object;
          }
        }
      }

      return true;
    },
    [
      drawingRef,
      sceneRef,
      particleRef,
      currentTraceSegmentsRef,
      resetTrace,
      rendererRef,
      mouseRef,
      cameraRef,
      raycasterRef,
      lastIntersected,
    ]
  );

  const handleDrawMouseUp = useCallback(
    (e: any) => {
      if (!(drawingRef.current && e.button === 0)) return false;

      const sceneLengthEnd = sceneRef?.current?.children?.length;

      elementsStackRef?.current?.set(particleRef?.current?.id, {
        sceneLengthStart: particleRef?.current?.sceneLengthStart,
        sceneLengthEnd: sceneLengthEnd,
      });

      if (currentTraceSegmentsRef.current.length > 0) {
        pushHistory({
          action: 'add',
          element: currentTraceSegmentsRef.current,
        });
      }

      return true;
    },
    [
      drawingRef,
      activeCreativityRef,
      particleRef,
      sceneRef,
      elementsStackRef,
      currentTraceSegmentsRef,
      pushHistory,
    ]
  );

  return { handleDrawMouseMove, handleDrawMouseDown, handleDrawMouseUp };
};
