import type * as THREE from 'three';

export function getParticleId(obj: THREE.Object3D): string | undefined {
  return obj.userData?.particleId ?? obj.parent?.userData?.particleId;
}
