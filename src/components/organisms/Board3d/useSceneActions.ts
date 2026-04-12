import { useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useScene } from '../../../hooks/contexts/SceneContext';
import { useElements } from '../../../hooks/contexts/ElementsContext';
import { useCamera } from '../../../hooks/contexts/CameraContext';
import { useDrawing } from '../../../hooks/contexts/DrawingContext';
import { createRealisticStarfield, disposeMultipleObjects, drawRuler } from './spaceElements';

// ─── Types ────────────────────────────────────────────────────────────────

export interface UseSceneActionsDeps {
  /** Setter de estado para ativar/desativar régua */
  setRulerIsActive: (active: boolean) => void;
  rulerIsActive: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Encapsula as ações que interagem diretamente com a cena Three.js
 * e com a câmera, mantendo o componente Board3d livre desse detalhe.
 */
export function useSceneActions({ setRulerIsActive, rulerIsActive }: UseSceneActionsDeps) {
  const { sceneRef, rendererRef, elementsStackRef, needsRenderRef } = useScene();
  const { cameraRef, raycasterRef, mouseRef, speedRefectorRef } = useCamera();
  const { editingArrowsRef, lastIntersected, originalColor } = useElements();
  const { colorRef, rulerRef } = useDrawing();

  // Planos reutilizados para reposição de elementos (estáveis entre renders)
  const planeXZ = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const planeXY = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const intersectionPoint = useMemo(() => new THREE.Vector3(), []);

  // ── Câmera ────────────────────────────────────────────────────────────────

  const setCameraPosition = useCallback(
    (
      coords: { x: number; y: number; z: number },
      lookAt = { x: 0, y: 0, z: 0 },
    ) => {
      cameraRef.current?.position.set(coords.x, coords.y, coords.z);
      cameraRef.current?.lookAt(lookAt.x, lookAt.y, lookAt.z);
    },
    [cameraRef],
  );

  const moveCamera = useCallback(
    (direction: string) => {
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      const speed = speedRefectorRef.current / 2;
      const dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const map: Record<string, [THREE.Vector3, number]> = {
        forward: [dir, speed], backward: [dir, -speed],
        left: [right, -speed], right: [right, speed],
        up: [up, speed], down: [up, -speed],
      };
      const entry = map[direction];
      if (entry) {
        cam.position.addScaledVector(entry[0], entry[1]);
        needsRenderRef.current = true;
      }
    },
    [cameraRef, speedRefectorRef, needsRenderRef],
  );

  const rotateCamera = useCallback(
    (deltaX: number, deltaY: number) => {
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      const s = 0.002;
      cam.quaternion.premultiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * s),
      );
      const pitchAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      cam.quaternion.premultiply(
        new THREE.Quaternion().setFromAxisAngle(pitchAxis, deltaY * s),
      );
      cam.quaternion.normalize();
    },
    [cameraRef],
  );

  // ── Cena ──────────────────────────────────────────────────────────────────

  const addNewCube = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return;
    const dir = new THREE.Vector3();
    cameraRef.current.getWorldDirection(dir);
    const pos = cameraRef.current.position.clone().addScaledVector(dir, 20);
    const geometry = new THREE.BoxGeometry(20, 20, 20);
    const materials = Array.from({ length: 6 }, () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          Math.random() * 0.4,
          Math.random() * 0.6,
          Math.random() * 0.6 + 0.4,
        ),
        transparent: true,
        opacity: 0.9,
      }),
    );
    const cube = new THREE.Mesh(geometry, materials);
    cube.position.copy(pos);
    sceneRef.current.add(cube);
  }, [sceneRef, cameraRef]);

  const clearScene = useCallback(
    (onDone?: () => void) => {
      sceneRef.current?.traverse((obj: any) => {
        obj.geometry?.dispose();
        const mat = obj.material;
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((m: any) => m.dispose());
      });
      sceneRef.current?.clear();
      createRealisticStarfield(sceneRef, elementsStackRef);
      onDone?.();
    },
    [sceneRef, elementsStackRef],
  );

  // ── Raycasting ────────────────────────────────────────────────────────────

  const isPointInsideCube = useCallback(
    (point: any, cube: any) => {
      if (!point || !cube) return undefined;
      const h = 0.25;
      return (
        point.x >= cube.x - h && point.x <= cube.x + h &&
        point.y >= cube.y - h && point.y <= cube.y + h &&
        point.z >= cube.z - h && point.z <= cube.z + h
      ) ? cube : undefined;
    },
    [],
  );

  const identifyFace = useCallback(
    (
      event: MouseEvent,
      scene: THREE.Scene,
      camera: THREE.Camera,
      renderer: THREE.WebGLRenderer,
    ) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(scene.children, true);
      if (hits.length > 0) {
        const hit = hits[0].object as any;
        if (lastIntersected.current !== hit) {
          if (lastIntersected.current && originalColor.current)
            (lastIntersected.current as any).material.color.copy(originalColor.current);
          lastIntersected.current = hit;
          if (hit.material?.color) {
            originalColor.current = hit.material.color.clone();
            hit.material.color.set(0xffff00);
          }
        }
      } else if (lastIntersected.current) {
        (lastIntersected.current as any).material.color.copy(originalColor.current);
        lastIntersected.current = null;
        originalColor.current = null;
      }
    },
    [mouseRef, raycasterRef, lastIntersected, originalColor],
  );

  const updateElementPosition = useCallback(
    (clientX: number, clientY: number, ctrl: boolean) => {
      if (!rendererRef.current || !cameraRef.current || !lastIntersected.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      let x = ((clientX - rect.left) / rect.width) * 2 - 1;
      let y = -((clientY - rect.top) / rect.height) * 2 + 1;
      x += x * 0.0008;
      y -= y * 0.0008;
      raycasterRef.current.setFromCamera({ x, y }, cameraRef.current);
      const objPos = (lastIntersected.current as any).parent.position;
      const plane = ctrl ? planeXZ : planeXY;
      plane.constant = ctrl ? -objPos.y : -objPos.z;
      if (raycasterRef.current.ray.intersectPlane(plane, intersectionPoint)) {
        ctrl
          ? objPos.set(intersectionPoint.x, objPos.y, intersectionPoint.z)
          : objPos.set(intersectionPoint.x, intersectionPoint.y, objPos.z);
        editingArrowsRef.current?.updatePosition(lastIntersected.current);
      }
    },
    [rendererRef, cameraRef, raycasterRef, lastIntersected, planeXZ, planeXY, intersectionPoint, editingArrowsRef],
  );

  // ── Element interaction ───────────────────────────────────────────────────

  const handleElementRotation = useCallback(
    (tx: number, ty: number) => {
      const p = (lastIntersected.current as any)?.parent;
      if (!p) return;
      const lf = 0.5;
      p.rotation.x += (tx - p.rotation.x) * lf;
      p.rotation.y += (ty - p.rotation.y) * lf;
      p.rotation.z += 0.05;
    },
    [lastIntersected],
  );

  const handleElementResize = useCallback(
    (mv: number) => {
      const p = (lastIntersected.current as any)?.parent;
      if (!p) return;
      const amount = mv > 0 ? -0.05 : 0.05;
      if (p.scale.x <= 0.5 && amount < 0) return;
      p.scale.addScalar(amount);
    },
    [lastIntersected],
  );

  // ── Ruler ─────────────────────────────────────────────────────────────────

  const handleRuler = useCallback(() => {
    rulerRef.current.active = !rulerRef.current.active;
    setRulerIsActive(!rulerIsActive);
    if (rulerRef.current.active) {
      rulerRef.current.object = drawRuler(cameraRef, sceneRef, colorRef);
      return;
    }
    const obj = rulerRef.current.object;
    cameraRef.current?.remove(obj);
    obj?.traverse((c: any) => {
      c.geometry?.dispose();
      const m = c.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x: any) => x.dispose());
    });
    rulerRef.current.object = null;
  }, [rulerRef, rulerIsActive, setRulerIsActive, cameraRef, sceneRef, colorRef]);

  // ── Stars ─────────────────────────────────────────────────────────────────

  const handleStars = useCallback(
    (starsAreActive: boolean, setStarsAreActive: (v: boolean) => void) => {
      if (starsAreActive) {
        disposeMultipleObjects(sceneRef, elementsStackRef, 'realistic-starfield');
        setStarsAreActive(false);
      } else {
        createRealisticStarfield(sceneRef, elementsStackRef);
        setStarsAreActive(true);
      }
    },
    [sceneRef, elementsStackRef],
  );

  return {
    setCameraPosition,
    moveCamera,
    rotateCamera,
    addNewCube,
    clearScene,
    isPointInsideCube,
    identifyFace,
    updateElementPosition,
    handleElementRotation,
    handleElementResize,
    handleRuler,
    handleStars,
  };
}
