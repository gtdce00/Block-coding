import * as THREE from "three";

export class PlayerAnimation {
  constructor(model, clips = []) {
    this.model = model;
    this.clips = clips;
    this.t = 0;
    this.state = "idle";
    this.mixer = clips.length ? new THREE.AnimationMixer(model) : null;
    this.actions = {};
    this.current = null;
    if (this.mixer) {
      clips.forEach((clip) => {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      });
      this.fadeTo(this.findName(["Idle"]));
    }
    this.body = model.getObjectByName("body") || model;
    this.head = model.getObjectByName("head");
    this.leftArm = model.getObjectByName("leftArm");
    this.rightArm = model.getObjectByName("rightArm");
    this.leftLeg = model.getObjectByName("leftLeg");
    this.rightLeg = model.getObjectByName("rightLeg");
    this.visor = model.getObjectByName("visor");
    this.tip = model.getObjectByName("antennaTip");
  }

  findName(candidates) {
    const keys = Object.keys(this.actions);
    for (const want of candidates) {
      const hit = keys.find((k) => k.toLowerCase() === want.toLowerCase() || k.toLowerCase().includes(want.toLowerCase()));
      if (hit) return hit;
    }
    return keys[0] || null;
  }

  setState(state) {
    this.state = state;
    if (!this.mixer) return;
    const map = {
      idle: ["Idle"],
      walk: ["Walking", "Walk"],
      run: ["Running", "Run"],
      jump: ["Jump"],
      fall: ["Jump", "Fall"],
      success: ["ThumbsUp", "Yes", "Dance", "Wave"],
      error: ["No"],
      interact: ["Wave", "Punch"]
    };
    this.fadeTo(this.findName(map[state] || ["Idle"]));
  }

  fadeTo(name) {
    if (!name || !this.actions[name]) return;
    const next = this.actions[name];
    if (this.current === next) return;
    next.reset().setEffectiveWeight(1).fadeIn(0.18).play();
    const once = /jump|thumbsup|yes|no|wave|punch|death/i.test(name);
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    if (once) next.clampWhenFinished = true;
    this.current?.fadeOut(0.18);
    this.current = next;
  }

  update(delta, state = this.state) {
    if (state !== this.state) this.setState(state);
    this.t += delta;
    if (this.mixer) {
      this.mixer.update(delta);
      return;
    }
    const swing = Math.sin(this.t * (state === "run" ? 12 : 8));
    const idle = Math.sin(this.t * 2) * 0.03;
    if (this.body) this.body.position.y = 1.05 + (state === "idle" ? idle : Math.abs(swing) * 0.05);
    if (this.head) this.head.rotation.y = Math.sin(this.t * 1.4) * 0.08;
    const armAmt = state === "idle" ? 0.08 : state === "jump" || state === "fall" ? 0.5 : 0.7;
    if (this.leftArm) this.leftArm.rotation.x = swing * armAmt;
    if (this.rightArm) this.rightArm.rotation.x = -swing * armAmt;
    if (this.leftLeg) this.leftLeg.rotation.x = state === "idle" ? 0 : -swing * 0.55;
    if (this.rightLeg) this.rightLeg.rotation.x = state === "idle" ? 0 : swing * 0.55;
    if (this.tip) this.tip.position.y = 2.18 + Math.sin(this.t * 4) * 0.03;
  }
}
