import { useRef, useCallback } from 'react';
import * as THREE from 'three';

export function useDepthIndicator(
  cameraRef: React.MutableRefObject<THREE.Camera | null>,
  sceneRef: React.MutableRefObject<THREE.Scene | null>,
  needsRenderRef: React.MutableRefObject<boolean>,
) {
  const indicatorRef = useRef<THREE.Group | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const removeIndicator = useCallback(() => {
    const group = indicatorRef.current;
    const scene = sceneRef.current;
    if (!group || !scene) return;
    scene.remove(group);
    group.traverse((obj: any) => {
      obj.geometry?.dispose();
      const m = obj.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x: any) => x.dispose());
    });
    indicatorRef.current = null;
    needsRenderRef.current = true;
  }, [sceneRef, needsRenderRef]);

  const updateTransform = useCallback((value: number) => {
    const camera = cameraRef.current;
    const group = indicatorRef.current;
    if (!camera || !group) return;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    group.position.copy(camera.position).addScaledVector(dir, value);
    group.quaternion.copy(camera.quaternion);
    // Escala proporcional à distância para ocupar fração consistente da tela
    group.scale.setScalar(value / 10);
  }, [cameraRef]);

  const onDistanceChange = useCallback((value: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!camera || !scene) return;

    if (!indicatorRef.current) {
      const group = new THREE.Group();

      const geo = new THREE.BoxGeometry(1.5, 1.5, 0.04);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x0a1a4f,
        transparent: true,
        opacity: 0.75,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 999;
      group.add(mesh);

      const edgesGeo = new THREE.EdgesGeometry(geo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: 0x1a4aaf,
        depthTest: false,
      });
      const edges = new THREE.LineSegments(edgesGeo, edgesMat);
      edges.renderOrder = 999;
      group.add(edges);

      scene.add(group);
      indicatorRef.current = group;
    }

    updateTransform(value);
    needsRenderRef.current = true;

    timeoutRef.current = setTimeout(removeIndicator, 1500);
  }, [cameraRef, sceneRef, needsRenderRef, updateTransform, removeIndicator]);

  return { onDistanceChange };
}
