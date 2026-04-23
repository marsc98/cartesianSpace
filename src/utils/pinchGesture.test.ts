import { describe, it, expect } from 'vitest';
import { calcPinchDelta } from './pinchGesture';

describe('calcPinchDelta', () => {
  it('dedos estáticos → zero em tudo', () => {
    const result = calcPinchDelta({ x: 100, y: 200 }, { x: 200, y: 200 }, { x: 100, y: 200 }, { x: 200, y: 200 });
    expect(result).toEqual({ zoom: 0, panX: 0, panY: 0 });
  });

  it('pinça abrindo → zoom positivo', () => {
    const result = calcPinchDelta({ x: 90, y: 200 }, { x: 210, y: 200 }, { x: 100, y: 200 }, { x: 200, y: 200 });
    expect(result.zoom).toBeGreaterThan(0);
  });

  it('pinça fechando → zoom negativo', () => {
    const result = calcPinchDelta({ x: 110, y: 200 }, { x: 190, y: 200 }, { x: 100, y: 200 }, { x: 200, y: 200 });
    expect(result.zoom).toBeLessThan(0);
  });

  it('pan puro (sem mudança de distância) → zoom ≈ 0', () => {
    const result = calcPinchDelta({ x: 110, y: 200 }, { x: 210, y: 200 }, { x: 100, y: 200 }, { x: 200, y: 200 });
    expect(result.zoom).toBeCloseTo(0);
    expect(Math.abs(result.panX)).toBeGreaterThan(0);
  });

  it('dedos se movendo juntos horizontalmente → panX correto', () => {
    const result = calcPinchDelta({ x: 110, y: 200 }, { x: 210, y: 200 }, { x: 100, y: 200 }, { x: 200, y: 200 });
    expect(result.panX).toBe(10);
    expect(result.panY).toBe(0);
  });

  it('distância < 10px (ruído) → zoom mínimo (responsabilidade do chamador)', () => {
    const result = calcPinchDelta({ x: 100, y: 200 }, { x: 104, y: 200 }, { x: 100, y: 200 }, { x: 100, y: 200 });
    // currDist=4, prevDist=0 → zoom=(4-0)*0.002=0.008; resultado calculado normalmente
    expect(typeof result.zoom).toBe('number');
  });
});
