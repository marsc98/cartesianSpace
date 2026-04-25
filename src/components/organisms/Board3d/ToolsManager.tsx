import React from 'react';
import HelpersList from '../../molecules/helpersList';
import RangeInput from '../../atoms/rangeInput';
import UniverseNavigator from '../../molecules/universeNavigator';
import { useCamera } from '../../../hooks/contexts/CameraContext';
import { useScene } from '../../../hooks/contexts/SceneContext';
import { useSession } from '../../../hooks/contexts/SessionContext';
import { useDrawingRefs } from '../../../hooks/contexts/DrawingContext';
import { useDepthIndicator } from '../../../hooks/useDepthIndicator';
import { useUnits } from '../../../hooks/contexts/UnitsContext';
import { safeSetItem } from '../../../utils/storage';
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
  const { sceneRef, rendererRef, needsRenderRef } = useScene();
  const { drawDistanceRef } = useDrawingRefs();
  const { onDistanceChange } = useDepthIndicator(cameraRef, sceneRef, needsRenderRef);
  const { distanceUnit, velocityUnit } = useUnits();

  return (
    <>
      {/* ── Toolbars ──────────────────────────────────────────────────────── */}
      <HelpersList
        key="rightHelpers"
        id="rightHelpers"
        listOpen={listOpen}
        setListOpen={setListOpen}
        list={bottomRightHelpers}
        position='brc'
        jump={isMobile ? "bottom-15" : 'bottom-25'}
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
        key="leftHelpers"
        id="leftHelpers"
        isMobile={isMobile}
        listOpen={listOpen}
        setListOpen={setListOpen}
        list={bottomLeftHelpers}
        position="blc"
        jump={isMobile ? "bottom-17" : "bottom-25"}
      />
      <HelpersList
        key="actionHelpers"
        id="actionHelpers"
        listOpen={listOpen}
        setListOpen={setListOpen}
        list={actionHelpers}
        position={isMobile ? "brr" : "bcr"}
        jump={isMobile ? "bottom-5" : "bottom-.3"}
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
        jump="top-5"
      />

      {/* ── Controle de distância de interação ───────────────────────────── */}
      <div
        className={css['range-input-container']}
        style={{ left: "5px" }}
        title="Distância"
      >
        <RangeInput
          id="distanceSetter"
          isMobile={isMobile}
          min={10}
          max={100}
          label={distanceUnit}
          sizeRef={drawDistanceRef}
          shouldRotate={false}
          onValueChange={(val) => {
            onDistanceChange(val);
            safeSetItem('drawDistance', String(val));
          }}
          thumbIcon="/images/icons/ruler.svg"
        />
      </div>

      {/* ── Controle de velocidade da câmera ──────────────────────────────── */}
      <div
        className={css['range-input-container']}
        style={{ right: isMobile ? 0 : '5px', left: 'auto' }}
        title="Velocidade"
      >
        <RangeInput
          id="sizeSetter"
          shouldRotate={false}
          isMobile={isMobile}
          min={10}
          max={100}
          label={velocityUnit}
          sizeRef={speedRefectorRef}
          onValueChange={(val) => safeSetItem('speed', String(val))}
          thumbIcon="/images/icons/speed.svg"
        />
      </div>

      {/* ── Gizmo de navegação (WebGL scissor no renderer principal) ─────── */}
      {!notification && !isLoading && (
        <UniverseNavigator
          isMobile={isMobile}
          mainCamera={cameraRef}
          mainRenderer={rendererRef}
          renderFnRef={navigatorRenderFnRef}
          onClick={onResetCamera}
        />
      )}
    </>
  );
}
