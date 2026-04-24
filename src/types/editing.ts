import type React from 'react';
import type { ModalConfig, ModalInstance } from './modal';
import type * as THREE from 'three';

export type EditingModeId =
  | 'scale'
  | 'rotation'
  | 'delete'
  | 'reposition'
  | 'freeReposition'
  | 'animation'
  | 'copy'
  | string;

export interface EditingInteractorState {
  previousX: number;
  previousY: number;
  active: boolean;
  initialX: number | null;
  initialY: number | null;
  type: 'scale' | 'rotation' | 'delete' | string;
}

export interface EditingModeContext {
  editingInteractorRef: React.MutableRefObject<EditingInteractorState>;
  lastIntersected: React.MutableRefObject<THREE.Object3D | any>;
  originalColor: React.MutableRefObject<THREE.Color | null>;
  rotationRef: React.MutableRefObject<{
    x: number; y: number; z: number;
    active: boolean;
    previousX: number; previousY: number;
  }>;
  sceneRef: React.MutableRefObject<THREE.Scene>;
  editingArrowsRef: React.MutableRefObject<THREE.Group | null | any>;
  isDraggingRef: React.MutableRefObject<boolean>;
  animationContent?: React.ReactNode;
  modalId?: string;
  
  setEditingInteractorIsActive?: (active: boolean) => void;
  removeModal?: (id: string) => void;
  addModal?: (config: ModalConfig | ModalInstance) => void;
  deleteElement?: (id: string) => void;
  fixModal?: () => void;
  updateElementPosition?: (x: number, y: number, control: boolean) => void;
  waitingForFirstInteractionRef?: React.MutableRefObject<boolean>;
  notify?: (iconName: string, variant: string, options?: { duration?: number }) => void;
}

export interface EditingMode {
  id: EditingModeId;
  enter(ctx: EditingModeContext): void;
  update(event?: any, ctx?: EditingModeContext): void;
  exit(ctx: EditingModeContext): void;
}
