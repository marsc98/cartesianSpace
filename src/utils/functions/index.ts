import * as THREE from 'three';

/**
 * Gets contrasting color with configurable brightness threshold
 * @param {string} hexColor - The background color in hex format
 * @param {number} [threshold=0.5] - Brightness threshold (0-1)
 * @returns {string} - The contrasting border color
 */
export function getContrastColor(hexColor, threshold = 0.5) {
  // Remove # and expand short hex codes (like #abc to #aabbcc)
  hexColor = hexColor.replace('#', '');

  // Handle 3-digit hex codes by duplicating each character
  if (hexColor.length === 3) {
    hexColor = hexColor
      .split('')
      .map((c) => c + c)
      .join('');
  }

  // Convert to RGB values
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate perceived brightness
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark colors, black for light colors
  return luminance < threshold ? '#ffffff' : '#000000';
}

/**
 * Converts ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string} Base64 encoded string
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer
 * @param {string} base64 - The Base64 string to convert
 * @returns {ArrayBuffer} Decoded ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Extracts essential data from a Three.js scene for serialization
 * @param {THREE.Scene} scene - The Three.js scene to extract data from
 * @returns {Object} - A simplified object containing scene data
 */
export function extractSceneData(scene) {
  const data = {
    metadata: {
      version: 4.6,
      type: 'ThreeJS Scene',
      generator: 'SceneExporter',
    },
    objects: [],
  };

  // Traverse all scene objects
  scene.traverse(function (object) {
    // Skip helper objects and internal Three.js items
    if (object.isMesh || object.isCamera || object.isLight) {
      const objData = {
        type: object.type,
        uuid: object.uuid,
        name: object.name || '',
        position: object.position.toArray(), // [x, y, z]
        rotation: object.rotation.toArray(), // [x, y, z, order]
        scale: object.scale.toArray(), // [x, y, z]
        userData: object.userData,
      };

      // Handle mesh-specific data
      if (object.isMesh) {
        objData.geometry = extractGeometryData(object.geometry);
        objData.material = extractMaterialData(object.material);
      }

      // Handle camera-specific data
      if (object.isCamera) {
        objData.fov = object.fov;
        objData.aspect = object.aspect;
        objData.near = object.near;
        objData.far = object.far;
      }

      data.objects.push(objData);
    }
  });

  return data;
}

/**
 * Extracts geometry data in a compact format
 * @param {THREE.BufferGeometry} geometry
 * @returns {Object} - Simplified geometry representation
 */
function extractGeometryData(geometry) {
  if (geometry.parameters) {
    return {
      type: 'parametric',
      parameters: {
        type: geometry.type
          .replace('BufferGeometry', '')
          .replace('Geometry', ''),
        ...geometry.parameters,
      },
    };
  }

  return {
    type: 'buffer',
    uuid: geometry.uuid,
    attributes: {
      position: Array.from(geometry.attributes.position.array),
      normal: geometry.attributes.normal
        ? Array.from(geometry.attributes.normal.array)
        : undefined,
      uv: geometry.attributes.uv
        ? Array.from(geometry.attributes.uv.array)
        : undefined,
    },
  };
}

/**
 * Extracts material data
 * @param {THREE.Material} material
 * @returns {Object} - Simplified material representation
 */
function extractMaterialData(material) {
  return {
    type: material.type,
    color: material.color?.getHex(),
    opacity: material.opacity,
    transparent: material.transparent,
    // Add other relevant material properties
  };
}

/**
 * Compresses data using native browser Compression Streams API
 * @param {Object} data - The data to compress
 * @param {string} [format='gzip'] - Compression format ('gzip' or 'deflate')
 * @returns {Promise<ArrayBuffer>} - Compressed data as ArrayBuffer
 */
export async function compressData(data, format = 'gzip') {
  // 1. Convert data to JSON string
  const jsonString = JSON.stringify(data);

  // 2. Create a stream from the string
  const stream = new Blob([jsonString]).stream();

  // 3. Pipe through compression stream
  const compressedStream = stream.pipeThrough(new CompressionStream(format));

  // 4. Collect compressed chunks
  const chunks = [];
  const reader = compressedStream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // 5. Combine chunks into single ArrayBuffer
  const blob = new Blob(chunks);
  return await blob.arrayBuffer();
}

