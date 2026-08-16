import * as THREE from "three";

export class PlayerController {
  constructor(player, collision, input, camera) {
    this.player = player;
    this.collision = collision;
    this.input = input;
    this.camera = camera;
    this.walkSpeed = 6.2;
    this.runSpeed = 10.2;
    this.jumpSpeed = 8.4;
    this.gravity = -22;
  }

  update(delta) {
    const move = this.input.move;
    const moving = move.x !== 0 || move.z !== 0;
    const speed = move.run ? this.runSpeed : this.walkSpeed;

    const forward = this.camera.flatForward().clone();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const wish = new THREE.Vector3();
    if (moving) {
      wish.addScaledVector(forward, -move.z);
      wish.addScaledVector(right, move.x);
      wish.normalize().multiplyScalar(speed);
      this.player.yaw = Math.atan2(wish.x, wish.z);
    }

    this.player.velocity.x = wish.x + this.player.knock.x;
    this.player.velocity.z = wish.z + this.player.knock.z;

    let jumped = false;
    if (this.player.grounded && move.jump) {
      this.player.velocity.y = this.jumpSpeed;
      this.player.grounded = false;
      jumped = true;
    }

    this.player.velocity.y += this.gravity * delta;

    const next = this.player.position.clone();
    next.x += this.player.velocity.x * delta;
    if (this.collision.collides(next, this.player.radius, this.player.height)) next.x = this.player.position.x;
    next.z += this.player.velocity.z * delta;
    if (this.collision.collides(next, this.player.radius, this.player.height)) next.z = this.player.position.z;
    next.y += this.player.velocity.y * delta;

    if (next.y <= 0) {
      next.y = 0;
      this.player.velocity.y = 0;
      this.player.grounded = true;
    } else {
      this.player.grounded = false;
    }

    this.player.position.copy(next);

    if (!this.player.grounded) this.player.setState(this.player.velocity.y > 0 ? "jump" : "fall");
    else if (moving) this.player.setState(move.run ? "run" : "walk");
    else this.player.setState("idle");

    return jumped ? "jump" : null;
  }
}
