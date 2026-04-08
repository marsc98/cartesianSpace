import React, { createContext, useContext, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import type { Marker, EditingInteractorState } from '../../types';

interface ElementsRef {
  shape: string;
  active: boolean;
}

interface EditingElementState {
  active: boolean;
  initPressTime: number | null;
  initCoordinates: { x: number; y: number };
  loading: boolean;
}

interface ElementsContextValue {
  elementsIsActive: boolean;
  setElementsIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  isResizingElement: boolean;
  setIsResizingElement: React.Dispatch<React.SetStateAction<boolean>>;
  elementsRef: React.MutableRefObject<ElementsRef>;
  editingElementRef: React.MutableRefObject<EditingElementState>;
  editingInteractorRef: React.MutableRefObject<EditingInteractorState>;
  editingArrowsRef: React.MutableRefObject<THREE.Group | null>;
  isDraggingRef: React.MutableRefObject<boolean>;
  lastIntersected: React.MutableRefObject<THREE.Mesh | null>;
  originalColor: React.MutableRefObject<THREE.Color | null>;
  searchingFacesRef: React.MutableRefObject<boolean>;
  selectedTerrainRef: React.MutableRefObject<THREE.Mesh | null>;
  searchingPointRef: React.MutableRefObject<boolean>;
  markersRef: React.MutableRefObject<Marker[]>;
}

const ElementsContext = createContext<ElementsContextValue | null>(null);

export const ElementsProvider = ({ children }: { children: React.ReactNode }) => {
  const [elementsIsActive, setElementsIsActive] = useState(false);
  const [isResizingElement, setIsResizingElement] = useState(false);

  const elementsRef = useRef<ElementsRef>({ shape: '', active: false });
  const editingElementRef = useRef<EditingElementState>({
    active: false,
    initPressTime: null,
    initCoordinates: { x: 0, y: 0 },
    loading: false,
  });
  const editingInteractorRef = useRef<EditingInteractorState>({
    previousX: 0, previousY: 0,
    active: false,
    initialX: null, initialY: null,
    type: 'scale',
  });
  const editingArrowsRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const lastIntersected = useRef<THREE.Mesh | null>(null);
  const originalColor = useRef<THREE.Color | null>(null);
  const searchingFacesRef = useRef(false);
  const selectedTerrainRef = useRef<THREE.Mesh | null>(null);
  const searchingPointRef = useRef(false);
  const markersRef = useRef<Marker[]>([{
    id: '756540985106411aa62398338a4',
    name: 'Ponto Inicial',
    position: { x: 0, y: 0, z: 0 },
  }]);

  const contextValue = useMemo(() => ({
    elementsIsActive, setElementsIsActive,
    isResizingElement, setIsResizingElement,
    elementsRef, editingElementRef, editingInteractorRef,
    editingArrowsRef, isDraggingRef, lastIntersected,
    originalColor, searchingFacesRef, selectedTerrainRef,
    searchingPointRef, markersRef,
  // setters and refs are stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [elementsIsActive, isResizingElement]);

  return (
    <ElementsContext.Provider value={contextValue}>
      {children}
    </ElementsContext.Provider>
  );
};

export const useElements = (): ElementsContextValue => {
  const ctx = useContext(ElementsContext);
  if (!ctx) throw new Error('useElements must be used within ElementsProvider');
  return ctx;
};
