import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { adjustColorTone, hexToRgb } from '../../../../utils/functions';
import { safeGetItem } from '../../../../utils/storage';
import {
  createCartesianSpaceAxes,
  drawFunction,
} from '../cartesianSpaceElements';
import { addTextToScene, addPaperToScene } from './textHandling';
import {
  createParticleSpheresAlongPath,
  createCirclesAlongPath,
} from '../basicGeometryElements';
import resourcePool from '../../../../utils/classes/resourcePool';

// D2 — Utilitário de dispose de geometria/material
function disposeObject(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    Array.isArray(obj.material)
      ? obj.material.forEach((m) => m.dispose())
      : obj.material.dispose();
  }
}


export function createSimplePlane(
  scene,
  initialPosition = { x: 0, y: 0, z: 0 },
  options = {},
) {
  const config = {
    width: 500,
    depth: 500,
    heightVariation: 10,
    terrainComplexity: 75,
    colors: {
      desert: {
        sand: [0xf4a460, 0xdeb887, 0xd2691e],
        rocks: [0x8b4513, 0x6b4423, 0x5d4037],
      },
      mountain: {
        base: [0x2e8b57, 0x3cb371, 0x228b22],
        peak: [0x8b4513, 0x6b4423, 0x5d4037],
      },
    },
    ...options,
  };

  function getTerrainZone(x, z) {
    const relativeX = x - initialPosition.x;
    const relativeZ = z - initialPosition.z;
    const distanceFromCenter = Math.abs(relativeX) + Math.abs(relativeZ);
    return distanceFromCenter / (config.width / 2);
  }

  function interpolateColor(color1, color2, factor) {
    return new THREE.Color(color1).lerp(new THREE.Color(color2), factor);
  }

  // Pré-computa a quaternion de rotação (reutilizada para todos os patches)
  const rotQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const unitScale = new THREE.Vector3(1, 1, 1);
  const piecePosVec = new THREE.Vector3();
  const transformMat = new THREE.Matrix4();

  const pieceWidth = config.width / config.terrainComplexity;
  const pieceDepth = config.depth / config.terrainComplexity;

  // Acumula geometrias em espaço de mundo para merge em 1 draw call
  const geoList: THREE.BufferGeometry[] = [];

  for (let x = -config.width / 2; x < config.width / 2; x += pieceWidth) {
    for (let z = -config.depth / 2; z < config.depth / 2; z += pieceDepth) {
      const zoneIntensity = getTerrainZone(x, z);
      const height =
        Math.pow(Math.random(), 1.5) * config.heightVariation * (1 - zoneIntensity);

      let pieceColor: THREE.Color;
      if (zoneIntensity < 0.5) {
        const baseColor = config.colors.mountain.base[
          Math.floor(Math.random() * config.colors.mountain.base.length)
        ];
        const peakColor = config.colors.mountain.peak[
          Math.floor(Math.random() * config.colors.mountain.peak.length)
        ];
        pieceColor = interpolateColor(baseColor, peakColor, height / (config.heightVariation * 0.5));
      } else {
        const sandColors = config.colors.desert.sand;
        const rockColors = config.colors.desert.rocks;
        pieceColor = new THREE.Color(
          Math.random() > 0.9
            ? rockColors[Math.floor(Math.random() * rockColors.length)]
            : sandColors[Math.floor(Math.random() * sandColors.length)],
        );
      }

      const geo = new THREE.PlaneGeometry(pieceWidth, pieceDepth, 10, 10);

      // Variação de altura nos vértices
      const posArr = geo.attributes.position.array;
      for (let i = 0; i < posArr.length; i += 3) {
        posArr[i + 2] += Math.pow(Math.random(), 2) * height;
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();

      // Aplica transform (rotação + translação) em espaço de mundo
      piecePosVec.set(x + initialPosition.x, initialPosition.y, z + initialPosition.z);
      transformMat.compose(piecePosVec, rotQuat, unitScale);
      geo.applyMatrix4(transformMat);

      // Cor uniforme por patch via atributo de vértice
      const vertexCount = geo.attributes.position.count;
      const colorArr = new Float32Array(vertexCount * 3);
      for (let v = 0; v < vertexCount; v++) {
        colorArr[v * 3]     = pieceColor.r;
        colorArr[v * 3 + 1] = pieceColor.g;
        colorArr[v * 3 + 2] = pieceColor.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));

      geoList.push(geo);
    }
  }

  // 1 draw call para todo o terreno
  const mergedGeo = mergeGeometries(geoList, false);
  // Libera geometrias individuais após o merge
  geoList.forEach((g) => g.dispose());

  const terrainMesh = new THREE.Mesh(
    mergedGeo,
    new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      shininess: 7,
    }),
  );

  const lightHeight = Math.max(100, config.heightVariation * 10);
  const ambientLight = new THREE.AmbientLight(0x404040);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(initialPosition.x, initialPosition.y + lightHeight, initialPosition.z);
  directionalLight.target.position.set(initialPosition.x, initialPosition.y, initialPosition.z);

  // Agrupa tudo em 1 objeto — cena recebe 1 filho em vez de 5625
  const terrainGroup = new THREE.Group();
  terrainGroup.add(terrainMesh);
  terrainGroup.add(ambientLight);
  terrainGroup.add(directionalLight.target);
  terrainGroup.add(directionalLight);
  scene.add(terrainGroup);

  return terrainGroup;
}

function drawCircle(sceneRef, elementData, config = {}) {
  const {
    radius = 1,
    segments = 32,
    openEnded = false, // se true, não cria o triângulo central
  } = config;

  // Garante que a cor esteja no formato aceito pelo Three.js

  // Criar o grupo que conterá círculo + bordas
  const circleGroup = new THREE.Group();

  const geometry = resourcePool.getCircleGeometry(segments);

  const material = resourcePool.getBasicMaterial(elementData.color, 0.9);

  // Mesh do círculo
  const circle = new THREE.Mesh(geometry, material);
  circle.castShadow = true;
  circle.receiveShadow = true;

  circle.scale.set(
    elementData.scale.x / 2,
    elementData.scale.y / 2,
    elementData.scale.z / 2,
  );

  // Adicionar círculo ao grupo
  circleGroup.add(circle);
  const edgesGeometry = new THREE.WireframeGeometry(geometry);
  const adjustedEdgeColor = adjustColorTone(elementData.color, 80);
  const edgesMaterial = resourcePool.getLineMaterial(adjustedEdgeColor, 0.7);

  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

  edges.userData.particleId = elementData.id;

  edges.scale.copy(circle.scale);

  // Adicionar bordas ao grupo (sem precisar copiar posição)
  circleGroup.add(edges);

  // Posicionar o grupo inteiro
  circleGroup.position.set(
    elementData.position.x,
    elementData.position.y,
    elementData.position.z,
  );
  circleGroup.rotation.set(
    elementData.rotation.x,
    elementData.rotation.y,
    elementData.rotation.z,
  );

  circleGroup.userData.particleId = elementData.id;
  // Adicionar grupo à cena
  sceneRef.current.add(circleGroup);

  // Retornar o grupo (não apenas o mesh do círculo)
  return circleGroup;
}

function drawTriangle(sceneRef, elementData, config = {}) {
  // Garante que a cor esteja no formato aceito pelo Three.js
  const parsedColor = new THREE.Color(elementData.color);

  // Vértices do triângulo (no plano XY) - reutilizados para ambos os objetos
  const vertices = new Float32Array([
    -elementData.scale.x,
    -elementData.scale.y,
    0, // vértice esquerdo
    elementData.scale.x,
    -elementData.scale.y,
    0, // vértice direito
    0,
    elementData.scale.y,
    0, // vértice superior
  ]);

  // Índices (um único triângulo)
  const indices = [0, 1, 2];

  // Criar geometria base (será compartilhada)
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();

  // Criar o grupo que conterá triângulo + bordas
  const triangleGroup = new THREE.Group();

  // Material do triângulo
  const material = new THREE.MeshBasicMaterial({
    color: parsedColor,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });

  // Mesh do triângulo
  const triangle = new THREE.Mesh(geometry, material);
  triangle.castShadow = true;
  triangle.receiveShadow = true;

  // Adicionar triângulo ao grupo
  triangleGroup.add(triangle);

  // Cor ajustada para as bordas
  const adjustedEdgeColor = new THREE.Color(
    adjustColorTone(elementData.color, 80),
  );

  // Wireframe (arestas) - usando EdgesGeometry para melhor performance
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: adjustedEdgeColor,
    linewidth: 1,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.userData.particleId = elementData.id;

  // Adicionar bordas ao grupo (sem precisar copiar posição)
  triangleGroup.add(edges);

  // Posicionar o grupo inteiro
  triangleGroup.position.set(
    elementData.position.x,
    elementData.position.y,
    elementData.position.z,
  );

  triangleGroup.rotation.set(
    elementData.rotation.x,
    elementData.rotation.y,
    elementData.rotation.z,
  );

  triangleGroup.userData.particleId = elementData.id;

  // Adicionar grupo à cena
  sceneRef.current.add(triangleGroup);
  return triangleGroup;
}

