import { useEffect } from 'react';
import * as THREE from 'three';
import { Camera } from '../../../utils/classes/camera';
import { createRealisticStarfield } from './spaceElements';
import { useScene } from '../../../hooks/contexts/SceneContext';
import { useCamera } from '../../../hooks/contexts/CameraContext';

interface SceneRendererProps {
  /** Ref do elemento DOM onde o renderer será montado */
  mountRef: React.MutableRefObject<HTMLDivElement | null>;
  /** Ref para guardar o requestAnimationFrame atual */
  animationFrameRef: React.MutableRefObject<number | null>;
  /** Fn opcional chamada a cada frame antes do render principal */
  onBeforeRender?: () => void;
  /** Fn opcional para o gizmo de navegação (scissor render) */
  navigatorRenderFnRef: React.MutableRefObject<(() => void) | null>;
  /** Fn opcional para inércia do acelerômetro */
  accelerometerRenderFnRef: React.MutableRefObject<(() => void) | null>;
  /** Chamada uma única vez após o primeiro frame renderizado */
  onSceneReady?: () => void;
  /** Chamada a cada frame com o delta de tempo em segundos */
  onCameraUpdate?: (deltaTime: number) => void;
}

/**
 * Componente lógico (sem JSX visível) responsável por:
 * - Inicializar o WebGLRenderer, Scene, Camera e Raycaster do Three.js
 * - Montar o canvas no DOM via mountRef
 * - Rodar o animation loop
 * - Fazer cleanup completo ao desmontar
 */
export function SceneRenderer({
  mountRef,
  animationFrameRef,
  navigatorRenderFnRef,
  accelerometerRenderFnRef,
  onSceneReady,
  onCameraUpdate,
}: SceneRendererProps) {
  const { sceneRef, rendererRef, elementsStackRef, needsRenderRef } = useScene();
  const { cameraRef, raycasterRef } = useCamera();

  useEffect(() => {
    if (!mountRef.current) return;

    // React StrictMode: remove qualquer canvas residual
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x111223);

    // ── Camera ─────────────────────────────────────────────────────────────
    const camera = new Camera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    cameraRef.current = camera;
    camera.position.set(-2, -1, 4);

    // ── Renderer ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // ── Raycaster ──────────────────────────────────────────────────────────
    raycasterRef.current = new THREE.Raycaster();

    // ── Starfield inicial ──────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createRealisticStarfield(sceneRef, elementsStackRef as any);

    // ── Animation loop ─────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let sceneReadyFired = false;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      onCameraUpdate?.(dt);
      // Acelerômetro ativo: sempre precisa renderizar para refletir rotação da câmera
      if (accelerometerRenderFnRef.current) needsRenderRef.current = true;
      if (!needsRenderRef.current) return;
      needsRenderRef.current = false;
      // Limpa viewport/scissor antes do render principal
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, renderer.domElement.width, renderer.domElement.height);
      renderer.render(scene, camera);
      // Gizmo de navegação (scissor no mesmo contexto WebGL)
      navigatorRenderFnRef.current?.();
      // Inércia do acelerômetro
      accelerometerRenderFnRef.current?.();
      // Notifica que a cena está pronta após o primeiro frame renderizado
      if (!sceneReadyFired) {
        sceneReadyFired = true;
        onSceneReady?.();
      }
    };
    animate();

    // ── Resize ─────────────────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      needsRenderRef.current = true;
    };
    window.addEventListener('resize', handleResize);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameRef.current ?? 0);
      window.removeEventListener('resize', handleResize);

      if (mountRef.current && renderer.domElement) {
        try {
          mountRef.current.removeChild(renderer.domElement);
        } catch (e) {
          console.error('SceneRenderer: erro ao remover canvas', e);
        }
      }

      scene.traverse((object: any) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach((m: any) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });

      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
