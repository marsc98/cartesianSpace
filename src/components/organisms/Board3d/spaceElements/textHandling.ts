import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import type React from 'react';

// Tipos auxiliares
interface ElementData {
  id?: string;
  text: string;
  color?: string | number;
  position: { x: number; y: number; z: number };
  font: { path: string; size: number; height: number };
}

// D1 — Font cache (evita re-download da mesma fonte)
const fontCache = new Map<string, any>();

function loadFont(path: string): Promise<any> {
  if (fontCache.has(path)) return Promise.resolve(fontCache.get(path));
  const promise = new Promise((resolve, reject) => {
    const loader = new FontLoader();
    loader.load(path, (font) => {
      fontCache.set(path, font);
      resolve(font);
    }, undefined, reject);
  });
  fontCache.set(path, promise);
  return promise;
}

// D2 — Utilitário de dispose de geometria/material
function disposeObject(obj: any) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    Array.isArray(obj.material)
      ? obj.material.forEach((m: any) => m.dispose())
      : obj.material.dispose();
  }
}

export function addTextToScene(scene: THREE.Scene, elementData: ElementData, drawingStarted?: boolean) {
  // text, color, font, point
  drawingStarted = false;
  const particleId = `text-${Date.now()}`;
  const newPosition = new THREE.Vector3(
    elementData.position.x,
    elementData.position.y,
    elementData.position.z,
  );
  const tempFont = structuredClone(elementData.font);

  // Criar o grupo que conterá o texto e suas bordas
  const textGroup = new THREE.Group();
  textGroup.userData.particleId = particleId;
  textGroup.position.copy(newPosition);

  // D1 — usar cache de fontes
  loadFont(tempFont.path).then((font) => {
    const textGeometry = new TextGeometry(elementData.text, {
      font: font,
      size: tempFont.size / 4,
      // height: tempFont.height,
      depth: tempFont.height / 4,
      curveSegments: 100,
      bevelEnabled: false,
      bevelThickness: 10,
      bevelSize: 8,
      bevelOffset: 0,
      bevelSegments: 5,
    });

    textGeometry.center(); // Centraliza o texto

    // Use MeshBasicMaterial que não precisa de luz para teste
    const textMaterial = new THREE.MeshBasicMaterial({
      color: elementData.color ? elementData.color : 0x000000,
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Bordas (outline)
    const edgesGeometry = new THREE.EdgesGeometry(textGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 2,
    });
    const textEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

    // Adicionar userData aos elementos individuais
    textMesh.userData.particleId = particleId;
    textEdges.userData.particleId = particleId;

    // D2 — registrar dispose nos elementos para limpeza posterior
    textMesh.userData.dispose = () => disposeObject(textMesh);
    textEdges.userData.dispose = () => {
      edgesGeometry.dispose();
      edgesMaterial.dispose();
    };

    // Adicionar os elementos ao grupo em vez de à cena
    textGroup.add(textMesh);
    textGroup.add(textEdges);

    // Adicionar o grupo à cena
    scene.add(textGroup);
  });
  return textGroup;
}

export function addPaperToScene(
  e: React.MouseEvent | React.TouchEvent | any, // Typing the broad event realistically used
  text: string,
  scene: THREE.Scene,
  camera: THREE.Camera,
  drawingStarted: boolean,
  color: string | number,
  font: { path: string; size: number; height: number },
) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  drawingStarted = false;

  const tempFont = structuredClone(font);

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  const distanceFromCamera = 20;

  const newPosition = new THREE.Vector3(
    camera.position.x + direction.x * distanceFromCamera,
    camera.position.y + direction.y * distanceFromCamera,
    camera.position.z + direction.z * distanceFromCamera,
  );

  // D1 — usar cache de fontes
  loadFont(tempFont.path).then((font) => {
    // 2. Crie o texto como uma geometria
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: tempFont.size / 4,
      height: tempFont.height, // Altura do relevo (simula um "entalhe" no plano)
      curveSegments: 12,
      bevelEnabled: false,
    });

    // 3. Crie um plano para servir de base
    const planeGeometry = new THREE.PlaneGeometry(5, 2);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    // 4. Posicione o texto sobre o plano
    const textMaterial = new THREE.MeshStandardMaterial({
      color: color ? color : 0x000000,
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // D2 — registrar dispose nos elementos para limpeza posterior
    plane.userData.dispose = () => disposeObject(plane);
    textMesh.userData.dispose = () => disposeObject(textMesh);

    textMesh.position.set(newPosition.x, newPosition.y, newPosition.z); // Levemente acima do plano
    plane.position.set(newPosition.x, newPosition.y, newPosition.z);
    plane.quaternion.copy(camera.quaternion);
    textMesh.quaternion.copy(camera.quaternion);

    // 5. Adicione ambos à cena
    scene.add(plane);
    scene.add(textMesh);
  });
}
