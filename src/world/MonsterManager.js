import { Monster } from "./Monster.js";

export class MonsterManager {
  constructor(parent, themeKey) {
    this.parent = parent;
    this.themeKey = themeKey;
    this.items = [];
    this.paused = false;
  }

  spawn(list = []) {
    this.items = list.map((spec) => new Monster(spec, this.parent, this.themeKey));
    return this;
  }

  update(delta, player) {
    if (this.paused) {
      this.items.forEach((m) => {
        if (!m.alive) return;
        m.bob += delta;
        m._bob();
      });
      return;
    }
    this.items.forEach((m) => m.update(delta, player));
  }

  collidePlayer(player) {
    const falling = !player.grounded && player.velocity.y < 0;
    for (const m of this.items) {
      if (!m.alive) continue;
      const dist = m.horizDist(player.position);
      const reach = m.radius + player.radius;
      if (dist > reach) continue;

      const stompRange = falling && player.position.y > 0.48;
      if (stompRange) {
        const result = m.stomp();
        if (result) return { type: result, monster: m };
      }

      if (player.iFrame > 0 || m.stunT > 0) continue;
      const dir = player.position.clone().sub(m.position);
      dir.y = 0;
      if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1);
      dir.normalize();
      return { type: "knock", monster: m, dir, force: m.isBoss ? 11 : 7.5 };
    }
    return null;
  }

  boss() {
    return this.items.find((m) => m.isBoss) || null;
  }

  bossStatus() {
    const b = this.boss();
    if (!b) return null;
    return {
      name: "ผู้พิทักษ์ป่าโบราณ",
      hp: Math.max(0, b.hitsLeft),
      max: b.hitsMax,
      stunned: b.stunT > 0 && b.alive,
      alive: b.alive
    };
  }

  aliveCount() {
    return this.items.filter((m) => m.alive && !m.isBoss).length;
  }

  total() {
    return this.items.filter((m) => !m.isBoss).length;
  }
}
