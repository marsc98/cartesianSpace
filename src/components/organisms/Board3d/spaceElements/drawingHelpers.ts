import * as THREE from 'three';
import type React from 'react';
import {
  createParticleSpheresAlongPath,
  createCirclesAlongPath,
} from '../basicGeometryElements';

export const createOptimizedTrace = (
  particleRef: React.MutableRefObject<any>,
  positionsCopy: Float32Array | number[],
  colorRef: React.MutableRefObject<any>,
  sizeRef: React.MutableRefObject<any>,
  sceneRef: React.RefObject<THREE.Scene | null>,
  colorVariation = 0.15,
) => {
  const particleCount = positionsCopy.length / 3;
  const colors = new Float32Array(positionsCopy.length);
  const base = new THREE.Color(colorRef.current);

  for (let i = 0; i < particleCount; i++) {
    const v = (Math.random() - 0.5) * colorVariation;
    const idx = i * 3;
    colors[idx]     = Math.max(0, Math.min(1, base.r + v));
    colors[idx + 1] = Math.max(0, Math.min(1, base.g + v));
    colors[idx + 2] = Math.max(0, Math.min(1, base.b + v));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positionsCopy instanceof Float32Array ? positionsCopy : new Float32Array(positionsCopy), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    vertexColors: true,
    size: sizeRef.current * 0.02,
    sizeAttenuation: true,
  });

  let group = particleRef.current.group;
  if (!group) {
    group = new THREE.Group();
    group.userData.particleId = particleRef.current.id;
    particleRef.current.group = group;
  }

  const points = new THREE.Points(geometry, material);
  points.userData.particleId = particleRef.current.id;
  group.add(points);
  
  if (sceneRef.current) {
    sceneRef.current.add(group);
  }

  return {
    id: particleRef.current.id,
    element: 'optimizedTrace',
    type: 'traces',
    color: colorRef.current,
    size: sizeRef.current,
    positions: Array.from(positionsCopy),
    colorVariation,
  };
};

export function createTraceAlongPath(
  elementData: any,
  particleRef: React.MutableRefObject<any>,
  addElement: any,
  isRebuild: boolean,
) {
  if (!isRebuild) {
    addElement(elementData);
  }

  let newElement;

  switch (elementData.element) {
    case 'optimizedTrace': {
      if (!elementData.positions?.length) return null;
      const posArr = new Float32Array(elementData.positions);
      const particleCount = posArr.length / 3;
      const colArr = new Float32Array(posArr.length);
      const base = new THREE.Color(elementData.color);
      const variation = elementData.colorVariation ?? 0.15;

      for (let i = 0; i < particleCount; i++) {
        const v = (Math.random() - 0.5) * variation;
        const idx = i * 3;
        colArr[idx]     = Math.max(0, Math.min(1, base.r + v));
        colArr[idx + 1] = Math.max(0, Math.min(1, base.g + v));
        colArr[idx + 2] = Math.max(0, Math.min(1, base.b + v));
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

      const mat = new THREE.PointsMaterial({
        vertexColors: true,
        size: elementData.size * 0.02,
        sizeAttenuation: true,
      });
      let group = particleRef.current.group;
      if (!group) {
        group = new THREE.Group();
        group.userData.particleId = particleRef.current.id;
        particleRef.current.group = group;
      }
      const pts = new THREE.Points(geo, mat);
      pts.userData.particleId = particleRef.current.id;
      group.add(pts);
      return group;
    }
    case '2dTrace':
      newElement = {
        id: elementData.id,
        radius: elementData.size * 0.01,
        color: elementData.color,
        position: elementData.position,
        ...elementData,
      };

      return createCirclesAlongPath(newElement, particleRef);
    case '3dTrace': {
      // Rebuild path: positions is a flat number[] committed by the pipeline
      if (elementData.positions?.length) {
        const flat = elementData.positions as number[];
        const positions3d: { x: number; y: number; z: number }[] = [];
        for (let i = 0; i < flat.length / 3; i++) {
          positions3d.push({ x: flat[i * 3], y: flat[i * 3 + 1], z: flat[i * 3 + 2] });
        }
        newElement = {
          particlesPerSphere: 100,
          sphereRadius: elementData.size * 0.008,
          particleSize: 0.1,
          particleColor: elementData.color,
          position: positions3d,
        };
      } else {
        // Live drawing path: position is [{x,y,z}] from movementPathRef
        newElement = {
          particlesPerSphere: 100,
          sphereRadius: elementData.size * 0.008,
          particleSize: 0.1,
          particleColor: elementData.color,
          ...elementData,
        };
      }
      return createParticleSpheresAlongPath(newElement, particleRef);
    }
    default:
      console.log('Pincel inexistente');
      break;
  }
}
