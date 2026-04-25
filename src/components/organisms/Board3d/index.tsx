import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// ── Componentes extraídos ──────────────────────────────────────────────────
import { SceneRenderer } from './SceneRenderer';
import { InputHandler, useCursorHandlers } from './InputHandler';
import { UILayer } from './UILayer';
import { ToolsManager } from './ToolsManager';

// ── Mobile interaction hooks ──────────────────────────────────────────────
import { useScreenOrientation } from '../../../hooks/useScreenOrientation';
import { useTouchOffset } from '../../../hooks/useTouchOffset';
import { useCameraComposer } from './useCameraComposer';
import { CalibrationButton } from '../../atoms/CalibrationButton';

// ── Contextos ─────────────────────────────────────────────────────────────
import { useDrawing } from '../../../hooks/contexts/DrawingContext';
import { useFunctions } from '../../../hooks/contexts/FunctionsContext';
import { useElements } from '../../../hooks/contexts/ElementsContext';
import { useUI } from '../../../hooks/contexts/UIContext';
import { useScene } from '../../../hooks/contexts/SceneContext';
import { useHistory } from '../../../hooks/contexts/HistoryContext';
import { useCamera } from '../../../hooks/contexts/CameraContext';
import { useSession, useCoordinates } from '../../../hooks/contexts/SessionContext';
import { useModal } from '../../../hooks/useModal';

// ── Hooks de domínio ──────────────────────────────────────────────────────
import useNotifications from '../../../hooks/useNotifications';
import { useSketch } from '../../../hooks/useSketch';
import { useUniverseEventListeners } from '../../../hooks/useUniverseEventListeners';
import { useEditingModeManager } from '../../../hooks/useEditingModeManager';

// ── Editing modes ─────────────────────────────────────────────────────────
import { freeRepositionMode } from '../../../hooks/editingModes/freeRepositionMode';
import { repositionMode } from '../../../hooks/editingModes/repositionMode';
import { rotationMode } from '../../../hooks/editingModes/rotationMode';
import { scaleMode } from '../../../hooks/editingModes/scaleMode';
import { animationMode } from '../../../hooks/editingModes/animationMode';
import { copyMode } from '../../../hooks/editingModes/copyMode';
import { deleteMode } from '../../../hooks/editingModes/deleteMode';

// ── Elementos da cena ─────────────────────────────────────────────────────
import { handleCreativityOnSpace, addTextToScene } from './spaceElements';
import { addCubeToCartesianSpace } from './cartesianSpaceElements';

// ── Utils ─────────────────────────────────────────────────────────────────
import { safeGetItem } from '../../../utils/storage';
import { useSceneActions } from './useSceneActions';
import { useModalHandlers } from './useModalHandlers';
import css from './index.module.scss';

// ── Componentes ───────────────────────────────────────────────────────────
import { AppLoader } from '../../molecules/appLoader';

// ── Constantes de módulo ──────────────────────────────────────────────────
// Array estável — fora do componente para que useEditingModeManager não re-execute o useEffect a cada render.
const EDITING_MODES = [
  freeRepositionMode, repositionMode, rotationMode,
  scaleMode, animationMode, copyMode, deleteMode,
];

// ─── Types ────────────────────────────────────────────────────────────────