function drawCube(sceneRef, elementData) {
  // Garante que a cor esteja no formato aceito pelo Three.js
  const parsedColor = new THREE.Color(elementData.color);

  // Criar o grupo que conterá cubo + bordas
  const cubeGroup = new THREE.Group();

  // Geometria do cubo
  const geometry = new THREE.BoxGeometry(
    elementData.scale.x,
    elementData.scale.y,
    elementData.scale.z,
  );

  // Material do cubo
  const material = new THREE.MeshBasicMaterial({
    color: parsedColor,
    transparent: true,
    opacity: 0.9,
  });

  // Mesh do cubo
  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;

  // Adicionar cubo ao grupo
  cubeGroup.add(cube);

  // Cor ajustada para as bordas
  const adjustedEdgeColor = new THREE.Color(
    adjustColorTone(elementData.color, 80),
  );

  // Wireframe (arestas)
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: adjustedEdgeColor,
    linewidth: 2,
    opacity: 0.7,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.userData.particleId = elementData.id;

  // Adicionar bordas ao grupo (sem precisar copiar posição)
  cubeGroup.add(edges);

  // Posicionar o grupo inteiro
  cubeGroup.position.set(
    elementData.position.x,
    elementData.position.y,
    elementData.position.z,
  );

  cubeGroup.rotation.set(
    elementData.rotation.x,
    elementData.rotation.y,
    elementData.rotation.z,
  );

  cubeGroup.userData.particleId = elementData.id;

  // Adicionar grupo à cena
  sceneRef.current.add(cubeGroup);

  // Retornar o grupo (não apenas o mesh do cubo)
  return cubeGroup;
}

function drawSquare(sceneRef, elementData) {
  // Garante que a cor esteja no formato aceito pelo Three.js
  const parsedColor = new THREE.Color(elementData.color);

  // Criar o grupo que conterá quadrado + bordas
  const squareGroup = new THREE.Group();

  // Geometria do quadrado (um plano 2x2)
  const geometry = new THREE.PlaneGeometry(
    elementData.scale.x,
    elementData.scale.y,
  );

  // Material do quadrado
  const material = new THREE.MeshBasicMaterial({
    color: parsedColor,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide, // visível de frente e verso
  });

  // Mesh do quadrado
  const square = new THREE.Mesh(geometry, material);
  square.castShadow = true;
  square.receiveShadow = true;

  // Adicionar quadrado ao grupo
  squareGroup.add(square);

  // Cor ajustada para as bordas
  const adjustedEdgeColor = new THREE.Color(
    adjustColorTone(elementData.color, 80),
  );
  // const adjustedEdgeColor = new THREE.Color("#ffffff");

  // Wireframe (arestas)
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: adjustedEdgeColor,
    linewidth: 3,
    opacity: 0.7,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

  // Adicionar bordas ao grupo (sem precisar copiar posição)
  squareGroup.add(edges);

  // Posicionar o grupo inteiro
  squareGroup.position.set(
    elementData.position.x,
    elementData.position.y,
    elementData.position.z,
  );
  squareGroup.rotation.set(
    elementData.rotation.x,
    elementData.rotation.y,
    elementData.rotation.z,
  );

  squareGroup.userData.particleId = elementData.id;

  // Adicionar grupo à cena
  sceneRef.current.add(squareGroup);

  // Retornar o grupo (não apenas o mesh do quadrado)
  return squareGroup;
}

function drawSphere(sceneRef, elementData) {
  // Garante que a cor esteja no formato aceito pelo Three.js
  const parsedColor = new THREE.Color(elementData.color);

  // Criar o grupo que conterá esfera + bordas
  const sphereGroup = new THREE.Group();

  // Geometria da esfera (raio 1, 32 segmentos horizontais, 32 verticais para suavidade)
  const geometry = new THREE.SphereGeometry(elementData.size, 32, 32);

  geometry.userData.particleId = elementData.id;

  // Material da esfera
  const material = new THREE.MeshBasicMaterial({
    color: parsedColor,
    transparent: true,
    opacity: 0.8,
  });

  // Mesh da esfera
  const sphere = new THREE.Mesh(geometry, material);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  sphere.userData.particleId = elementData.id;

  // Adicionar esfera ao grupo
  sphereGroup.add(sphere);

  // Cor ajustada para as bordas
  const adjustedEdgeColor = new THREE.Color(
    adjustColorTone(elementData.color, 60),
  );

  // Arestas da esfera — EdgesGeometry elimina arestas coplanares internas (~10x menos vértices que WireframeGeometry)
  const edgesGeometry = new THREE.EdgesGeometry(
    new THREE.SphereGeometry(elementData.size, 16, 16),
  );
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: adjustedEdgeColor,
    linewidth: 2,
    opacity: 0.7,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.userData.particleId = elementData.id;

  // Adicionar bordas ao grupo (sem precisar copiar posição)
  sphereGroup.add(edges);

  // Posicionar o grupo inteiro
  sphereGroup.position.set(
    elementData.position.x,
    elementData.position.y,
    elementData.position.z,
  );
  sphereGroup.rotation.set(
    elementData.rotation.x,
    elementData.rotation.y,
    elementData.rotation.z,
  );

  sphereGroup.userData.particleId = elementData.id;

  // Adicionar grupo à cena
  sceneRef.current.add(sphereGroup);

  // Retornar o grupo (não apenas o mesh da esfera)
  return sphereGroup;
}

function drawCylinder(sceneRef, elementData, config = {}) {
  const {
    radiusTop = 1,
    radiusBottom = 1,
    height = 1,
    radialSegments = 32,
    heightSegments = 1,
    openEnded = false,
  } = config;

  // Garante que a cor esteja no formato aceito pelo Three.js
  const parsedColor = new THREE.Color(elementData.color);

  // Criar o grupo que conterá cilindro + bordas
  const cylinderGroup = new THREE.Group();

  // Geometria do cilindro
  const geometry = new THREE.CylinderGeometry(
    elementData.size * 0.2,
    elementData.size * 0.2,
    elementData.size,
    radialSegments,
    heightSegments,
    openEnded,
  );

  // Material do cilindro
  const material = new THREE.MeshBasicMaterial({
    color: parsedColor,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });

  // Mesh do cilindro
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;

  // Adicionar cilindro ao grupo
  cylinderGroup.add(cylinder);

  // Cor ajustada para as bordas
  const adjustedEdgeColor = new THREE.Color(
    adjustColorTone(elementData.color, 60),
  );

  // Wireframe (arestas) para destacar a forma
  const edgesGeometry = new THREE.WireframeGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: adjustedEdgeColor,
    linewidth: 2,
    opacity: 0.7,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.userData.particleId = elementData.id;

  // Adicionar bordas ao grupo (sem precisar copiar posição)
  cylinderGroup.add(edges);

  // Posicionar o grupo inteiro
  cylinderGroup.position.set(
    elementData.position.x,
    elementData.position.y,
    elementData.position.z,
  );
  cylinderGroup.rotation.set(
    elementData.rotation.x,
    elementData.rotation.y,
    elementData.rotation.z,
  );

  cylinderGroup.userData.particleId = elementData.id;

  // Adicionar grupo à cena
  sceneRef.current.add(cylinderGroup);

  // Retornar o grupo (não apenas o mesh do cilindro)
  return cylinderGroup;
}

function drawPyramid(sceneRef, elementData = {}, config = {}) {
  const { baseWidth = 1 } = config;

  // Valores padrão para elementData
  const defaultElementData = {
    color: '#ffffff',
    scale: { x: 1, y: 1, z: 1 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    height: null,
    id: `pyramid_${Date.now()}`,
  };

  // Mesclar valores padrão com dados recebidos
  const data = {
    ...defaultElementData,
    ...elementData,
    scale: { ...defaultElementData.scale, ...(elementData.scale || {}) },
    position: {
      ...defaultElementData.position,
      ...(elementData.position || {}),
    },
    rotation: {
      ...defaultElementData.rotation,
      ...(elementData.rotation || {}),
    },
  };

  // Garante que a cor esteja no formato aceito pelo Three.js
  const parsedColor = new THREE.Color(data.color);

  // Criar o grupo que conterá pirâmide + bordas
  const pyramidGroup = new THREE.Group();

  // Metade da base usando scale
  const half = data.scale;

  // Altura padrão se não definida
  const height = data.height?.y ?? half.y * 2;

  // Define os 5 pontos base
  const v0 = [-half.x, 0, half.z]; // frente-esquerda
  const v1 = [half.x, 0, half.z]; // frente-direita
  const v2 = [half.x, 0, -half.z]; // trás-direita
  const v3 = [-half.x, 0, -half.z]; // trás-esquerda
  const v4 = [0, height, 0]; // topo

  // SEM ÍNDICES: cada triângulo tem seus 3 vértices completos
  // Total: 6 faces × 3 vértices × 3 coordenadas = 54 números
  const vertices = elementData.vertices
    ? new Float32Array(elementData.vertices)
    : new Float32Array([
        // Face frontal (v0, v1, v4)
        ...v0,
        ...v1,
        ...v4,

        // Face direita (v1, v2, v4)
        ...v1,
        ...v2,
        ...v4,

        // Face traseira (v2, v3, v4)
        ...v2,
        ...v3,
        ...v4,

        // Face esquerda (v3, v0, v4)
        ...v3,
        ...v0,
        ...v4,

        // Base - Triângulo 1 (v0, v2, v1)
        ...v0,
        ...v2,
        ...v1,

        // Base - Triângulo 2 (v0, v3, v2)
        ...v0,
        ...v3,
        ...v2,
      ]);

  // Criar geometria SEM índices
  const geometry = new THREE.BufferGeometry();
  // NÃO usa setIndex() - os vértices já estão na ordem correta
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();

  // Material da pirâmide
  const material = new THREE.MeshBasicMaterial({
    color: parsedColor,
    transparent: true,
    opacity: elementData.opacity ?? 0.8,
    side: THREE.DoubleSide,
  });

  // Mesh da pirâmide
  const pyramid = new THREE.Mesh(geometry, material);
  pyramid.castShadow = elementData.castShadow ?? true;
  pyramid.receiveShadow = elementData.receiveShadow ?? true;
  pyramid.userData.particleId = data.id;
  pyramidGroup.userData.particleId = data.id;

  // Adicionar pirâmide ao grupo
  pyramidGroup.add(pyramid);

  // Cor ajustada para as bordas
  const edgeColor = elementData.edgeColor || adjustColorTone(data.color, 80);
  const adjustedEdgeColor = new THREE.Color(edgeColor);

  // Wireframe (arestas)
  const edgesGeometry = new THREE.WireframeGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: adjustedEdgeColor,
    linewidth: elementData.edgeLinewidth ?? 2,
    opacity: elementData.edgeOpacity ?? 0.7,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.userData.particleId = data.id;

  // Adicionar bordas ao grupo
  pyramidGroup.add(edges);

  // Posicionar o grupo inteiro usando os valores mesclados
  pyramidGroup.position.set(data.position.x, data.position.y, data.position.z);
  pyramidGroup.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);

  pyramidGroup.userData.particleId = data.id;

  // Adicionar grupo à cena (assumindo que sceneRef existe no escopo)
  if (typeof sceneRef !== 'undefined' && sceneRef.current) {
    sceneRef.current.add(pyramidGroup);
  }

  // Retornar o grupo
  return pyramidGroup;
}

