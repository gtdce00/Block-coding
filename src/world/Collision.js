import * as THREE from "three";

export class Collision {
  constructor() {
    this.boxes = [];
    this.ray = new THREE.Raycaster();
    this.meshes = [];
  }

  clear() {
    this.boxes = [];
    this.meshes = [];
  }

  addBox(min, max) {
    this.boxes.push({
      min: new THREE.Vector3(min.x, min.y ?? 0, min.z),
      max: new THREE.Vector3(max.x, max.y ?? 3, max.z)
    });
  }

  addMesh(mesh) {
    this.meshes.push(mesh);
  }

  collides(pos, radius, height) {
    const minY = pos.y;
    const maxY = pos.y + height;
    for (const b of this.boxes) {
      if (maxY < b.min.y || minY > b.max.y) continue;
      const nx = Math.max(b.min.x, Math.min(pos.x, b.max.x));
      const nz = Math.max(b.min.z, Math.min(pos.z, b.max.z));
      const dx = pos.x - nx;
      const dz = pos.z - nz;
      if (dx * dx + dz * dz < radius * radius) return true;
    }
    return false;
  }

  rayHit(from, to) {
    const dir = to.clone().sub(from);
    const dist = dir.length();
    if (dist < 0.01) return null;
    dir.multiplyScalar(1 / dist);
    this.ray.set(from, dir);
    this.ray.far = dist;
    const hits = this.ray.intersectObjects(this.meshes, true);
    if (hits.length) return hits[0].point;
    return null;
  }
}
