import React, { createContext, useContext, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { Vector3 } from '../../types';

// ─── Coordinates context (muda a cada mousemove) ──────────────────────────────

interface CoordinatesContextValue {
  coordinates: Vector3;
  setCoordinates: React.Dispatch<React.SetStateAction<Vector3>>;
}

// ─── Session context (muda raramente) ────────────────────────────────────────

interface SessionContextValue {
  isMobile: boolean;
  setIsMobile: React.Dispatch<React.SetStateAction<boolean>>;
  currentColor: string;
  setCurrentColor: React.Dispatch<React.SetStateAction<string>>;
  counting: boolean;
  seconds: number;
  startCounter: () => void;
  stopCounter: () => void;
  resetCounter: () => void;
  lastTouchTime: React.MutableRefObject<number>;
  touchStartCoords: React.MutableRefObject<Touch[]>;
  doubleTouch: React.MutableRefObject<boolean>;
}

const CoordinatesContext = createContext<CoordinatesContextValue | null>(null);
const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [isMobile, setIsMobile] = useState(isMobileDevice || false);
  const [coordinates, setCoordinates] = useState<Vector3>({ x: 0, y: 0, z: 0 });
  const [currentColor, setCurrentColor] = useState('#ff0000');
  const [counting, setCounting] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const lastTouchTime = useRef(0);
  const touchStartCoords = useRef<Touch[]>([]);
  const doubleTouch = useRef(false);

  const startCounter = useCallback(() => {
    if (intervalRef.current) return;
    setCounting(true);
    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 700);
  }, []);

  const stopCounter = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCounting(false);
  }, []);

  const resetCounter = useCallback(() => {
    setSeconds(0);
    stopCounter();
  }, [stopCounter]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const coordinatesValue = useMemo<CoordinatesContextValue>(
    () => ({ coordinates, setCoordinates }),
    [coordinates],
  );

  const sessionValue = useMemo<SessionContextValue>(
    () => ({
      isMobile, setIsMobile,
      currentColor, setCurrentColor,
      counting, seconds,
      startCounter, stopCounter, resetCounter,
      lastTouchTime, touchStartCoords, doubleTouch,
    }),
    [isMobile, currentColor, counting, seconds, startCounter, stopCounter, resetCounter],
  );

  return (
    <CoordinatesContext.Provider value={coordinatesValue}>
      <SessionContext.Provider value={sessionValue}>
        {children}
      </SessionContext.Provider>
    </CoordinatesContext.Provider>
  );
};

/** Coordenadas do cursor — invalida a cada mousemove. Usar somente onde necessário. */
export const useCoordinates = (): CoordinatesContextValue => {
  const ctx = useContext(CoordinatesContext);
  if (!ctx) throw new Error('useCoordinates must be used within SessionProvider');
  return ctx;
};

/** Estado de sessão estável — não invalida por movimento do cursor. */
export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};