function drawArrow(sceneRef, elementData, config = {}) {
  const {
    arrowLength = 3,
    shaftRadius = elementData?.size * 0.02,
    shaftLength = elementData?.size * 0.8,
    headWidth = elementData?.size * 0.22,
    headHeight = elementData?.size * 0.33,
  } = config;

  // Garante que a cor esteja no formato aceito pelo Three.js
  const parsedColor = new THREE.Color(elementData.color);

  // Criar o grupo que conterá todas as partes da seta + bordas
  const arrowGroup = new THREE.Group();

  // === CORPO DA SETA (CILINDRO) ===

  // Criar cilindro manualmente com geometria pura
  const cylinderSegments = 16;
  const cylinderVertices = [];
  const cylinderIndices = [];

  // Vértices do cilindro
  for (let i = 0; i <= cylinderSegments; i++) {
    const angle = (i / cylinderSegments) * Math.PI * 2;
    const x = Math.cos(angle) * shaftRadius;
    const z = Math.sin(angle) * shaftRadius;

    // Círculo inferior (y = 0)
    cylinderVertices.push(x, 0, z);
    // Círculo superior (y = shaftLength)
    cylinderVertices.push(x, shaftLength, z);
  }

  // Centro dos círculos para fechar as tampas
  cylinderVertices.push(0, 0, 0); // centro inferior
  cylinderVertices.push(0, shaftLength, 0); // centro superior

  const centerBottomIndex = (cylinderSegments + 1) * 2;
  const centerTopIndex = centerBottomIndex + 1;

  // Índices para as faces laterais
  for (let i = 0; i < cylinderSegments; i++) {
    const current = i * 2;
    const next = ((i + 1) % (cylinderSegments + 1)) * 2;

    // Dois triângulos por face lateral
    cylinderIndices.push(current, current + 1, next);
    cylinderIndices.push(current + 1, next + 1, next);
  }

  // Índices para as tampas
  for (let i = 0; i < cylinderSegments; i++) {
    const current = i * 2;
    const next = ((i + 1) % (cylinderSegments + 1)) * 2;

    // Tampa inferior
    cylinderIndices.push(centerBottomIndex, next, current);
    // Tampa superior
    cylinderIndices.push(centerTopIndex, current + 1, next + 1);
  }

  const cylinderGeometry = new THREE.BufferGeometry();
  cylinderGeometry.setIndex(cylinderIndices);
  cylinderGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(cylinderVertices), 3),
  );
  cylinderGeometry.computeVertexNormals();

  // Material do cilindro
  const cylinderMaterial = new THREE.MeshBasicMaterial({
    color: parsedColor,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });

  // Mesh do cilindro
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  // Rotacionar 90 graus para ficar horizontal
  cylinder.rotation.z = -Math.PI / 2;
  cylinder.position.set(-shaftLength / 2, 0, 0);
  arrowGroup.add(cylinder);

  // === PONTA DA SETA (PIRÂMIDE DE 12 LADOS) ===

  const pyramidSides = 12;
  const radius = headWidth / 2;
  const pyramidVerticesArray = [];
  const pyramidIndices = [];

  // Centro da base
  pyramidVerticesArray.push(0, 0, 0); // índice 0

  // Vértices da base (círculo com 12 lados)
  for (let i = 0; i < pyramidSides; i++) {
    const angle = (i / pyramidSides) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    pyramidVerticesArray.push(x, 0, z); // índices 1 a 12
  }

  // Ponta da pirâmide
  pyramidVerticesArray.push(0, headHeight, 0); // índice 13

  // Índices para as faces laterais (triângulos do centro da base para cada lado)
  for (let i = 0; i < pyramidSides; i++) {
    const current = i + 1; // vértice atual da base
    const next = ((i + 1) % pyramidSides) + 1; // próximo vértice da base
    const tip = pyramidSides + 1; // índice da ponta

    // Face lateral (da base para a ponta)
    pyramidIndices.push(current, next, tip);

    // Face da base (do centro para cada lado)
    pyramidIndices.push(0, next, current);
  }

  const pyramidVertices = new Float32Array(pyramidVerticesArray);

  const pyramidGeometry = new THREE.BufferGeometry();
  pyramidGeometry.setIndex(pyramidIndices);
  pyramidGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(pyramidVertices, 3),
  );
  pyramidGeometry.computeVertexNormals();

  // Material da pirâmide
  const pyramidMaterial = new THREE.MeshBasicMaterial({
    color: parsedColor,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });

  // Mesh da pirâmide
  const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
  pyramid.castShadow = true;
  pyramid.receiveShadow = true;
  // Rotacionar 90 graus para que a ponta aponte para a direita
  pyramid.rotation.z = -Math.PI / 2;
  pyramid.position.set(shaftLength / 2, 0, 0);
  arrowGroup.add(pyramid);

  // === WIREFRAMES ===

  // Cor ajustada para as bordas
  const adjustedEdgeColor = new THREE.Color(
    adjustColorTone(elementData.color, 60),
  );

  // Wireframe do cilindro
  const cylinderEdgesGeometry = new THREE.WireframeGeometry(cylinderGeometry);
  const cylinderEdgesMaterial = new THREE.LineBasicMaterial({
    color: adjustedEdgeColor,
    linewidth: 2,
    opacity: 0.7,
  });
  const cylinderEdges = new THREE.LineSegments(
    cylinderEdgesGeometry,
    cylinderEdgesMaterial,
  );
  cylinderEdges.position.copy(cylinder.position);
  cylinderEdges.rotation.copy(cylinder.rotation);
  cylinderEdges.userData.particleId = elementData.id;
  arrowGroup.add(cylinderEdges);

  // Wireframe da pirâmide
  const pyramidEdgesGeometry = new THREE.WireframeGeometry(pyramidGeometry);
  const pyramidEdgesMaterial = new THREE.LineBasicMaterial({
    color: adjustedEdgeColor,
    linewidth: 2,
    opacity: 0.7,
  });
  const pyramidEdges = new THREE.LineSegments(
    pyramidEdgesGeometry,
    pyramidEdgesMaterial,
  );
  pyramidEdges.position.copy(pyramid.position);
  pyramidEdges.rotation.copy(pyramid.rotation);
  pyramidEdges.userData.particleId = elementData.id;
  arrowGroup.add(pyramidEdges);

  // Posicionar o grupo inteiro
  arrowGroup.position.set(
    elementData.position.x,
    elementData.position.y,
    elementData.position.z,
  );

  arrowGroup.userData.particleId = elementData.id;

  // Adicionar grupo à cena
  sceneRef.current.add(arrowGroup);

  // Retornar o grupo
  return arrowGroup;
}

export function handleCreativityOnSpace(
  elementData,
  sceneRef,
  elementsStackRef,
  cartesianSpaceRef,
  addElement,
  isRebuild,
  pushHistory,
) {
  let particleId = elementData?.id;

  let result;

  const shouldNotAdd =
    !elementData?.element || !elementData?.color || !elementData?.size;

  if (shouldNotAdd) {
    return;
  }

  let newElement = {
    ...elementData,
    scale: {
      x: elementData?.size?.x || elementData.size,
      y: elementData?.size?.y || elementData.size,
      z: elementData?.size?.z || elementData.size,
    },

    rotation: {
      x: elementData?.rotation?.x || 0,
      y: elementData?.rotation?.y || 0,
      z: elementData?.rotation?.z || 0,
    },
  };

  const sceneLengthStart = sceneRef.current.children.length;

  if (!isRebuild) {
    particleId = `${elementData?.element}-${Date.now()}`;
    newElement = {
      ...newElement,
      id: particleId,
    };
    addElement(newElement);
  }

  switch (elementData?.element) {
    case 'circle':
      result = drawCircle(sceneRef, newElement);
      break;
    case 'triangle':
      result = drawTriangle(sceneRef, newElement);
      break;
    case 'square':
      result = drawSquare(sceneRef, newElement);
      break;
    case 'cube':
      result = drawCube(sceneRef, newElement);
      break;
    case 'sphere':
      result = drawSphere(sceneRef, newElement);
      break;
    case 'cylinder':
      result = drawCylinder(sceneRef, newElement);
      break;
    case 'pyramid':
      result = drawPyramid(sceneRef, newElement);
      break;
    case 'arrow':
      result = drawArrow(sceneRef, newElement);
      break;
    case 'axis':
      result = createCartesianSpaceAxes(
        sceneRef.current,
        newElement,
        particleId,
      );
      break;
    case 'text':
      result = addTextToScene(sceneRef.current, newElement);
      break;
    case 'functions':
      result = drawFunction(sceneRef.current, newElement);
      break;
    case 'line':
      result = createLineBetweenPoints(sceneRef, newElement);
      break;
    case 'plane':
      result = handlePlaneSelection(sceneRef, newElement);
      break;
    case 'blackboard':
      result = drawBlackboard(sceneRef, newElement);
      break;
    default:
      result = drawCube(sceneRef, newElement);
      break;
  }

  const sceneLengthEnd = sceneRef.current.children.length;

  elementsStackRef.current.set(particleId, {
    sceneLengthStart: sceneLengthStart,
    sceneLengthEnd: sceneLengthEnd,
  });

  if (!isRebuild && typeof pushHistory === 'function') {
    pushHistory({ type: 'ADD_ELEMENT', element: newElement });
  }

  return result;
}

