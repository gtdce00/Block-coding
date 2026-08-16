import * as THREE from "three";
import { PlaceholderFactory } from "../core/PlaceholderFactory.js";

const KIND = {
  slime: { speed: 2.15, radius: 0.7, height: 0.95, aggro: 7.5, hits: 1, scale: 1, color: 0x4adf6a },
  beetle: { speed: 2.55, radius: 0.75, height: 0.7, aggro: 8.5, hits: 1, scale: 1, color: 0x6a8a28 },
  wolf: { speed: 3.35, radius: 0.8, height: 0.95, aggro: 10, hits: 1, scale: 1.05, color: 0x5a4034 },
  guardian: { speed: 2.7, radius: 1.55, height: 4.4, aggro: 16, hits: 3, scale: 1.15, color: 0x3a5a28 }
};

const THEME_TINT = {
  forest: { slime: 0x4adf6a, beetle: 0x3a6a28, wolf: 0x4a3a32 },
  desert: { slime: 0xe8a030, beetle: 0x8a5a18, wolf: 0x6a4020 },
  valley: { slime: 0x4ad0c8, beetle: 0x2a6a58, wolf: 0x3a4a48 },
  volcano: { slime: 0xff6b3d, beetle: 0x6a2818, wolf: 0x4a2018 },
  castle: { slime: 0xc878ff, beetle: 0x4a3a6a, wolf: 0x3a2a48 },
  boss: { slime: 0xffd166, beetle: 0x3a5a28, wolf: 0x2a3a22 }
};

export class Monster {
  constructor(spec, parent, themeKey = "forest") {
    const kind = spec.kind || "slime";
    const meta = KIND[kind] || KIND.slime;
    const tint = THEME_TINT[themeKey]?.[kind] || meta.color;
    this.id = spec.id;
    this.kind = kind;
    this.isBoss = !!spec.isBoss || kind === "guardian";
    this.speed = spec.speed ?? meta.speed;
    this.radius = spec.radius ?? meta.radius;
    this.height = meta.height;
    this.aggro = spec.aggro ?? meta.aggro;
    this.hitsMax = spec.hits ?? meta.hits;
    this.hitsLeft = this.hitsMax;
    this.alive = true;
    this.state = "patrol";
    this.home = new THREE.Vector3(...spec.position);
    this.position = this.home.clone();
    this.waypoints = (spec.patrol || [[spec.position[0], spec.position[2]]]).map(
      ([x, z]) => new THREE.Vector3(x, 0, z)
    );
    this.wp = 0;
    this.stunT = 0;
    this.iFrame = 0;
    this.chargeT = this.isBoss ? 2.4 : 0;
    this.bob = Math.random() * Math.PI * 2;
    this.facing = 0;
    this.sink = 0;

    this.object = this._makeModel(kind, tint);
    const scale = spec.scale ?? meta.scale;
    this.object.scale.setScalar(scale);
    this.object.position.copy(this.home);
    parent.add(this.object);

    if (this.isBoss) {
      this.light = new THREE.PointLight(0xff6b3d, 2.8, 18);
      this.light.position.set(0, 3.2, 0);
      this.object.add(this.light);
    }
  }

  _makeModel(kind, tint) {
    if (kind === "guardian") return PlaceholderFactory.guardian();
    if (kind === "beetle") return PlaceholderFactory.beetle(tint);
    if (kind === "wolf") return PlaceholderFactory.wolf(tint);
    return PlaceholderFactory.slime(tint);
  }

  update(delta, player) {
    this.bob += delta;
    if (!this.alive) {
      this.sink += delta;
      this.object.position.y = -this.sink * 1.6;
      this.object.rotation.z = this.sink * 0.8;
      this.object.scale.multiplyScalar(Math.max(0.2, 1 - delta * 1.4));
      if (this.sink > 1.6) this.object.visible = false;
      return;
    }

    if (this.iFrame > 0) this.iFrame -= delta;
    if (this.isBoss && this.hitsLeft <= 0 && this.alive) {
      this.stunT = Math.max(this.stunT, 0.6);
    }
    if (this.stunT > 0) {
      this.stunT -= delta;
      this.state = "stunned";
      this.object.rotation.z = Math.sin(this.bob * 10) * 0.12;
      this._bob();
      return;
    }
    this.object.rotation.z = 0;

    const p = player.position;
    const dx = p.x - this.position.x;
    const dz = p.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    const leashed = this.position.distanceTo(this.home) > (this.isBoss ? 18 : 14);

    if (this.isBoss) this.chargeT -= delta;

    if (!leashed && dist < this.aggro && dist > 0.01) {
      this.state = this.isBoss && this.chargeT <= 0 ? "charge" : "chase";
      const sprint = this.state === "charge" ? this.speed * 1.85 : this.speed * 1.25;
      this._moveToward(dx / dist, dz / dist, sprint, delta);
      if (this.state === "charge" && dist < this.radius + 0.6) this.chargeT = 3.2;
    } else {
      this.state = "patrol";
      const target = this.waypoints[this.wp] || this.home;
      const tx = target.x - this.position.x;
      const tz = target.z - this.position.z;
      const td = Math.hypot(tx, tz);
      if (td < 0.45) this.wp = (this.wp + 1) % this.waypoints.length;
      else this._moveToward(tx / td, tz / td, this.speed, delta);
    }

    this.object.position.x = this.position.x;
    this.object.position.z = this.position.z;
    this.object.rotation.y = this.facing;
    this._bob();
  }

  _moveToward(nx, nz, speed, delta) {
    this.position.x += nx * speed * delta;
    this.position.z += nz * speed * delta;
    this.facing = Math.atan2(nx, nz);
  }

  _bob() {
    const bounce = this.kind === "slime" ? Math.abs(Math.sin(this.bob * 4.2)) * 0.16 : Math.sin(this.bob * 6) * 0.04;
    this.object.position.y = this.position.y + bounce;
    const tail = this.object.getObjectByName("tail");
    if (tail) tail.rotation.x = 0.5 + Math.sin(this.bob * 8) * 0.25;
    const core = this.object.getObjectByName("core");
    if (core) core.rotation.y += 0.04;
  }

  stomp() {
    if (!this.alive || this.iFrame > 0) return false;
    if (this.isBoss && this.hitsLeft <= 0) return false;
    this.hitsLeft -= 1;
    this.iFrame = 0.45;
    this.stunT = this.isBoss ? 1.6 : 0.4;
    if (this.hitsLeft <= 0) {
      if (this.isBoss) {
        this.stunT = 8;
        this.hitsLeft = 0;
        this.state = "stunned";
        return "stunBoss";
      }
      this.alive = false;
      this.state = "defeated";
      return "defeat";
    }
    return this.isBoss ? "hitBoss" : "hit";
  }

  defeat() {
    this.alive = false;
    this.hitsLeft = 0;
    this.state = "defeated";
  }

  horizDist(playerPos) {
    return Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);
  }
}
