import * as THREE from "three";
import { Treasure } from "./Treasure.js";

export class TreasureManager {
  constructor(scene, assets, parent) {
    this.scene = scene;
    this.assets = assets;
    this.parent = parent;
    this.items = [];
  }

  spawn(list) {
    this.items = list.map((spec) => {
      const { object } = this.assets.clone("treasure");
      const [x, y, z] = spec.position;
      object.position.set(x, y, z);
      this.parent.add(object);
      return new Treasure({
        id: spec.id,
        questionId: spec.questionId,
        position: new THREE.Vector3(x, y, z),
        object,
        isBoss: !!spec.isBoss
      });
    });
  }

  update(delta, playerPos) {
    this.items.forEach((t) => t.update(delta, playerPos));
  }

  nearest(playerPos) {
    return this.items.find((t) => t.near) || null;
  }

  unlockedCount() {
    return this.items.filter((t) => t.unlocked).length;
  }

  total() {
    return this.items.length;
  }
}
