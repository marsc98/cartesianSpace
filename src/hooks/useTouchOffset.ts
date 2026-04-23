import { useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';

// Module-level pre-allocated objects — not allocated per call
const _axisX = new THREE.Vector3();
const _axisY = new THREE.Vector3();
const _dQ = new THREE.Quaternion();
const _dQ2 = new THREE.Quaternion();
const _identity = new THREE.Quaternion();

const PAN_SPEED = 0.008;

interface TouchOffsetHook {
  touchOffsetQRef: RefObject<THREE.Quaternion>;
  addPanDelta: (deltaX: number, deltaY: number, accelQ: THREE.Quaternion) => void;
  cancelDecay: () => void;
  resetOffset: () => void;
}

export function useTouchOffset(): TouchOffsetHook {
  const touchOffsetQRef = useRef(new THREE.Quaternion());
  const decayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decayRafRef = useRef<number | null>(null);

  const cancelDecay = useCallback(() => {
    if (decayTimerRef.current !== null) {
      clearTimeout(decayTimerRef.current);
      decayTimerRef.current = null;
    }
    if (decayRafRef.current !== null) {
      cancelAnimationFrame(decayRafRef.current);
      decayRafRef.current = null;
    }
  }, []);

  const startDecay = useCallback(() => {
    function tick() {
      touchOffsetQRef.current.slerp(_identity, 0.15);
      if (touchOffsetQRef.current.dot(_identity) > 0.9999) {
        touchOffsetQRef.current.identity();
        decayRafRef.current = null;
        return;
      }
      decayRafRef.current = requestAnimationFrame(tick);
    }
    decayRafRef.current = requestAnimationFrame(tick);
  }, []);

  const addPanDelta = useCallback(
    (deltaX: number, deltaY: number, accelQ: THREE.Quaternion) => {
      cancelDecay();

      _axisY.set(0, 1, 0).applyQuaternion(accelQ);
      _axisX.set(1, 0, 0).applyQuaternion(accelQ);
      _dQ.setFromAxisAngle(_axisY, deltaX * PAN_SPEED);
      _dQ2.setFromAxisAngle(_axisX, deltaY * PAN_SPEED);
      touchOffsetQRef.current.multiply(_dQ).multiply(_dQ2);

      decayTimerRef.current = setTimeout(startDecay, 1000);
    },
    [cancelDecay, startDecay],
  );

  const resetOffset = useCallback(() => {
    cancelDecay();
    touchOffsetQRef.current.identity();
  }, [cancelDecay]);

  return { touchOffsetQRef, addPanDelta, cancelDecay, resetOffset };
}
