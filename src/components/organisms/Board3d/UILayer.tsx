import React, { useEffect, useRef } from 'react';
import css from './UILayer.module.scss';
import Modal from '../../molecules/modal';
import NotificationCenter from '../../molecules/notificationCenter';
import PencilCursor from '../../atoms/pencilCursor';
import FunctionsList from '../../molecules/functionsList';
import TutorialGuide from '../TutorialGuide';
import { useUI } from '../../../hooks/contexts/UIContext';
import { useModal } from '../../../hooks/useModal';
import { useDrawingRefs } from '../../../hooks/contexts/DrawingContext';
import { useElements } from '../../../hooks/contexts/ElementsContext';
import { useSession } from '../../../hooks/contexts/SessionContext';
import { useFunctionsState, useFunctionsRefs } from '../../../hooks/contexts/FunctionsContext';
import { useCamera } from '../../../hooks/contexts/CameraContext';
import type { NotificationData } from '../../../hooks/useNotifications';
import EditingInteractor from '../../molecules/editingInteractor';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UILayerProps {
  /** Cor atual do cursor/lápis */
  currentColor: string;
  setCurrentColor: (color: string) => void;
  /** Posição 2D do cursor na tela */
  coordinates: { x: number; y: number; z?: number };
  /** Estado atual de notificação */
  notification: NotificationData | null;
  /** Fecha o painel de lista de funções */
  onCloseFunctionsList: () => void;
  /** Move a câmera para coordenadas específicas */
  onSetCameraPosition: (
    coords: { x: number; y: number; z: number },
    lookAt?: { x: number; y: number; z: number },
  ) => void;
  /** Controla visibilidade do EditingInteractor */
  editingInteractorIsActive: boolean;
  setEditingInteractorIsActive: (active: boolean) => void;
  /** Tutorial ativo no momento, null = nenhum */
  activeTutorial: string | null;
  onCloseTutorial: () => void;
  /** Rect da box selection ativa, null = sem seleção ativa */
  boxSelectorRect?: DOMRect | null;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Camada de UI 2D sobre o canvas Three.js.
 *
 * Responsabilidades:
 * - Renderizar todos os modais da lista `modalsList`
 * - Cursor personalizado (lápis / ícone de criatividade)
 * - Overlay de lista de funções matemáticas
 * - EditingInteractor via modal (resize/reposição)
 * - Central de notificações
 * - TutorialGuide
 */
export function UILayer({
  currentColor,
  setCurrentColor,
  coordinates,
  notification,
  onCloseFunctionsList,
  onSetCameraPosition,
  editingInteractorIsActive,
  setEditingInteractorIsActive,
  activeTutorial,
  onCloseTutorial,
  boxSelectorRect,
}: UILayerProps) {
  const { isOwnCursorActive, modalIsOpenRef, openModalCount } = useUI();
  const { modalsList, addModal, removeModal } = useModal();
  const { activeCreativityRef, colorRef, sizeRef } = useDrawingRefs();
  const { editingElementRef, editingInteractorRef, editingArrowsRef, lastIntersected } =
    useElements();
  const { isMobile } = useSession();
  const { functionsList, functionsOpen } = useFunctionsState();
  const { writingRef } = useFunctionsRefs();
  const { controlsRef } = useCamera();

  const editingInteractorModalId = 'modal-editing-interactor';
  const modalOpenRef = useRef(false);

  useEffect(() => {
    if (editingInteractorIsActive) {
      if (modalOpenRef.current) return;
      modalOpenRef.current = true;

      const interactorType = editingInteractorRef.current.type;
      const title = interactorType === 'scale' ? 'Redimensionar' : 'Reposicionar';

      addModal({
        id: editingInteractorModalId,
        title,
        formId: 'editing-interactor-form',
        fixed: true,
        isOpen: true,
        onClose: () => {
          modalOpenRef.current = false;
          editingInteractorRef.current.active = false;
          editingInteractorRef.current.type = '';
          editingInteractorRef.current.targetIds = undefined;
          if (interactorType === 'reposition') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (editingArrowsRef.current as any)?.highlightArrow?.(null);
            editingArrowsRef.current?.remove();
          }
          setEditingInteractorIsActive(false);
          removeModal(editingInteractorModalId);
        },
        content: (
          <EditingInteractor
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            editingArrowsRef={editingArrowsRef as any}
            editingInteractorIsActive={editingInteractorIsActive}
            editingInteractorRef={editingInteractorRef}
            lastIntersected={lastIntersected}
            controlsRef={controlsRef}
          />
        ),
      });
    } else {
      if (!modalOpenRef.current) return;
      modalOpenRef.current = false;
      editingInteractorRef.current.active = false;
      editingInteractorRef.current.type = '';
      editingInteractorRef.current.targetIds = undefined;
      removeModal(editingInteractorModalId);
    }
  }, [editingInteractorIsActive]);

  return (
    <>
      {/* Cursor personalizado (lápis / ícone de shape ativo) — oculto quando qualquer modal está aberto */}
      {isOwnCursorActive && openModalCount === 0 && (
        <PencilCursor
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
          img={activeCreativityRef.current.img}
          loading={editingElementRef.current.loading}
          position={coordinates}
          color={colorRef.current}
          size={sizeRef?.current}
          svgPath={undefined}
        />
      )}

      {/* Todos os modais abertos renderizados simultaneamente */}
      {modalsList?.map((item) => (
        <Modal
          key={item.id}
          id={item.id}
          modalState={item}
          modalIsOpenRef={modalIsOpenRef}
          writingRef={writingRef}
        />
      ))}

      {/* Overlay de funções matemáticas plotadas */}
      {(functionsList?.length ?? 0) > 0 && functionsOpen && (
        <FunctionsList
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          functionsList={functionsList as any[]}
          closeFunctionsList={onCloseFunctionsList}
          setCameraPosition={onSetCameraPosition as (coords: unknown) => void}
        />
      )}

      {/* Central de notificações toast */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <NotificationCenter notification={notification as any} isMobile={isMobile} />

      {/* Guia tutorial (onboarding) */}
      {activeTutorial && (
        <TutorialGuide type={activeTutorial} onClose={onCloseTutorial} />
      )}

      {/* Overlay de box selection */}
      {boxSelectorRect && (
        <div
          className={css['box-selector']}
          style={{
            left: boxSelectorRect.left,
            top: boxSelectorRect.top,
            width: boxSelectorRect.width,
            height: boxSelectorRect.height,
          }}
        />
      )}
    </>
  );
}
