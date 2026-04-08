import type { Element } from './element';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ParticleRef {
  id: string | null;
  group: unknown | null;
}

export interface HistoryStack {
  past: Element[][];
  future: Element[][];
}

export interface ElementAnimationState {
  active: boolean;
  equation: string;
}

export interface DrawerState {
  size: number;
  active: boolean;
  selectedType: string;
  color: string;
}

export interface CreativityRef {
  id: string;
  name: string;
  type: string;
  img?: string;
}

export interface RulerState {
  active: boolean;
  object: unknown | null;
}