/**
 * Decompresses data using native browser Compression Streams API
 * @param {ArrayBuffer} buffer - Compressed data
 * @param {string} [format='gzip'] - Compression format ('gzip' or 'deflate')
 * @returns {Promise<Object>} - Original uncompressed data
 */
export async function decompressData(buffer, format = 'gzip') {
  // 1. Create stream from compressed data
  const stream = new Blob([buffer]).stream();

  // 2. Pipe through decompression stream
  const decompressedStream = stream.pipeThrough(
    new DecompressionStream(format),
  );

  // 3. Collect decompressed chunks
  const chunks = [];
  const reader = decompressedStream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // 4. Combine chunks and parse JSON
  const blob = new Blob(chunks);
  const jsonString = await blob.text();
  return JSON.parse(jsonString);
}

/**
 * Reconstroi uma cena do Three.js a partir dos dados salvos
 * @param {THREE.Scene} scene - A cena vazia onde os objetos serão reconstruídos
 * @param {Object} sceneData - Dados da cena extraídos (do loadSceneFromStorage)
 */
export async function rebuildScene(scene, sceneData) {
  // Limpa a cena existente
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  // Reconstroi cada objeto
  sceneData.objects.forEach((objData) => {
    let object;

    // Cria o objeto baseado no tipo
    switch (objData.type) {
      case 'Mesh':
        object = rebuildMesh(objData);
        break;
      case 'PerspectiveCamera':
        object = rebuildCamera(objData);
        break;
      case 'DirectionalLight':
      case 'PointLight':
      case 'SpotLight':
        object = rebuildLight(objData);
        break;
      default:
        console.warn(`Tipo de objeto não suportado: ${objData.type}`);
        return;
    }

    // Restaura propriedades comuns
    if (object) {
      object.position.set(...objData.position);
      object.rotation.set(...objData.rotation);
      object.scale.set(...objData.scale);
      object.name = objData.name;
      object.userData = objData.userData || {};

      scene.add(object);
    }
  });
}

// Cache para reutilizar geometrias idênticas
const geometryCache = new Map();

function rebuildMesh(objData) {
  const cacheKey =
    objData.geometry.type === 'parametric'
      ? `parametric:${objData.geometry.parameters.type}:${JSON.stringify(objData.geometry.parameters)}`
      : `custom:${objData.geometry.uuid}`;

  // Tenta usar geometria do cache
  if (geometryCache.has(cacheKey)) {
    const cached = geometryCache.get(cacheKey);
    return new THREE.Mesh(cached.geometry, cached.material.clone());
  }

  try {
    let geometry;
    const geometryConstructors = {
      Box: () =>
        new THREE.BoxGeometry(
          objData.geometry.parameters.width,
          objData.geometry.parameters.height,
          objData.geometry.parameters.depth,
        ),
      Sphere: () =>
        new THREE.SphereGeometry(
          objData.geometry.parameters.radius,
          objData.geometry.parameters.widthSegments,
          objData.geometry.parameters.heightSegments,
        ),
      // Adicione outros construtores aqui
    };

    if (objData.geometry.type === 'parametric') {
      const constructor =
        geometryConstructors[objData.geometry.parameters.type];
      if (!constructor) {
        throw new Error(
          `Constructor não encontrado para: ${objData.geometry.parameters.type}`,
        );
      }
      geometry = constructor();
    } else {
      geometry = new THREE.BufferGeometry();
      // Configura atributos da geometria...
    }

    const material = createMaterial(objData.material);
    const mesh = new THREE.Mesh(geometry, material);

    // Armazena no cache (armazena a geometria e material base)
    geometryCache.set(cacheKey, {
      geometry: geometry,
      material: material,
    });

    return mesh;
  } catch (error) {
    console.error(`Falha ao reconstruir mesh ${objData.uuid}:`, error);
    return createErrorMesh(objData);
  }
}

function createMaterial(materialData) {
  const materialClasses = {
    MeshBasicMaterial: THREE.MeshBasicMaterial,
    MeshStandardMaterial: THREE.MeshStandardMaterial,
    // Adicione outros materiais suportados
  };

  const MaterialClass =
    materialClasses[materialData.type] || THREE.MeshBasicMaterial;
  return new MaterialClass({
    color: new THREE.Color(materialData.color),
    opacity: materialData.opacity,
    transparent: materialData.transparent,
  });
}

function createErrorMesh(objData) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `ERROR_${objData.name || objData.uuid}`;
  return mesh;
}

