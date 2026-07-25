import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { getParticleId } from '../editingModes/getParticleId';

interface BoxSelectionEventsDeps {
  sceneRef: MutableRefObject<THREE.Scene>;
  cameraRef: MutableRefObject<THREE.Camera>;
  rendererRef: MutableRefObject<THREE.WebGLRenderer>;
  handleEditing: (individualMode?: boolean) => void;
  temporarySelectionIdsRef: MutableRefObject<string[]>;
  lastIntersected: MutableRefObject<THREE.Object3D | null>;
  onBoxRect: (rect: DOMRect | null) => void;
}

const isSPenBarrel = (e: PointerEvent) =>
  e.pointerType === 'pen' &&
  ((e.buttons & 32) === 32 || e.button === 5 || e.button === 2);

function rectsIntersect(a: DOMRect, b: DOMRect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export function boxSelection(
  rect: DOMRect,
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
): string[] {
  const canvasRect = renderer.domElement.getBoundingClientRect();
  const ids: string[] = [];

  for (const child of scene.children) {
    const particleId = getParticleId(child);
    if (!particleId) continue;

    const box3 = new THREE.Box3().setFromObject(child);
    if (box3.isEmpty()) continue;

    const { min, max } = box3;
    const corners: THREE.Vector3[] = [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(min.x, max.y, min.z),
      new THREE.Vector3(max.x, max.y, min.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(max.x, min.y, max.z),
      new THREE.Vector3(min.x, max.y, max.z),
      new THREE.Vector3(max.x, max.y, max.z),
    ];

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    let anyVisible = false;

    for (const corner of corners) {
      const ndc = corner.clone().project(camera);
      if (ndc.z > 1) continue;
      anyVisible = true;
      const sx = ((ndc.x + 1) / 2) * canvasRect.width + canvasRect.left;
      const sy = ((-ndc.y + 1) / 2) * canvasRect.height + canvasRect.top;
      if (sx < minX) minX = sx;
      if (sy < minY) minY = sy;
      if (sx > maxX) maxX = sx;
      if (sy > maxY) maxY = sy;
    }

    if (!anyVisible) continue;

    // Clip projected bbox to canvas bounds — prevents extreme off-screen projections
    // from large geometries (e.g. long traces) creating false positives.
    const clampedLeft   = Math.max(minX, canvasRect.left);
    const clampedTop    = Math.max(minY, canvasRect.top);
    const clampedRight  = Math.min(maxX, canvasRect.right);
    const clampedBottom = Math.min(maxY, canvasRect.bottom);
    if (clampedRight <= clampedLeft || clampedBottom <= clampedTop) continue;

    const objectScreen = new DOMRect(clampedLeft, clampedTop, clampedRight - clampedLeft, clampedBottom - clampedTop);
    if (rectsIntersect(rect, objectScreen)) ids.push(particleId);
  }

  return ids;
}

export function useBoxSelectionEvents({
  sceneRef,
  cameraRef,
  rendererRef,
  handleEditing,
  temporarySelectionIdsRef,
  lastIntersected,
  onBoxRect,
}: BoxSelectionEventsDeps): void {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const activeRef = useRef(false);
  const pendingIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!e.ctrlKey && !isSPenBarrel(e)) return;
      e.preventDefault();
      startRef.current = { x: e.clientX, y: e.clientY };
      activeRef.current = true;
    };

    const updateIds = (curX: number, curY: number) => {
      if (!startRef.current) return;
      const x = Math.min(startRef.current.x, curX);
      const y = Math.min(startRef.current.y, curY);
      const w = Math.abs(curX - startRef.current.x);
      const h = Math.abs(curY - startRef.current.y);
      if (w < 4 && h < 4) return;
      const ids = boxSelection(
        new DOMRect(x, y, w, h),
        sceneRef.current,
        cameraRef.current,
        rendererRef.current,
      );
      if (ids.length < 1) return;
      pendingIdsRef.current = ids;
      temporarySelectionIdsRef.current = ids;
      let firstObj: THREE.Object3D | undefined;
      sceneRef.current.traverse((obj) => {
        if (!firstObj && getParticleId(obj) === ids[0]) firstObj = obj;
      });
      if (firstObj) {
        const mesh =
          firstObj instanceof THREE.Mesh
            ? firstObj
            : firstObj.children.find(
                (c: THREE.Object3D): c is THREE.Mesh => c instanceof THREE.Mesh,
              );
        lastIntersected.current = mesh ?? firstObj;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!startRef.current) return;
      const x = Math.min(startRef.current.x, e.clientX);
      const y = Math.min(startRef.current.y, e.clientY);
      const w = Math.abs(e.clientX - startRef.current.x);
      const h = Math.abs(e.clientY - startRef.current.y);
      if (w < 4 || h < 4) {
        onBoxRect(null);
        return;
      }
      onBoxRect(new DOMRect(x, y, w, h));
      if (!activeRef.current) updateIds(e.clientX, e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!activeRef.current || !startRef.current) return;
      activeRef.current = false;
      updateIds(e.clientX, e.clientY);
      // startRef kept alive so mouse movement continues updating the rect until ctrl is released
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'Control') return;
      startRef.current = null;
      activeRef.current = false;
      onBoxRect(null);
      if (pendingIdsRef.current.length < 1) return;
      pendingIdsRef.current = [];
      handleEditing();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    sceneRef,
    cameraRef,
    rendererRef,
    handleEditing,
    temporarySelectionIdsRef,
    lastIntersected,
    onBoxRect,
  ]);
}
