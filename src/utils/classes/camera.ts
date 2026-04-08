import * as THREE from 'three';

export class Camera extends THREE.PerspectiveCamera {
  rotationH: number;
  rotationV: number;
  speed: number;
  rotationSpeed: number;
  scrollSpeed: number;
  orbitalSpeed: number;

  _sinH: number;
  _cosH: number;
  _sinHPlusPI2: number;
  _cosHPlusPI2: number;
  _isDirty: boolean;
  _direction: THREE.Vector3;
  _rotation: THREE.Euler;
  _tempVector: THREE.Vector3;
  _scrollBuffer: Array<{ dx: number; dy: number; t: number }>;
  _scrollBufferWindow: number;

  stats: { cacheHits: number; cacheMisses: number; movements: number };

  constructor(fov, aspect, near, far) {
    super(fov, aspect, near, far);

    // Initial position
    this.position.set(47, -25, -180);

    // Rotation angles
    this.rotationH = 0; // horizontal (yaw)
    this.rotationV = 0; // vertical (pitch)

    // Cached trigonometric values
    this._sinH = 0;
    this._cosH = 1;
    this._sinHPlusPI2 = 1; // sin(rotationH + PI/2) for strafe
    this._cosHPlusPI2 = 0; // cos(rotationH + PI/2) for strafe
    this._isDirty = true; // Flag to recalculate cache

    // Movement speeds
    this.speed = 5;
    this.rotationSpeed = 0.003;
    this.scrollSpeed = 1.0;
    this.orbitalSpeed = 0.02;

    // Circular scroll detection
    this._scrollBuffer = [];
    this._scrollBufferWindow = 300; // ms

    // Object pooling for reduced GC pressure
    this._direction = new THREE.Vector3();
    this._rotation = new THREE.Euler();
    this._tempVector = new THREE.Vector3();

    // Performance tracking (optional)
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      movements: 0
    };

