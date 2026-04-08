import React from 'react';
import HelpersList from '../../molecules/helpersList';
import RangeInput from '../../atoms/rangeInput';
import UniverseNavigator from '../../molecules/universeNavigator';
import { useCamera } from '../../../hooks/contexts/CameraContext';
import { useScene } from '../../../hooks/contexts/SceneContext';
import { useSession } from '../../../hooks/contexts/SessionContext';
import type { NotificationData } from '../../../hooks/useNotifications';
import css from './index.module.scss';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Entrada mínima para um botão da toolbar */
export interface HelperItem {
  iconName: string;
  hoverText: string;
  onClick: () => void;
  active: boolean;
  visible?: boolean;
}

export interface ToolsManagerProps {
  // ── Listas de helpers ─────────────────────────────────────────────────────
  bottomRightHelpers: HelperItem[];
  topRightHelpers: HelperItem[];
  topRightHelpersSec: HelperItem[];
  bottomLeftHelpers: HelperItem[];
  actionHelpers: HelperItem[];
  sceneHelpers: HelperItem[];

  // ── Estado de UI ──────────────────────────────────────────────────────────
  listOpen: boolean;
  setListOpen: (open: boolean) => void;

  // ── Navigator ─────────────────────────────────────────────────────────────
  notification: NotificationData | null;
  navigatorRenderFnRef: React.MutableRefObject<(() => void) | null>;
  onResetCamera: () => void;
  isLoading: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Gerencia e renderiza toda a camada de ferramentas:
 * - 6 grupos de HelpersList (toolbars posicionadas)
 * - RangeInput de velocidade de câmera
 * - UniverseNavigator (gizmo de orientação)
 *
 * Não contém lógica de negócio — recebe as listas de helpers já construídas
 * pelo index.tsx orquestrador.
 */
export function ToolsManager({
  bottomRightHelpers,
  topRightHelpers,
  topRightHelpersSec,
  bottomLeftHelpers,
  actionHelpers,
  sceneHelpers,
  listOpen,
  setListOpen,
  notification,
  navigatorRenderFnRef,
  onResetCamera,
  isLoading,
}: ToolsManagerProps) {
  const { isMobile } = useSession();
  const { cameraRef, speedRefectorRef } = useCamera();
  const { rendererRef } = useScene();

  return (
    <>
      {/* ── Toolbars ──────────────────────────────────────────────────────── */}
      <HelpersList
        key="bottomRightHelpers"
        id="bottomRightHelpers"
        listOpen={listOpen}
        setListOpen={setListOpen}
        list={bottomRightHelpers}
        position={isMobile ? 'brc' : 'brr'}
      />
      <HelpersList
        key="topRightHelpers"
        id="topRightHelpers"
        listOpen={listOpen}
        setListOpen={setListOpen}
        list={topRightHelpers}
        position="trr"
      />
      <HelpersList
        key="bottomLeftHelpers"
        id="bottomLeftHelpers"
        isMobile={isMobile}
        listOpen={listOpen}
        setListOpen={setListOpen}
        hasMobileChange={true}
        list={bottomLeftHelpers}
        position="blc"
      />
      <HelpersList
        key="actionHelpers"
        id="actionHelpers"
        isMobile={isMobile}
        listOpen={listOpen}
        setListOpen={setListOpen}
        list={actionHelpers}
        position="blr"
        jump="left-4"
      />
      <HelpersList
        key="sceneHelpers"
        id="sceneHelpers"
        listOpen={listOpen}
        setListOpen={setListOpen}
        list={sceneHelpers}
        position="tlr"
      />
      <HelpersList
        key="calculatorHelpers"
        id="calculatorHelpers"
        listOpen={listOpen}
        setListOpen={setListOpen}
        list={topRightHelpersSec}
        position="trr"
        jump="top-4.2"
      />

      {/* ── Controle de velocidade da câmera ──────────────────────────────── */}
      <div
        className={css['range-input-container']}
        style={{ right: !isMobile ? window?.innerWidth / 2 : undefined }}
        title="Velocidade"
      >
        <RangeInput
          id="sizeSetter"
          isMobile={isMobile}
          min={1}
          max={40}
          sizeRef={speedRefectorRef}
          shouldRotate={true}
        />
      </div>

      {/* ── Gizmo de navegação (WebGL scissor no renderer principal) ─────── */}
      {!notification && !isLoading && (
        <UniverseNavigator
          isMobile={isMobile}
          mainCamera={cameraRef.current}
          mainRenderer={rendererRef}
          renderFnRef={navigatorRenderFnRef}
          onClick={onResetCamera}
        />
      )}
    </>
  );
}
