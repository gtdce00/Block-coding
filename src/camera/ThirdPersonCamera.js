import * as THREE from "three";

export class ThirdPersonCamera {
  constructor(camera, target, collision) {
    this.camera = camera;
    this.target = target;
    this.collision = collision;
    this.yaw = 0;
    this.pitch = 0.36;
    this.distance = 8;
    this.minDistance = 4.5;
    this.maxDistance = 13;
    this.height = 1.45;
    this.mouseLookTimer = 0;
    this.current = new THREE.Vector3(0, 5, 10);
    this.look = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
  }

  attach(target) {
    this.target = target;
  }

  update(delta, mouse, playerYaw = 0, moving = false) {
    if (mouse.looking) {
      this.yaw -= mouse.dx * 0.0032;
      this.pitch = THREE.MathUtils.clamp(this.pitch + mouse.dy * 0.0024, 0.16, 0.92);
      this.mouseLookTimer = 1.35;
    } else {
      this.mouseLookTimer = Math.max(0, this.mouseLookTimer - delta);
    }
    this.distance = THREE.MathUtils.clamp(this.distance + mouse.wheel * 0.008, this.minDistance, this.maxDistance);

    if (moving && this.mouseLookTimer <= 0) {
      let diff = playerYaw + Math.PI - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, 1.5 * delta);
    }

    const origin = this.look;
    origin.set(this.target.position.x, this.target.position.y + this.height, this.target.position.z);

    const cp = Math.cos(this.pitch);
    const desired = new THREE.Vector3(
      origin.x + Math.sin(this.yaw) * cp * this.distance,
      origin.y + Math.sin(this.pitch) * this.distance,
      origin.z + Math.cos(this.yaw) * cp * this.distance
    );

    this.current.lerp(desired, 1 - Math.exp(-14 * delta));
    this.camera.position.copy(this.current);
    this.camera.lookAt(origin);
  }

  flatForward() {
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    return this._forward;
  }

  flatRight() {
    this._right.set(-Math.cos(this.yaw), 0, Math.sin(this.yaw));
    return this._right;
  }
}
