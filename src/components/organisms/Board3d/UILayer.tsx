import React from 'react';
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
  /** Para o modo de resize */
  onStopResize: () => void;
  /** Tutorial ativo no momento, null = nenhum */
  activeTutorial: string | null;
  onCloseTutorial: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Camada de UI 2D sobre o canvas Three.js.
 *
 * Responsabilidades:
 * - Renderizar todos os modais da lista `modalsList`
 * - Cursor personalizado (lápis / ícone de criatividade)
 * - Overlay de lista de funções matemáticas
 * - EditingInteractor (handle de resize/reposição)
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
  onStopResize,
  activeTutorial,
  onCloseTutorial,
}: UILayerProps) {
  const { isOwnCursorActive, modalIsOpenRef } = useUI();
  const { modalsList } = useModal();
  const { activeCreativityRef, colorRef, sizeRef } = useDrawingRefs();
  const { editingElementRef, editingInteractorRef, editingArrowsRef, lastIntersected } =
    useElements();
  const { isMobile } = useSession();
  const { functionsList, functionsOpen } = useFunctionsState();
  const { writingRef } = useFunctionsRefs();
  const { controlsRef, speedRefectorRef } = useCamera();

  return (
    <>
      {/* Cursor personalizado (lápis / ícone de shape ativo) */}
      {isOwnCursorActive && (
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
          setIsOwnCursorActive={() => { }}
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

      {/* Handle de resize/reposição de elemento selecionado */}
      {editingInteractorIsActive &&
        editingInteractorRef.current.initialX != null &&
        editingInteractorRef.current.initialY != null && (
          <EditingInteractor
            speedRefectorRef={speedRefectorRef}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            editingArrowsRef={editingArrowsRef as any}
            editingInteractorIsActive={editingInteractorIsActive}
            setEditingInteractorIsActive={setEditingInteractorIsActive}
            controlsRef={controlsRef}
            stopResize={onStopResize}
            editingInteractorRef={editingInteractorRef}
            lastIntersected={lastIntersected}
            coordinates={{
              x: editingInteractorRef.current.initialX,
              y: editingInteractorRef.current.initialY,
            }}
            isMobile={isMobile}
          />
        )}

      {/* Central de notificações toast */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <NotificationCenter notification={notification as any} isMobile={isMobile} />

      {/* Guia tutorial (onboarding) */}
      {activeTutorial && (
        <TutorialGuide type={activeTutorial} onClose={onCloseTutorial} />
      )}
    </>
  )
}
