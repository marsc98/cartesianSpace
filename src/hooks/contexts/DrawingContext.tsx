import React, { createContext, useContext, useRef, useState, useEffect, useMemo } from 'react';
import { safeSetItem, safeGetValidated, safeGetParsed, isValidColor, isValidSize } from '../../utils/storage';
import * as THREE from 'three';
import type { DrawerState, CreativityRef, RulerState, Vector3 } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DrawingStateValue {
  isDrawing: boolean;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
  pencilIsActive: boolean;
  setPencilIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  linePoints: THREE.Vector3[];
  setLinePoints: React.Dispatch<React.SetStateAction<THREE.Vector3[]>>;
  awaitingSecondClick: boolean;
  setAwaitingSecondClick: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DrawingRefsValue {
  drawingRef: React.MutableRefObject<boolean>;
  drawingStartedRef: React.MutableRefObject<boolean>;
  drawingElementRef: React.MutableRefObject<THREE.Object3D | null>;
  initialElementsCoordinatesRef: React.MutableRefObject<Vector3>;
  lineBetweenPointsRef: React.MutableRefObject<THREE.Line[]>;
  currentTraceSegmentsRef: React.MutableRefObject<unknown[]>;
  drawerRef: React.MutableRefObject<DrawerState>;
  activeCreativityRef: React.MutableRefObject<CreativityRef>;
  colorRef: React.MutableRefObject<string>;
  sizeRef: React.MutableRefObject<number>;
  rulerRef: React.MutableRefObject<RulerState>;
  planesRef: React.MutableRefObject<boolean>;
}

export type DrawingContextValue = DrawingStateValue & DrawingRefsValue;

// ─── Contexts ─────────────────────────────────────────────────────────────────

const DrawingStateContext = createContext<DrawingStateValue | null>(null);
const DrawingRefsContext = createContext<DrawingRefsValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DrawingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [pencilIsActive, setPencilIsActive] = useState(false);
  const [linePoints, setLinePoints] = useState<THREE.Vector3[]>([]);
  const [awaitingSecondClick, setAwaitingSecondClick] = useState(false);

  const drawingRef = useRef(false);
  const drawingStartedRef = useRef(false);
  const drawingElementRef = useRef<THREE.Object3D | null>(null);
  const initialElementsCoordinatesRef = useRef<Vector3>({ x: 0, y: 0, z: 0 });
  const lineBetweenPointsRef = useRef<THREE.Line[]>([]);
  const currentTraceSegmentsRef = useRef<unknown[]>([]);
  const drawerRef = useRef<DrawerState>({ size: 20, active: false, selectedType: '2d', color: '#ff0000' });
  const activeCreativityRef = useRef<CreativityRef>({ id: '2dTrace', name: '2D', type: 'traces' });
  const colorRef = useRef('#ff0000');
  const sizeRef = useRef(10);
  const rulerRef = useRef<RulerState>({ active: false, object: null });
  const planesRef = useRef(false);

  useEffect(() => {
    const storedColor = safeGetValidated('color', isValidColor);
    const storedSize = safeGetParsed('size', isValidSize);
    if (storedColor !== null) colorRef.current = storedColor;
    if (storedSize !== null) sizeRef.current = storedSize;

    return () => {
      safeSetItem('color', colorRef.current);
      safeSetItem('size', String(sizeRef.current));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stateValue = useMemo<DrawingStateValue>(() => ({
    isDrawing, setIsDrawing,
    pencilIsActive, setPencilIsActive,
    linePoints, setLinePoints,
    awaitingSecondClick, setAwaitingSecondClick,
  }), [isDrawing, pencilIsActive, linePoints, awaitingSecondClick]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refsValue = useMemo<DrawingRefsValue>(() => ({
    drawingRef, drawingStartedRef, drawingElementRef,
    initialElementsCoordinatesRef, lineBetweenPointsRef,
    currentTraceSegmentsRef, drawerRef, activeCreativityRef,
    colorRef, sizeRef, rulerRef, planesRef,
  }), []);

  return (
    <DrawingStateContext.Provider value={stateValue}>
      <DrawingRefsContext.Provider value={refsValue}>
        {children}
      </DrawingRefsContext.Provider>
    </DrawingStateContext.Provider>
  );
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Hook granular — apenas estado reativo. Re-renderiza quando isDrawing/linePoints/etc mudam. */
export const useDrawingState = (): DrawingStateValue => {
  const ctx = useContext(DrawingStateContext);
  if (!ctx) throw new Error('useDrawingState must be used within DrawingProvider');
  return ctx;
};

/** Hook granular — apenas refs estáveis. Não causa re-renders por mudança de estado. */
export const useDrawingRefs = (): DrawingRefsValue => {
  const ctx = useContext(DrawingRefsContext);
  if (!ctx) throw new Error('useDrawingRefs must be used within DrawingProvider');
  return ctx;
};

/** Hook combinado — compatibilidade com consumers existentes. */
export const useDrawing = (): DrawingContextValue => ({
  ...useDrawingState(),
  ...useDrawingRefs(),
});
