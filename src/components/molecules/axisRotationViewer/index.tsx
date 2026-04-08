import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const AxisRotationViewer = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // 1. Configuração básica
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 2. Cena, câmera e renderizador
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0xf0f0f0);
    mountRef.current.appendChild(renderer.domElement);

    // 3. Controles de órbita
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // 4. Criar eixos coloridos
    const axesSize = 3;
    const axes = new THREE.Group();

    // Eixo X (vermelho)
    const xAxis = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      axesSize,
      0xff0000,
      0.2,
      0.1
    );
    axes.add(xAxis);

    // Eixo Y (verde)
    const yAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      axesSize,
      0x00ff00,
      0.2,
      0.1
    );
    axes.add(yAxis);

    // Eixo Z (azul)
    const zAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      axesSize,
      0x0000ff,
      0.2,
      0.1
    );
    axes.add(zAxis);

    // Adicionar rótulos aos eixos
    const createAxisLabel = (text, color, position) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 64, 64);
      context.font = '24px Arial';
      context.fillStyle = color;
      context.textAlign = 'center';
      context.fillText(text, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(0.5, 0.5, 0.5);
      axes.add(sprite);
    };

    createAxisLabel('X', '#ff0000', new THREE.Vector3(axesSize + 0.5, 0, 0));
    createAxisLabel('Y', '#00ff00', new THREE.Vector3(0, axesSize + 0.5, 0));
    createAxisLabel('Z', '#0000ff', new THREE.Vector3(0, 0, axesSize + 0.5));

    scene.add(axes);

    // 5. Adicionar grade de referência
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // 6. Animação
    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);

      // Atualizar a rotação dos eixos para acompanhar a câmera
      axes.quaternion.copy(camera.quaternion);
    };
    animate();

    // 7. Lidar com redimensionamento
    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 8. Limpeza
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '500px',
        position: 'relative',
        border: '1px solid #ccc'
      }}
    >
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <p>Rotacione a câmera com o mouse para ver os eixos se ajustarem</p>
        <p>X (Vermelho), Y (Verde), Z (Azul)</p>
      </div>
    </div>
  );
};

export default AxisRotationViewer;
