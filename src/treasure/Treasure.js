import * as THREE from "three";

export class Treasure {
  constructor({ id, questionId, position, object, isBoss = false }) {
    this.id = id;
    this.questionId = questionId;
    this.position = position;
    this.object = object;
    this.isBoss = isBoss;
    this.unlocked = false;
    this.near = false;
    this.time = 0;

    const color = isBoss ? 0xff6b3d : 0xffe066;
    this.light = new THREE.PointLight(color, 3.4, 18);
    this.light.position.set(0, 2.2, 0);
    object.add(this.light);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.55, 14, 10),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, depthWrite: false })
    );
    beam.position.y = 7.2;
    beam.name = "beam";
    object.add(beam);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.08, 8, 20),
      new THREE.MeshBasicMaterial({ color })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.15;
    halo.name = "halo";
    object.add(halo);
  }

  update(delta, playerPos) {
    this.time += delta;
    this.object.position.y = this.position.y + Math.sin(this.time * 2.2) * 0.06;
    const gem = this.object.getObjectByName("gem");
    if (gem) gem.rotation.y += delta * 2;
    const beam = this.object.getObjectByName("beam");
    if (beam) {
      beam.visible = !this.unlocked;
      beam.material.opacity = 0.22 + Math.sin(this.time * 3) * 0.1;
    }
    this.near = !this.unlocked && !!playerPos && playerPos.distanceTo(this.position) < 3.8;
    this.light.intensity = this.unlocked ? 0.3 : this.near ? 5 : 3.2;
    if (this.unlocked) {
      const lid = this.object.getObjectByName("lid");
      if (lid) lid.rotation.x = THREE.MathUtils.lerp(lid.rotation.x, -1.1, 1 - Math.exp(-4 * delta));
    }
  }
}
