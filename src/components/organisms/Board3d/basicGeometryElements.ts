import * as THREE from 'three';
import resourcePool from '../../../utils/classes/resourcePool';

export function createParticleSpheresAlongPath(config, particleRef) {
  const {
    particlesPerSphere = 200,
    sphereRadius = 0.5,
    particleSize = 1,
    particleColor = 0x00aaff,
    randomness = 0.2,
    borderThreshold = 0.8,
    position = [], // Array de pontos (Vector3)
  } = config;

  // ✅ OTIMIZAÇÃO 1: Validação rápida
  if (!position || position.length === 0) {
    console.warn('Nenhum ponto fornecido para createParticleSpheresAlongPath');
    return null;
  }

  // ✅ OTIMIZAÇÃO 2: Reutilizar grupo ou criar novo
  let particleGroup = particleRef?.current?.group;

  if (!particleGroup) {
    particleGroup = new THREE.Group();
    particleRef.current.group = particleGroup;
    particleGroup.userData.particleId = particleRef.current.id;
  }

  // ✅ OTIMIZAÇÃO 3: Pre-calcular tamanho total (evita realocações)
  const totalParticles = position.length * particlesPerSphere;

  // ✅ OTIMIZAÇÃO 4: Arrays tipados (50% mais rápido que arrays normais)
  const allPositions = new Float32Array(totalParticles * 3);
  const colors = new Float32Array(totalParticles * 3);
  const opacities = new Float32Array(totalParticles);

  // ✅ OTIMIZAÇÃO 5: Cachear cor (evita criar Color object N vezes)
  const baseColor = new THREE.Color(particleColor);
  const colorVariation = 0.1;

  // ✅ OTIMIZAÇÃO 6: Pré-calcular constantes
  const PI2 = Math.PI * 2;
  const randomnessFactor = 1 - randomness;
  const sphereRadiusSquared = sphereRadius * sphereRadius; // Para cálculos mais rápidos

  let particleIndex = 0;

  // ✅ OTIMIZAÇÃO 7: Loop otimizado (minimizar operações por iteração)
  for (let p = 0; p < position.length; p++) {
    const point = position[p];

    // Cache das coordenadas do ponto
    const px = point.x;
    const py = point.y;
    const pz = point.z;

    for (let i = 0; i < particlesPerSphere; i++) {
      // ✅ Distribuição esférica uniforme (algoritmo de Marsaglia)
      const theta = Math.random() * PI2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Raio com randomness
      const r = sphereRadius * (randomnessFactor + Math.random() * randomness);

      // ✅ Pré-calcular senos e cossenos
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      // Calcular posição da partícula
      const idx = particleIndex * 3;
      allPositions[idx] = px + r * sinPhi * cosTheta;
      allPositions[idx + 1] = py + r * sinPhi * sinTheta;
      allPositions[idx + 2] = pz + r * cosPhi;

      // ✅ Variação de cor (mais eficiente)
      const colorVar = (Math.random() - 0.5) * colorVariation;
      colors[idx] = Math.max(0, Math.min(1, baseColor.r + colorVar));
      colors[idx + 1] = Math.max(0, Math.min(1, baseColor.g + colorVar));
      colors[idx + 2] = Math.max(0, Math.min(1, baseColor.b + colorVar));

      // ✅ Opacidade baseada na distância do centro (borda vs centro)
      const isBorderParticle = r / sphereRadius > borderThreshold;
      opacities[particleIndex] = isBorderParticle ? 0.5 : 0.9;

      particleIndex++;
    }
  }

  // ✅ OTIMIZAÇÃO 8: Criar geometria UMA VEZ com todos os pontos
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(allPositions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

  // ✅ OTIMIZAÇÃO 9: Material do pool (reutilizado + shader pré-compilado)
  const material = resourcePool.getParticleMaterial(
    particleColor,
    particleSize,
    1.0,
  );

  // ✅ Criar Points mesh
  const points = new THREE.Points(geometry, material);
  points.userData.particleId = particleGroup.userData.particleId;
  points.name = '3d-trace-particles';

  // ✅ OTIMIZAÇÃO 10: Verificar se deve criar novo Points ou reutilizar
  // (Para traços contínuos, evita criar muitos objects)
  const shouldMerge =
    particleGroup.children.length > 0 && particleGroup.children.length < 10; // Limite razoável

  if (shouldMerge) {
    // ✅ Mesclar com Points existente (opcional, para traços muito longos)
    const existingPoints =
      particleGroup.children[particleGroup.children.length - 1];

    if (existingPoints instanceof THREE.Points && totalParticles < 50000) {
      // Mesclar geometrias se não estiver muito grande
      mergePointsGeometry(existingPoints, geometry);
      geometry.dispose(); // Liberar geometria temporária
      return particleGroup;
    }
  }

  // Adicionar ao grupo
  particleGroup.add(points);

  // ✅ OTIMIZAÇÃO 11: Limitar número de Points no grupo
  // (Evita muitos objetos em traços muito longos)
  if (particleGroup.children.length > 20) {
    // Mesclar os 2 primeiros Points
    const first = particleGroup.children[0];
    const second = particleGroup.children[1];

    if (first instanceof THREE.Points && second instanceof THREE.Points) {
      mergePointsGeometry(first, second.geometry);
      particleGroup.remove(second);
      second.geometry.dispose();
      // Material não precisa dispose (vem do pool)
    }
  }

  return particleGroup;
}

/**
 * Mescla geometria de um Points em outro (helper interno)
 */
function mergePointsGeometry(targetPoints, sourceGeometry) {
  const targetGeometry = targetPoints.geometry;

  // Obter arrays atuais
  const targetPos = targetGeometry.attributes.position.array;
  const targetColors = targetGeometry.attributes.color.array;
  const targetOpacities = targetGeometry.attributes.opacity.array;

  // Obter arrays novos
  const sourcePos = sourceGeometry.attributes.position.array;
  const sourceColors = sourceGeometry.attributes.color.array;
  const sourceOpacities = sourceGeometry.attributes.opacity.array;

  // Criar arrays maiores
  const newPos = new Float32Array(targetPos.length + sourcePos.length);
  const newColors = new Float32Array(targetColors.length + sourceColors.length);
  const newOpacities = new Float32Array(
    targetOpacities.length + sourceOpacities.length,
  );

  // Copiar dados existentes
  newPos.set(targetPos);
  newColors.set(targetColors);
  newOpacities.set(targetOpacities);

  // Adicionar novos dados
  newPos.set(sourcePos, targetPos.length);
  newColors.set(sourceColors, targetColors.length);
  newOpacities.set(sourceOpacities, targetOpacities.length);

  // Atualizar geometria
  targetGeometry.setAttribute('position', new THREE.BufferAttribute(newPos, 3));
  targetGeometry.setAttribute('color', new THREE.BufferAttribute(newColors, 3));
  targetGeometry.setAttribute(
    'opacity',
    new THREE.BufferAttribute(newOpacities, 1),
  );

  // Marcar como precisa atualização
  targetGeometry.attributes.position.needsUpdate = true;
  targetGeometry.attributes.color.needsUpdate = true;
  targetGeometry.attributes.opacity.needsUpdate = true;

  // Recalcular bounding sphere
  targetGeometry.computeBoundingSphere();
}

/**
 * Versão simplificada sem merge (se preferir simplicidade)
 */
export function createParticleSpheresAlongPathSimple(config, particleRef) {
  const {
    particlesPerSphere = 200,
    sphereRadius = 0.5,
    particleSize = 1,
    particleColor = 0x00aaff,
    randomness = 0.2,
    borderThreshold = 0.8,
    position = [],
  } = config;

  if (!position || position.length === 0) return null;

  let particleGroup = particleRef?.current?.group;
  if (!particleGroup) {
    particleGroup = new THREE.Group();
    particleRef.current.group = particleGroup;
    particleGroup.userData.particleId = particleRef.current.id;
  }

  const totalParticles = position.length * particlesPerSphere;
  const allPositions = new Float32Array(totalParticles * 3);
  const colors = new Float32Array(totalParticles * 3);
  const opacities = new Float32Array(totalParticles);

  const baseColor = new THREE.Color(particleColor);
  const PI2 = Math.PI * 2;
  const randomnessFactor = 1 - randomness;

  let idx = 0;

  position.forEach((point) => {
    for (let i = 0; i < particlesPerSphere; i++) {
      const theta = Math.random() * PI2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = sphereRadius * (randomnessFactor + Math.random() * randomness);

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      allPositions[idx * 3] = point.x + r * sinPhi * Math.cos(theta);
      allPositions[idx * 3 + 1] = point.y + r * sinPhi * Math.sin(theta);
      allPositions[idx * 3 + 2] = point.z + r * cosPhi;

      const colorVar = (Math.random() - 0.5) * 0.1;
      colors[idx * 3] = Math.max(0, Math.min(1, baseColor.r + colorVar));
      colors[idx * 3 + 1] = Math.max(0, Math.min(1, baseColor.g + colorVar));
      colors[idx * 3 + 2] = Math.max(0, Math.min(1, baseColor.b + colorVar));

      opacities[idx] = r / sphereRadius > borderThreshold ? 0.5 : 0.9;
      idx++;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(allPositions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

  const material = resourcePool.getParticleMaterial(
    particleColor,
    particleSize,
    1.0,
  );

  const points = new THREE.Points(geometry, material);
  points.userData.particleId = particleGroup.userData.particleId;

  particleGroup.add(points);

  return particleGroup;
}

export function createCirclesAlongPath(config, particleRef) {
  const {
    radius = 0.5,
    color = 0x00aaff,
    position = [],
  } = config;

  let particleGroup = particleRef.current.group;
  if (!particleGroup) {
    particleGroup = new THREE.Group();
    particleRef.current.group = particleGroup;
    particleGroup.userData.particleId = particleRef.current.id;
  }

  if (!position || position.length === 0) return particleGroup;

  // Reutiliza o único Points do grupo (1 draw call independente do comprimento do traço)
  const existing = particleGroup.children[0];
  if (existing instanceof THREE.Points) {
    const geo = existing.geometry;
    const oldArr = geo.attributes.position.array as Float32Array;
    const newArr = new Float32Array(oldArr.length + position.length * 3);
    newArr.set(oldArr);
    for (let i = 0; i < position.length; i++) {
      newArr[oldArr.length + i * 3]     = position[i].x;
      newArr[oldArr.length + i * 3 + 1] = position[i].y;
      newArr[oldArr.length + i * 3 + 2] = position[i].z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(newArr, 3));
    geo.attributes.position.needsUpdate = true;
    geo.computeBoundingSphere();
  } else {
    const posArr = new Float32Array(position.length * 3);
    for (let i = 0; i < position.length; i++) {
      posArr[i * 3]     = position[i].x;
      posArr[i * 3 + 1] = position[i].y;
      posArr[i * 3 + 2] = position[i].z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: radius * 2,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.userData.particleId = particleRef.current.id;
    particleGroup.add(points);
  }

  return particleGroup;
}
