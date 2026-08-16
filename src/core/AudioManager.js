export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this.sfxOn = true;
    this._music = null;
    this._unlocked = false;
  }

  async unlock() {
    if (this._unlocked) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this._unlocked = true;
  }

  setMusic(on) {
    this.musicOn = on;
    if (!on) this.stopMusic();
    else if (this._unlocked) this.startMusic();
  }

  setSfx(on) {
    this.sfxOn = on;
  }

  play(name) {
    if (!this.sfxOn || !this.ctx) return;
    const map = {
      button: () => this._beep(880, 0.06, "square", 0.04),
      jump: () => this._sweep(240, 620, 0.16),
      coin: () => this._beep(1320, 0.09, "triangle", 0.08),
      treasure: () => this._arpeggio([523, 659, 784, 1046], 0.09),
      correct: () => this._arpeggio([523, 659, 784], 0.12),
      wrong: () => this._beep(180, 0.22, "sawtooth", 0.07),
      portal: () => this._sweep(200, 880, 0.4),
      complete: () => this._arpeggio([392, 523, 659, 784, 1046], 0.1),
      warning: () => this._beep(920, 0.12, "square", 0.06),
      interact: () => this._beep(640, 0.08, "triangle", 0.05),
      walk: () => this._beep(140, 0.03, "sine", 0.02),
      stomp: () => this._arpeggio([392, 523, 659], 0.07),
      hit: () => this._beep(220, 0.12, "square", 0.05),
      knock: () => this._beep(140, 0.18, "sawtooth", 0.05)
    };
    (map[name] || map.button)();
  }

  startMusic() {
    if (!this.ctx || !this.musicOn || this._music) return;
    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.value = 0.045;
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 110;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(master);
    osc.start();
    lfo.start();

    const arp = ctx.createOscillator();
    arp.type = "triangle";
    const arpGain = ctx.createGain();
    arpGain.gain.value = 0.35;
    arp.connect(arpGain);
    arpGain.connect(master);
    arp.start();

    const notes = [220, 277, 330, 392, 330, 277];
    let i = 0;
    const timer = setInterval(() => {
      if (!this._music) return;
      arp.frequency.setValueAtTime(notes[i % notes.length], ctx.currentTime);
      i += 1;
    }, 480);

    this._music = { osc, lfo, arp, master, timer };
  }

  stopMusic() {
    if (!this._music) return;
    clearInterval(this._music.timer);
    try {
      this._music.osc.stop();
      this._music.lfo.stop();
      this._music.arp.stop();
    } catch {
      /* already stopped */
    }
    this._music = null;
  }

  _beep(freq, dur, type, vol) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  _sweep(from, to, dur) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
    gain.gain.value = 0.06;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  _arpeggio(notes, step) {
    notes.forEach((n, i) => {
      setTimeout(() => this._beep(n, step + 0.04, "triangle", 0.06), i * step * 1000);
    });
  }
}
