import { useRef, useCallback } from 'react';
import { createTraceDescriptor } from '../lib/drawing/traceDescriptor';
import { runTracePipeline } from '../lib/drawing/tracePipeline';
import type { TraceDescriptor, TraceSource } from '../types';

export function useDrawingPipeline(deps: any) {
  const rawCoordsRef = useRef(new Float32Array(4000 * 3));
  const rawCountRef  = useRef<number>(0);

  const accumulatePoint = useCallback((x: number, y: number, z: number) => {
    const i = rawCountRef.current;
    if (i >= 4000) return;
    rawCoordsRef.current[i * 3]     = x;
    rawCoordsRef.current[i * 3 + 1] = y;
    rawCoordsRef.current[i * 3 + 2] = z;
    rawCountRef.current++;
  }, []);

  const commitTrace = useCallback(() => {
    const n = rawCountRef.current;
    if (n < 2) return null;
    const { colorRef, sizeRef } = deps;
    const descriptor: TraceDescriptor = createTraceDescriptor({
      color: colorRef.current,
      size: sizeRef.current,
      rawCoords: rawCoordsRef.current,
      rawCount: n,
      source: 'local' as TraceSource,
    });
    const result = runTracePipeline(descriptor, deps);
    rawCountRef.current = 0;
    return result;
  }, []); // lê deps por referência — objeto estável vindo de drawingPipelineDepsRef.current

  const reset = useCallback(() => {
    rawCountRef.current = 0;
  }, []);

  return { accumulatePoint, commitTrace, reset };
}