interface YourWorldProps {
  socketId: string;
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * Board3d — orquestrador principal.
 *
 * Compõe: SceneRenderer · InputHandler · UILayer · ToolsManager
 * Delega: lógica de cena → useSceneActions
 *         abertura de modais → useModalHandlers
 * Conecta: useUniverseEventListeners · WebSocket
 */
const YourWorld = ({ socketId }: YourWorldProps) => {
  // ── Contextos ────────────────────────────────────────────────────────────
  const {
    isDrawing, setIsDrawing, pencilIsActive, setPencilIsActive,
    setLinePoints, setAwaitingSecondClick,
    drawingRef, drawerRef,
  } = useDrawing();

  const { setFunctionsOpen, writingRef } = useFunctions();

  const {
    elementsIsActive, setElementsIsActive, elementsRef, editingInteractorRef,
    isDraggingRef, lastIntersected, searchingFacesRef, searchingPointRef,
  } = useElements();

  const {
    isOwnCursorActive, setIsOwnCursorActive,
    starsAreActive, setStarsAreActive,
    openModalCount,
  } = useUI();

  const { modalsList } = useModal();

  const { isMobile, currentColor, setCurrentColor } = useSession();
  const { coordinates, setCoordinates } = useCoordinates();
  const coordinatesRef = useRef(coordinates);
  coordinatesRef.current = coordinates;
  const { mountRef, needsRenderRef } = useScene();
  const { historySize } = useHistory();
  const { cameraRef, controlsRef, rotationRef, keysHeldRef } = useCamera();
  const { updateSketch } = useSketch();
  const { notify, notification } = useNotifications();

  // ── Local state ───────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [rulerIsActive, setRulerIsActive] = useState(false);
  const [editingInteractorIsActive, setEditingInteractorIsActive] = useState(false);
  const [viewWithAccelerometer, setViewWithAccelerometer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // boardIsActive precisa ser state local — passado para CreativityForm via useModalHandlers
  const [boardIsActive, setBoardIsActive] = useState(false);

  // ── Refs de frame / navigator ─────────────────────────────────────────────
  const animationFrameRef = useRef<number | null>(null);
  const navigatorRenderFnRef = useRef<(() => void) | null>(null);
  const accelerometerRenderFnRef = useRef<(() => void) | null>(null);

  // ── Refs de acelerômetro ──────────────────────────────────────────────────
  const accelQRef = useRef(new THREE.Quaternion());
  const accelActiveRef = useRef(false);
  const lastBetaRef = useRef(0);
  const lastAlphaRef = useRef(0);
  const lastGammaRef = useRef(0);

  // deleteElement vem do useUniverseEventListeners, mas useModalHandlers precisa dele.
  // Ref intermediária resolve a dependência circular sem quebrar regras de hooks.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deleteElementRef = useRef<(particleId?: any) => void>(() => { });

  // ── Efeitos ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    document.addEventListener('wheel', preventBrowserZoom, { passive: false });
    return () => document.removeEventListener('wheel', preventBrowserZoom);
  }, []);

  useEffect(() => {
    if (!safeGetItem('cartesian_tutorial_seen')) setActiveTutorial('welcome');
  }, []);

  useEffect(() => {
    if (socketId) setCoordinates({ x: window.innerWidth / 2, y: window.innerHeight / 2, z: 0 });
  }, [socketId, setCoordinates]);

  useEffect(() => {
    document.body.style.cursor = (isOwnCursorActive && openModalCount === 0) ? 'none' : 'default';
    return () => { document.body.style.cursor = 'default'; };
  }, [isOwnCursorActive, openModalCount]);

