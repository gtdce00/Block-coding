export class Timer {
  constructor(seconds, onTick, onEnd) {
    this.total = seconds;
    this.left = seconds;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.running = false;
    this._warned = new Set();
    this._acc = 0;
  }

  start() {
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  setSeconds(s) {
    this.total = s;
    this.left = s;
    this._warned = new Set();
  }

  resetForWorld(seconds) {
    this.setSeconds(seconds);
    this.running = true;
  }

  update(delta) {
    if (!this.running) return;
    this.left = Math.max(0, this.left - delta);
    this.onTick?.(this.left, this.total);
    const sec = Math.ceil(this.left);
    [600, 300, 180, 60, 30, 10].forEach((mark) => {
      if (sec <= mark && !this._warned.has(mark)) {
        this._warned.add(mark);
        this.onWarning?.(mark);
      }
    });
    if (this.left <= 0) {
      this.running = false;
      this.onEnd?.();
    }
  }

  format(t = this.left) {
    const s = Math.max(0, Math.ceil(t));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
}