function rebuildCamera(objData) {
  const camera = new THREE.PerspectiveCamera(
    objData.fov,
    objData.aspect,
    objData.near,
    objData.far,
  );
  camera.uuid = objData.uuid;
  return camera;
}

function rebuildLight(objData) {
  let light;
  switch (objData.type) {
    case 'DirectionalLight':
      light = new THREE.DirectionalLight(objData.color, objData.intensity);
      break;
    case 'PointLight':
      light = new THREE.PointLight(
        objData.color,
        objData.intensity,
        objData.distance,
        objData.decay,
      );
      break;
    case 'SpotLight':
      light = new THREE.SpotLight(
        objData.color,
        objData.intensity,
        objData.distance,
        objData.angle,
        objData.penumbra,
        objData.decay,
      );
      break;
  }
  if (light) light.uuid = objData.uuid;
  return light;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Converte HSL para RGB
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Converte RGB para hex
function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

// Função principal para ajustar o tom
export function adjustColorTone(hex, saturationReduction) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Reduz a saturação
  hsl.s = Math.max(0, hsl.s - saturationReduction);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

export function hexToHsl(hex) {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  const l = (max + min) / 2;

  let h, s;

  if (delta === 0) {
    h = s = 0;
  } else {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function formatDate(isoString) {
  const date = new Date(isoString);

  // Ajusta para horário de Brasília (UTC-3)
  const brasilOffset = -3 * 60; // -3 horas em minutos
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const brasilTime = new Date(utc + brasilOffset * 60000);

  const dia = String(brasilTime.getDate()).padStart(2, '0');
  const mes = String(brasilTime.getMonth() + 1).padStart(2, '0'); // mês começa do 0
  const ano = String(brasilTime.getFullYear()).slice(-2);
  const hora = String(brasilTime.getHours()).padStart(2, '0');
  const minuto = String(brasilTime.getMinutes()).padStart(2, '0');

  return {
    date: `${dia}/${mes}/${ano}`,
    time: `${hora}:${minuto}`,
  };
}

export function cleanupScene(scene) {
  scene.traverse((object) => {
    if (object.geometry) {
      object.geometry.dispose();
    }

    if (object.material) {
      // Material pode ser um array
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => disposeMaterial(material));
      } else {
        disposeMaterial(object.material);
      }
    }
  });

  // Remover todos os objetos
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }
}

function disposeMaterial(material) {
  // Descartar texturas
  Object.keys(material).forEach((prop) => {
    if (material[prop] && typeof material[prop].dispose === 'function') {
      material[prop].dispose();
    }
  });

  material.dispose();
}

// export function hexToHsl(hex) {
//   if (!hex) return [0, 0, 0];
//   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//   if (!result) return [0, 0, 0];
//
//   let r = parseInt(result[1], 16) / 255;
//   let g = parseInt(result[2], 16) / 255;
//   let b = parseInt(result[3], 16) / 255;
//
//   const max = Math.max(r, g, b),
//     min = Math.min(r, g, b);
//   let h,
//     s,
//     l = (max + min) / 2;
//
//   if (max === min) {
//     h = s = 0;
//   } else {
//     const d = max - min;
//     s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
//     switch (max) {
//       case r:
//         h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
//         break;
//       case g:
//         h = ((b - r) / d + 2) / 6;
//         break;
//       case b:
//         h = ((r - g) / d + 4) / 6;
//         break;
//     }
//   }
//
//   return [h * 360, s * 100, l * 100];
// }
// Source images use red (HSL 0°, 100%, 50%) as default color.
// This function maps a target hex color to a CSS filter string that approximates it
// by adjusting hue rotation, saturation, and brightness relative to the red source.
export function colorToFilter(color: string): string {
  if (!color) return 'hue-rotate(0deg) saturate(1) brightness(1)';
  const [h, s, l] = hexToHsl(color);
  const saturate = +(s / 100).toFixed(2);
  const brightness = +(l / 50).toFixed(2);
  return `hue-rotate(${h}deg) saturate(${saturate}) brightness(${brightness})`;
}

export function generateArcadeColor(hue) {
  const h = hue !== undefined ? hue : Math.floor(Math.random() * 360);
  const s = 88;
  return {
    light: `hsl(${h}, ${s}%, 70%)`,
    main:  `hsl(${h}, ${s}%, 55%)`,
    dark:  `hsl(${h}, ${s}%, 35%)`,
    deep:  `hsl(${h}, ${s}%, 20%)`,
  };
}
