import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import * as THREE from 'three';
import { useCamera } from '../../../hooks/contexts/CameraContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AccelerometerState {
  x: number | string;
  y: number | string;
  z: number | string;
}

interface InputHandlerProps {
  /** Liga/desliga o modo acelerômetro */
  viewWithAccelerometer: boolean;
  /** Callback opcional para debug do acelerômetro */
  onAccelerometerChange?: (state: AccelerometerState) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Componente lógico (sem JSX visível) que centraliza todos os listeners
 * de input do canvas/window:
 * - mousemove / touchmove → atualiza coordenadas do cursor
 * - deviceorientation → controle por acelerômetro
 *
 * Eventos de pointer (down/move/up), wheel e keyboard são gerenciados pelo
 * hook useUniverseEventListeners — este componente lida apenas com os inputs
 * que dependem de estado React ou que precisam de cleanup gerenciado.
 */
export function InputHandler({
  viewWithAccelerometer,
  onAccelerometerChange,
}: InputHandlerProps) {
  const { cameraRef } = useCamera();
  const filteredOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });

  // Pre-allocated Three.js objects to avoid per-event allocations at ~60 Hz
  const _euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const _q = useRef(new THREE.Quaternion());
  const _qCorrection = useRef(new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)));

  // ── Accelerometer ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!viewWithAccelerometer) return;

    function handleOrientation(event: DeviceOrientationEvent) {
      if (event.alpha === null || event.beta === null || event.gamma === null) return;

      const smoothing = 0.8;

      // Correção de wrap-around do alpha antes do smoothing
      let rawAlpha = event.alpha;
      const prevAlpha = filteredOrientation.current.alpha;
      const alphaDiff = rawAlpha - prevAlpha;
      if (alphaDiff > 180) rawAlpha -= 360;
      if (alphaDiff < -180) rawAlpha += 360;

      filteredOrientation.current.alpha =
        smoothing * prevAlpha + (1 - smoothing) * rawAlpha;
      filteredOrientation.current.beta =
        smoothing * filteredOrientation.current.beta + (1 - smoothing) * event.beta;
      filteredOrientation.current.gamma =
        smoothing * filteredOrientation.current.gamma + (1 - smoothing) * event.gamma;

      const { alpha, beta, gamma } = filteredOrientation.current;
      const degToRad = Math.PI / 180;

      // Conversão para quaternion (abordagem Three.js DeviceOrientationControls)
      // Objetos pré-alocados via useRef — sem alocação a cada evento (~60 Hz)
      _euler.current.set(beta * degToRad, alpha * degToRad, -gamma * degToRad);
      _q.current.setFromEuler(_euler.current);

      // Corrige frame: alinha -Z da câmera com a normal da tela
      _q.current.multiply(_qCorrection.current);

      // Garante o caminho curto de interpolação
      if (cameraRef.current && cameraRef.current.quaternion.dot(_q.current) < 0) {
        _q.current.set(-_q.current.x, -_q.current.y, -_q.current.z, -_q.current.w);
      }
      if (cameraRef.current) cameraRef.current.quaternion.copy(_q.current);

      onAccelerometerChange?.({
        x: beta.toFixed(2),
        y: alpha.toFixed(2),
        z: gamma.toFixed(2),
      });
    }

    function requestPermission() {
      // iOS 13+ requer permissão explícita
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DOE.requestPermission === 'function') {
        DOE.requestPermission()
          .then((response) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [viewWithAccelerometer, cameraRef, onAccelerometerChange]);

  return null;
}

// ─── Hooks auxiliares expostos para uso no index.tsx ────────────────────────

/**
 * Hook que encapsula os handlers de cursor para serem passados ao <main>
 * via props onMouseMove/onTouchMove.
 */
export function useCursorHandlers(
  onCursorMove: (x: number, y: number) => void,
  modalsList: unknown[],
) {
  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      if (!modalsList?.length) {
        onCursorMove(e.clientX, e.clientY);
      }
    },
    [modalsList, onCursorMove],
  );

  const handleTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      if (!modalsList?.length) {
        onCursorMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [modalsList, onCursorMove],
  );

  return { handleMouseMove, handleTouchMove };
}
