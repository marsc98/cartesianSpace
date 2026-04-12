import { useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useDrawing } from './contexts/DrawingContext';
import { useElements } from './contexts/ElementsContext';
import { useUI } from './contexts/UIContext';
import { useScene } from './contexts/SceneContext';
import { useHistory } from './contexts/HistoryContext';
import { useCamera } from './contexts/CameraContext';
import { useFunctionsRefs } from './contexts/FunctionsContext';
import { useSession } from './contexts/SessionContext';
import {
  createTraceAlongPath,
  detectClickIntersection,
} from '../components/organisms/Board3d/spaceElements';
import { createParticleSpheresAlongPath } from '../components/organisms/Board3d/basicGeometryElements';
import { useSketch } from './useSketch';
import { loadTraceWasm } from '../lib/wasm/index.js';
import { useDrawingPipeline } from './useDrawingPipeline';
import { useHistoryEvents } from './universeEventListeners/useHistoryEvents';
import { useClipboardEvents } from './universeEventListeners/useClipboardEvents';
import { useKeyboardEvents } from './universeEventListeners/useKeyboardEvents';
import { useCameraEvents } from './universeEventListeners/useCameraEvents';
import { useDrawEvents } from './universeEventListeners/useDrawEvents';
import { useCreationEvents } from './universeEventListeners/useCreationEvents';
import type { UniverseContext } from '../types/universe';
import type { TraceDescriptor, AnyElement } from '../types';

