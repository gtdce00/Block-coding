import * as THREE from "three";
import { PlayerAnimation } from "./PlayerAnimation.js";

export class Player {
  constructor(assetManager) {
    this.group = new THREE.Group();
    this.group.name = "player";
    const { object, animations } = assetManager.clone("player");
    this.model = object;
    this.group.add(this.model);
    this.animation = new PlayerAnimation(this.model, animations);
    this.position = this.group.position;
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.grounded = true;
    this.radius = 0.42;
    this.height = 1.7;
    this.state = "idle";
    this.knock = new THREE.Vector3();
    this.iFrame = 0;
  }

  applyKnock(dir, force) {
    this.knock.copy(dir).setY(0);
    if (this.knock.lengthSq() < 0.0001) this.knock.set(0, 0, 1);
    this.knock.normalize().multiplyScalar(force);
    this.velocity.y = 4.4;
    this.grounded = false;
    this.iFrame = 0.9;
  }

  spawn(x, y, z, yaw = Math.PI) {
    this.group.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.group.rotation.y = yaw;
    this.grounded = true;
    this.knock.set(0, 0, 0);
    this.iFrame = 0;
  }

  setState(state) {
    this.state = state;
    this.animation.setState(state);
  }

  update(delta) {
    if (this.iFrame > 0) this.iFrame -= delta;
    this.knock.multiplyScalar(Math.exp(-6.5 * delta));
    this.group.rotation.y = this.yaw;
    this.animation.update(delta, this.state);
  }
}
