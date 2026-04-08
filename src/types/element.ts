import type { Vector3 } from './scene';

export type ElementType = 'traces' | 'text' | 'image' | 'marker' | string;

export interface Element {
  id: string;
  element: string;
  type?: ElementType;
  color: string;
  size: number | Vector3;
  scale?: Vector3;
  rotation?: Vector3;
  position?: Vector3;
}

export interface RenderedTrace extends Omit<Element, 'size'> {
  element: 'optimizedTrace';
  type: 'traces';
  size: number;
  positions: number[];
  colorVariation: number;
  origin: Vector3;
}

export type AnyElement = Element | RenderedTrace;