function createLineBetweenPoints(sceneRef, elementData) {
  const parsedColor = new THREE.Color(elementData.color);

  const geometry = new THREE.BufferGeometry().setFromPoints(
    elementData.position,
  );
  const material = new THREE.LineBasicMaterial({
    color: parsedColor,
    linewidth: elementData.size,
  });
  const line = new THREE.Line(geometry, material);
  sceneRef.current.add(line); // Adicionar a linha à cena

  return line;
}


// Função para carregar imagem do localStorage e criar textura
async function loadImageFromLocalStorageToThreeJS(imageId) {
  // Obter todas imagens salvas
  const savedImages = JSON.parse(safeGetItem('savedImages') || '[]');

  // Encontrar imagem específica
  const imageData = savedImages.find((img) => img.id === imageId);
  if (!imageData) throw new Error('Imagem não encontrada');

  // Criar textura Three.js a partir do Base64
  return new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageData.data,
      (texture) => {
        resolve(texture);
      },
      undefined,
      (error) => {
        console.error('Erro ao carregar textura:', error);
        reject(error);
      },
    );
  });
}

// Função para adicionar imagem à cena
export async function addImageToScene(imageId, scene, camera) {
  try {
    const texture = await loadImageFromLocalStorageToThreeJS(imageId);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry();
    const mesh = new THREE.Mesh(geometry, material);

    // D3 — expor dispose para limpeza ao remover o mesh da cena
    mesh.userData.dispose = () => {
      material.map?.dispose();
      material.dispose();
      geometry.dispose();
      scene.remove(mesh);
    };

    scene.add(mesh);
    return mesh;
  } catch (error) {
    console.error('Erro ao adicionar imagem à cena:', error);
    return null;
  }
}

export function removeParticlesByid(scene, particleId) {
  scene.children.forEach((object) => {
    if (object.userData.particleId === particleId) {
      scene.remove(object);

      // Limpeza de memória
      if (object.isPoints || object.isLine) {
        object.geometry.dispose();
        object.material.dispose();
      } else if (object.isSprite) {
        object.material.dispose();
      } else if (object.isMesh || object.isGroup) {
        // D2/D3 — dispor meshes (texto, imagem, etc.)
        if (typeof object.userData.dispose === 'function') {
          object.userData.dispose();
        } else {
          disposeObject(object);
        }
        // Dispor filhos do grupo recursivamente
        object.traverse((child) => {
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

export function createBrickLikeTerrain(scene, options = {}) {
  const config = {
    width: 500,
    depth: 500,
    brickSize: 10,
    heightVariation: 4,
    colors: [
      0xa0522d, // marrom escuro
      0x8b4513, // marrom médio
      0xcd853f, // marrom claro
      0x7b3f00, // barro seco
      0x5c4033, // terra queimada
    ],
    ...options,
  };

  function createBrick(x, z, width, depth) {
    const color = new THREE.Color(
      config.colors[Math.floor(Math.random() * config.colors.length)],
    );
    const height = Math.random() * config.heightVariation;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      metalness: 0.1,
    });

    const brick = new THREE.Mesh(geometry, material);
    brick.position.set(x, height / 2, z); // posiciona o tijolo sobre o plano

    return brick;
  }

  const brickGroup = new THREE.Group();
  const halfWidth = config.width / 2;
  const halfDepth = config.depth / 2;

  for (let x = -halfWidth; x < halfWidth; x += config.brickSize) {
    for (let z = -halfDepth; z < halfDepth; z += config.brickSize) {
      brickGroup.add(createBrick(
        x + config.brickSize / 2,
        z + config.brickSize / 2,
        config.brickSize,
        config.brickSize,
      ));
    }
  }

  const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;

  brickGroup.add(ambientLight);
  brickGroup.add(directionalLight);
  scene.add(brickGroup);

  return brickGroup;
}

/**
 * Detecta interseção de clique com objetos da cena.
 * @param {MouseEvent} event - Evento de clique do mouse.
 * @param {THREE.Camera} camera - Câmera da cena.
 * @param {THREE.Scene} scene - Cena contendo os objetos.
 * @param {THREE.WebGLRenderer} renderer - Renderer usado para obter tamanho do canvas.
 * @returns {THREE.Intersection[]} Lista de interseções encontradas (ordenadas pela distância).
 */
export function detectClickIntersection(event, camera, scene, renderer) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Converte posição do mouse para coordenadas normalizadas (-1 a +1)
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Configura o Raycaster com câmera e posição do mouse
  raycaster.setFromCamera(mouse, camera);

  // Intersecta com todos os objetos da cena (inclusive filhos)
  const intersects = raycaster.intersectObjects(scene.children, true);

  return intersects;
}

// Função para criar terreno de neve
export function createSnowTerrain(scene, options = {}) {
  const config = {
    width: 500,
    depth: 500,
    heightVariation: 15,
    snowComplexity: 60,
    colors: {
      snow: [0xffffff, 0xf0f8ff, 0xe6e6fa, 0xf5f5f5], // Tons de branco e neve
      ice: [0xb0e0e6, 0x87ceeb, 0x87cefa, 0xadd8e6], // Tons de azul gelo
      shadow: [0xe0e0e0, 0xd3d3d3, 0xc0c0c0], // Tons de cinza para sombras
    },
    ...options,
  };

  function createSnowPatch(x, z, width, depth) {
    // Cria variação de altura mais suave para neve
    const baseHeight = Math.pow(Math.random(), 0.8) * config.heightVariation;
    const additionalHeight = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3;
    const height = Math.max(0.5, baseHeight + additionalHeight);

    // Determina cor baseada na altura e posição
    let color;
    const heightFactor = height / config.heightVariation;
    const randomFactor = Math.random();

    if (heightFactor > 0.7 && randomFactor > 0.8) {
      // Áreas mais altas com gelo ocasional
      const iceIndex = Math.floor(Math.random() * config.colors.ice.length);
      color = config.colors.ice[iceIndex];
    } else if (heightFactor < 0.3) {
      // Áreas baixas com sombras
      const shadowIndex = Math.floor(
        Math.random() * config.colors.shadow.length,
      );
      color = config.colors.shadow[shadowIndex];
    } else {
      // Neve normal
      const snowIndex = Math.floor(Math.random() * config.colors.snow.length);
      color = config.colors.snow[snowIndex];
    }

    // Cria geometria com vertices modificados para parecer neve fofa
    const geometry = new THREE.PlaneGeometry(width, depth, 8, 8);
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      // Adiciona ruído suave para simular neve acumulada
      const noiseX = Math.sin(positions[i] * 0.1) * 0.5;
      const noiseZ = Math.cos(positions[i + 1] * 0.1) * 0.5;
      positions[i + 2] += height + noiseX + noiseZ;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
      color: color,
      side: THREE.DoubleSide,
      shininess: 80, // Neve brilhante
      specular: 0x111111,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0, z);

    return mesh;
  }

  const snowGroup = new THREE.Group();
  const patchWidth = config.width / config.snowComplexity;
  const patchDepth = config.depth / config.snowComplexity;

  for (let x = -config.width / 2; x < config.width / 2; x += patchWidth) {
    for (let z = -config.depth / 2; z < config.depth / 2; z += patchDepth) {
      snowGroup.add(createSnowPatch(x, z, patchWidth, patchDepth));
    }
  }

  const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
  directionalLight.position.set(1, 1, 0.5);

  snowGroup.add(ambientLight);
  snowGroup.add(directionalLight);
  scene.add(snowGroup);

  return snowGroup;
}

// Função para criar terreno de grama com elevações
export function createGrassTerrain(scene, options = {}) {
  const config = {
    width: 500,
    depth: 500,
    heightVariation: 20,
    grassComplexity: 80,
    colors: {
      grass: [0x228b22, 0x32cd32, 0x90ee90, 0x7cfc00], // Tons de verde
      darkGrass: [0x006400, 0x008000, 0x2e8b57], // Verde escuro
      flowers: [0xffff00, 0xff69b4, 0xff1493, 0x00ffff], // Cores de flores
    },
    ...options,
  };

  function createGrassChunk(x, z, width, depth) {
    // Cria elevações suaves usando funções trigonométricas
    const waveHeight1 =
      Math.sin(x * 0.01) * Math.cos(z * 0.01) * config.heightVariation * 0.6;
    const waveHeight2 =
      Math.sin(x * 0.02 + Math.PI / 4) *
      Math.cos(z * 0.015) *
      config.heightVariation *
      0.4;
    const randomHeight = (Math.random() - 0.5) * config.heightVariation * 0.3;
    const totalHeight = Math.max(0, waveHeight1 + waveHeight2 + randomHeight);

    // Determina cor baseada na altura e aleatoriedade
    let color;
    const heightFactor = totalHeight / config.heightVariation;
    const flowerChance = Math.random();

    if (flowerChance > 0.95) {
      // Pequena chance de flores
      const flowerIndex = Math.floor(
        Math.random() * config.colors.flowers.length,
      );
      color = config.colors.flowers[flowerIndex];
    } else if (heightFactor > 0.6) {
      // Grama mais escura em elevações
      const darkIndex = Math.floor(
        Math.random() * config.colors.darkGrass.length,
      );
      color = config.colors.darkGrass[darkIndex];
    } else {
      // Grama normal
      const grassIndex = Math.floor(Math.random() * config.colors.grass.length);
      color = config.colors.grass[grassIndex];
    }

    // Cria geometria com detalhes de grama
    const geometry = new THREE.PlaneGeometry(width, depth, 12, 12);
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      // Adiciona variação micro para simular textura de grama
      const microVariation = (Math.random() - 0.5) * 0.5;
      const x_pos = positions[i];
      const z_pos = positions[i + 1];

      // Aplica altura base mais variação micro
      const localHeight = Math.sin(x_pos * 0.3) * Math.cos(z_pos * 0.3) * 1;
      positions[i + 2] += totalHeight + microVariation + localHeight;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
      color: color,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0, z);

    return mesh;
  }

  const grassGroup = new THREE.Group();
  const chunkWidth = config.width / config.grassComplexity;
  const chunkDepth = config.depth / config.grassComplexity;

  for (let x = -config.width / 2; x < config.width / 2; x += chunkWidth) {
    for (let z = -config.depth / 2; z < config.depth / 2; z += chunkDepth) {
      grassGroup.add(createGrassChunk(x, z, chunkWidth, chunkDepth));
    }
  }

  const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0.5, 1, 0.3);

  grassGroup.add(ambientLight);
  grassGroup.add(directionalLight);
  scene.add(grassGroup);

  return grassGroup;
}

// Função para criar terreno de concreto/cimento
export function createConcreteTerrain(scene, options = {}) {
  const config = {
    width: 500,
    depth: 500,
    slabSize: 25,
    heightVariation: 3,
    colors: {
      concrete: [0x808080, 0x696969, 0x778899, 0x2f4f4f], // Tons de cinza
      aged: [0x555555, 0x404040, 0x36454f], // Cinza envelhecido
      stains: [0x8b4513, 0x654321, 0x2f4f4f], // Manchas e sujeira
    },
    ...options,
  };

  function createConcreteBlock(x, z, width, depth) {
    // Altura ligeiramente variável para simular assentamento
    const settlementHeight = (Math.random() - 0.5) * config.heightVariation;
    const baseHeight = config.heightVariation * 0.5;
    const totalHeight = Math.max(0.2, baseHeight + settlementHeight);

    // Determina cor e textura baseada em posição e aleatoriedade
    let color;
    const ageingFactor = Math.random();
    const stainChance = Math.random();

    if (stainChance > 0.9) {
      // Manchas ocasionais
      const stainIndex = Math.floor(
        Math.random() * config.colors.stains.length,
      );
      color = config.colors.stains[stainIndex];
    } else if (ageingFactor > 0.7) {
      // Concreto envelhecido
      const agedIndex = Math.floor(Math.random() * config.colors.aged.length);
      color = config.colors.aged[agedIndex];
    } else {
      // Concreto normal
      const concreteIndex = Math.floor(
        Math.random() * config.colors.concrete.length,
      );
      color = config.colors.concrete[concreteIndex];
    }

    // Cria bloco de concreto com geometria de caixa
    const geometry = new THREE.BoxGeometry(
      width * 0.95,
      totalHeight,
      depth * 0.95,
    );

    // Adiciona rugosidade sutil modificando vértices
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const roughness = (Math.random() - 0.5) * 0.1;
      positions[i] += roughness;
      positions[i + 1] += roughness * 0.5; // Menos variação vertical
      positions[i + 2] += roughness;
    }
    geometry.attributes.position.needsUpdate = true;

    const material = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 10, // Baixo brilho para concreto
      specular: 0x222222,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, totalHeight / 2, z);

    return mesh;
  }

  function createJoint(x, z, isVertical = true) {
    // Cria juntas entre blocos de concreto
    const jointWidth = isVertical ? 0.5 : config.slabSize;
    const jointDepth = isVertical ? config.slabSize : 0.5;
    const jointHeight = 0.1;

    const geometry = new THREE.BoxGeometry(jointWidth, jointHeight, jointDepth);
    const material = new THREE.MeshPhongMaterial({
      color: 0x2f2f2f, // Cor escura para juntas
      shininess: 5,
    });

    const joint = new THREE.Mesh(geometry, material);
    joint.position.set(x, jointHeight / 2, z);

    return joint;
  }

  const concreteGroup = new THREE.Group();

  for (let x = -config.width / 2; x < config.width / 2; x += config.slabSize) {
    for (
      let z = -config.depth / 2;
      z < config.depth / 2;
      z += config.slabSize
    ) {
      concreteGroup.add(createConcreteBlock(
        x + config.slabSize / 2,
        z + config.slabSize / 2,
        config.slabSize,
        config.slabSize,
      ));

      if (Math.random() > 0.7) {
        concreteGroup.add(createJoint(x + config.slabSize, z + config.slabSize / 2, true));
      }
      if (Math.random() > 0.7) {
        concreteGroup.add(createJoint(x + config.slabSize / 2, z + config.slabSize, false));
      }
    }
  }

  const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(0.8, 1, 0.2);

  concreteGroup.add(ambientLight);
  concreteGroup.add(directionalLight);
  scene.add(concreteGroup);

  return concreteGroup;
}

