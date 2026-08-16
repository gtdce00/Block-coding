import * as THREE from "three";
import { WorldBuilder, THEMES } from "./WorldBuilder.js";
import { Checkpoint } from "./Checkpoint.js";
import { Portal } from "./Portal.js";
import { TreasureManager } from "../treasure/TreasureManager.js";
import { MonsterManager } from "./MonsterManager.js";

export class World {
  constructor(scene, collision, assets, level) {
    this.scene = scene;
    this.collision = collision;
    this.assets = assets;
    this.level = level;
    this.builder = new WorldBuilder(scene, collision, assets);
    this.theme = THEMES[level.key] || THEMES.forest;
    this.treasureManager = null;
    this.checkpoint = null;
    this.portal = null;
    this.coins = [];
    this.secret = null;
    this.monsters = null;
    this.time = 0;
  }

  load() {
    const built = this.builder.build(this.level, this.level.key);
    this.theme = built.theme;

    this.treasureManager = new TreasureManager(this.scene, this.assets, this.builder.root);
    this.treasureManager.spawn(this.level.treasures);

    const cp = this.assets.clone("checkpoint").object;
    const [cx, , cz] = this.level.checkpoint;
    cp.position.set(cx, 0, cz);
    this.builder.root.add(cp);
    this.checkpoint = new Checkpoint(cp, new THREE.Vector3(cx, 0, cz));

    const po = this.assets.clone("portal").object;
    const [px, , pz] = this.level.portal;
    po.position.set(px, 0, pz);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.09, 8, 32),
      new THREE.MeshBasicMaterial({ color: this.theme.accent })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.5;
    halo.name = "ring";
    po.add(halo);
    const portalLight = new THREE.PointLight(this.theme.accent, 2.2, 16);
    portalLight.position.set(0, 2.2, 0);
    po.add(portalLight);
    this.builder.root.add(po);
    this.portal = new Portal(po, new THREE.Vector3(px, 0, pz));
    this.portal.setUnlocked(false);

    this.coins = this.level.coins.map(([x, y, z]) => {
      const obj = this.assets.clone("coin").object;
      obj.position.set(x, y, z);
      this.builder.root.add(obj);
      return { object: obj, collected: false, position: new THREE.Vector3(x, y, z) };
    });

    if (this.level.secret) {
      const obj = this.assets.clone("secretTreasure").object;
      const [sx, sy, sz] = this.level.secret.position;
      obj.position.set(sx, sy, sz);
      this.builder.root.add(obj);
      this.secret = { object: obj, collected: false, position: new THREE.Vector3(sx, sy, sz) };
    }

    this.monsters = new MonsterManager(this.builder.root, this.level.key).spawn(this.level.monsters || []);

    return this;
  }

  update(delta, playerPos) {
    this.time += delta;
    if (playerPos) this.treasureManager?.update(delta, playerPos);
    this.coins.forEach((c) => {
      if (c.collected) return;
      c.object.rotation.z += delta * 2.4;
      c.object.position.y = 0.55 + Math.sin(this.time * 3 + c.position.x) * 0.12;
    });
    if (this.portal) {
      const ring = this.portal.object.getObjectByName("ring");
      if (ring) ring.rotation.z += delta * (this.portal.unlocked ? 1.6 : 0.4);
    }
    if (this.checkpoint) {
      const orb = this.checkpoint.object.getObjectByName("orb");
      if (orb) orb.position.y = 2.25 + Math.sin(this.time * 3) * 0.1;
    }
    if (this.secret && !this.secret.collected) {
      this.secret.object.rotation.y += delta * 0.8;
    }
    if (playerPos) this.monsters?.update(delta, { position: playerPos });
    this.builder.npcs?.forEach((n) => n.mixer?.update(delta));
    this.builder.birds?.forEach((b) => {
      b.userData.t = (b.userData.t || 0) + delta * (b.userData.speed || 0.4);
      const a = b.userData.t;
      b.position.set(
        Math.cos(a) * b.userData.radius,
        b.userData.height + Math.sin(a * 2) * 0.35,
        Math.sin(a) * b.userData.radius - 8
      );
      b.rotation.y = -a + Math.PI / 2;
    });
    if (this.builder.leaves) {
      const pos = this.builder.leaves.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - delta * 1.1;
        let x = pos.getX(i) + Math.sin(this.time + i) * delta * 0.4;
        if (y < 0.2) y = 11;
        pos.setXYZ(i, x, y, pos.getZ(i));
      }
      pos.needsUpdate = true;
    }
  }

  dispose() {
    this.builder.dispose();
  }
}

export class WorldManager {
  constructor(scene, collision, assets, levels) {
    this.scene = scene;
    this.collision = collision;
    this.assets = assets;
    this.levels = levels;
    this.current = null;
    this.worldId = 1;
  }

  loadWorld(id) {
    this.current?.dispose();
    const level = this.levels.find((w) => w.id === id);
    if (!level) throw new Error(`ไม่พบโลกที่ ${id}`);
    this.worldId = id;
    this.current = new World(this.scene, this.collision, this.assets, level).load();
    return this.current;
  }

  get theme() {
    return this.current?.theme;
  }
}
