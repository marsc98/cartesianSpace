import React, { useCallback, useRef } from 'react';
import CreativityForm from '../../molecules/creativityForm';
import Calculator from '../../molecules/calculator';
import CommandHelpers from '../../molecules/commandHelpers';
import EditingForm from '../../molecules/editingForm';
import AnimationForm from '../../molecules/animationForm';
import FunctionForm from '../../molecules/functionForm';
import ImageForm from '../../molecules/imagesForm';
import MarkersList from '../../molecules/markersList';
import PencilForm from '../../molecules/pencilForm';
import PlanesForm from '../../molecules/planesForm';
import SavedScenes from '../../molecules/savedScenes';
import TextForm from '../../molecules/textForm';
import { MeuForm } from '../../molecules/authorInfoForm';
import { addImageToScene } from '../../organisms/Board3d/spaceElements';

import { useDrawing } from '../../../hooks/contexts/DrawingContext';
import { useElements } from '../../../hooks/contexts/ElementsContext';
import { useFunctions } from '../../../hooks/contexts/FunctionsContext';
import { useScene } from '../../../hooks/contexts/SceneContext';
import { useCamera } from '../../../hooks/contexts/CameraContext';
import { useCoordinates } from '../../../hooks/contexts/SessionContext';
import CartesianSpaceForm from '../../molecules/cartesianSpaceForm';
import { useUI } from '../../../hooks/contexts/UIContext';
import { useModal } from '../../../hooks/useModal';
import { UnitSettingsModal } from '../../molecules/unitSettingsModal';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseModalHandlersDeps {
  editingModeManager: EditingModeManagerReturn;
  /** Ref intermediária para deleteElement (evita dependência circular com useUniverseEventListeners) */
  deleteElementRef: React.MutableRefObject<() => void>;
  updateElementPosition: (x: number, y: number, ctrl: boolean) => void;
  setCameraPosition: (
    coords: { x: number; y: number; z: number },
    lookAt?: { x: number; y: number; z: number },
  ) => void;
  setActiveTutorial: (type: string | null) => void;
  setEditingInteractorIsActive: (active: boolean) => void;
  setElementsIsActive: (active: boolean) => void;
  setIsBlackBoardActive: (active: boolean) => void;
  setIsOwnCursorActive: (active: boolean) => void;
  setPencilIsActive: (active: boolean) => void;
  setFunctionsOpen: (open: boolean) => void;
  /** boardIsActive e setter — state local do Board3d necessário para CreativityForm */
  boardIsActive: boolean;
  setBoardIsActive: (v: boolean) => void;
  drawingRef: React.MutableRefObject<boolean>;
  writingRef: React.MutableRefObject<boolean>;
  searchingPointRef: React.MutableRefObject<boolean>;
  notify: NotifyFn;
  isMobile: boolean;
  /** Ref de coordenadas do cursor — lida no momento de abertura do modal, não causa re-render */
  coordinatesRef: React.MutableRefObject<{ x: number; y: number; z?: number }>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Centraliza toda a lógica de abertura/fechamento de modais do Board3d.
 * Cada handler segue o padrão: gera um id único → addModal(...) → onClose: removeModal(id).
 *
 * IMPORTANTE: usa deleteElementRef (MutableRefObject) em vez de deleteElement diretamente
 * para quebrar a dependência circular com useUniverseEventListeners.
 */
export function useModalHandlers(deps: UseModalHandlersDeps) {
  const {
    editingModeManager, deleteElementRef, updateElementPosition,
    setCameraPosition, setActiveTutorial, setEditingInteractorIsActive,
    setElementsIsActive, setIsBlackBoardActive, setIsOwnCursorActive,
    setPencilIsActive, setFunctionsOpen,
    boardIsActive, setBoardIsActive,
    drawingRef, writingRef, searchingPointRef,
    notify, isMobile, coordinatesRef,
  } = deps;

  // ── Contextos ─────────────────────────────────────────────────────────────
  const { addModal, removeModal, modalsList } = useModal();
  const { setScenesIsOpen } = useUI();
  const { colorRef, drawerRef, activeCreativityRef, sizeRef } = useDrawing();
  const {
    elementsRef, editingInteractorRef, editingArrowsRef,
    isDraggingRef, waitingForFirstInteractionRef, lastIntersected, originalColor, selectedTerrainRef,
  } = useElements() as any;
  const { cartesianSpaceRef, functionsRef, functionRef, limitesRef, fontRef, textRef, axisRef } = useFunctions() as any;
  const { sceneRef, elementsStackRef, particleRef, mountRef } = useScene();
  const { cameraRef, rotationRef } = useCamera();
  const { setCoordinates } = useCoordinates();

  // ── Utilitários internos ──────────────────────────────────────────────────
  function stopWriting() { writingRef.current = false; }

  // handleCloseModal legado — mantido para compatibilidade com componentes filhos
  // que ainda esperam essa prop (ex: SavedScenes, PencilForm)
  function handleCloseModal(_id?: string) { }

  // ── Info / Projeto ────────────────────────────────────────────────────────

  // handleProjectInfo é referenciado por handleInfo, mas ambos são useCallback.
  // Usamos uma ref estável para quebrar a dependência circular de ordem.
  const handleProjectInfoRef = useRef<() => void>(() => { });

  const handleProjectInfo = useCallback(() => {
    const id = `modal-project-info-${Date.now()}`;
    addModal({
      id,
      title: 'Informações do projeto',
      formId: 'project-info-form',
      isOpen: true,
      content: <MeuForm isMobile={isMobile} />,
      onClose: () => removeModal(id),
    });
  }, [addModal, removeModal, isMobile]);

  // Sincroniza a ref com a função mais recente
  handleProjectInfoRef.current = handleProjectInfo;

  const handleInfo = useCallback(() => {
    const id = `modal-info-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      formId: 'info-form',
      title: 'Informações',
      content: <CommandHelpers onStartTutorial={(type) => setActiveTutorial(type)} onClose={() => removeModal(id)} />,
      buttonText: 'Informações do projeto',
      iconName: 'infoOnInfo',
      // Usa a ref para evitar ordem de declaração / deps circulares
      action: () => handleProjectInfoRef.current(),
      onClose: () => removeModal(id),
    });
  }, [addModal, removeModal, setActiveTutorial]);

  // ── Espaço Cartesiano ─────────────────────────────────────────────────────

  const handleCartesianSpaceDraw = useCallback(() => {
    const id = `modal-cartesian-space-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Espaço Cartesiano',
      content: (
        <CartesianSpaceForm
          cartesianSpaceRef={cartesianSpaceRef}
          createCartesianSpace={() => {
            setElementsIsActive(true);
            drawingRef.current = true;
            elementsRef.current.shape = 'axis';
            elementsRef.current.active = true;
            removeModal(id);
          }}
          scene={sceneRef.current}
        />
      ),
      onClose: () => { removeModal(id); writingRef.current = false; },
      stopWriting,
      formId: 'cartesian-space-form',
      buttonText: 'Adicionar',
      buttonColor: 'green',
    });
    axisRef.current = true;
    setFunctionsOpen(true);
  }, [addModal, removeModal, cartesianSpaceRef, sceneRef, setElementsIsActive,
    drawingRef, elementsRef, axisRef, setFunctionsOpen, writingRef]);

  // ── Funções matemáticas ───────────────────────────────────────────────────

  const handleFunctionsControls = useCallback(() => {
    setElementsIsActive(true);
    elementsRef.current.shape = 'functions';
    elementsRef.current.type = 'shapes';
    elementsRef.current.active = true;
    const id = `modal-functions-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Funções',
      content: (
        <FunctionForm
          setCameraPosition={setCameraPosition}
          functionsRef={functionsRef}
          functionRef={functionRef}
          colorRef={colorRef}
          limitesRef={limitesRef}
        />
      ),
      onClose: () => removeModal(id),
      stopWriting,
      buttonText: 'Posicionar',
      formId: 'function-form',
      buttonColor: 'blue',
      action: () => {
        searchingPointRef.current = true;
        drawingRef.current = true;
        removeModal(id);
        writingRef.current = true;
      },
    });
    setFunctionsOpen(true);
  }, [addModal, removeModal, setElementsIsActive, elementsRef, setCameraPosition,
    functionsRef, functionRef, colorRef, limitesRef,
    searchingPointRef, drawingRef, writingRef, setFunctionsOpen]);

  // ── Terrenos / Montanhas ──────────────────────────────────────────────────

  const handleMountains = useCallback(() => {
    const id = `modal-mountains-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Terrenos',
      content: <PlanesForm isMobile={isMobile} selectedTerrainRef={selectedTerrainRef} />,
      onClose: () => removeModal(id),
      stopWriting,
      buttonText: 'Posicionar',
      formId: 'planes-form',
      buttonColor: 'blue',
      action: () => {
        elementsRef.current.shape = 'plane';
        elementsRef.current.type = 'shapes';
        elementsRef.current.active = true;
        setElementsIsActive(true);
        searchingPointRef.current = true;
        drawingRef.current = true;
        removeModal(id);
        writingRef.current = true;
      },
    });
  }, [addModal, removeModal, isMobile, selectedTerrainRef,
    searchingPointRef, drawingRef, writingRef, elementsRef, setElementsIsActive]);

  // ── Texto ─────────────────────────────────────────────────────────────────

  const addText = useCallback(() => {
    setElementsIsActive(true);
    elementsRef.current.shape = 'text';
    elementsRef.current.type = 'shapes';
    elementsRef.current.active = true;
    const id = `modal-text-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Texto',
      content: <TextForm textRef={textRef} colorRef={colorRef} fontRef={fontRef} />,
      onClose: () => removeModal(id),
      stopWriting,
      buttonText: 'Posicionar',
      formId: 'text-form',
      buttonColor: 'green',
      action: () => {
        textRef.current.active = true;
        searchingPointRef.current = true;
        drawingRef.current = true;
        writingRef.current = true;
        removeModal(id);
      },
    });
  }, [addModal, removeModal, setElementsIsActive, elementsRef,
    textRef, colorRef, fontRef, searchingPointRef, drawingRef, writingRef]);

  // ── Imagem ────────────────────────────────────────────────────────────────

  const addImage = useCallback(() => {
    const id = `modal-image-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Imagem',
      content: (
        <ImageForm
          addImageToScene={(imageId: string) => {
            addImageToScene(imageId, sceneRef.current, cameraRef.current);
            writingRef.current = false;
            removeModal(id);
          }}
          colorRef={colorRef}
          fontRef={fontRef}
        />
      ),
      onClose: () => { removeModal(id); writingRef.current = false; },
      stopWriting,
      formId: 'text-form',
      buttonColor: 'green',
    });
  }, [addModal, removeModal, colorRef, fontRef, writingRef, sceneRef, cameraRef]);

  // ── Limpar Espaço ─────────────────────────────────────────────────────────

  const handleSpaceClean = useCallback((onClear: () => void) => {
    const id = `modal-space-clean-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Limpar Espaço',
      content: <><br /></>,
      onClose: () => { removeModal(id); writingRef.current = false; },
      stopWriting,
      buttonText: 'Ok',
      formId: 'space-clean-form',
      buttonColor: 'red',
      action: () => { onClear(); removeModal(id); },
    });
  }, [addModal, removeModal, writingRef]);

  // ── Cenas Salvas ─────────────────────────────────────────────────────────

  const handleSavedScenes = useCallback(() => {
    const id = `modal-saved-scenes-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Cenas Salvas',
      content: (
        <SavedScenes
          handleCloseModal={handleCloseModal}
          isOpen={false}
          setScenesIsOpen={setScenesIsOpen}
          onSceneSelect={() => { }}
          onAddScene={() => { }}
          scene={sceneRef.current}
          canvas={mountRef.current}
          sceneRef={sceneRef}
          elementsStackRef={elementsStackRef}
          elementsRef={elementsRef}
          colorRef={colorRef}
          sizeRef={sizeRef}
          cartesianSpaceRef={cartesianSpaceRef}
          particleRef={particleRef}
          functionsRef={functionsRef}
          notify={notify}
        />
      ),
      onClose: () => { removeModal(id); writingRef.current = false; },
      stopWriting,
      formId: 'saved-scenes-form',
    });
  }, [addModal, removeModal, sceneRef, mountRef, elementsStackRef, elementsRef,
    colorRef, sizeRef, cartesianSpaceRef, particleRef, functionsRef,
    notify, writingRef, setScenesIsOpen]);

  // ── Marcadores de posição ─────────────────────────────────────────────────

  const handleMarkPosition = useCallback((isAdding?: boolean) => {
    const id = `modal-marked-points-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Marcadores',
      content: (
        <MarkersList
          isAdding={isAdding}
          setCameraPosition={setCameraPosition}
          position={lastIntersected?.current?.parent?.position}
          writingRef={writingRef}
          isMobile={isMobile}
        />
      ),
      onClose: () => { removeModal(id); writingRef.current = false; },
      stopWriting,
      formId: 'marked-points-form',
    });
  }, [addModal, removeModal, setCameraPosition, lastIntersected, writingRef, isMobile]);

  // ── Calculadora ───────────────────────────────────────────────────────────

  const handleCalculator = useCallback(() => {
    elementsRef.current.shape = 'text';
    elementsRef.current.type = 'shapes';
    elementsRef.current.active = true;
    const id = `modal-calculator-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Calculadora',
      formId: 'calculator-form',
      content: <Calculator textRef={textRef} writingRef={writingRef} />,
      onClose: () => removeModal(id),
      buttonText: 'Posicionar cálculo',
      action: () => {
        drawingRef.current = true;
        setElementsIsActive(true);
        searchingPointRef.current = true;
        removeModal(id);
        writingRef.current = true;
      },
    });
  }, [addModal, removeModal, elementsRef, textRef, writingRef,
    drawingRef, setElementsIsActive, searchingPointRef]);

  // ── Lápis / Caneta ────────────────────────────────────────────────────────
  // NOTA: no original, handlePencil não gera id — addModal sem id é intencional.
  // O modal de caneta fecha via handleCloseModal() no onClose, não removeModal(id).

  const handlePencil = useCallback(() => {
    elementsRef.current.active = false;
    setPencilIsActive(true);
    addModal({
      isOpen: true,
      title: 'Caneta',
      content: (
        <PencilForm
          drawerRef={drawerRef}
          colorRef={colorRef}
          applySettings={handleCloseModal}
        />
      ),
      onClose: () => {
        handleCloseModal();
        setIsOwnCursorActive(true);
      },
      stopWriting,
      formId: 'pencil-form',
    });
  }, [addModal, elementsRef, setPencilIsActive, drawerRef, colorRef, setIsOwnCursorActive]);

  // ── Edição de elementos ───────────────────────────────────────────────────

  const handleEditing = useCallback(() => {
    // Limpa os modos de busca antes de abrir o painel de edição
    searchingPointRef.current = false;

    const id = `modal-editing-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Edição de Elementos',
      content: (
        <EditingForm
          modalId={id}
          activateMode={(modeId: string) =>
            editingModeManager.activate(modeId, {
              lastIntersected,
              sceneRef,
              editingArrowsRef,
              editingInteractorRef,
              isDraggingRef,
              rotationRef,
              originalColor,
              setEditingInteractorIsActive,
              removeModal,
              addModal,
              deleteElement: (id: any) => deleteElementRef.current(id),
              modalId: id,
              updateElementPosition,
              animationContent: <AnimationForm lastIntersected={lastIntersected} />,
              waitingForFirstInteractionRef,
              notify,
            })
          }
          handleMarkPosition={handleMarkPosition}
          coordinates={coordinatesRef.current}
          editingInteractorRef={editingInteractorRef}
          sceneRef={sceneRef}
          lastIntersected={lastIntersected}
          isMobile={isMobile}
          colorRef={colorRef}
        />
      ),
      onClose: () => {
        editingInteractorRef.current.type = null;
        isDraggingRef.current = false;
        editingArrowsRef?.current?.remove();
        removeModal(id);
      },
    });
  }, [addModal, removeModal, editingModeManager, deleteElementRef, updateElementPosition,
    lastIntersected, sceneRef, editingArrowsRef, editingInteractorRef, isDraggingRef,
    rotationRef, originalColor, setEditingInteractorIsActive, isMobile, colorRef,
    searchingPointRef, handleMarkPosition]);

  // ── Criatividade / Desenho livre ──────────────────────────────────────────
  // NOTA: handleCreativity é auto-referenciado em CreativityForm.
  // Usamos uma ref estável para evitar dependência circular no useCallback.

  const handleCreativityRef = useRef<() => void>(() => { });

  const handleCreativity = useCallback(() => {
    drawingRef.current = true;
    setFunctionsOpen(false);
    setElementsIsActive(false);
    const id = `modal-creativity-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Criar',
      content: (
        <CreativityForm
          sizeRef={sizeRef}
          positionCursor={handleCloseModal}
          drawerRef={drawerRef}
          setIsOwnCursorActive={setIsOwnCursorActive}
          setPencilIsActive={setPencilIsActive}
          drawingRef={drawingRef}
          colorRef={colorRef}
          elementsRef={elementsRef}
          applySettings={handleCloseModal}
          setElementsIsActive={setElementsIsActive}
          isMobile={isMobile}
          activeCreativityRef={activeCreativityRef}
          currentColor={colorRef.current}
          setCurrentColor={() => { }}
          handleCreativity={() => handleCreativityRef.current()}
        />
      ),
      onClose: () => {
        setIsOwnCursorActive(true);
        drawingRef.current = true;
        removeModal(id);
      },
      stopWriting,
      formId: 'creativity-form',
    });
  }, [addModal, removeModal, drawingRef, setFunctionsOpen, setElementsIsActive,
    sizeRef, drawerRef, setIsOwnCursorActive, setPencilIsActive, colorRef,
    elementsRef, isMobile, activeCreativityRef, boardIsActive, setBoardIsActive]);

  // Sincroniza a ref com a versão mais recente da função
  handleCreativityRef.current = handleCreativity;

  // ── Unidades de medida ────────────────────────────────────────────────────

  const handleUnitsSettings = useCallback(() => {
    const id = 'modal-unit-settings';
    if (modalsList.find((m: any) => m.formId === 'unit-settings-form')) {
      removeModal(id);
      return;
    }
    addModal({
      id,
      title: 'Unidades de Medida',
      content: <UnitSettingsModal />,
      onClose: () => removeModal(id),
      formId: 'unit-settings-form',
      buttonText: 'Aplicar',
    });
  }, [addModal, removeModal, modalsList]);

  // ── Lousa (BlackBoard) ────────────────────────────────────────────────────
  // Não abre modal — ativa diretamente os refs/state necessários.
  // Mantido aqui por coesão com os outros handlers de ferramenta.

  const handleBlackBoard = useCallback(() => {
    setIsBlackBoardActive(true);
    setElementsIsActive(true);
    elementsRef.current.shape = 'blackboard';
    elementsRef.current.type = 'shapes';
    elementsRef.current.active = true;
    searchingPointRef.current = true;
    drawingRef.current = true;
    writingRef.current = true;
  }, [setIsBlackBoardActive, setElementsIsActive, elementsRef,
    searchingPointRef, drawingRef, writingRef]);

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    handleInfo,
    handleProjectInfo,
    handleCartesianSpaceDraw,
    handleFunctionsControls,
    handleMountains,
    addText,
    addImage,
    handleSpaceClean,
    handleSavedScenes,
    handleMarkPosition,
    handleCalculator,
    handlePencil,
    handleEditing,
    handleCreativity,
    handleBlackBoard,
    handleUnitsSettings,
    handleCloseModal,
  };
}