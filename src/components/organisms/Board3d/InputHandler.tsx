import { useCallback, useEffect, useRef } from 'react';
import type { RefObject, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
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
  /** Ref onde o quaternion processado é gravado (em vez de camera.quaternion diretamente) */
  accelQRef: RefObject<THREE.Quaternion>;
  /** Remapeia eixos conforme orientação da tela */
  remapAxes: (beta: number, alpha: number, gamma: number) => {
    beta: number;
    alpha: number;
    gamma: number;
  };
  /** Callback com valores raw do sensor (antes de smoothing) — usado para calibração */
  onRawOrientation?: (beta: number, alpha: number, gamma: number) => void;
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
  accelQRef,
  remapAxes,
  onRawOrientation,
  onAccelerometerChange,
}: InputHandlerProps) {
  const { cameraRef } = useCamera();
  const filteredOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });

  // Pre-allocated Three.js objects to avoid per-event allocations at ~60 Hz
  const _euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const _q = useRef(new THREE.Quaternion());
  const _qCorrection = useRef(new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)));

  // Keep callbacks in refs so the effect closure is always fresh
  const remapAxesRef = useRef(remapAxes);
  remapAxesRef.current = remapAxes;
  const onRawOrientationRef = useRef(onRawOrientation);
  onRawOrientationRef.current = onRawOrientation;

  // ── Accelerometer ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!viewWithAccelerometer) return;

    function handleOrientation(event: DeviceOrientationEvent) {
      if (event.alpha === null || event.beta === null || event.gamma === null) return;

      onRawOrientationRef.current?.(event.beta, event.alpha, event.gamma);

      const smoothing = 0.8;

      // Apply remapping before smoothing pipeline
      const { beta: bR, alpha: aR, gamma: gR } = remapAxesRef.current(
        event.beta,
        event.alpha,
        event.gamma,
      );

      // Wrap-around correction on remapped alpha before smoothing
      let rawAlpha = aR;
      const prevAlpha = filteredOrientation.current.alpha;
      const alphaDiff = rawAlpha - prevAlpha;
      if (alphaDiff > 180) rawAlpha -= 360;
      if (alphaDiff < -180) rawAlpha += 360;

      filteredOrientation.current.alpha =
        smoothing * prevAlpha + (1 - smoothing) * rawAlpha;
      filteredOrientation.current.beta =
        smoothing * filteredOrientation.current.beta + (1 - smoothing) * bR;
      filteredOrientation.current.gamma =
        smoothing * filteredOrientation.current.gamma + (1 - smoothing) * gR;

      const { alpha, beta, gamma } = filteredOrientation.current;
      const degToRad = Math.PI / 180;

      // Conversão para quaternion (abordagem Three.js DeviceOrientationControls)
      _euler.current.set(beta * degToRad, alpha * degToRad, -gamma * degToRad);
      _q.current.setFromEuler(_euler.current);

      // Corrige frame: alinha -Z da câmera com a normal da tela
      _q.current.multiply(_qCorrection.current);

      // Garante o caminho curto de interpolação
      if (cameraRef.current && cameraRef.current.quaternion.dot(_q.current) < 0) {
        _q.current.set(-_q.current.x, -_q.current.y, -_q.current.z, -_q.current.w);
      }

      // Grava em accelQRef — useCameraComposer aplica à câmera
      accelQRef.current.copy(_q.current);

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
  }, [viewWithAccelerometer, cameraRef, accelQRef, onAccelerometerChange]);

  return null;
}

// ─── Hooks auxiliares expostos para uso no index.tsx ────────────────────────

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
