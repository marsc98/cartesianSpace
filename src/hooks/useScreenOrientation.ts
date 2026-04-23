import { useState, useEffect, useRef, useCallback } from 'react';

interface RemappedAxes {
  beta: number;
  alpha: number;
  gamma: number;
}

interface ScreenOrientationHook {
  remapAxes: (beta: number, alpha: number, gamma: number) => RemappedAxes;
  showCalibrationButton: boolean;
  calibrate: (beta: number, alpha: number, gamma: number) => void;
}

function getOrientationType(): OrientationType | null {
  try {
    return screen.orientation?.type ?? null;
  } catch {
    return null;
  }
}

export function useScreenOrientation(): ScreenOrientationHook {
  const [orientationType, setOrientationType] = useState<OrientationType | null>(
    () => getOrientationType(),
  );

  const showCalibrationButton = orientationType === null;

  const calibrationOffsetRef = useRef({ beta: 0, alpha: 0, gamma: 0 });

  useEffect(() => {
    if (!screen.orientation) return;

    function handleChange() {
      setOrientationType(getOrientationType());
    }

    screen.orientation.addEventListener('change', handleChange);
    return () => screen.orientation.removeEventListener('change', handleChange);
  }, []);

  const calibrate = useCallback((beta: number, alpha: number, gamma: number) => {
    calibrationOffsetRef.current = { beta, alpha, gamma };
  }, []);

  const remapAxes = useCallback(
    (beta: number, alpha: number, gamma: number): RemappedAxes => {
      const bAdj = beta - calibrationOffsetRef.current.beta;
      const aAdj = alpha - calibrationOffsetRef.current.alpha;
      const gAdj = gamma - calibrationOffsetRef.current.gamma;

      switch (orientationType) {
        case 'portrait-secondary':
          return { beta: -bAdj, alpha: (aAdj + 180) % 360, gamma: -gAdj };
        case 'landscape-primary':
          return { beta: -gAdj, alpha: (aAdj + 90) % 360, gamma: bAdj };
        case 'landscape-secondary':
          return { beta: gAdj, alpha: ((aAdj - 90) % 360 + 360) % 360, gamma: -bAdj };
        default:
          return { beta: bAdj, alpha: aAdj, gamma: gAdj };
      }
    },
    [orientationType],
  );

  return { remapAxes, showCalibrationButton, calibrate };
}
