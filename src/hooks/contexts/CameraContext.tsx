import React, { createContext, useContext, useRef, useEffect, useMemo } from 'react';
import { safeSetItem, safeGetParsed, isValidSpeed } from '../../utils/storage';
import * as THREE from 'three';
import type { CameraControls, CameraRotationState } from '../../types/camera';

interface CameraContextValue {
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  raycasterRef: React.MutableRefObject<THREE.Raycaster | null>;
  mouseRef: React.MutableRefObject<THREE.Vector2>;
  controlsRef: React.MutableRefObject<CameraControls>;
  speedRefectorRef: React.MutableRefObject<number>;
  rotationRef: React.MutableRefObject<CameraRotationState>;
}

const CameraContext = createContext<CameraContextValue | null>(null);

export const CameraProvider = ({ children }: { children: React.ReactNode }) => {
  const cameraRef = useRef<THREE.Camera | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef(new THREE.Vector2());
  const controlsRef = useRef<CameraControls>({
    shiftPressed: false,
    mouseDown: false,
    mouseMoving: false,
    lastX: 0,
    lastY: 0,
    rightButton: false,
    lastClickTime: 0,
  });
  const speedRefectorRef = useRef(10);
  const rotationRef = useRef<CameraRotationState>({
    x: 0, y: 0, z: 0,
    active: false,
    previousX: 0, previousY: 0,
  });

  useEffect(() => {
    const storedSpeed = safeGetParsed('speed', isValidSpeed);
    if (storedSpeed !== null) speedRefectorRef.current = storedSpeed;

    return () => {
      safeSetItem('speed', String(speedRefectorRef.current));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const contextValue = useMemo(() => ({
    cameraRef, raycasterRef, mouseRef,
    controlsRef, speedRefectorRef, rotationRef,
  }), []);

  return (
    <CameraContext.Provider value={contextValue}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = (): CameraContextValue => {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCamera must be used within CameraProvider');
  return ctx;
};
