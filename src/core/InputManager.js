export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, wheel: 0, looking: false, locked: false };
    this.enabled = true;
    this.interactPressed = false;
    this.pausePressed = false;

    this._onKeyDown = (e) => {
      if (!this.enabled && e.code !== "Escape") return;
      this.keys.add(e.code);
      if (e.code === "KeyE") this.interactPressed = true;
      if (e.code === "Escape") this.pausePressed = true;
      if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
    };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onMouseDown = (e) => {
      if (!this.enabled) return;
      if (e.button === 0 || e.button === 2) {
        this.mouse.looking = true;
        this.lockLook();
      }
    };
    this._onMouseUp = () => {
      if (!this.mouse.locked) this.mouse.looking = false;
    };
    this._onMouseMove = (e) => {
      if (!this.mouse.looking && !this.mouse.locked) return;
      this.mouse.dx += e.movementX;
      this.mouse.dy += e.movementY;
    };
    this._onWheel = (e) => {
      this.mouse.wheel += e.deltaY;
    };
    this._onContext = (e) => e.preventDefault();
    this._onLockChange = () => {
      this.mouse.locked = document.pointerLockElement === this.canvas;
      this.mouse.looking = this.mouse.locked;
      this.canvas.style.cursor = this.mouse.locked ? "none" : "grab";
    };

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    canvas.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mouseup", this._onMouseUp);
    window.addEventListener("mousemove", this._onMouseMove);
    canvas.addEventListener("wheel", this._onWheel, { passive: true });
    canvas.addEventListener("contextmenu", this._onContext);
    document.addEventListener("pointerlockchange", this._onLockChange);
    canvas.style.cursor = "grab";
  }

  lockLook() {
    if (!this.enabled) return;
    this.canvas.focus?.();
    if (document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock?.();
    }
  }

  unlockLook() {
    this.mouse.looking = false;
    this.mouse.locked = false;
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) this.unlockLook();
  }

  consumeMouse() {
    const { dx, dy, wheel, looking } = this.mouse;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.mouse.wheel = 0;
    return { dx, dy, wheel, looking };
  }

  consumeInteract() {
    const v = this.interactPressed;
    this.interactPressed = false;
    return v;
  }

  consumePause() {
    const v = this.pausePressed;
    this.pausePressed = false;
    return v;
  }

  get move() {
    const x = (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0);
    const z = (this.keys.has("KeyS") ? 1 : 0) - (this.keys.has("KeyW") ? 1 : 0);
    return { x, z, jump: this.keys.has("Space"), run: this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") };
  }
}