export const useUniverseEventListeners = (ctx: UniverseContext) => {
  const {
    handleCloseModal,
    addTextToScene,
    isPointInsideCube,
    addCubeToCartesianSpace,
    handleEditing,
    handleCreativityOnSpace,
    identifyFace,
    moveCamera,
    rotateCamera,
    addNewCube,
    addText,
    handleDraw,
    handleCartesianSpaceDraw,
    handleFunctionsControls,
    handleSpaceClean,
    handleInfo,
    updateElementPosition,
    stopDragging,
    handleCreativity,
    handleElementRotation,
    stopRotation,
    handleStopAll,
    handleElementsSelection,
    handleElementResize,
    stopResize,
    handleMountains,
    handleSavedScenes,
    updateSketch,
    handleCalculator,
    handleMarkPosition,
    handleRuler,
    notify,
    setUiHidden,
    setIsDrawing,
    setIsWriting,
    setEditingInteractorIsActive,
  } = ctx;
  const {
    setLinePoints, awaitingSecondClick, setAwaitingSecondClick, linePoints,
    drawingRef, drawingStartedRef, colorRef, lineBetweenPointsRef, drawerRef,
    drawingElementRef, initialElementsCoordinatesRef, currentTraceSegmentsRef,
    activeCreativityRef, sizeRef, planesRef,
  } = useDrawing();

  // Ref estável para linePoints — evita que handleBoardClick invalide a cada clique
  const linePointsRef = useRef(linePoints);
  linePointsRef.current = linePoints;

  const {
    elementsIsActive, setIsResizingElement, setElementsIsActive,
    elementsRef, searchingFacesRef, searchingPointRef, editingElementRef,
    isDraggingRef, editingInteractorRef, selectedTerrainRef, editingArrowsRef,
    lastIntersected,
  } = useElements();

  const { setIsOwnCursorActive, modalIsOpenRef } = useUI();

  const {
    planeCubesRef, sceneRef, rendererRef, elementsStackRef,
    historyRef, particleRef, blackBoardRef, needsRenderRef,
  } = useScene();

  const { setHistorySize } = useHistory();

  const { cameraRef, raycasterRef, mouseRef, controlsRef, speedRefectorRef, rotationRef } = useCamera();

  const { axisRef, fontRef, writingRef, textRef, functionRef, cartesianSpaceRef, functionsRef } = useFunctionsRefs();

  const { startCounter, stopCounter, resetCounter } = useSession();

  const { addElement, queueElement, flushQueue, deleteElementsById, elements } =
    useSketch();

  useEffect(() => {
    loadTraceWasm().catch(console.error);
  }, []);

  // Reusable Three.js objects — avoid per-event allocations (GC pressure)
  const _planeNormalRef = useRef(new THREE.Vector3());
  const _planePositionRef = useRef(new THREE.Vector3());
  const _planeRef = useRef(new THREE.Plane());
  const _intersectionPointRef = useRef(new THREE.Vector3());

  const drawingPipelineDepsRef = useRef({
    colorRef,
    sizeRef,
    sceneRef,
    particleRef,
    persist: null as unknown as (el: AnyElement) => AnyElement,
    onAfterRender: null as unknown as (_descriptor: TraceDescriptor, el: AnyElement) => void,
  });
  drawingPipelineDepsRef.current.persist = queueElement;
  drawingPipelineDepsRef.current.onAfterRender = (_descriptor, el) => {
    currentTraceSegmentsRef.current.push(el);
  };

  const { accumulatePoint, commitTrace, commit3dTrace, reset: resetTrace } =
    useDrawingPipeline(drawingPipelineDepsRef.current);

  /**
   * Creates a visual sphere marker at a given 3D position.
   * Returns the mesh so the caller can dispose it when done.
   */
  const addPointMarker = useCallback(
    (position, color) => {
      if (!sceneRef.current) return null;
      const geometry = new THREE.SphereGeometry(1, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(position);
      sceneRef.current.add(sphere);
      return sphere;
    },
    [sceneRef],
  );

  const removePointMarker = useCallback(
    (sphere: THREE.Mesh) => {
      if (!sceneRef.current || !sphere) return;
      sceneRef.current.remove(sphere);
      sphere.geometry.dispose();
      if (sphere.material instanceof THREE.Material) sphere.material.dispose();
    },
    [sceneRef],
  );

  const preventContextMenu = useCallback((e: Event) => e.preventDefault(), []);

  const { pushHistory, deleteElement, replayTrace, undo, redo } = useHistoryEvents({
    historyRef,
    setHistorySize,
    elements,
    sceneRef,
    elementsStackRef,
    deleteElementsById,
    notify,
    particleRef,
    addElement,
    cartesianSpaceRef,
    handleCreativityOnSpace,
    needsRenderRef,
    setEditingInteractorIsActive,
  });

  const { handleWheel, handleCameraDrag } = useCameraEvents(ctx, { controlsRef });

  const {
    handleDrawMouseMove: handleBoardMovement,
    handleDrawMouseDown,
    handleDrawMouseUp,
  } = useDrawEvents({
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
  });

  /**
   * Centraliza a lógica de criação de elementos no espaço (click action)
   */
  const handleBoardClick = useCallback(
    (intersectionPoint: any, clientX: number, clientY: number) => {
      if (!intersectionPoint && !elementsIsActive) return;
      if (drawerRef.current.active) return;

      const isLine = elementsRef?.current?.shape === 'line';

      // Lógica para criar elementos
      if (
        (!awaitingSecondClick && !isLine) ||
        (awaitingSecondClick && isLine)
      ) {
        setIsResizingElement(true);
        initialElementsCoordinatesRef.current = {
          x: clientX,
          y: clientY,
        };

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const distance = 10;
        const point = raycasterRef.current.ray.direction
          .clone()
          .multiplyScalar(distance)
          .add(cameraRef.current.position);

        let elementData: any = {
          size: sizeRef.current * 0.2,
          color: colorRef.current,
          position: {
            x: point.x,
            y: point.y,
            z: point.z,
          },
          origin: {
            x: point.x,
            y: point.y,
            z: point.z,
          },
          element: elementsRef?.current?.shape,
          type: elementsRef?.current?.type || 'shapes',
          lineSize: cartesianSpaceRef?.current?.lineSize,
          numLines: cartesianSpaceRef?.current?.numLines,
          text: textRef.current.value,
          font: fontRef.current,
          interval: functionRef.current.interval,
          inputedFunction: functionRef.current.value,
          pointsSize: functionsRef.current.pointsSize,
          plane: selectedTerrainRef.current,
        };

        if (elementsRef?.current?.shape === 'line' && awaitingSecondClick) {
          elementData = {
            ...elementData,
            position: [linePointsRef.current[0], intersectionPoint],
          };

          if (controlsRef?.current?.controlPressed) {
            const newPoint = raycasterRef.current.intersectObjects(
              sceneRef.current.children,
            )?.[0]?.point;
            elementData = {
              ...elementData,
              position: [linePointsRef.current[0], newPoint],
            };
          }
        }

        if (controlsRef?.current?.controlPressed && !isLine) {
          const intersects = raycasterRef.current.intersectObjects(
            sceneRef.current.children,
          );
          const newPoint = intersects?.[0]?.point;
          elementData = {
            ...elementData,
            position: newPoint,
          };
        }

        const drawingElement = handleCreativityOnSpace(
          elementData,
          sceneRef,
          elementsStackRef,
          cartesianSpaceRef,
          addElement,
          false,
          pushHistory,
        );
        drawingElementRef.current = drawingElement;

        textRef.current.value = '';

        if (elementsRef.current.shape === 'functions') {
          const id = `function-list-${Date.now()}`;
          functionsRef.current = [
            ...functionsRef.current,
            {
              text: functionRef.current.value,
              color: colorRef.current,
              coordinates: elementData.position,
              id: id.toString(),
            },
          ];
        }

        writingRef.current = false;
        setIsWriting(false);

        const shouldCleanInteraction = [
          'text',
          'axis',
          'functions',
          'plane',
          '2D',
          '3D',
          'blackboard',
        ].includes(elementsRef?.current?.shape);

        if (
          !shouldCleanInteraction &&
          elementsRef.current.type !== 'traces' &&
          !isLine
        ) {
          drawingElementRef?.current?.lookAt(cameraRef.current.position);
        }

        if (elementsIsActive && shouldCleanInteraction) {
          searchingPointRef.current = false;
          setElementsIsActive(false);
          elementsRef.current.active = false;
          drawingRef.current = false;
          setIsDrawing(false);
          return;
        }

        if (isLine) {
          setAwaitingSecondClick(false);
          setLinePoints([]);
        }

        return;
      } else {
        if (elementsIsActive && elementsRef.current?.shape !== 'line') {
          setIsResizingElement(false);
          drawingElementRef.current = null;
        }
        setAwaitingSecondClick(true);

        if (controlsRef?.current?.controlPressed) {
          const newPoint = raycasterRef.current.intersectObjects(
            sceneRef.current.children,
          )?.[0]?.point;
          setLinePoints([newPoint]);
        } else {
          setLinePoints([intersectionPoint]);
        }
      }
    },
    [
      awaitingSecondClick,
      elementsIsActive,
      handleCreativityOnSpace,
      pushHistory,
      setAwaitingSecondClick,
      setIsResizingElement,
      setLinePoints,
      setElementsIsActive,
    ],
  );

  // handleBoardMovement is now provided by useDrawEvents

  /**
   * Verifica se o ponto clicado está sobre um cubo de plano cartesiano.
   * Extraído como useCallback para ser reutilizado em handleMouseDown e handleTouchStart.
   */
  const checkIfClickIsOnPlaneCube = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = rendererRef.current?.domElement;
      if (!canvas) return undefined;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children);
      return planeCubesRef.current.find((cube) =>
        isPointInsideCube(intersects?.[0]?.point, cube?.point),
      );
    },
    [rendererRef, mouseRef, raycasterRef, cameraRef, sceneRef, planeCubesRef, isPointInsideCube],
  );

  /**
   * Handles actions when the mouse button is pressed down.
   */
  const handleMouseDown = useCallback(
    (e) => {
      const controls = controlsRef.current;
      const canvas = rendererRef.current?.domElement;
      if (!canvas) return;

      if (searchingPointRef.current && searchingFacesRef.current) {
        const intersected = detectClickIntersection(
          e,
          cameraRef.current,
          sceneRef.current,
          rendererRef.current,
        );
        if (intersected.length > 0) {
          handleEditing();
        } else {
          searchingPointRef.current = false;
          searchingFacesRef.current = false;
        }
      }

      editingElementRef.current.initPressTime = Date.now();
      editingElementRef.current.initCoordinates = {
        x: e.clientX,
        y: e.clientY,
      };

      startCounter();

      controls.mouseDown = true;
      handleDrawMouseDown(e);

      if (!drawingRef.current) {
        controls.mouseMoving = false;
        controls.lastX = e.clientX;
        controls.lastY = e.clientY;
        controls.rightButton = e.button === 2;
      }

      const cubeObj = checkIfClickIsOnPlaneCube(e.clientX, e.clientY);
      if (
        cubeObj?.cube &&
        axisRef.current &&
        controlsRef.current.controlPressed
      ) {
        lineBetweenPointsRef.current.push(cubeObj?.point);
        if (lineBetweenPointsRef.current.length === 2) {
          handleCreativityOnSpace(
            {
              element: 'line',
              color: colorRef.current,
              size: sizeRef.current,
              position: [
                lineBetweenPointsRef.current[0],
                lineBetweenPointsRef.current[1],
              ],
              origin: {
                x: (lineBetweenPointsRef.current[0].x + lineBetweenPointsRef.current[1].x) / 2,
                y: (lineBetweenPointsRef.current[0].y + lineBetweenPointsRef.current[1].y) / 2,
                z: (lineBetweenPointsRef.current[0].z + lineBetweenPointsRef.current[1].z) / 2,
              },
            },
            sceneRef,
            elementsStackRef,
            cartesianSpaceRef,
            addElement,
            false,
            pushHistory,
          );
          lineBetweenPointsRef.current = [];
        }
      }

      if (
        !drawingRef.current &&
        !cubeObj?.cube &&
        axisRef.current &&
        controlsRef.current.controlPressed
      ) {
        addCubeToCartesianSpace(
          e,
          mouseRef,
          cameraRef,
          sceneRef,
          raycasterRef,
          planeCubesRef,
        );
      }

      const now = new Date().getTime();
      const isDoubleClick = now - controls.lastClickTime < 300;

      if (isDoubleClick) {
        const rect = rendererRef.current.domElement.getBoundingClientRect();

        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(
          sceneRef.current.children,
          true,
        );

        if (intersects.length > 0) {
          const intersected = intersects[0].object;
          lastIntersected.current = intersected;

          handleEditing();
        }
      }
      controls.lastClickTime = now;

      e.preventDefault();
    },
    [
      addCubeToCartesianSpace,
      addTextToScene,
      checkIfClickIsOnPlaneCube,
      handleCloseModal,
      handleEditing,
      startCounter,
    ],
  );

  /**
   * Handles actions when the mouse button is released.
   */
  const handleMouseUp = useCallback(
    async (e) => {
      const canvas = rendererRef.current?.domElement;
      if (!canvas) return;

      if (
        editingElementRef.current.active &&
        editingElementRef.current.type === 'copy'
      ) {
        editingElementRef.current.active = false;
      }

      controlsRef.current.mouseDown = false;

      if (isDraggingRef.current) {
        stopDragging();
      }

      if (editingInteractorRef.current.type === 'freeReposition') {
        editingArrowsRef?.current?.remove();
      }

      if (drawingRef.current && e.button === 0) {
        if (
          activeCreativityRef.current.id === 'optimizedTrace' ||
          activeCreativityRef.current.id === '3dTrace'
        ) {
          const tempGroup = particleRef.current.group;
          if (tempGroup) {
            sceneRef.current.remove(tempGroup);
            tempGroup.traverse((obj) => {
              if ((obj as any).geometry) (obj as any).geometry.dispose();
              if ((obj as any).material) (obj as any).material.dispose();
            });
            particleRef.current.group = null;
          }
          if (activeCreativityRef.current.id === '3dTrace') {
            const result = commit3dTrace();
            if (result?.element) {
              particleRef.current = { id: result.element.id, group: null };
              const flat = result.element.positions as number[];
              const positions3d: { x: number; y: number; z: number }[] = [];
              for (let i = 0; i < flat.length / 3; i++) {
                positions3d.push({ x: flat[i * 3], y: flat[i * 3 + 1], z: flat[i * 3 + 2] });
              }
              const group = createParticleSpheresAlongPath({
                particlesPerSphere: 100,
                sphereRadius: result.element.size * 0.008,
                particleSize: 0.1,
                particleColor: result.element.color,
                position: positions3d,
              }, particleRef);
              if (group) sceneRef.current.add(group);
              currentTraceSegmentsRef.current.push(result.element);
            }
          } else {
            commitTrace();
          }
        }

        const sceneLengthEnd = sceneRef?.current?.children?.length;

        elementsStackRef?.current?.set(particleRef?.current?.id, {
          sceneLengthStart: particleRef?.current?.sceneLengthStart,
          sceneLengthEnd: sceneLengthEnd,
        });

        if (currentTraceSegmentsRef.current.length > 0) {
          pushHistory({
            type: 'ADD_ELEMENT',
            element: {
              id: particleRef.current.id,
              type: 'traces',
              segments: [...currentTraceSegmentsRef.current],
            },
          });
          flushQueue();
          currentTraceSegmentsRef.current = [];
        }

        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

        cameraRef.current.getWorldDirection(_planeNormalRef.current);
        _planePositionRef.current
          .copy(cameraRef.current.position)
          .addScaledVector(_planeNormalRef.current, 50);
        _planeRef.current.setFromNormalAndCoplanarPoint(
          _planeNormalRef.current,
          _planePositionRef.current,
        );
        _intersectionPointRef.current.set(0, 0, 0);
        raycasterRef.current.ray.intersectPlane(_planeRef.current, _intersectionPointRef.current);
        handleBoardClick(_intersectionPointRef.current, e.clientX, e.clientY);

        e.preventDefault();
        controlsRef.current.mouseDown = false;

        if (elementsIsActive && elementsRef?.current?.shape === 'axis') {
          setElementsIsActive(false);
          drawingRef.current = false;
          setIsDrawing(false);
        }

        return;
      }

      particleRef.current = {
        id: null,
        group: null,
      };

      controlsRef.current.mouseDown = false;
      e.preventDefault();
    },
    [
      awaitingSecondClick,
      elementsIsActive,
      handleEditing,
      stopDragging,
      handleBoardClick,
      setElementsIsActive,
      commitTrace,
    ],
  );

  /**
   * Handles mouse movement for camera control, drawing, and resizing.
   */
  const handleMouseMove = useCallback(
    (e) => {
      const controls = controlsRef.current;
      const canvas = rendererRef.current?.domElement;
      if (!canvas) return;

      const mouseX = e.clientX;
      const mouseY = e.clientY;
      if (editingInteractorRef.current.active) {
        if (editingElementRef.current.type === 'copy') {
          lastIntersected.current.position.set(mouseX, mouseY, 0);
        }

        if (
          editingInteractorRef.current.initialX === null &&
          editingInteractorRef.current.initialY === null
        ) {
          editingInteractorRef.current.initialX =
            lastIntersected.current.position.x;
          editingInteractorRef.current.initialY =
            lastIntersected.current.position.y;
        }
      }

      const cursorMovedAfterPress =
        Date.now() - editingElementRef.current.initPressTime > 600;
      if (editingElementRef.current.loading && cursorMovedAfterPress) {
        editingElementRef.current.loading = false;
        stopCounter();
        resetCounter();
        setIsOwnCursorActive(false);
      }

      if (isDraggingRef.current) {
        updateElementPosition(e.clientX, e.clientY, controls.controlPressed);
      }

      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (
        searchingFacesRef.current &&
        !drawingRef.current &&
        !elementsRef.current.active
      ) {
        identifyFace(
          e,
          sceneRef.current,
          cameraRef.current,
          rendererRef.current,
        );
      }

      handleBoardMovement();

      if (
        controls.mouseDown &&
        !drawingRef.current &&
        !isDraggingRef.current &&
        !searchingFacesRef.current
      ) {
        const deltaX = e.clientX - controls.lastX;
        const deltaY = e.clientY - controls.lastY;
        handleCameraDrag(deltaX, deltaY);
        controls.lastX = e.clientX;
        controls.lastY = e.clientY;
      }
    },
    [
      identifyFace,
      handleBoardMovement,
      moveCamera,
      rotateCamera,
      updateElementPosition,
      stopCounter,
      resetCounter,
      setIsOwnCursorActive,
    ],
  );



  const { handleKeyDown, handleKeyUp } = useKeyboardEvents(ctx, {
    setLinePoints,
    setAwaitingSecondClick,
    drawingRef,
    setIsOwnCursorActive,
    controlsRef,
    writingRef,
    modalIsOpenRef,
    undo,
    redo,
  });

  const { handlePaste } = useClipboardEvents({ rendererRef, editingElementRef });

  /**
   * Manages movement during a touch gesture for rotation, drawing, or zooming.
   */
  const handleTouchMove = useCallback(
    (e) => {
      const controls = controlsRef.current;
      const canvas = rendererRef.current?.domElement;
      if (!canvas) return;

      if (
        e.touches.length === 2 &&
        editingInteractorRef.current.type !== 'freeReposition'
      ) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const currMidX = (touch1.clientX + touch2.clientX) / 2;
        const currMidY = (touch1.clientY + touch2.clientY) / 2;

        controlsRef.current.isTwoFingerMove = true;

        const currentDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY,
        );

        if (
          controls.lastMidX === undefined ||
          controls.lastMidY === undefined ||
          controls.lastDistance === undefined
        ) {
          controls.lastMidX = currMidX;
          controls.lastMidY = currMidY;
          controls.lastDistance = currentDistance;
          controls.touchStartDistance = currentDistance;
          return;
        }

        const midPointMoveX = currMidX - controls.lastMidX;
        const midPointMoveY = currMidY - controls.lastMidY;
        const midPointMovement = Math.hypot(midPointMoveX, midPointMoveY);

        const distanceChange = currentDistance - controls.lastDistance;
        const absoluteDistanceChange = Math.abs(distanceChange);

        const panThreshold = 3;
        const zoomThreshold = 5;
        const panSensitivity = 0.01;
        const zoomSensitivity = 0.002;

        if (
          midPointMovement > panThreshold &&
          absoluteDistanceChange < zoomThreshold
        ) {
          const smoothedMoveX = midPointMoveX * panSensitivity;
          const smoothedMoveY = midPointMoveY * panSensitivity;

          if (Math.abs(smoothedMoveX) > 0.001) {
            if (smoothedMoveX > 0) {
              moveCamera(
                'left',
                Math.abs(smoothedMoveX) * speedRefectorRef.current,
              );
            } else {
              moveCamera(
                'right',
                Math.abs(smoothedMoveX) * speedRefectorRef.current,
              );
            }
          }

          if (Math.abs(smoothedMoveY) > 0.001) {
            if (smoothedMoveY > 0) {
              moveCamera(
                'up',
                Math.abs(smoothedMoveY) * speedRefectorRef.current,
              );
            } else {
              moveCamera(
                'down',
                Math.abs(smoothedMoveY) * speedRefectorRef.current,
              );
            }
          }
        }

        if (absoluteDistanceChange > zoomThreshold) {
          const smoothedZoom = distanceChange * zoomSensitivity;

          if (smoothedZoom > 0.001) {
            moveCamera('forward', smoothedZoom * speedRefectorRef.current);
          } else if (smoothedZoom < -0.001) {
            moveCamera(
              'backward',
              Math.abs(smoothedZoom) * speedRefectorRef.current,
            );
          }
        }

        controls.lastMidX = currMidX;
        controls.lastMidY = currMidY;
        controls.lastDistance = currentDistance;

        return;
      }

      if (e.touches.length === 1 && editingInteractorRef.current.active) {
        const touch = e.touches[0];
        const mouseX = touch.clientX;
        const mouseY = touch.clientY;

        if (
          editingInteractorRef.current.initialX === null &&
          editingInteractorRef.current.initialY === null
        ) {
          editingInteractorRef.current.initialX = mouseX;
          editingInteractorRef.current.initialY = mouseY;
        }
      }

      const touch = e.touches[0];
      const cursorMovedAfterPress =
        Date.now() - editingElementRef.current.initPressTime > 600;
      if (editingElementRef.current.loading && cursorMovedAfterPress) {
        editingElementRef.current.loading = false;
        stopCounter();
        resetCounter();
        setIsOwnCursorActive(false);
      }

      if (isDraggingRef.current) {
        if (e.touches.length === 1) {
          updateElementPosition(touch.clientX, touch.clientY, false);
        } else {
          updateElementPosition(touch.clientX, touch.clientY, true);
        }
      }

      if (e.touches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y =
          -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        if (
          searchingFacesRef.current &&
          !drawingRef.current &&
          !elementsRef.current.active
        ) {
          const simulatedEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
          };
          identifyFace(
            simulatedEvent,
            sceneRef.current,
            cameraRef.current,
            rendererRef.current,
          );
        }
      }

      handleBoardMovement();

      if (
        e.touches.length === 1 &&
        controls.mouseDown &&
        !isDraggingRef.current &&
        !searchingFacesRef.current &&
        !drawingRef.current &&
        !elementsRef.current.active
      ) {
          const deltaX = touch.clientX - controls.lastX;
          const deltaY = touch.clientY - controls.lastY;
          handleCameraDrag(deltaX, deltaY);
          controls.lastX = touch.clientX;
          controls.lastY = touch.clientY;
      }

      e.preventDefault();
    },
    [
      identifyFace,
      handleBoardMovement,
      moveCamera,
      rotateCamera,
      updateElementPosition,
      stopCounter,
      resetCounter,
      setIsOwnCursorActive,
    ],
  );

  const handleTouchStart = useCallback(
    (e) => {
      const controls = controlsRef.current;
      const canvas = rendererRef.current?.domElement;
      if (!canvas) return;

      controlsRef.current.isTwoFingerMove = false;

      if (e.touches.length === 1) {
        const touch = e.touches[0];

        if (searchingPointRef.current && searchingFacesRef.current) {
          const simulatedEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
          };
          const intersected = detectClickIntersection(
            simulatedEvent,
            cameraRef.current,
            sceneRef.current,
            rendererRef.current,
          );
          if (intersected.length > 0) {
            handleEditing();
          } else {
            searchingPointRef.current = false;
            searchingFacesRef.current = false;
          }
        }

        editingElementRef.current.initPressTime = Date.now();
        editingElementRef.current.initCoordinates = {
          x: touch.clientX,
          y: touch.clientY,
        };

        startCounter();

        controls.mouseDown = true;
        controls.mouseMoving = false;
        controls.lastX = touch.clientX;
        controls.lastY = touch.clientY;
        controls.rightButton = false;

        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y =
          -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        if (drawingRef.current) {
          const sceneLengthStart = sceneRef?.current?.children?.length;

          particleRef.current = {
            id: `trace-${new Date().getTime()}`,
            sceneLengthStart,
          };
          currentTraceSegmentsRef.current = [];
          resetTrace();

          raycasterRef.current.setFromCamera(
            mouseRef.current,
            cameraRef.current,
          );
          const intersects = raycasterRef.current.intersectObjects(
            sceneRef.current.children,
            true,
          );

          if (intersects.length > 0) {
            const intersected = intersects[0].object;
            lastIntersected.current = intersected;
          }
        }

        const cubeObj = checkIfClickIsOnPlaneCube(touch.clientX, touch.clientY);

        if (
          cubeObj?.cube &&
          axisRef.current &&
          controlsRef.current.controlPressed
        ) {
          lineBetweenPointsRef.current.push(cubeObj?.point);
          if (lineBetweenPointsRef.current.length === 2) {
            handleCreativityOnSpace(
              {
                element: 'line',
                color: colorRef.current,
                size: sizeRef.current,
                position: [
                  lineBetweenPointsRef.current[0],
                  lineBetweenPointsRef.current[1],
                ],
                origin: {
                  x: (lineBetweenPointsRef.current[0].x + lineBetweenPointsRef.current[1].x) / 2,
                  y: (lineBetweenPointsRef.current[0].y + lineBetweenPointsRef.current[1].y) / 2,
                  z: (lineBetweenPointsRef.current[0].z + lineBetweenPointsRef.current[1].z) / 2,
                },
              },
              sceneRef,
              elementsStackRef,
              cartesianSpaceRef,
              addElement,
              false,
              pushHistory,
            );
            lineBetweenPointsRef.current = [];
          }
        }

        if (
          !drawingRef.current &&
          !cubeObj?.cube &&
          axisRef.current &&
          controlsRef.current.controlPressed
        ) {
          addCubeToCartesianSpace(
            { clientX: touch.clientX, clientY: touch.clientY },
            mouseRef,
            cameraRef,
            sceneRef,
            raycasterRef,
            planeCubesRef,
          );
        }

        if (searchingPointRef.current) {
          raycasterRef.current.setFromCamera(
            mouseRef.current,
            cameraRef.current,
          );
          const distance = 10;
          const point = raycasterRef.current.ray.direction
            .clone()
            .multiplyScalar(distance)
            .add(cameraRef.current.position);

          if (planesRef.current) {
            initialElementsCoordinatesRef.current = {
              x: touch.clientX,
              y: touch.clientY,
            };
            handleCreativityOnSpace(
              {
                element: 'plane',
                plane: selectedTerrainRef.current,
                position: point,
                origin: { x: point.x, y: point.y, z: point.z },
                color: colorRef.current,
                size: sizeRef.current,
              },
              sceneRef,
              elementsStackRef,
              cartesianSpaceRef,
              addElement,
              false,
              pushHistory,
            );
            searchingPointRef.current = false;
            planesRef.current = false;
          }
        }

        const now = new Date().getTime();
        const isDoubleClick = now - controls.lastClickTime < 300;

        if (isDoubleClick) {
          raycasterRef.current.setFromCamera(
            mouseRef.current,
            cameraRef.current,
          );
          const intersects = raycasterRef.current.intersectObjects(
            sceneRef.current.children,
            true,
          );

          if (intersects.length > 0) {
            const intersected = intersects[0].object;
            lastIntersected.current = intersected;
            handleEditing();
          }
        }

        controls.lastClickTime = now;
      } else if (e.touches.length === 2) {
        controls.touchStartDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }

      e.preventDefault();
    },
    [
      addTextToScene,
      handleCloseModal,
      checkIfClickIsOnPlaneCube,
      detectClickIntersection,
      handleEditing,
      startCounter,
      addCubeToCartesianSpace,
    ],
  );

  const handleTouchEnd = useCallback(
    (e) => {
      const canvas = rendererRef.current?.domElement;
      if (!canvas) return;

      if (
        editingElementRef.current.active &&
        editingElementRef.current.type === 'copy'
      ) {
        editingElementRef.current.active = false;
      }

      controlsRef.current.mouseDown = false;

      // if (isDraggingRef.current) {
      //   // stopDragging();
      // }

      if (
        searchingPointRef.current &&
        !writingRef.current &&
        !searchingFacesRef.current &&
        !planesRef?.current
      ) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const distance = 10;
        const point = raycasterRef.current.ray.direction
          .clone()
          .multiplyScalar(distance)
          .add(cameraRef.current.position);
      }

      if (
        searchingPointRef.current &&
        !functionRef.current &&
        planesRef.current
      ) {
        const lastTouch = e.changedTouches[0];
        initialElementsCoordinatesRef.current = {
          x: lastTouch.clientX,
          y: lastTouch.clientY,
        };
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const distance = 10;
        const point = raycasterRef.current.ray.direction
          .clone()
          .multiplyScalar(distance)
          .add(cameraRef.current.position);

        handleCreativityOnSpace(
          {
            element: 'plane',
            plane: selectedTerrainRef.current,
            position: point,
            origin: { x: point.x, y: point.y, z: point.z },
            color: colorRef.current,
            size: sizeRef.current,
          },
          sceneRef,
          elementsStackRef,
          cartesianSpaceRef,
          addElement,
          false,
          pushHistory,
        );

        searchingPointRef.current = false;
        planesRef.current = false;
      }

      if (drawingRef.current && e.changedTouches.length > 0) {
        if (
          activeCreativityRef.current.id === 'optimizedTrace' ||
          activeCreativityRef.current.id === '3dTrace'
        ) {
          const tempGroup = particleRef.current.group;
          if (tempGroup) {
            sceneRef.current.remove(tempGroup);
            tempGroup.traverse((obj) => {
              if (obj.geometry) obj.geometry.dispose();
              if (obj.material) obj.material.dispose();
            });
            particleRef.current.group = null;
          }
          if (activeCreativityRef.current.id === '3dTrace') {
            const result = commit3dTrace();
            if (result?.element) {
              particleRef.current = { id: result.element.id, group: null };
              const flat = result.element.positions as number[];
              const positions3d: { x: number; y: number; z: number }[] = [];
              for (let i = 0; i < flat.length / 3; i++) {
                positions3d.push({ x: flat[i * 3], y: flat[i * 3 + 1], z: flat[i * 3 + 2] });
              }
              const group = createParticleSpheresAlongPath({
                particlesPerSphere: 100,
                sphereRadius: result.element.size * 0.008,
                particleSize: 0.1,
                particleColor: result.element.color,
                position: positions3d,
              }, particleRef);
              if (group) sceneRef.current.add(group);
              currentTraceSegmentsRef.current.push(result.element);
            }
          } else {
            commitTrace();
          }
        }

        const sceneLengthEnd = sceneRef?.current?.children?.length;

        elementsStackRef?.current?.set(particleRef?.current?.id, {
          sceneLengthStart: particleRef?.current?.sceneLengthStart,
          sceneLengthEnd: sceneLengthEnd,
        });

        if (currentTraceSegmentsRef.current.length > 0) {
          pushHistory({
            type: 'ADD_ELEMENT',
            element: {
              id: particleRef.current.id,
              type: 'traces',
              segments: [...currentTraceSegmentsRef.current],
            },
          });
          currentTraceSegmentsRef.current = [];
        }

        const lastTouch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x =
          ((lastTouch.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y =
          -((lastTouch.clientY - rect.top) / rect.height) * 2 + 1;
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

        cameraRef.current.getWorldDirection(_planeNormalRef.current);
        _planePositionRef.current
          .copy(cameraRef.current.position)
          .addScaledVector(_planeNormalRef.current, 50);
        _planeRef.current.setFromNormalAndCoplanarPoint(
          _planeNormalRef.current,
          _planePositionRef.current,
        );
        _intersectionPointRef.current.set(0, 0, 0);
        raycasterRef.current.ray.intersectPlane(_planeRef.current, _intersectionPointRef.current);

        if (controlsRef.current.isTwoFingerMove) {
          return;
        }

        handleBoardClick(
          _intersectionPointRef.current,
          lastTouch.clientX,
          lastTouch.clientY,
        );

        e.preventDefault();
        controlsRef.current.mouseDown = false;

        if (elementsIsActive && elementsRef?.current?.shape === 'axis') {
          setElementsIsActive(false);
          drawingRef.current = false;
          setIsDrawing(false);
        }

        return;
      }

      if (e.touches.length < 2) {
        controlsRef.current.touchStartDistance = null;
        controlsRef.current.lastMidX = null;
        controlsRef.current.lastMidY = null;
      }

      controlsRef.current.mouseDown = false;
      e.preventDefault();
    },
    [
      awaitingSecondClick,
      elementsIsActive,
      handleEditing,
      stopDragging,
      setElementsIsActive,
      handleBoardClick,
      commitTrace,
    ],
  );

  useEffect(() => {
    const handleTripleTap = (e) => {
      if (e.touches.length === 3) {
        setUiHidden((prev) => !prev);
      }
    };

    window.addEventListener('touchstart', handleTripleTap, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTripleTap);
    };
  }, [setUiHidden]);

  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    let lastWheel = 0;
    let rafId: number | null = null;
    let rafTouchId: number | null = null;

    // RAF-based throttle: processa um evento por frame de animação, sem descartar pontos
    const throttledMouseMove = (e: MouseEvent) => {
      needsRenderRef.current = true;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        handleMouseMove(e);
        rafId = null;
      });
    };

    const throttledWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now - lastWheel < 16) return;
      lastWheel = now;
      needsRenderRef.current = true;
      handleWheel(e);
    };

    const throttledTouchMove = (e: TouchEvent) => {
      needsRenderRef.current = true;
      if (rafTouchId !== null) return;
      rafTouchId = requestAnimationFrame(() => {
        handleTouchMove(e);
        rafTouchId = null;
      });
    };

    const wrappedMouseDown = (e: MouseEvent) => { needsRenderRef.current = true; handleMouseDown(e); };
    const wrappedMouseUp = (e: MouseEvent) => { needsRenderRef.current = true; handleMouseUp(e); };

    canvas.addEventListener('mousedown', wrappedMouseDown);
    canvas.addEventListener('mouseup', wrappedMouseUp);
    canvas.addEventListener('mousemove', throttledMouseMove);
    canvas.addEventListener('wheel', throttledWheel, { passive: false });
    canvas.addEventListener('contextmenu', preventContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', throttledTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('paste', handlePaste);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (rafTouchId !== null) cancelAnimationFrame(rafTouchId);
      canvas.removeEventListener('mousedown', wrappedMouseDown);
      canvas.removeEventListener('mouseup', wrappedMouseUp);
      canvas.removeEventListener('mousemove', throttledMouseMove);
      canvas.removeEventListener('wheel', throttledWheel);
      canvas.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', throttledTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('paste', handlePaste);
    };
  }, [
    rendererRef,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleWheel,
    handleKeyDown,
    handleKeyUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handlePaste,
  ]);

  return { deleteElement, undo, redo };
};