    // Initialize cache
    this._updateCache();
  }

  /**
   * Updates cached trigonometric values
   * Only called when rotation changes
   */
  _updateCache() {
    if (!this._isDirty) {
      this.stats.cacheHits++;
      return;
    }

    this.stats.cacheMisses++;

    // Cache sin/cos for forward/backward movement
    this._sinH = Math.sin(this.rotationH);
    this._cosH = Math.cos(this.rotationH);

    // Cache sin/cos for left/right movement (perpendicular)
    const perpendicular = this.rotationH + Math.PI / 2;
    this._sinHPlusPI2 = Math.sin(perpendicular);
    this._cosHPlusPI2 = Math.cos(perpendicular);

    this._isDirty = false;
  }

  /**
   * Updates camera rotation based on internal angles
   * Marks cache as dirty for next movement
   */
  updateRotation() {
    this._rotation.set(this.rotationV, this.rotationH, 0, 'YXZ');
    this.quaternion.setFromEuler(this._rotation);
    this._isDirty = true;
  }

  /**
   * Move forward in the direction the camera is facing
   * Uses cached sin/cos values
   */
  moveForward(factor = 1) {
    this._updateCache();
    this.stats.movements++;

    const distance = this.speed * factor;
    this.position.x += this._sinH * distance;
    this.position.z += this._cosH * distance;

    this.logPosition();
  }

  /**
   * Move backward opposite to camera direction
   * Uses cached sin/cos values
   */
  moveBackward(factor = 1) {
    this._updateCache();
    this.stats.movements++;

    const distance = this.speed * factor;
    this.position.x -= this._sinH * distance;
    this.position.z -= this._cosH * distance;

    this.logPosition();
  }

  /**
   * Strafe left perpendicular to camera direction
   * Uses pre-cached perpendicular sin/cos values
   */
  moveLeft(factor = 1) {
    this._updateCache();
    this.stats.movements++;

    const distance = this.speed * factor;
    this.position.x -= this._sinHPlusPI2 * distance;
    this.position.z -= this._cosHPlusPI2 * distance;

    this.logPosition();
  }

  /**
   * Strafe right perpendicular to camera direction
   * Uses pre-cached perpendicular sin/cos values
   */
  moveRight(factor = 1) {
    this._updateCache();
    this.stats.movements++;

    const distance = this.speed * factor;
    this.position.x += this._sinHPlusPI2 * distance;
    this.position.z += this._cosHPlusPI2 * distance;

    this.logPosition();
  }

  /**
   * Move up (decrease Y in Three.js coordinates)
   */
  moveUp(factor = 1) {
    this.stats.movements++;
    this.position.y -= this.speed * factor;
    this.logPosition();
  }

  /**
   * Move down (increase Y in Three.js coordinates)
   */
  moveDown(factor = 1) {
    this.stats.movements++;
    this.position.y += this.speed * factor;
    this.logPosition();
  }

  /**
   * Rotate camera with mouse movement
   * Clamps vertical rotation to prevent gimbal lock
   * Marks cache as dirty for next movement
   */
  rotate(deltaX, deltaY) {
    this.rotationH += deltaX * this.rotationSpeed;
    this.rotationV = THREE.MathUtils.clamp(
      this.rotationV + deltaY * this.rotationSpeed,
      -Math.PI / 2,
      Math.PI / 2
    );

    this.updateRotation();
  }

  /**
   * Batch movement optimization
   * Useful for complex movement patterns
   * Only updates cache once for all movements
   */
  batchMove(movements) {
    this._updateCache();

    for (const movement of movements) {
      const distance = this.speed * (movement.factor || 1);

      switch (movement.direction) {
        case 'forward':
          this.position.x += this._sinH * distance;
          this.position.z += this._cosH * distance;
          break;
        case 'backward':
          this.position.x -= this._sinH * distance;
          this.position.z -= this._cosH * distance;
          break;
        case 'left':
          this.position.x -= this._sinHPlusPI2 * distance;
          this.position.z -= this._cosHPlusPI2 * distance;
          break;
        case 'right':
          this.position.x += this._sinHPlusPI2 * distance;
          this.position.z += this._cosHPlusPI2 * distance;
          break;
        case 'up':
          this.position.y -= distance;
          break;
        case 'down':
          this.position.y += distance;
          break;
      }

      this.stats.movements++;
    }

    this.logPosition();
  }

  /**
   * Smooth movement with interpolation
   * Useful for cinematic camera movements
   */
  smoothMoveTo(targetPosition, alpha = 0.1) {
    this.position.lerp(targetPosition, alpha);
    this.logPosition();
  }

  /**
   * Look at target with smooth rotation
   */
  smoothLookAt(target, alpha = 0.1) {
    // Calculate target direction
    this._tempVector.copy(target).sub(this.position);
    const targetH = Math.atan2(this._tempVector.x, this._tempVector.z);
    const horizontalDist = Math.sqrt(
      this._tempVector.x * this._tempVector.x +
      this._tempVector.z * this._tempVector.z
    );
    const targetV = Math.atan2(-this._tempVector.y, horizontalDist);

    // Interpolate rotation
    this.rotationH = THREE.MathUtils.lerp(this.rotationH, targetH, alpha);
    this.rotationV = THREE.MathUtils.lerp(this.rotationV, targetV, alpha);

    this.updateRotation();
  }

  /**
   * Gets current camera direction (normalized)
   * Reuses pooled vector to avoid allocations
   */
  getDirection() {
    this.getWorldDirection(this._direction);
    return this._direction;
  }

  /**
   * Gets forward direction without vertical component
   * Useful for ground-based movement
   */
  getForwardFlat() {
    this._updateCache();
    return this._tempVector.set(this._sinH, 0, this._cosH).normalize();
  }

  /**
   * Gets right direction (perpendicular to forward)
   */
  getRightFlat() {
    this._updateCache();
    return this._tempVector.set(this._sinHPlusPI2, 0, this._cosHPlusPI2).normalize();
  }

  /**
   * Set rotation from direction vector
   * Useful for third-person cameras
   */
  setRotationFromDirection(direction) {
    this.rotationH = Math.atan2(direction.x, direction.z);
    const horizontalDist = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    this.rotationV = Math.atan2(-direction.y, horizontalDist);
    this.updateRotation();
  }

  /**
   * Main entry point for scroll/wheel input.
   * Detects circular gestures (orbital rotation) and falls back to
   * forward/back (deltaY) or strafe (deltaX) movement.
   */
  processScrollInput(deltaX: number, deltaY: number, deltaMode: number = 0): void {
    const scale = this._wheelScale(deltaMode);
    const dx = deltaX * scale;
    const dy = deltaY * scale;

    const orbitalDir = this._detectCircularMotion(dx, dy);

    if (orbitalDir !== 0) {
      this.rotationH += orbitalDir * this.orbitalSpeed;
      this.updateRotation();
      return;
    }

    this._updateCache();
    this.stats.movements++;

    const scrollFactor = this.scrollSpeed * 0.1;

    if (Math.abs(dy) >= Math.abs(dx)) {
      // Vertical scroll → forward / backward
      const d = dy * scrollFactor;
      this.position.x += this._sinH * d;
      this.position.z += this._cosH * d;
    } else {
      // Horizontal scroll → strafe
      const d = dx * scrollFactor;
      this.position.x += this._sinHPlusPI2 * d;
      this.position.z += this._cosHPlusPI2 * d;
    }

    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 1000;
    const length = Math.sqrt(
      this.position.x ** 2 + this.position.y ** 2 + this.position.z ** 2
    );
    if (length > 0) {
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, length));
      const factor = clamped / length;
      this.position.x *= factor;
      this.position.y *= factor;
      this.position.z *= factor;
    }
  }

  /**
   * Normalizes wheel delta based on DOM deltaMode.
   * 0 = pixel, 1 = line (~20px), 2 = page (~400px)
   */
  _wheelScale(deltaMode: number): number {
    if (deltaMode === 1) return 20;
    if (deltaMode === 2) return 400;
    return 1;
  }

  /**
   * Detects circular scroll gesture using a rolling time window.
   *
   * Maintains a buffer of recent (dx, dy) samples. Computes the cumulative
   * signed angle change of the delta vector direction. If the total rotation
   * within the window exceeds the threshold (default ~60°), the gesture is
   * considered circular.
   *
   * Returns:  1 = counterclockwise, -1 = clockwise, 0 = not circular
   */
  _detectCircularMotion(dx: number, dy: number): -1 | 0 | 1 {
    const now = performance.now();

    if (Math.hypot(dx, dy) > 0.5) {
      this._scrollBuffer.push({ dx, dy, t: now });
    }

    // Prune entries outside the time window
    const cutoff = now - this._scrollBufferWindow;
    while (this._scrollBuffer.length > 0 && this._scrollBuffer[0].t < cutoff) {
      this._scrollBuffer.shift();
    }

    if (this._scrollBuffer.length < 6) return 0;

    // Accumulate signed angle changes between consecutive delta vectors
    let totalAngleDelta = 0;
    let prevAngle = Math.atan2(this._scrollBuffer[0].dy, this._scrollBuffer[0].dx);

    for (let i = 1; i < this._scrollBuffer.length; i++) {
      const { dx: bdx, dy: bdy } = this._scrollBuffer[i];
      if (Math.hypot(bdx, bdy) < 0.5) continue;

      const angle = Math.atan2(bdy, bdx);
      let delta = angle - prevAngle;

      // Wrap to [-PI, PI]
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      totalAngleDelta += delta;
      prevAngle = angle;
    }

    // ~60° of consistent rotation required to trigger orbital mode
    if (Math.abs(totalAngleDelta) > Math.PI / 3) {
      return totalAngleDelta > 0 ? 1 : -1;
    }

    return 0;
  }

  /**
   * Helper method for logging position
   */
  logPosition() {
    console.log(
      `Position: x:${this.position.x.toFixed(2)}, ` +
      `y:${this.position.y.toFixed(2)}, ` +
      `z:${this.position.z.toFixed(2)}`
    );
  }

  /**
   * Log performance statistics
   */
  logStats() {
    const hitRate = this.stats.cacheMisses === 0
      ? 100
      : (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2);

    console.log('Camera Performance Stats:');
    console.log(`  Total movements: ${this.stats.movements}`);
    console.log(`  Cache hits: ${this.stats.cacheHits}`);
    console.log(`  Cache misses: ${this.stats.cacheMisses}`);
    console.log(`  Cache hit rate: ${hitRate}%`);
  }

  /**
   * Reset performance statistics
   */
  resetStats() {
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
    this.stats.movements = 0;
  }

  /**
   * Serialize camera state
   * Useful for save/load or network sync
   */
  serialize() {
    return {
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      rotation: {
        h: this.rotationH,
        v: this.rotationV
      },
      speed: this.speed,
      rotationSpeed: this.rotationSpeed
    };
  }

  /**
   * Deserialize camera state
   */
  deserialize(data) {
    this.position.set(data.position.x, data.position.y, data.position.z);
    this.rotationH = data.rotation.h;
    this.rotationV = data.rotation.v;
    this.speed = data.speed;
    this.rotationSpeed = data.rotationSpeed;
    this.updateRotation();
  }

  /**
   * Clone camera with all properties
   */
  clone() {
    const cloned = new Camera(this.fov, this.aspect, this.near, this.far);
    cloned.position.copy(this.position);
    cloned.rotationH = this.rotationH;
    cloned.rotationV = this.rotationV;
    cloned.speed = this.speed;
    cloned.rotationSpeed = this.rotationSpeed;
    cloned.updateRotation();
    return cloned;
  }

  /**
   * Dispose resources (for cleanup)
   */
  dispose() {
    // Clear references for garbage collection
    this._direction = null;
    this._rotation = null;
    this._tempVector = null;
  }
}

