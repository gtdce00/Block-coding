export class Portal {
  constructor(object, position) {
    this.object = object;
    this.position = position;
    this.unlocked = false;
  }

  setUnlocked(v) {
    this.unlocked = v;
    this.object.visible = true;
    this.object.traverse((c) => {
      if (c.material && c.material.opacity !== undefined && c.name === "inner") {
        c.material.opacity = v ? 0.55 : 0.15;
      }
    });
  }
}
