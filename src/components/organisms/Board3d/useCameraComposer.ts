import { useRef, useEffect } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import * as THREE from 'three';
import type { Camera } from 'three';

const SLERP_ALPHA = 0.15;
const NOISE_THRESHOLD = 0.0001;

interface CameraComposerOptions {
  cameraRef: RefObject<Camera>;
  accelQRef: RefObject<THREE.Quaternion>;
  touchOffsetQRef: RefObject<THREE.Quaternion>;
  accelActiveRef: RefObject<boolean>;
  needsRenderRef: MutableRefObject<boolean>;
  accelerometerRenderFnRef: MutableRefObject<(() => void) | null>;
}

export function useCameraComposer({
  cameraRef,
  accelQRef,
  touchOffsetQRef,
  accelActiveRef,
  needsRenderRef,
  accelerometerRenderFnRef,
}: CameraComposerOptions): void {
  const _qCurrent = useRef(new THREE.Quaternion());
  const _composed = useRef(new THREE.Quaternion());

  useEffect(() => {
    if (cameraRef.current) {
      _qCurrent.current.copy(cameraRef.current.quaternion);
    }

    function update() {
      if (!accelActiveRef.current || !cameraRef.current) return;

      _composed.current.copy(accelQRef.current).multiply(touchOffsetQRef.current);

      if (_qCurrent.current.dot(_composed.current) < 0) {
        _composed.current.negate();
      }

      _qCurrent.current.slerp(_composed.current, SLERP_ALPHA);

      if (_qCurrent.current.angleTo(cameraRef.current.quaternion) > NOISE_THRESHOLD) {
        cameraRef.current.quaternion.copy(_qCurrent.current);
        needsRenderRef.current = true;
      }
    }

    accelerometerRenderFnRef.current = update;

    return () => {
      accelerometerRenderFnRef.current = null;
    };
  }, [cameraRef, accelQRef, touchOffsetQRef, accelActiveRef, needsRenderRef, accelerometerRenderFnRef]);
}
