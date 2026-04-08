// src/utils/three/ResourcePool.js

import * as THREE from 'three';

/**
 * Pool de recursos Three.js reutilizáveis
 * Singleton que gerencia geometrias e materiais
 */
class ResourcePool {
  constructor() {
    if (ResourcePool.instance) {
      return ResourcePool.instance;
    }

    this.geometries = new Map();
    this.materials = new Map();
    this.usageCount = new Map(); // Rastreia quantas vezes cada recurso é usado

    ResourcePool.instance = this;
  }

  // =================================================================
  // GEOMETRIAS
  // =================================================================

  /**
   * Retorna geometria de círculo (reutilizada)
   * @param {number} segments - Número de segmentos (padrão: 32)
   */
  getCircleGeometry(segments = 32) {
    const key = `circle_${segments}`;

    if (!this.geometries.has(key)) {
      const geometry = new THREE.CircleGeometry(1, segments);
      this.geometries.set(key, geometry);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.geometries.get(key);
  }

  /**
   * Retorna geometria de cubo (reutilizada)
   */
  getCubeGeometry() {
    const key = 'cube';

    if (!this.geometries.has(key)) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      this.geometries.set(key, geometry);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.geometries.get(key);
  }

  /**
   * Retorna geometria de esfera (reutilizada)
   * @param {number} widthSegments - Segmentos horizontais
   * @param {number} heightSegments - Segmentos verticais
   */
  getSphereGeometry(widthSegments = 32, heightSegments = 32) {
    const key = `sphere_${widthSegments}_${heightSegments}`;

    if (!this.geometries.has(key)) {
      const geometry = new THREE.SphereGeometry(
        1,
        widthSegments,
        heightSegments,
      );
      this.geometries.set(key, geometry);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.geometries.get(key);
  }

  /**
   * Retorna geometria de plano/quadrado (reutilizada)
   */
  getPlaneGeometry() {
    const key = 'plane';

    if (!this.geometries.has(key)) {
      const geometry = new THREE.PlaneGeometry(1, 1);
      this.geometries.set(key, geometry);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.geometries.get(key);
  }

  /**
   * Retorna geometria de cilindro (reutilizada)
   * @param {number} radialSegments - Segmentos radiais
   */
  getCylinderGeometry(radialSegments = 32) {
    const key = `cylinder_${radialSegments}`;

    if (!this.geometries.has(key)) {
      const geometry = new THREE.CylinderGeometry(1, 1, 1, radialSegments);
      this.geometries.set(key, geometry);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.geometries.get(key);
  }

  /**
   * Retorna geometria de triângulo (reutilizada)
   */
  getTriangleGeometry() {
    const key = 'triangle';

    if (!this.geometries.has(key)) {
      // Triângulo como BufferGeometry personalizada
      const geometry = new THREE.BufferGeometry();

      const vertices = new Float32Array([
        -1,
        -1,
        0, // inferior esquerdo
        1,
        -1,
        0, // inferior direito
        0,
        1,
        0, // superior
      ]);

      const indices = [0, 1, 2];

      geometry.setIndex(indices);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();

      this.geometries.set(key, geometry);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.geometries.get(key);
  }

  /**
   * Retorna geometria de pirâmide (reutilizada)
   */
  getPyramidGeometry() {
    const key = 'pyramid';

    if (!this.geometries.has(key)) {
      const geometry = new THREE.BufferGeometry();

      const vertices = new Float32Array([
        // Base - triângulo 1
        -1, 0, 1, 1, 0, 1, 1, 0, -1,
        // Base - triângulo 2
        -1, 0, 1, 1, 0, -1, -1, 0, -1,
        // Face frontal
        -1, 0, 1, 1, 0, 1, 0, 1, 0,
        // Face direita
        1, 0, 1, 1, 0, -1, 0, 1, 0,
        // Face traseira
        1, 0, -1, -1, 0, -1, 0, 1, 0,
        // Face esquerda
        -1, 0, -1, -1, 0, 1, 0, 1, 0,
      ]);

      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();

      this.geometries.set(key, geometry);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.geometries.get(key);
  }

  // =================================================================
  // MATERIAIS
  // =================================================================

  /**
   * Retorna material básico (reutilizado por cor)
   * @param {string|number} color - Cor hexadecimal
   * @param {number} opacity - Opacidade (0-1)
   */
  getBasicMaterial(color, opacity = 0.9) {
    // Normalizar cor para string hex
    const normalizedColor = new THREE.Color(color).getHexString();
    const key = `basic_${normalizedColor}_${opacity}`;

    if (!this.materials.has(key)) {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(`#${normalizedColor}`),
        transparent: opacity < 1,
        opacity: opacity,
        side: THREE.DoubleSide,
      });

      this.materials.set(key, material);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.materials.get(key);
  }

  /**
   * Retorna material de linha (reutilizado por cor)
   * @param {string|number} color - Cor hexadecimal
   * @param {number} opacity - Opacidade (0-1)
   */
  getLineMaterial(color, opacity = 0.7) {
    const normalizedColor = new THREE.Color(color).getHexString();
    const key = `line_${normalizedColor}_${opacity}`;

    if (!this.materials.has(key)) {
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(`#${normalizedColor}`),
        transparent: opacity < 1,
        opacity: opacity,
        linewidth: 2,
      });

      this.materials.set(key, material);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.materials.get(key);
  }

  // =================================================================
  // GERENCIAMENTO
  // =================================================================

  /**
   * Retorna estatísticas de uso do pool
   */
  getStats() {
    const geometryStats = Array.from(this.geometries.keys()).map((key) => ({
      key,
      type: 'geometry',
      uses: this.usageCount.get(key) || 0,
    }));

    const materialStats = Array.from(this.materials.keys()).map((key) => ({
      key,
      type: 'material',
      uses: this.usageCount.get(key) || 0,
    }));

    return {
      geometries: {
        total: this.geometries.size,
        items: geometryStats,
      },
      materials: {
        total: this.materials.size,
        items: materialStats,
      },
      totalResources: this.geometries.size + this.materials.size,
      estimatedMemorySaved: this.calculateMemorySaved(),
    };
  }

  getParticleMaterial(color, size = 1, opacity = 1) {
    const normalizedColor = new THREE.Color(color).getHexString();
    const key = `particle_${normalizedColor}_${size}_${opacity}`;

    if (!this.materials.has(key)) {
      const material = new THREE.PointsMaterial({
        size: size,
        vertexColors: true,
        transparent: true,
        sizeAttenuation: true,
        opacity: opacity,
      });

      // ✅ Shader customizado aplicado UMA VEZ (não a cada frame)
      material.onBeforeCompile = (shader) => {
        // Adicionar atributo de opacidade por vértice
        shader.vertexShader = shader.vertexShader.replace(
          'void main() {',
          `
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
        `,
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          'void main() {',
          `
        varying float vOpacity;
        void main() {
        `,
        );

        // Multiplicar opacidade por vértice no fragment shader
        shader.fragmentShader = shader.fragmentShader.replace(
          'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
          'gl_FragColor = vec4( outgoingLight, diffuseColor.a * vOpacity );',
        );
      };

      this.materials.set(key, material);
      this.usageCount.set(key, 0);
    }

    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.materials.get(key);
  }

  /**
   * Calcula memória economizada (estimativa)
   */
  calculateMemorySaved() {
    let saved = 0;

    // Geometrias: ~40KB cada reutilização
    this.geometries.forEach((_, key) => {
      const uses = this.usageCount.get(key) || 0;
      if (uses > 1) {
        saved += (uses - 1) * 40; // KB
      }
    });

    // Materiais: ~8KB cada reutilização
    this.materials.forEach((_, key) => {
      const uses = this.usageCount.get(key) || 0;
      if (uses > 1) {
        saved += (uses - 1) * 8; // KB
      }
    });

    return saved;
  }

  /**
   * Limpa recursos não utilizados (garbage collection manual)
   * CUIDADO: Só chamar se tiver certeza que não serão mais usados
   */
  cleanup() {
    let cleaned = 0;

    this.geometries.forEach((geometry) => {
      geometry.dispose();
      cleaned++;
    });
    this.materials.forEach((material) => {
      material.dispose();
      cleaned++;
    });

    this.geometries.clear();
    this.materials.clear();
    this.usageCount.clear();

    return cleaned;
  }

  // Release controlado de material de partícula — decrementa usageCount e dispõe se não usado
  releaseParticleMaterial(color, size = 1, opacity = 1) {
    const normalizedColor = new THREE.Color(color).getHexString();
    const key = `particle_${normalizedColor}_${size}_${opacity}`;
    const count = (this.usageCount.get(key) ?? 1) - 1;
    if (count <= 0) {
      this.materials.get(key)?.dispose();
      this.materials.delete(key);
      this.usageCount.delete(key);
    } else {
      this.usageCount.set(key, count);
    }
  }

  /**
   * Log de debug das estatísticas
   */
  logStats() {
    const stats = this.getStats();

    console.group('📊 ResourcePool Stats');
    console.log(`Geometrias: ${stats.geometries.total}`);
    console.table(stats.geometries.items);
    console.log(`Materiais: ${stats.materials.total}`);
    console.table(stats.materials.items);
    console.log(`💾 Memória economizada: ~${stats.estimatedMemorySaved} KB`);
    console.groupEnd();
  }
}

// Exportar singleton
const resourcePool = new ResourcePool();
export default resourcePool;
