import React, { createContext, useContext, useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { ParticleRef, HistoryStack, ElementAnimationState, Element } from '../../types';

interface SceneContextValue {
  mountRef: React.MutableRefObject<HTMLDivElement | null>;
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  elementsStackRef: React.MutableRefObject<Map<string, THREE.Object3D>>;
  historyRef: React.MutableRefObject<HistoryStack>;
  particleRef: React.MutableRefObject<ParticleRef>;
  blackBoardRef: React.MutableRefObject<{ active: boolean }>;
  elementAnimationRef: React.MutableRefObject<ElementAnimationState>;
  planeCubesRef: React.MutableRefObject<THREE.Mesh[]>;
  /** Dirty flag: set true to force a render on the next animation frame */
  needsRenderRef: React.MutableRefObject<boolean>;
}

const SceneContext = createContext<SceneContextValue | null>(null);

export const SceneProvider = ({ children }: { children: React.ReactNode }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const elementsStackRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const historyRef = useRef<HistoryStack>({ past: [], future: [] });
  const particleRef = useRef<ParticleRef>({ id: null, group: null });
  const blackBoardRef = useRef({ active: false });
  const elementAnimationRef = useRef<ElementAnimationState>({ active: false, equation: '' });
  const planeCubesRef = useRef<THREE.Mesh[]>([]);
  const needsRenderRef = useRef<boolean>(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const contextValue = useMemo(() => ({
    mountRef, sceneRef, rendererRef, elementsStackRef,
    historyRef, particleRef, blackBoardRef, elementAnimationRef,
    planeCubesRef, needsRenderRef,
  }), []);

  return (
    <SceneContext.Provider value={contextValue}>
      {children}
    </SceneContext.Provider>
  );
};

export const useScene = (): SceneContextValue => {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used within SceneProvider');
  return ctx;
};
