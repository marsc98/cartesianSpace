import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useScene } from '../../../hooks/contexts/SceneContext';

/**
 * Option B — Gizmo de navegação usando o renderer principal via scissor/viewport.
 * Não cria segundo contexto WebGL nem loop RAF próprio.
 * A função de render é registrada em `renderFnRef` e chamada pelo loop do Board3d.
 */
export default function UniverseNavigator({
  mainCamera,
  mainRenderer,
  renderFnRef,
  isMobile,
  onClick,
}) {
  const containerRef = useRef();
  const { needsRenderRef } = useScene();

  useEffect(() => {
    if (!mainCamera || !mainRenderer || !renderFnRef) return;

    const scene = new THREE.Scene();
    const gizmoCam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    gizmoCam.position.set(0, 0, 10);

    const group = new THREE.Group();
    scene.add(group);

    const _up = new THREE.Vector3(0, 1, 0);

    const axisData = [
      { dir: [1, 0, 0], color: 0xff4444 },
      { dir: [0, 1, 0], color: 0x44ee44 },
      { dir: [0, 0, 1], color: 0x4499ff },
    ];

    axisData.forEach(({ dir, color }) => {
      const dirV = new THREE.Vector3(...dir);
      const mat = new THREE.MeshBasicMaterial({ color });
      const matDim = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.3,
      });

      // Haste positiva
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 2.4, 8),
        mat,
      );
      shaft.position.copy(dirV).multiplyScalar(1.2);
      shaft.quaternion.setFromUnitVectors(_up, dirV);
      group.add(shaft);

      // Cone (ponta)
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.7, 8), mat);
      cone.position.copy(dirV).multiplyScalar(2.75);
      cone.quaternion.setFromUnitVectors(_up, dirV);
      group.add(cone);

      // Haste negativa (semi-transparente)
      const neg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8),
        matDim,
      );
      neg.position.copy(dirV).multiplyScalar(-0.7);
      neg.quaternion.setFromUnitVectors(_up, dirV);
      group.add(neg);
    });

    // Esfera central
    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xdddddd }),
      ),
    );

    needsRenderRef.current = true;

    renderFnRef.current = () => {
      const renderer = mainRenderer.current;
      const container = containerRef.current;
      if (!renderer || !container) return;

      const rect = container.getBoundingClientRect();
      const canvas = renderer.domElement;
      const canvasRect = canvas.getBoundingClientRect();
      const x = Math.round(rect.left - canvasRect.left);
      const y = Math.round(canvasRect.bottom - rect.bottom);
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      const camera = mainCamera.current;
      if (!camera) return;
      group.setRotationFromQuaternion(camera.quaternion);

      const savedAutoClear = renderer.autoClear;
      renderer.autoClear = false;

      renderer.setScissorTest(true);
      renderer.setScissor(x, y, w, h);
      renderer.setViewport(x, y, w, h);
      renderer.clearDepth();
      renderer.render(scene, gizmoCam);

      renderer.autoClear = savedAutoClear;
      renderer.setScissorTest(false);
      const el = renderer.domElement;
      renderer.setScissor(0, 0, el.clientWidth, el.clientHeight);
      renderer.setViewport(0, 0, el.clientWidth, el.clientHeight);
    };

    return () => {
      renderFnRef.current = null;
      needsRenderRef.current = true;
      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry.dispose();
          obj.material.dispose();
        }
      });
    };
  }, [mainRenderer, renderFnRef]);

  const size = isMobile ? '4.5rem' : '6rem';

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      title="Clique para resetar a câmera"
      style={{
        width: size,
        height: size,
        position: 'absolute',
        left: isMobile ? '40%' : '47.5%',
        top: 10,
        cursor: 'pointer',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    />
  );
}