// Example usage with performance comparison
export function runPerformanceTest() {
  const camera = new Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  console.log('=== Performance Test: 10,000 movements ===');

  // Test 1: Individual movements (worst case for cache)
  camera.resetStats();
  console.time('Individual movements');
  for (let i = 0; i < 10000; i++) {
    camera.rotate(0.001, 0.001); // Invalidates cache each time
    camera.moveForward(0.01);
  }
  console.timeEnd('Individual movements');
  camera.logStats();

  console.log('\n');

  // Test 2: Batch movements (best case for cache)
  camera.resetStats();
  console.time('Batch movements');
  for (let i = 0; i < 100; i++) {
    camera.rotate(0.01, 0.01); // Invalidate cache once
    // Multiple movements reuse cache
    for (let j = 0; j < 100; j++) {
      camera.moveForward(0.01);
    }
  }
  camera.logStats();

  console.log('\n');

  // Test 3: Using batchMove
  camera.resetStats();
  console.time('batchMove API');
  for (let i = 0; i < 100; i++) {
    camera.rotate(0.01, 0.01);
    camera.batchMove([
      { direction: 'forward', factor: 0.01 },
      { direction: 'forward', factor: 0.01 },
      { direction: 'right', factor: 0.005 },
      { direction: 'forward', factor: 0.01 }
    ].concat(Array(96).fill({ direction: 'forward', factor: 0.01 })));
  }
  console.timeEnd('batchMove API');
  camera.logStats();
}

// Export for use in main.js
// import { Camera, runPerformanceTest } from './Camera.js';
// const camera = new Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// runPerformanceTest(); // Optional: test performance
