export type TraceSource = 'local' | 'remote' | 'import';

export interface TraceDescriptor {
  id: string;
  color: string;
  size: number;
  colorVariation: number;
  rawCoords: Float32Array;
  rawCount: number;
  positions: Float32Array | null;
  source: TraceSource;
  timestamp: number;
}

export interface TraceOptions {
  epsilon?: number;
  nRing?: number;
}