export function drawElementSelectionIndicator(
  element,
  sceneRef,
  particleId,
  config = {},
) {
  const {
    offsetFromElement = 0.1,
    lineColor = 0x666666,
    lineOpacity = 0.6,
    dashSize = 0.1,
    gapSize = 0.05,
    linewidth = 2,
  } = config;

  // Calcular bounding box do elemento
  const box = new THREE.Box3().setFromObject(element);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Criar o grupo que conterá todas as linhas do cubo
  const cubeSkeletonGroup = new THREE.Group();
  cubeSkeletonGroup.userData.particleId = particleId;

  // Calcular dimensões do cubo com offset
  const halfSize = size
    .clone()
    .multiplyScalar(0.5)
    .addScalar(offsetFromElement);

  // Definir os 8 vértices do cubo
  const vertices = [
    // Vértices frontais (Z positivo)
    new THREE.Vector3(
      center.x - halfSize.x,
      center.y - halfSize.y,
      center.z + halfSize.z,
    ), // 0: inferior esquerdo frontal
    new THREE.Vector3(
      center.x + halfSize.x,
      center.y - halfSize.y,
      center.z + halfSize.z,
    ), // 1: inferior direito frontal
    new THREE.Vector3(
      center.x + halfSize.x,
      center.y + halfSize.y,
      center.z + halfSize.z,
    ), // 2: superior direito frontal
    new THREE.Vector3(
      center.x - halfSize.x,
      center.y + halfSize.y,
      center.z + halfSize.z,
    ), // 3: superior esquerdo frontal

    // Vértices traseiros (Z negativo)
    new THREE.Vector3(
      center.x - halfSize.x,
      center.y - halfSize.y,
      center.z - halfSize.z,
    ), // 4: inferior esquerdo traseiro
    new THREE.Vector3(
      center.x + halfSize.x,
      center.y - halfSize.y,
      center.z - halfSize.z,
    ), // 5: inferior direito traseiro
    new THREE.Vector3(
      center.x + halfSize.x,
      center.y + halfSize.y,
      center.z - halfSize.z,
    ), // 6: superior direito traseiro
    new THREE.Vector3(
      center.x - halfSize.x,
      center.y + halfSize.y,
      center.z - halfSize.z,
    ), // 7: superior esquerdo traseiro
  ];

  // Definir as 12 arestas do cubo (pares de índices de vértices)
  const edges = [
    // Face frontal
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    // Face traseira
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    // Arestas conectando frente e trás
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  // Material para linhas tracejadas
  const lineMaterial = new THREE.LineDashedMaterial({
    color: lineColor,
    linewidth: linewidth,
    scale: 1,
    dashSize: dashSize,
    gapSize: gapSize,
    transparent: true,
    opacity: lineOpacity,
  });

  // Criar cada aresta do cubo
  edges.forEach(([startIdx, endIdx]) => {
    const points = [vertices[startIdx], vertices[endIdx]];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances(); // Necessário para linhas tracejadas
    line.userData.particleId = particleId;

    cubeSkeletonGroup.add(line);
  });

  // Adicionar o grupo à cena
  sceneRef.current.add(cubeSkeletonGroup);

  // Retornar objeto com informações e métodos úteis
  return {
    group: cubeSkeletonGroup,
    boundingBox: box,
    center: center,
    size: size,

    // Função para remover o cubo da cena
    remove: () => {
      sceneRef.current.remove(cubeSkeletonGroup);
    },

    // Função para atualizar posição se o elemento se mover
    updatePosition: (newElement) => {
      const newBox = new THREE.Box3().setFromObject(newElement);
      const newSize = newBox.getSize(new THREE.Vector3());
      const newCenter = newBox.getCenter(new THREE.Vector3());
      const newHalfSize = newSize
        .clone()
        .multiplyScalar(0.5)
        .addScalar(offsetFromElement);

      // Recalcular vértices
      const newVertices = [
        // Vértices frontais
        new THREE.Vector3(
          newCenter.x - newHalfSize.x,
          newCenter.y - newHalfSize.y,
          newCenter.z + newHalfSize.z,
        ),
        new THREE.Vector3(
          newCenter.x + newHalfSize.x,
          newCenter.y - newHalfSize.y,
          newCenter.z + newHalfSize.z,
        ),
        new THREE.Vector3(
          newCenter.x + newHalfSize.x,
          newCenter.y + newHalfSize.y,
          newCenter.z + newHalfSize.z,
        ),
        new THREE.Vector3(
          newCenter.x - newHalfSize.x,
          newCenter.y + newHalfSize.y,
          newCenter.z + newHalfSize.z,
        ),
        // Vértices traseiros
        new THREE.Vector3(
          newCenter.x - newHalfSize.x,
          newCenter.y - newHalfSize.y,
          newCenter.z - newHalfSize.z,
        ),
        new THREE.Vector3(
          newCenter.x + newHalfSize.x,
          newCenter.y - newHalfSize.y,
          newCenter.z - newHalfSize.z,
        ),
        new THREE.Vector3(
          newCenter.x + newHalfSize.x,
          newCenter.y + newHalfSize.y,
          newCenter.z - newHalfSize.z,
        ),
        new THREE.Vector3(
          newCenter.x - newHalfSize.x,
          newCenter.y + newHalfSize.y,
          newCenter.z - newHalfSize.z,
        ),
      ];

      // Atualizar cada linha do grupo
      cubeSkeletonGroup.children.forEach((line, index) => {
        const [startIdx, endIdx] = edges[index];
        const points = [newVertices[startIdx], newVertices[endIdx]];
        line.geometry.setFromPoints(points);
        line.computeLineDistances();
      });
    },

    // Função para alterar a cor das linhas
    setColor: (newColor) => {
      cubeSkeletonGroup.children.forEach((line) => {
        line.material.color.set(newColor);
      });
    },

    // Função para alterar a opacidade
    setOpacity: (newOpacity) => {
      cubeSkeletonGroup.children.forEach((line) => {
        line.material.opacity = newOpacity;
      });
    },

    // Função para alterar o estilo do tracejado
    setDashStyle: (newDashSize, newGapSize) => {
      cubeSkeletonGroup.children.forEach((line) => {
        line.material.dashSize = newDashSize;
        line.material.gapSize = newGapSize;
        line.computeLineDistances();
      });
    },

    // Função para mostrar/ocultar o cubo
    setVisible: (visible) => {
      cubeSkeletonGroup.visible = visible;
    },
  };
}

export function drawPositionIndicator(element, sceneRef, config = {}) {
  const {
    arrowLength = 0.3,
    arrowRadius = 0.08,
    offsetFromFace = 0.1,
    segments = 12,
    opacity = 0.8,
  } = config;

  // Cores para cada face (seguindo convenção: +X, -X, +Y, -Y, +Z, -Z)
  const faceColors = {
    posX: new THREE.Color(0xff0000), // Vermelho - Face direita
    negX: new THREE.Color(0x800000), // Vermelho escuro - Face esquerda
    posY: new THREE.Color(0x00ff00), // Verde - Face superior
    negY: new THREE.Color(0x008000), // Verde escuro - Face inferior
    posZ: new THREE.Color(0x0000ff), // Azul - Face frontal
    negZ: new THREE.Color(0x000080), // Azul escuro - Face traseira
  };

  // Estado interno para controle de seleção
  let currentSelectedAxis = '+X'; // Eixo inicialmente selecionado
  let previousSelectedAxis = null;

  // Calcular bounding box do elemento
  const box = new THREE.Box3().setFromObject(element);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Grupo principal para todas as setas
  const arrowsGroup = new THREE.Group();

  // Grupo para o grid
  const gridGroup = new THREE.Group();

  // Função para criar grid com linhas tracejadas
  function createGrid(customGridSize = null) {
    const gridLines = 5; // 5x5x5 grid

    // Usar tamanho customizado ou calcular baseado no elemento
    const gridSize = customGridSize || Math.max(size.x, size.y, size.z) * 2.0; // Aumentado para 2.0x
    const step = gridSize / (gridLines - 1);
    const halfGrid = gridSize / 2;

    // Material para linhas tracejadas
    const gridMaterial = new THREE.LineDashedMaterial({
      color: 0x666666,
      linewidth: 1,
      scale: 1,
      dashSize: 0.05,
      gapSize: 0.03,
      transparent: true,
      opacity: 0.4,
    });

    // Arrays para armazenar pontos das linhas
    const points = [];

    // Linhas paralelas ao eixo X (direção X)
    for (let i = 0; i < gridLines; i++) {
      for (let j = 0; j < gridLines; j++) {
        const y = center.y + (-halfGrid + i * step);
        const z = center.z + (-halfGrid + j * step);

        points.push(
          new THREE.Vector3(center.x - halfGrid, y, z),
          new THREE.Vector3(center.x + halfGrid, y, z),
        );
      }
    }

    // Linhas paralelas ao eixo Y (direção Y)
    for (let i = 0; i < gridLines; i++) {
      for (let j = 0; j < gridLines; j++) {
        const x = center.x + (-halfGrid + i * step);
        const z = center.z + (-halfGrid + j * step);

        points.push(
          new THREE.Vector3(x, center.y - halfGrid, z),
          new THREE.Vector3(x, center.y + halfGrid, z),
        );
      }
    }

    // Linhas paralelas ao eixo Z (direção Z)
    for (let i = 0; i < gridLines; i++) {
      for (let j = 0; j < gridLines; j++) {
        const x = center.x + (-halfGrid + i * step);
        const y = center.y + (-halfGrid + j * step);

        points.push(
          new THREE.Vector3(x, y, center.z - halfGrid),
          new THREE.Vector3(x, y, center.z + halfGrid),
        );
      }
    }

    // Criar geometria com todos os pontos
    const gridGeometry = new THREE.BufferGeometry().setFromPoints(points);

    // Criar o objeto de linha
    const gridLines3D = new THREE.LineSegments(gridGeometry, gridMaterial);
    gridLines3D.computeLineDistances(); // Necessário para linhas tracejadas

    gridGroup.add(gridLines3D);

    return {
      gridSize: gridSize,
      gridStep: step,
      gridCenter: center.clone(),
    };
  }

  // Criar o grid
  const gridInfo = createGrid();

  // Função para criar uma seta personalizada
  function createArrow(color) {
    const arrowVertices = [];
    const arrowIndices = [];

    // Centro da base
    arrowVertices.push(0, 0, 0);

    // Vértices da base circular
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * arrowRadius;
      const z = Math.sin(angle) * arrowRadius;
      arrowVertices.push(x, 0, z);
    }

    // Ponta da seta
    arrowVertices.push(0, arrowLength, 0);

    // Índices para os triângulos da base
    for (let i = 0; i < segments; i++) {
      const current = i + 1;
      const next = ((i + 1) % segments) + 1;
      arrowIndices.push(0, next, current);
    }

    // Índices para os triângulos laterais
    for (let i = 0; i < segments; i++) {
      const current = i + 1;
      const next = ((i + 1) % segments) + 1;
      const tip = segments + 1;
      arrowIndices.push(current, next, tip);
    }

    const arrowGeometry = new THREE.BufferGeometry();
    arrowGeometry.setIndex(arrowIndices);
    arrowGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(arrowVertices), 3),
    );
    arrowGeometry.computeVertexNormals();

    const arrowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
    });

    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);

    // Adicionar wireframe
    const edgesGeometry = new THREE.WireframeGeometry(arrowGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: color.clone().multiplyScalar(0.6),
      linewidth: 1,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

    const arrowGroup = new THREE.Group();
    arrowGroup.add(arrow);
    arrowGroup.add(edges);

    return arrowGroup;
  }

  // Função para posicionar e orientar seta em uma face
  function addFaceArrow(direction, color, position, rotation) {
    const arrow = createArrow(color);
    arrow.position.copy(position);
    arrow.rotation.set(rotation.x, rotation.y, rotation.z);

    arrowsGroup.add(arrow);

    return arrow;
  }

  // Calcular posições das setas (centro de cada face + offset)
  const halfSize = size.clone().multiplyScalar(0.5);

  // Face +X (direita)
  addFaceArrow(
    '+X',
    faceColors.posX,
    new THREE.Vector3(
      center.x + halfSize.x + offsetFromFace,
      center.y,
      center.z,
    ),
    new THREE.Euler(0, 0, -Math.PI / 2),
  );

  // Face -X (esquerda)
  addFaceArrow(
    '-X',
    faceColors.negX,
    new THREE.Vector3(
      center.x - halfSize.x - offsetFromFace,
      center.y,
      center.z,
    ),
    new THREE.Euler(0, 0, Math.PI / 2),
  );

  // Face +Y (superior)
  addFaceArrow(
    '+Y',
    faceColors.posY,
    new THREE.Vector3(
      center.x,
      center.y + halfSize.y + offsetFromFace,
      center.z,
    ),
    new THREE.Euler(0, 0, 0),
  );

  // Face -Y (inferior)
  addFaceArrow(
    '-Y',
    faceColors.negY,
    new THREE.Vector3(
      center.x,
      center.y - halfSize.y - offsetFromFace,
      center.z,
    ),
    new THREE.Euler(Math.PI, 0, 0),
  );

  // Face +Z (frontal)
  addFaceArrow(
    '+Z',
    faceColors.posZ,
    new THREE.Vector3(
      center.x,
      center.y,
      center.z + halfSize.z + offsetFromFace,
    ),
    new THREE.Euler(Math.PI / 2, 0, 0),
  );

  // Face -Z (traseira)
  addFaceArrow(
    '-Z',
    faceColors.negZ,
    new THREE.Vector3(
      center.x,
      center.y,
      center.z - halfSize.z - offsetFromFace,
    ),
    new THREE.Euler(-Math.PI / 2, 0, 0),
  );

  // Propriedades de sombra
  arrowsGroup.castShadow = true;
  arrowsGroup.receiveShadow = true;

  // Adicionar à cena
  sceneRef.current.add(arrowsGroup);
  sceneRef.current.add(gridGroup);

  // Mapear eixos para índices das setas
  const axisToArrowIndex = {
    '+X': 0,
    '-X': 1,
    '+Y': 2,
    '-Y': 3,
    '+Z': 4,
    '-Z': 5,
  };

  // Cores originais para restauração
  const originalColors = {
    '+X': faceColors.posX.clone(),
    '-X': faceColors.negX.clone(),
    '+Y': faceColors.posY.clone(),
    '-Y': faceColors.negY.clone(),
    '+Z': faceColors.posZ.clone(),
    '-Z': faceColors.negZ.clone(),
  };

  // Função para clarear uma cor
  function lightenColor(color, factor = 2.5) {
    return color
      .clone()
      .lerp(new THREE.Color(0xffffff), 0.6)
      .multiplyScalar(factor);
  }

  // Função interna para aplicar highlight em uma seta específica
  function applyHighlight(axis) {
    const arrowIndex = axisToArrowIndex[axis];
    if (arrowIndex === undefined) return;

    const arrow = arrowsGroup.children[arrowIndex];
    const lightColor = lightenColor(originalColors[axis]);

    // Atualizar cor da seta (mesh principal)
    arrow.children[0].material.color.copy(lightColor);

    // Atualizar cor do wireframe
    arrow.children[1].material.color.copy(
      lightColor.clone().multiplyScalar(0.8),
    );
  }

  // Função interna para restaurar cor original de uma seta específica
  function restoreColor(axis) {
    const arrowIndex = axisToArrowIndex[axis];
    if (arrowIndex === undefined) return;

    const arrow = arrowsGroup.children[arrowIndex];

    // Restaurar cor original da seta
    arrow.children[0].material.color.copy(originalColors[axis]);

    // Restaurar cor original do wireframe
    arrow.children[1].material.color.copy(
      originalColors[axis].clone().multiplyScalar(0.6),
    );
  }

  // Inicializar com o primeiro eixo destacado
  applyHighlight(currentSelectedAxis);

  // Retornar informações úteis
  return {
    arrowsGroup: arrowsGroup,
    gridGroup: gridGroup,
    gridInfo: gridInfo,
    elementSize: size,
    elementCenter: center,
    boundingBox: box,

    // Getter para o eixo atualmente selecionado
    get selectedAxis() {
      return currentSelectedAxis;
    },

    // Função para remover as setas da cena
    remove: () => {
      sceneRef.current.remove(arrowsGroup);
      sceneRef.current.remove(gridGroup);
    },

    // Função para atualizar posição se o elemento se mover
    updatePosition: (newElement) => {
      const newBox = new THREE.Box3().setFromObject(newElement);
      const newSize = newBox.getSize(new THREE.Vector3());
      const newCenter = newBox.getCenter(new THREE.Vector3());
      const newHalfSize = newSize.clone().multiplyScalar(0.5);

      const arrows = arrowsGroup.children;

      // Atualizar posições das setas
      arrows[0].position.set(
        newCenter.x + newHalfSize.x + offsetFromFace,
        newCenter.y,
        newCenter.z,
      ); // +X
      arrows[1].position.set(
        newCenter.x - newHalfSize.x - offsetFromFace,
        newCenter.y,
        newCenter.z,
      ); // -X
      arrows[2].position.set(
        newCenter.x,
        newCenter.y + newHalfSize.y + offsetFromFace,
        newCenter.z,
      ); // +Y
      arrows[3].position.set(
        newCenter.x,
        newCenter.y - newHalfSize.y - offsetFromFace,
        newCenter.z,
      ); // -Y
      arrows[4].position.set(
        newCenter.x,
        newCenter.y,
        newCenter.z + newHalfSize.z + offsetFromFace,
      ); // +Z
      arrows[5].position.set(
        newCenter.x,
        newCenter.y,
        newCenter.z - newHalfSize.z - offsetFromFace,
      ); // -Z
    },

    // Função para selecionar um novo eixo (restaura o anterior e destaca o novo)
    selectAxis: (axis) => {
      if (axisToArrowIndex[axis] === undefined) {
        console.warn(`Eixo inválido: ${axis}. Use: +X, -X, +Y, -Y, +Z, -Z`);
        return;
      }

      // Salvar o eixo anterior
      previousSelectedAxis = currentSelectedAxis;

      // Restaurar cor do eixo anteriormente selecionado
      if (previousSelectedAxis) {
        restoreColor(previousSelectedAxis);
      }

      // Atualizar o eixo atual
      currentSelectedAxis = axis;

      // Aplicar highlight no novo eixo
      applyHighlight(currentSelectedAxis);
    },

    // Função para selecionar eixo baseada em eixo ('x', 'y', 'z') e sinal ('+' ou '-')
    selectAxisBySigns: (axis, sign) => {
      const axisKey = `${sign}${axis.toUpperCase()}`;

      if (axisToArrowIndex[axisKey] === undefined) {
        console.warn(
          `Combinação inválida: eixo '${axis}' e sinal '${sign}'. Use eixos: 'x', 'y', 'z' e sinais: '+', '-'`,
        );
        return;
      }

      // Usar a função selectAxis principal
      this.selectAxis(axisKey);
    },

    // Função para restaurar o eixo atualmente selecionado à cor original
    restoreCurrentSelection: () => {
      if (currentSelectedAxis) {
        restoreColor(currentSelectedAxis);
        previousSelectedAxis = currentSelectedAxis;
        currentSelectedAxis = null;
      }
    },

    // Função para voltar ao eixo anteriormente selecionado
    selectPreviousAxis: () => {
      if (previousSelectedAxis) {
        this.selectAxis(previousSelectedAxis);
      }
    },

    // Função para restaurar todas as cores originais
    restoreAllColors: () => {
      Object.keys(axisToArrowIndex).forEach((axis) => {
        restoreColor(axis);
      });
      currentSelectedAxis = null;
      previousSelectedAxis = null;
    },

    // Função para obter informações sobre o estado atual
    getSelectionInfo: () => {
      return {
        current: currentSelectedAxis,
        previous: previousSelectedAxis,
        availableAxes: Object.keys(axisToArrowIndex),
      };
    },
  };
}

