import * as THREE from 'three';
import type React from 'react';

export interface ElementsStackMap {
  set: (id: string, value: { sceneLengthStart: number | undefined; sceneLengthEnd: number | undefined }) => void;
}

export interface StarfieldSystem {
  starPoints: THREE.Points;
  update: (camera: THREE.Camera | null | undefined) => void;
  pauseAnimation: () => void;
  dispose: () => void;
}

/**
 * Cria campo de estrelas realista ULTRA OTIMIZADO
 * - Pré-calcula distribuições
 * - Cache de trigonometria
 * - Animação em batch otimizado
 * - Memória reduzida
 */
export function createRealisticStarfield(
  sceneRef: React.RefObject<THREE.Scene | null>,
  elementsStackRef: React.MutableRefObject<ElementsStackMap | null> | null,
  numberOfStars = 10000,
): StarfieldSystem {
  const starfieldId = 'realistic-starfield';
  const sceneLengthStart = sceneRef?.current?.children?.length;

  // =================================================================
  // CONFIGURAÇÕES E CONSTANTES PRÉ-CALCULADAS
  // =================================================================

  // ✅ OTIMIZAÇÃO 1: Constantes matemáticas pré-calculadas
  const PI2 = Math.PI * 2;
  const MIN_RADIUS = 1000;
  const MAX_RADIUS = 3000;
  const RADIUS_RANGE = MAX_RADIUS - MIN_RADIUS;

  // Paleta de cores (mantida como array para compatibilidade)
  const starColors = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xffffee),
    new THREE.Color(0xffeedd),
    new THREE.Color(0xff9988),
    new THREE.Color(0xeeddff),
    new THREE.Color(0xddeeff),
  ];

  // ✅ OTIMIZAÇÃO 2: Pré-calcular lookup table de tamanhos
  // (Evita loop de distribuição dentro do loop principal)
  const SIZE_LUT_SIZE = 1000;
  const sizeLookupTable = new Float32Array(SIZE_LUT_SIZE);

  const sizeDistribution = [
    { max: 0.5, probability: 0.6 },
    { max: 0.8, probability: 0.3 },
    { max: 1.2, probability: 0.08 },
    { max: 1.8, probability: 0.02 },
  ];

  // Preencher lookup table (executado UMA vez)
  for (let i = 0; i < SIZE_LUT_SIZE; i++) {
    const rand = i / SIZE_LUT_SIZE;
    let cumulative = 0;
    let size = 0.5;

    for (const distribution of sizeDistribution) {
      cumulative += distribution.probability;
      if (rand <= cumulative) {
        size = Math.random() * distribution.max;
        break;
      }
    }
    sizeLookupTable[i] = size;
  }

  // =================================================================
  // PARTE 1: ESTRELAS PEQUENAS - SUPER OTIMIZADA
  // =================================================================

  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    sizeAttenuation: true,
  });

  // Arrays tipados (já estava otimizado)
  const positions = new Float32Array(numberOfStars * 3);
  const colors = new Float32Array(numberOfStars * 3);
  const sizes = new Float32Array(numberOfStars);

  // ✅ OTIMIZAÇÃO 3: Loop principal ultra otimizado
  const numColors = starColors.length;

  for (let i = 0; i < numberOfStars; i++) {
    // ✅ Posição esférica (algoritmo otimizado)
    const radius = MIN_RADIUS + Math.random() * RADIUS_RANGE;
    const theta = Math.random() * PI2;
    const phi = Math.acos(2 * Math.random() - 1);

    // ✅ Cache de seno/cosseno (calculado UMA vez)
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    // ✅ Usar valores cacheados
    const r_sinPhi = radius * sinPhi;
    const idx = i * 3;

    positions[idx] = r_sinPhi * cosTheta;
    positions[idx + 1] = r_sinPhi * sinTheta;
    positions[idx + 2] = radius * cosPhi;

    // ✅ Cor (otimizado com operador bit-wise)
    const colorIndex = (Math.random() * numColors) | 0; // Faster than Math.floor
    const color = starColors[colorIndex];
    colors[idx] = color.r;
    colors[idx + 1] = color.g;
    colors[idx + 2] = color.b;

    // ✅ OTIMIZAÇÃO 4: Usar lookup table para tamanho
    const lutIndex = (Math.random() * SIZE_LUT_SIZE) | 0;
    sizes[i] = sizeLookupTable[lutIndex];
  }

  starsGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3),
  );
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  starsGeometry.userData.particleId = starfieldId;

  const starPoints = new THREE.Points(starsGeometry, starsMaterial);
  starPoints.userData.particleId = starfieldId;
  starPoints.name = 'starfield-points';
  starPoints.frustumCulled = false;

  if (sceneRef?.current) {
    sceneRef.current.add(starPoints);
  }

  // =================================================================
  // PARTE 2: CONSTELAÇÕES - SUPER OTIMIZADA
  // =================================================================

  function addConstellations() {
    const numConstellations = 8;
    const avgStarsPerConstellation = 7; // Média para pré-alocação

    // ✅ OTIMIZAÇÃO 5: Pré-alocar arrays (evita realocações)
    const estimatedVertices = numConstellations * avgStarsPerConstellation * 6; // 6 floats por linha
    const allLineVertices = new Float32Array(estimatedVertices);
    let vertexIndex = 0;

    for (let c = 0; c < numConstellations; c++) {
      // Posição central da constelação
      const centerRadius = 1000 + Math.random() * 1500;
      const centerTheta = Math.random() * PI2;
      const centerPhi = Math.acos(2 * Math.random() - 1);

      // ✅ Cache trigonometria do centro
      const sinPhiCenter = Math.sin(centerPhi);
      const cosPhiCenter = Math.cos(centerPhi);
      const sinThetaCenter = Math.sin(centerTheta);
      const cosThetaCenter = Math.cos(centerTheta);

      const centerX = centerRadius * sinPhiCenter * cosThetaCenter;
      const centerY = centerRadius * sinPhiCenter * sinThetaCenter;
      const centerZ = centerRadius * cosPhiCenter;

      const starsPerConstellation = 4 + ((Math.random() * 7) | 0);

      // ✅ OTIMIZAÇÃO 6: Array fixo (sem push dinâmico)
      const constellationPoints = new Float32Array(starsPerConstellation * 3);

      for (let i = 0; i < starsPerConstellation; i++) {
        const offset = 100 + Math.random() * 150;

        // Direção normalizada
        const dx = Math.random() - 0.5;
        const dy = Math.random() - 0.5;
        const dz = Math.random() - 0.5;
        const invLen = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz);

        const idx = i * 3;
        constellationPoints[idx] = centerX + offset * dx * invLen;
        constellationPoints[idx + 1] = centerY + offset * dy * invLen;
        constellationPoints[idx + 2] = centerZ + offset * dz * invLen;
      }

      // ✅ Criar linhas entre pontos consecutivos
      for (let i = 0; i < starsPerConstellation - 1; i++) {
        const idx = i * 3;
        const nextIdx = (i + 1) * 3;

        // Verificar se há espaço no array
        if (vertexIndex + 6 <= allLineVertices.length) {
          allLineVertices[vertexIndex++] = constellationPoints[idx];
          allLineVertices[vertexIndex++] = constellationPoints[idx + 1];
          allLineVertices[vertexIndex++] = constellationPoints[idx + 2];
          allLineVertices[vertexIndex++] = constellationPoints[nextIdx];
          allLineVertices[vertexIndex++] = constellationPoints[nextIdx + 1];
          allLineVertices[vertexIndex++] = constellationPoints[nextIdx + 2];
        }
      }
    }

    // ✅ Criar geometria com dados reais (truncar array se necessário)
    if (vertexIndex > 0) {
      const lineGeometry = new THREE.BufferGeometry();
      const actualVertices = allLineVertices.slice(0, vertexIndex);

      lineGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(actualVertices, 3),
      );

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x6666aa,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const constellationLines = new THREE.LineSegments(
        lineGeometry,
        lineMaterial,
      );
      constellationLines.userData.particleId = starfieldId;
      constellationLines.name = 'constellation-lines';
      constellationLines.frustumCulled = false;

      if (sceneRef?.current) {
        sceneRef.current.add(constellationLines);
      }
    }
  }

  addConstellations();

  // =================================================================
  // PARTE 3: ANIMAÇÃO DE CINTILAÇÃO - ULTRA OTIMIZADA
  // =================================================================

  function animateStars(): () => void {
    const maxTwinkleStars = 150;

    // ✅ OTIMIZAÇÃO 7: Índices pré-gerados e cache de tamanhos originais
    const twinkleIndices = new Uint16Array(maxTwinkleStars);
    const originalSizes = new Float32Array(maxTwinkleStars);

    for (let i = 0; i < maxTwinkleStars; i++) {
      const index = (Math.random() * numberOfStars) | 0;
      twinkleIndices[i] = index;
      originalSizes[i] = sizes[index]; // Cache do tamanho original
    }

    let frameCount = 0;
    let currentTwinkleIndex = 0;
    const batchSize = 20;
    const variance = 0.15;

    // ✅ OTIMIZAÇÃO 8: Acessar array diretamente (mais rápido)
    const sizesArray = starsGeometry.attributes.size.array as Float32Array;
    const sizeAttribute = starsGeometry.attributes.size;

    // D4 — flags de cancelamento do loop
    let twinkleActive = true;
    let twinkleRafId: number | null = null;

    const twinkleAnimation = () => {
      if (!twinkleActive) return;

      frameCount++;

      // ✅ Atualizar a cada 4 frames (~15 FPS de twinkle)
      if (frameCount % 4 !== 0) {
        twinkleRafId = requestAnimationFrame(twinkleAnimation);
        return;
      }

      // ✅ OTIMIZAÇÃO 9: Loop desenrolado parcialmente (menos checks)
      let updated = false;

      for (let i = 0; i < batchSize; i++) {
        const index = twinkleIndices[currentTwinkleIndex];

        // ✅ Probabilidade mais alta = menos checks de Math.random()
        if (Math.random() > 0.7) {
          const originalSize = originalSizes[currentTwinkleIndex];
          const varianceAmount = originalSize * variance;
          sizesArray[index] =
            originalSize +
            (Math.random() * varianceAmount - varianceAmount * 0.5);
          updated = true;
        }

        currentTwinkleIndex = (currentTwinkleIndex + 1) % maxTwinkleStars;
      }

      // ✅ OTIMIZAÇÃO 10: Marcar como dirty apenas se houve mudança
      if (updated) {
        sizeAttribute.needsUpdate = true;
      }

      twinkleRafId = requestAnimationFrame(twinkleAnimation);
    };

    twinkleAnimation();

    return () => {
      twinkleActive = false;
      if (twinkleRafId) cancelAnimationFrame(twinkleRafId);
    };
  }

  // ✅ OTIMIZAÇÃO 11: Delay para não competir com carregamento
  let cancelTwinkle: (() => void) | null = null;
  setTimeout(() => {
    cancelTwinkle = animateStars();
  }, 1000);

  // =================================================================
  // REGISTRO E RETORNO
  // =================================================================

  const sceneLengthEnd = sceneRef?.current?.children?.length;

  if (elementsStackRef?.current) {
    elementsStackRef.current.set(starfieldId, {
      sceneLengthStart: sceneLengthStart,
      sceneLengthEnd: sceneLengthEnd,
    });
  }

  return {
    starPoints,

    update: function (camera?: THREE.Camera | null) {
      if (starPoints && camera) {
        starPoints.position.copy(camera.position);
      }
    },

    pauseAnimation: function () {},

    dispose: function () {
      // D4 — cancelar o loop de animação
      if (cancelTwinkle) cancelTwinkle();

      starsGeometry.dispose();
      starsMaterial.dispose();
      if (sceneRef?.current) {
        sceneRef.current.remove(starPoints);

        // Remover constelações
        const toRemove = sceneRef.current.children.filter(
          (child) => child.userData.particleId === starfieldId,
        );
        toRemove.forEach((obj: any) => {
          if (sceneRef.current) sceneRef.current.remove(obj);
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      }
    },
  };
}
