import * as THREE from 'three';
import type React from 'react';
import { handleCreativityOnSpace } from './geometryHelpers';
import { createTraceAlongPath } from './drawingHelpers';

// D2 — Utilitário de dispose de geometria/material (incluindo texturas)
export function disposeObject(obj: any) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    const mats: any[] = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m: any) => {
      if (m.map) m.map.dispose();
      if (m.envMap) m.envMap.dispose();
      if (m.lightMap) m.lightMap.dispose();
      if (m.aoMap) m.aoMap.dispose();
      if (m.emissiveMap) m.emissiveMap.dispose();
      if (m.bumpMap) m.bumpMap.dispose();
      if (m.normalMap) m.normalMap.dispose();
      if (m.roughnessMap) m.roughnessMap.dispose();
      if (m.metalnessMap) m.metalnessMap.dispose();
      m.dispose();
    });
  }
}

export function removeParticlesByid(scene: THREE.Scene, particleId: string) {
  scene.children.forEach((object: any) => {
    if (object.userData.particleId === particleId) {
      scene.remove(object);

      // Limpeza de memória
      if (object.isPoints || object.isLine) {
        object.geometry.dispose();
        object.material.dispose();
      } else if (object.isSprite) {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      } else if (object.isMesh || object.isGroup) {
        // D2/D3 — dispor meshes (texto, imagem, etc.)
        if (typeof object.userData.dispose === 'function') {
          object.userData.dispose();
        } else {
          disposeObject(object);
        }
        // Dispor filhos do grupo recursivamente
        object.traverse((child: any) => {
          if (typeof child.userData.dispose === 'function') {
            child.userData.dispose();
          } else {
            disposeObject(child);
          }
        });
      }
    }
  });
}

/**
 * Detecta interseção de clique com objetos da cena.
 * @param event - Evento de clique do mouse.
 * @param camera - Câmera da cena.
 * @param scene - Cena contendo os objetos.
 * @param renderer - Renderer usado para obter tamanho do canvas.
 * @returns Lista de interseções encontradas (ordenadas pela distância).
 */
// Module-level singletons — avoids allocating Raycaster + Vector2 a cada clique
const _clickRaycaster = new THREE.Raycaster();
const _clickMouse = new THREE.Vector2();

export function detectClickIntersection(
  event: MouseEvent | PointerEvent | any,
  camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
): THREE.Intersection[] {
  // Converte posição do mouse para coordenadas normalizadas (-1 a +1)
  const rect = renderer.domElement.getBoundingClientRect();
  _clickMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  _clickMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Configura o Raycaster com câmera e posição do mouse
  _clickRaycaster.setFromCamera(_clickMouse, camera);

  // Intersecta com todos os objetos da cena (inclusive filhos)
  return _clickRaycaster.intersectObjects(scene.children, true);
}

export function disposeMultipleObjects(
  sceneRef: React.RefObject<THREE.Scene | null>,
  elementsStackRef: React.MutableRefObject<Map<string, any>>,
  particleId: string,
) {
  const currentElement = elementsStackRef.current.get(particleId);

  if (currentElement?.sceneLengthStart >= 0 && sceneRef.current) {
    for (
      let i = currentElement.sceneLengthStart;
      i < currentElement.sceneLengthEnd;
      i++
    ) {
      const object = sceneRef.current.children[i];
      object?.traverse((child: any) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });

      if (object?.parent) {
        object.parent.remove(object);
      }
    }
  }
  elementsStackRef.current.delete(particleId);
}

const createInstancedGroup = (
  originalGroup: THREE.Group,
  maxInstances: number = 100,
  sceneRef: React.RefObject<THREE.Scene | null>,
) => {
  const instancedObjects = new Map();

  originalGroup.children.forEach((child: any, index: number) => {
    if (child.isMesh) {
      const instancedMesh = new THREE.InstancedMesh(
        child.geometry,
        child.material,
        maxInstances,
      );
      instancedMesh.userData.originalIndex = index;
      instancedObjects.set(index, {
        mesh: instancedMesh,
        count: 0,
      });
      if (sceneRef.current) {
        sceneRef.current.add(instancedMesh);
      }
    }
  });

  return instancedObjects;
};

export const handleCopyWithInstances = (
  originalGroup: THREE.Group,
  lastIntersected: React.MutableRefObject<any>,
  sceneRef: React.RefObject<THREE.Scene | null>,
) => {
  const instancedObjects = createInstancedGroup(originalGroup, 100, sceneRef);
  const matrix = new THREE.Matrix4();

  instancedObjects.forEach((obj, index) => {
    if (obj.count < obj.mesh.count) {
      // Define a matriz de transformação para a nova instância
      matrix.setPosition(
        lastIntersected.current.position.x + 10,
        lastIntersected.current.position.y,
        lastIntersected.current.position.z,
      );

      obj.mesh.setMatrixAt(obj.count, matrix);
      obj.count++;
      obj.mesh.instanceMatrix.needsUpdate = true;
    }
  });
};

export const reconstructElements = async (
  elements: any[],
  sceneRef: React.RefObject<THREE.Scene | null>,
  elementsStackRef: React.MutableRefObject<Map<string, any>>,
  cartesianSpaceRef: any,
  handlePlaneSelection: any,
  addElement: any,
  particleRef: React.MutableRefObject<any>,
  functionsRef: React.MutableRefObject<any>,
) => {
  for (const element of elements) {
    const elementData = { ...element };

    try {
      switch (element.type) {
        case 'shapes':
          handleCreativityOnSpace(
            elementData,
            sceneRef,
            elementsStackRef,
            cartesianSpaceRef,
            addElement,
            true,
            null // pushHistory
          );
          break;

        case 'traces': {
          particleRef.current = { id: elementData.id, group: null };
          if (!sceneRef.current) break;
          const sceneLengthStart = sceneRef.current.children.length;
          const particles = createTraceAlongPath(
            elementData,
            particleRef,
            addElement,
            true,
          );
          if (particles) {
            sceneRef.current.add(particles);
          }
          const sceneLengthEnd = sceneRef.current.children.length;
          elementsStackRef.current.set(elementData.id, {
            sceneLengthStart,
            sceneLengthEnd,
          });
          break;
        }
        default:
          console.warn(`Tipo de elemento desconhecido: ${element.type}`);
      }
    } catch (error) {
      console.error(`Erro ao reconstruir elemento ${element.id}:`, error);
    }
  }
};