export function drawRuler(cameraRef, sceneRef, colorRef, config = {}) {
  const isMobile = config.isMobile || false;

  // Configurações dinâmicas da régua
  const defaultConfig = {
    length: isMobile ? 12 : 20, 
    width: 2, // Retorno da largura fixa para não afastar a borda esquerda para a direita
    thickness: 0.02, 
    majorTickSpacing: isMobile ? 1 : 2, 
    minorTickSpacing: isMobile ? 0.25 : 0.5, 
    majorTickHeight: isMobile ? 0.2 : 0.3, 
    minorTickHeight: isMobile ? 0.1 : 0.15, 
  };

  // Mescla configurações padrão com as fornecidas
  const rulerConfig = { ...defaultConfig, ...config };

  // Garante que a cor esteja no formato aceito pelo Three.js
  const parsedColor = new THREE.Color('#888888');

  // POSIÇÕES RELATIVAS À CÂMERA (coordenadas locais)
  const rulerZ = -10; 
  const rulerY = isMobile ? -3.5 : -2; 
  const rulerX = isMobile ? -0.5 : 0; // Desloca levemente para a esquerda no mobile para ajustar centro de tela

  // Grupo para organizar todos os elementos da régua
  const rulerGroup = new THREE.Group();

  // Material comum para todos os traços
  const tickMaterial = new THREE.MeshBasicMaterial({
    color: parsedColor,
    transparent: true,
    opacity: 0.9,
  });

  // === TRAÇO LATERAL ESQUERDO (GRANDE) ===
  const leftBorderGeometry = new THREE.BoxGeometry(
    rulerConfig.thickness,
    rulerConfig.thickness,
    rulerConfig.length,
  );
  const leftBorder = new THREE.Mesh(leftBorderGeometry, tickMaterial);
  leftBorder.position.set(rulerX - rulerConfig.width / 2, rulerY, rulerZ);
  rulerGroup.add(leftBorder);

  // === TRAÇO LATERAL DIREITO (GRANDE) ===
  const rightBorderGeometry = new THREE.BoxGeometry(
    rulerConfig.thickness,
    rulerConfig.thickness,
    rulerConfig.length,
  );
  const rightBorder = new THREE.Mesh(rightBorderGeometry, tickMaterial);
  rightBorder.position.set(rulerX + rulerConfig.width / 2, rulerY, rulerZ);
  rulerGroup.add(rightBorder);

  // === TRAÇO SUPERIOR (GRANDE) ===
  const topBorderGeometry = new THREE.BoxGeometry(
    rulerConfig.width,
    rulerConfig.thickness,
    rulerConfig.thickness,
  );
  const topBorder = new THREE.Mesh(topBorderGeometry, tickMaterial);
  topBorder.position.set(rulerX, rulerY, rulerZ - rulerConfig.length / 2);
  rulerGroup.add(topBorder);

  // === TRAÇOS MENORES INTERNOS (LADO DIREITO) ===
  const numMinorTicks = Math.floor(
    rulerConfig.length / rulerConfig.minorTickSpacing,
  );
  const startZ = rulerZ - rulerConfig.length / 2;

  for (let i = 1; i <= numMinorTicks; i++) {
    const currentPosition = i * rulerConfig.minorTickSpacing;

    // Não desenhar traço no final da régua
    if (currentPosition >= rulerConfig.length) continue;

    // Determinar se é traço maior ou menor
    const isMajorTick = currentPosition % rulerConfig.majorTickSpacing === 0;
    const tickHeight = isMajorTick
      ? rulerConfig.majorTickHeight
      : rulerConfig.minorTickHeight;
    const tickOpacity = isMajorTick ? 0.9 : 0.7;

    // Material específico para este traço
    const specificTickMaterial = new THREE.MeshBasicMaterial({
      color: parsedColor,
      transparent: true,
      opacity: tickOpacity,
    });

    // Traço horizontal partindo do lado direito
    const minorTickGeometry = new THREE.BoxGeometry(
      tickHeight,
      rulerConfig.thickness,
      rulerConfig.thickness,
    );
    const minorTick = new THREE.Mesh(minorTickGeometry, specificTickMaterial);
    minorTick.position.set(
      rulerX + rulerConfig.width / 2 - tickHeight / 2,
      rulerY,
      startZ + currentPosition,
    );
    rulerGroup.add(minorTick);
  }

  // *** Adicionar à câmera em vez da cena ***
  cameraRef.current.add(rulerGroup);

  // IMPORTANTE: Certificar que a câmera está na cena para que seus filhos sejam renderizados
  if (!sceneRef.current.children.includes(cameraRef.current)) {
    sceneRef.current.add(cameraRef.current);
  }

  return rulerGroup;
}

