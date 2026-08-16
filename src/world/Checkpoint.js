export class Checkpoint {
  constructor(object, position) {
    this.object = object;
    this.position = position;
    this.active = false;
  }

  activate() {
    this.active = true;
  }
}