  // ── Loader ────────────────────────────────────────────────────────────────
  const handleSceneReady = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => setIsLoading(false), 900);
  }, []);

  // ── useSceneActions ───────────────────────────────────────────────────────
  const scene = useSceneActions({ setRulerIsActive, rulerIsActive });

  const onCameraUpdate = useCallback((dt: number) => {
    scene.updateCameraWithKeys(keysHeldRef.current, dt);
  }, [scene, keysHeldRef]);

  // ── Editing mode manager ──────────────────────────────────────────────────
  const editingModeManager = useEditingModeManager(EDITING_MODES);

  // ── Mobile interaction ────────────────────────────────────────────────────
  const { remapAxes, showCalibrationButton, calibrate } = useScreenOrientation();
  const { touchOffsetQRef, addPanDelta, resetOffset } = useTouchOffset();

  // Manter accelActiveRef sincronizado com o estado React
  useEffect(() => {
    accelActiveRef.current = viewWithAccelerometer;
    if (!viewWithAccelerometer) resetOffset();
  }, [viewWithAccelerometer, resetOffset]);

  useCameraComposer({
    cameraRef,
    accelQRef,
    touchOffsetQRef,
    accelActiveRef,
    needsRenderRef,
    accelerometerRenderFnRef,
  });

  const handleCalibrate = useCallback(() => {
    calibrate(lastBetaRef.current, lastAlphaRef.current, lastGammaRef.current);
  }, [calibrate]);

  const handleRawOrientation = useCallback((beta: number, alpha: number, gamma: number) => {
    lastBetaRef.current = beta;
    lastAlphaRef.current = alpha;
    lastGammaRef.current = gamma;
  }, []);

  // ── Handlers que ficam no orquestrador ────────────────────────────────────
  // Todos os handlers são useCallback com deps estáveis (refs + useState setters)
  // para evitar recriar o ctx a cada render e disparar re-registro de listeners.

  const handleStopAll = useCallback(() => {
    (drawerRef.current as any).active = false;
    drawingRef.current = false;
    setIsDrawing(false);
    setElementsIsActive(false);
    writingRef.current = false;
    setIsWriting(false);
    setBoardIsActive(false);
    setIsOwnCursorActive(false);
    elementsRef.current.active = false;
    searchingPointRef.current = false;
    searchingFacesRef.current = false;
    setPencilIsActive(false);
  }, [drawerRef, drawingRef, setIsDrawing, setElementsIsActive, writingRef, setIsOwnCursorActive, elementsRef, searchingPointRef, searchingFacesRef, setPencilIsActive]);

  const stopDragging = useCallback(() => {
    isDraggingRef.current = false;
  }, [isDraggingRef]);

  const stopRotation = useCallback(() => {
    rotationRef.current.active = false;
  }, [rotationRef]);

  const handleDraw = useCallback(() => {
    drawingRef.current = !drawingRef.current;
    setFunctionsOpen(false);
    setIsDrawing(true);
    setPencilIsActive(true);
    if (!drawingRef.current) {
      setLinePoints([]);
      setAwaitingSecondClick(false);
      setIsDrawing(false);
      setIsOwnCursorActive(false);
    }
  }, [drawingRef, setFunctionsOpen, setIsDrawing, setPencilIsActive, setLinePoints, setAwaitingSecondClick, setIsOwnCursorActive]);

  const handleElementsSelection = useCallback(() => {
    handleStopAll();
    if (elementsRef.current.active) {
      searchingPointRef.current = false;
      searchingFacesRef.current = false;
      return;
    }
    searchingPointRef.current = true;
    searchingFacesRef.current = true;
  }, [handleStopAll, elementsRef, searchingPointRef, searchingFacesRef]);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
    const el = document.getElementById('universe') as any;
    (el?.requestFullscreen ?? el?.webkitRequestFullscreen ?? el?.msRequestFullscreen)?.call(el);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    const d = document as any;
    (d.exitFullscreen ?? d.webkitExitFullscreen ?? d.msExitFullscreen)?.call(d);
  }, []);

  // ── useModalHandlers ──────────────────────────────────────────────────────
  const modalHandlers = useModalHandlers({
    editingModeManager,
    deleteElementRef,
    updateElementPosition: scene.updateElementPosition,
    setCameraPosition: scene.setCameraPosition,
    setActiveTutorial,
    setEditingInteractorIsActive,
    setElementsIsActive,
    setIsBlackBoardActive: setBoardIsActive,
    setIsOwnCursorActive,
    setPencilIsActive,
    setFunctionsOpen,
    boardIsActive,
    setBoardIsActive,
    drawingRef,
    writingRef,
    searchingPointRef,
    notify,
    isMobile,
    coordinatesRef,
  });

  // ── useUniverseEventListeners ─────────────────────────────────────────────
  const { deleteElement, undo, redo } = useUniverseEventListeners({
    handleCloseModal: modalHandlers.handleCloseModal,
    addTextToScene,
    isPointInsideCube: scene.isPointInsideCube,
    addCubeToCartesianSpace,
    handleEditing: modalHandlers.handleEditing,
    handleCreativityOnSpace,
    identifyFace: scene.identifyFace,
    moveCamera: scene.moveCamera,
    rotateCamera: scene.rotateCamera,
    addNewCube: scene.addNewCube,
    addText: modalHandlers.addText,
    handleDraw,
    handleCartesianSpaceDraw: modalHandlers.handleCartesianSpaceDraw,
    handleFunctionsControls: modalHandlers.handleFunctionsControls,
    handleSpaceClean: () => modalHandlers.handleSpaceClean(scene.clearScene),
    handleInfo: modalHandlers.handleInfo,
    updateElementPosition: scene.updateElementPosition,
    stopDragging,
    handleCreativity: modalHandlers.handleCreativity,
    handleElementRotation: scene.handleElementRotation,
    stopRotation,
    handleStopAll,
    handleElementsSelection,
    handleElementResize: scene.handleElementResize,
    handleMountains: modalHandlers.handleMountains,
    handleSavedScenes: modalHandlers.handleSavedScenes,
    updateSketch,
    handleCalculator: modalHandlers.handleCalculator,
    handleMarkPosition: modalHandlers.handleMarkPosition,
    handleRuler: scene.handleRuler,
    handleUnitsSettings: modalHandlers.handleUnitsSettings,
    notify,
    setUiHidden,
    setIsDrawing,
    setIsWriting,
    setEditingInteractorIsActive,
  }, {
    accelActiveRef,
    accelQRef,
    addPanDelta,
  });

  // Sincroniza deleteElementRef após cada render (sem useEffect — refs não são efeito colateral)
  deleteElementRef.current = deleteElement;

  // ── activeModalFormIds ────────────────────────────────────────────────────
  // Set de formIds ativos — dependência única e estável para os useMemos de helpers.
  const activeModalFormIds = useMemo(
    () => new Set(modalsList.map((m: any) => m.formId as string)),
    [modalsList],
  );

  // ── Helper lists ──────────────────────────────────────────────────────────
  const bottomRightHelpers = useMemo(() => [
    { iconName: 'mountains', hoverText: 'Planos (p)', onClick: modalHandlers.handleMountains, active: activeModalFormIds.has('planes-form'), visible: true },
    { iconName: 'uploadFile', hoverText: 'Adicionar imagem', onClick: modalHandlers.addImage, active: activeModalFormIds.has('text-form'), visible: true },
    { iconName: 'blackBoard', hoverText: 'Lousa', onClick: modalHandlers.handleBlackBoard, active: boardIsActive, visible: true },
    { iconName: 'note', hoverText: 'Adicionar Texto (t)', onClick: modalHandlers.addText, active: activeModalFormIds.has('text-form'), visible: true },
    { iconName: 'drawPlane', hoverText: 'Desenhar (d)', onClick: modalHandlers.handleCreativity, active: isDrawing, visible: true },
  ], [modalHandlers, boardIsActive, isDrawing, activeModalFormIds]);

  const topRightHelpers = useMemo(() => [
    { iconName: 'function', hoverText: 'Functions Control (f)', onClick: modalHandlers.handleFunctionsControls, active: activeModalFormIds.has('function-form'), visible: true },
    { iconName: 'axis', hoverText: 'Espaço Cartesiano', onClick: modalHandlers.handleCartesianSpaceDraw, active: activeModalFormIds.has('cartesian-space-form'), visible: true },
  ], [modalHandlers, activeModalFormIds]);

  const topRightHelpersSec = useMemo(() => [
    { iconName: 'calculator', hoverText: 'Calculadora (c)', onClick: modalHandlers.handleCalculator, active: activeModalFormIds.has('calculator-form'), visible: true },
  ], [modalHandlers, activeModalFormIds]);

  const bottomLeftHelpers = useMemo(() => [
    { iconName: 'info', hoverText: 'Informações (i)', onClick: modalHandlers.handleInfo, active: activeModalFormIds.has('info-form'), visible: true },
    { iconName: isFullscreen ? 'fullscreenExit' : 'fullscreen', hoverText: 'Tela cheia', onClick: isFullscreen ? closeFullscreen : openFullscreen, active: true, visible: true },
    { iconName: 'movePhone', hoverText: 'Movimentar cena', onClick: () => setViewWithAccelerometer((p) => !p), active: viewWithAccelerometer, visible: 'DeviceMotionEvent' in window && navigator.maxTouchPoints > 0 },
    { iconName: 'stars', hoverText: starsAreActive ? 'Remover Estrelas' : 'Adicionar Estrelas', onClick: () => scene.handleStars(starsAreActive, setStarsAreActive), active: starsAreActive, visible: true },
    { iconName: 'stop', hoverText: 'Parar todas interações (Esc)', onClick: handleStopAll, active: isDrawing || isWriting || elementsIsActive || boardIsActive || pencilIsActive, visible: true },
    { iconName: 'ruler', hoverText: 'Ativar régua (r)', onClick: scene.handleRuler, active: rulerIsActive, visible: true },
  ], [modalHandlers, activeModalFormIds, isFullscreen, viewWithAccelerometer, starsAreActive, isDrawing, isWriting, elementsIsActive, boardIsActive, pencilIsActive, rulerIsActive, scene, handleStopAll, closeFullscreen, openFullscreen]);

  const actionHelpers = useMemo(() => [
    { iconName: 'save', hoverText: 'Salvar (Ctrl+S)', onClick: () => updateSketch().then(() => notify('save', 'success')).catch(() => notify('save', 'error')), active: historySize.past > 0, visible: true },
    { iconName: 'undo', hoverText: 'Desfazer (Ctrl+Z)', onClick: () => { undo(); notify('backspace', 'neutral', { duration: 1000 }); }, active: historySize.past > 0, visible: true },
    { iconName: 'redo', hoverText: 'Refazer (Ctrl+Shift+Z)', onClick: () => { redo(); notify('backspace', 'neutral', { duration: 1000, style: 'flip' }); }, active: historySize.future > 0, visible: true },
  ], [updateSketch, notify, undo, redo, historySize]);

  const sceneHelpers = useMemo(() => [
    { iconName: 'bookmark', hoverText: 'Salvos (s)', onClick: modalHandlers.handleSavedScenes, active: activeModalFormIds.has('saved-scenes-form'), visible: true },
    { iconName: 'markers', hoverText: 'Marcadores (m)', onClick: modalHandlers.handleMarkPosition, active: activeModalFormIds.has('marked-points-form'), visible: true },
  ], [modalHandlers, activeModalFormIds]);

  // ── Cursor handlers ───────────────────────────────────────────────────────
  const onCursorMove = useCallback(
    (x: number, y: number) => setCoordinates({ x, y, z: 0 }),
    [setCoordinates],
  );
  const { handleMouseMove, handleTouchMove } = useCursorHandlers(onCursorMove, modalsList);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main
      id="universe"
      className={css['universe']}
      aria-label="Quadro 3D interativo"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      style={{
        cursor: searchingPointRef.current ? 'crosshair'
          : (isOwnCursorActive && openModalCount === 0) ? 'none'
            : controlsRef.current?.mouseDown ? 'grabbing'
              : 'grab',
      }}
    >
      {/* Three.js: inicializa renderer, scene, camera e animation loop */}
      <SceneRenderer
        mountRef={mountRef}
        animationFrameRef={animationFrameRef}
        navigatorRenderFnRef={navigatorRenderFnRef}
        accelerometerRenderFnRef={accelerometerRenderFnRef}
        onSceneReady={handleSceneReady}
        onCameraUpdate={onCameraUpdate}
      />

      {/* Device orientation / acelerômetro */}
      <InputHandler
        viewWithAccelerometer={viewWithAccelerometer}
        accelQRef={accelQRef}
        remapAxes={remapAxes}
        onRawOrientation={handleRawOrientation}
      />

      {/* Botão de calibração — aparece em browsers sem screen.orientation */}
      {showCalibrationButton && viewWithAccelerometer && (
        <CalibrationButton onCalibrate={handleCalibrate} className={css['calibration-button']} />
      )}

      {/* Canvas mount point do WebGL renderer */}
      <div
        id="canvas-container"
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}
        ref={mountRef}
      />

      {/* Camada 2D: modais, cursor personalizado, notificações, tutorial */}
      <UILayer
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        coordinates={coordinates}
        notification={notification}
        onCloseFunctionsList={() => setFunctionsOpen(false)}
        onSetCameraPosition={scene.setCameraPosition}
        editingInteractorIsActive={editingInteractorIsActive}
        setEditingInteractorIsActive={setEditingInteractorIsActive}
        activeTutorial={activeTutorial}
        onCloseTutorial={() => setActiveTutorial(null)}
      />

      {/* Loader animado de eixos XYZ — visível durante inicialização da cena */}
      {isLoading && (
        <AppLoader isExiting={isExiting} isMobile={isMobile} />
      )}

      {/* Toolbars, controle de velocidade e gizmo de navegação */}
      {!uiHidden && (
        <ToolsManager
          bottomRightHelpers={bottomRightHelpers}
          topRightHelpers={topRightHelpers}
          topRightHelpersSec={topRightHelpersSec}
          bottomLeftHelpers={bottomLeftHelpers}
          actionHelpers={actionHelpers}
          sceneHelpers={sceneHelpers}
          listOpen={listOpen}
          setListOpen={setListOpen}
          notification={notification}
          navigatorRenderFnRef={navigatorRenderFnRef}
          onResetCamera={() => cameraRef.current?.position.set(-2, -1, 4)}
          isLoading={isLoading}
        />
      )}
    </main>
  );
};

export default YourWorld;