export function disposeMultipleObjects(sceneRef, elementsStackRef, particleId) {
  const currentElement = elementsStackRef.current.get(particleId);

  if (currentElement?.sceneLengthStart >= 0) {
    for (
      let i = currentElement.sceneLengthStart;
      i < currentElement.sceneLengthEnd;
      i++
    ) {
      const object = sceneRef.current.children[i];
      object?.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
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

const createInstancedGroup = (originalGroup, maxInstances = 100, sceneRef) => {
  const instancedObjects = new Map();

  originalGroup.children.forEach((child, index) => {
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
      sceneRef.current.add(instancedMesh);
    }
  });

  return instancedObjects;
};

export const createOptimizedTrace = (
  particleRef,
  positionsCopy,
  colorRef,
  sizeRef,
  sceneRef,
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
  geometry.setAttribute('position', new THREE.BufferAttribute(positionsCopy, 3));
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
  sceneRef.current.add(group);

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
  elementData,
  particleRef,
  addElement,
  isRebuild,
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
    case '3dTrace':
      newElement = {
        particlesPerSphere: 100,
        sphereRadius: elementData.size * 0.008,
        particleSize: 0.1,
        particleColor: elementData.color,
        ...elementData,
      };
      return createParticleSpheresAlongPath(newElement, particleRef);
    default:
      console.log('Pincel inexistente');
      break;
  }
}

export const reconstructElements = async (
  elements,
  sceneRef,
  elementsStackRef,
  cartesianSpaceRef,
  handlePlaneSelection,
  addElement,
  particleRef,
  functionsRef,
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
          );
          break;

        case 'traces': {
          particleRef.current = { id: elementData.id, group: null };
          const sceneLengthStart = sceneRef.current.children.length;
          const particles = createTraceAlongPath(
            elementData,
            particleRef,
            addElement,
            true,
          );
          sceneRef.current.add(particles);
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

export function drawBlackboard(sceneRef, elementData, config = {}) {
  const {
    boardWidth = elementData.size * 1.6,
    boardHeight = elementData.size * 1.0,
    boardDepth = elementData.size * 0.05,
    frameWidth = elementData.size * 0.08,
    frameDepth = elementData.size * 0.06,
  } = config;

  const particleId = elementData.id;

  // Cor da lousa (verde escuro)
  const boardColor = new THREE.Color(0x2d5016);

  // Criar o grupo que conterá todas as partes da lousa
  const blackboardGroup = new THREE.Group();

  // === SUPERFÍCIE DA LOUSA (RETÂNGULO VERDE) ===
  const boardGeometry = new THREE.BoxGeometry(
    boardWidth,
    boardHeight,
    boardDepth,
  );
  const boardMaterial = new THREE.MeshBasicMaterial({
    color: boardColor,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });

  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.castShadow = true;
  board.receiveShadow = true;
  blackboardGroup.add(board);

  // Wireframe da lousa
  const boardEdgesGeometry = new THREE.WireframeGeometry(boardGeometry);
  const boardEdgesMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(0x1a3010),
    linewidth: 2,
    opacity: 0.7,
  });
  const boardEdges = new THREE.LineSegments(
    boardEdgesGeometry,
    boardEdgesMaterial,
  );
  if (particleId) boardEdges.userData.particleId = particleId;
  blackboardGroup.add(boardEdges);

  // === MOLDURA DE MADEIRA ===

  // Cores variadas para simular madeira
  const woodColors = [
    new THREE.Color(0x5c4033), // marrom escuro
    new THREE.Color(0x6b4423), // marrom médio
    new THREE.Color(0x7d5a3f), // marrom claro
    new THREE.Color(0x4a3728), // marrom muito escuro
  ];

  // Função para criar uma parte da moldura
  function createFramePiece(
    width,
    height,
    depth,
    posX,
    posY,
    posZ,
    colorIndex,
  ) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({
      color: woodColors[colorIndex % woodColors.length],
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Wireframe
    const edgesGeometry = new THREE.WireframeGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(0x3a2818),
      linewidth: 2,
      opacity: 0.8,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.position.copy(mesh.position);
    if (particleId) edges.userData.particleId = particleId;

    return { mesh, edges };
  }

  // Moldura superior
  const topFrame = createFramePiece(
    boardWidth + frameWidth * 2,
    frameWidth,
    frameDepth,
    0,
    boardHeight / 2 + frameWidth / 2,
    frameDepth / 2,
    0,
  );
  blackboardGroup.add(topFrame.mesh);
  blackboardGroup.add(topFrame.edges);

  // Moldura inferior
  const bottomFrame = createFramePiece(
    boardWidth + frameWidth * 2,
    frameWidth,
    frameDepth,
    0,
    -boardHeight / 2 - frameWidth / 2,
    frameDepth / 2,
    1,
  );
  blackboardGroup.add(bottomFrame.mesh);
  blackboardGroup.add(bottomFrame.edges);

  // Moldura esquerda
  const leftFrame = createFramePiece(
    frameWidth,
    boardHeight,
    frameDepth,
    -boardWidth / 2 - frameWidth / 2,
    0,
    frameDepth / 2,
    2,
  );
  blackboardGroup.add(leftFrame.mesh);
  blackboardGroup.add(leftFrame.edges);

  // Moldura direita
  const rightFrame = createFramePiece(
    frameWidth,
    boardHeight,
    frameDepth,
    boardWidth / 2 + frameWidth / 2,
    0,
    frameDepth / 2,
    3,
  );
  blackboardGroup.add(rightFrame.mesh);
  blackboardGroup.add(rightFrame.edges);

  // === CANTOS (QUINAS) - MARCAÇÕES ESPECIAIS ===

  const cornerSize = frameWidth * 0.7;
  const cornerDepth = frameDepth * 1.2;
  const cornerColor = new THREE.Color(0x3a2515); // marrom muito escuro para destaque

  function createCorner(posX, posY) {
    const geometry = new THREE.BoxGeometry(cornerSize, cornerSize, cornerDepth);
    const material = new THREE.MeshBasicMaterial({
      color: cornerColor,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(posX, posY, frameDepth);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Wireframe do canto com cor dourada para destacar
    const edgesGeometry = new THREE.WireframeGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(0x8b7355),
      linewidth: 3,
      opacity: 1.0,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.position.copy(mesh.position);
    if (particleId) edges.userData.particleId = particleId;

    return { mesh, edges };
  }

  // Canto superior esquerdo
  const cornerTL = createCorner(
    -boardWidth / 2 - frameWidth / 2,
    boardHeight / 2 + frameWidth / 2,
  );
  blackboardGroup.add(cornerTL.mesh);
  blackboardGroup.add(cornerTL.edges);

  // Canto superior direito
  const cornerTR = createCorner(
    boardWidth / 2 + frameWidth / 2,
    boardHeight / 2 + frameWidth / 2,
  );
  blackboardGroup.add(cornerTR.mesh);
  blackboardGroup.add(cornerTR.edges);

  // Canto inferior esquerdo
  const cornerBL = createCorner(
    -boardWidth / 2 - frameWidth / 2,
    -boardHeight / 2 - frameWidth / 2,
  );
  blackboardGroup.add(cornerBL.mesh);
  blackboardGroup.add(cornerBL.edges);

  // Canto inferior direito
  const cornerBR = createCorner(
    boardWidth / 2 + frameWidth / 2,
    -boardHeight / 2 - frameWidth / 2,
  );
  blackboardGroup.add(cornerBR.mesh);
  blackboardGroup.add(cornerBR.edges);

  // Posicionar o grupo inteiro
  blackboardGroup.position.set(
    elementData.position.x,
    elementData.position.y,
    elementData.position.z,
  );

  if (particleId) blackboardGroup.userData.particleId = particleId;

  // Adicionar grupo à cena
  sceneRef.current.add(blackboardGroup);

  // Retornar o grupo
  return blackboardGroup;
}

function handlePlaneSelection(sceneRef, elementData) {
  let result;
  switch (elementData.plane) {
    case 'default':
      result = createSimplePlane(sceneRef.current, elementData.position);
      break;
    case 'tijolo':
      result = createBrickLikeTerrain(sceneRef.current, elementData.position);
      break;
    case 'gelo':
      result = createSnowTerrain(sceneRef.current, elementData.position);
      break;
    case 'grama':
      result = createGrassTerrain(sceneRef.current, elementData.position);
      break;
    case 'concreto':
      result = createConcreteTerrain(sceneRef.current, elementData.position);
      break;
    default:
      return;
  }
  if (result) result.userData.particleId = elementData.id;
  return result;
}
