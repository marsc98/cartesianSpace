import type { Element } from './element';

export interface SketchMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sketch extends SketchMeta {
  data: Element[];
}

export interface SketchSummary extends SketchMeta {
  elementCount: number;
  data: Element[];
}

export interface UpdateElement {
  id: string;
  updates: Partial<Element>;
}
