import * as THREE from "three";
import { PlaceholderFactory } from "../core/PlaceholderFactory.js";

export const THEMES = {
  forest: {
    ground: 0x3d7a38, grid: 0x2f6a32, fog: 0xa8c8b0, fogNear: 55, fogFar: 140,
    skyTop: "#4ea4ff", skyBottom: "#d7eefe", sky: 0x7ec4f0, ambient: 0xd8f0c8, dir: 0xfff3c8,
    accent: 0xffd166, road: 0x8a6234, canopy: 0x2f8a46
  },
  desert: {
    ground: 0x8a6a28, grid: 0x6e5420, fog: 0xe8c888, fogNear: 36, fogFar: 118,
    skyTop: "#f0c878", skyBottom: "#f4e2b0", sky: 0xe8c070, ambient: 0xf0d8a0, dir: 0xffe8b8,
    accent: 0xff9e00, road: 0x6e4a22, canopy: 0xc45c18
  },
  valley: {
    ground: 0x3a6a58, grid: 0x2c5648, fog: 0xb8d4c8, fogNear: 22, fogFar: 90,
    skyTop: "#8eb8c8", skyBottom: "#d0e4d8", sky: 0x8eb0b8, ambient: 0xb8dcc8, dir: 0xe8f4ff,
    accent: 0x7ec8ff, road: 0x5a4630, canopy: 0x2a6e58
  },
  volcano: {
    ground: 0x3a2818, grid: 0x2a1810, fog: 0x6a3020, fogNear: 24, fogFar: 100,
    skyTop: "#6a3020", skyBottom: "#2a1410", sky: 0x4a2018, ambient: 0xd08060, dir: 0xffc8a0,
    accent: 0xff6b35, road: 0x3a2414, canopy: 0x3a2a18
  },
  castle: {
    ground: 0x3a6a48, grid: 0x2c5438, fog: 0xc8b8e8, fogNear: 30, fogFar: 112,
    skyTop: "#c8a8f0", skyBottom: "#e8d8ff", sky: 0xb8a0d8, ambient: 0xd8c8f0, dir: 0xfff0ff,
    accent: 0xe878ff, road: 0x6a5030, canopy: 0x4a8a62
  },
  boss: {
    ground: 0x2e4a28, grid: 0x243a20, fog: 0x6a8060, fogNear: 26, fogFar: 100,
    skyTop: "#4a6848", skyBottom: "#d8e8c8", sky: 0x5a7850, ambient: 0xc8d8a8, dir: 0xfff4d8,
    accent: 0xffd166, road: 0x5a4028, canopy: 0x1e5a28
  }
};

function grassTexture(bg, line) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = `#${bg.toString(16).padStart(6, "0")}`;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = i % 3 ? "rgba(20,70,20,0.18)" : "rgba(255,255,180,0.08)";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 8, 2);
  }
  ctx.strokeStyle = `#${line.toString(16).padStart(6, "0")}`;
  ctx.globalAlpha = 0.12;
  ctx.strokeRect(12, 12, 232, 232);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(22, 22);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function skyTexture(top, bottom) {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top);
  g.addColorStop(0.55, bottom);
  g.addColorStop(1, "#c8d898");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const KEEP_CLEAR = (x, z) => Math.abs(x) < 6.4 && z < 24 && z > -52;

export class WorldBuilder {
  constructor(scene, collision, assets) {
    this.scene = scene;
    this.collision = collision;
    this.assets = assets;
    this.root = null;
    this.pickups = [];
    this.npcs = [];
    this.birds = [];
    this.leaves = null;
  }

  build(level, themeKey) {
    this.dispose();
    const theme = THEMES[themeKey] || THEMES.forest;
    this.themeKey = themeKey;
    this.root = new THREE.Group();
    this.root.userData.worldObject = true;
    this.scene.add(this.root);
    this.pickups = [];
    this.npcs = [];
    this.birds = [];
    this.leaves = null;

    this._ground(theme);
    this._sky(theme);
    this._atmosphere(theme);
    this._road(theme);
    this._camp(level, theme);
    this._pathTrees(theme, themeKey);
    this._scatter(theme, themeKey, level);
    this._treasureClearings(level.treasures || [], theme);
    if (themeKey === "boss") this._bossArena(theme);
    this._bounds();

    return { root: this.root, pickups: this.pickups, npcs: this.npcs, theme };
  }

  _mark(obj) {
    obj.userData.worldObject = true;
    this.root.add(obj);
    return obj;
  }

  _put(kind, x, z, { scale = 1, collide = false, rot, radius = 0.4 } = {}) {
    const cloned = this.assets.clone(kind);
    const object = cloned.object;
    this._lastClone = cloned;
    object.position.set(x, 0, z);
    if (scale !== 1) object.scale.multiplyScalar(scale);
    object.rotation.y = rot ?? Math.random() * Math.PI * 2;
    this._mark(object);
    if (collide) {
      this.collision.addBox({ x: x - radius, z: z - radius }, { x: x + radius, y: 3.2, z: z + radius });
    }
    return object;
  }

  _treeKind(themeKey) {
    if (themeKey === "desert") return ["treeFall", "treeFall", "treeOak"];
    if (themeKey === "volcano") return ["treeFall", "treePine", "treeSimple"];
    if (themeKey === "valley") return ["treePine", "treeTall", "treePine2"];
    if (themeKey === "castle") return ["treeDetailed", "treeFat", "treeOak"];
    if (themeKey === "boss") return ["treeTall", "treeOak", "treePine"];
    return ["tree", "treePine", "treeTall", "treeFat", "treeDetailed"];
  }

  _ground(theme) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({
        map: grassTexture(theme.ground, theme.grid),
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this._mark(mesh);
  }

  _sky(theme) {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(100, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTexture(theme.skyTop, theme.skyBottom), side: THREE.BackSide, fog: false })
    );
    this._mark(sky);
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff1a8, fog: false })
    );
    sun.position.set(-28, 38, -18);
    this._mark(sun);
    const sunLight = new THREE.DirectionalLight(theme.dir, 0.4);
    sunLight.position.copy(sun.position);
    this._mark(sunLight);
  }

  _atmosphere(theme) {
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xfffaf2 });
    for (let i = 0; i < 12; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.3 + Math.random() * 0.9, 8, 8), cloudMat);
        puff.position.set(j * 1.5 - 2, Math.random() * 0.7, (Math.random() - 0.5) * 1.6);
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 80, 16 + Math.random() * 10, (Math.random() - 0.5) * 80);
      this._mark(cloud);
    }

    const blade = new THREE.ConeGeometry(0.07, 0.32, 4);
    const grassMat = new THREE.MeshStandardMaterial({ color: theme.canopy || 0x2f8a46, roughness: 0.95 });
    const grass = new THREE.InstancedMesh(blade, grassMat, 420);
    grass.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const dummy = new THREE.Object3D();
    let n = 0;
    let tries = 0;
    while (n < 420 && tries < 2500) {
      tries += 1;
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      if (Math.abs(x) < 4.1 && z < 24 && z > -52) continue;
      dummy.position.set(x, 0.14, z);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.setScalar(0.7 + Math.random() * 1.1);
      dummy.updateMatrix();
      grass.setMatrixAt(n, dummy.matrix);
      n += 1;
    }
    grass.count = Math.max(1, n);
    grass.instanceMatrix.needsUpdate = true;
    this._mark(grass);

    const leafCount = 80;
    const leafPos = new Float32Array(leafCount * 3);
    for (let i = 0; i < leafCount; i++) {
      leafPos[i * 3] = (Math.random() - 0.5) * 60;
      leafPos[i * 3 + 1] = 2 + Math.random() * 10;
      leafPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    const leafGeo = new THREE.BufferGeometry();
    leafGeo.setAttribute("position", new THREE.BufferAttribute(leafPos, 3));
    this.leaves = new THREE.Points(
      leafGeo,
      new THREE.PointsMaterial({ color: 0xc4e86a, size: 0.18, transparent: true, opacity: 0.85 })
    );
    this._mark(this.leaves);

    for (let i = 0; i < 7; i++) {
      const bird = PlaceholderFactory.bird();
      bird.userData.t = Math.random() * Math.PI * 2;
      bird.userData.radius = 9 + i * 2.4;
      bird.userData.speed = 0.35 + (i % 3) * 0.08;
      bird.userData.height = 5.5 + (i % 4) * 0.8;
      this.birds.push(bird);
      this._mark(bird);
    }
  }

  _road(theme) {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.08, 86),
      new THREE.MeshStandardMaterial({ color: theme.road, roughness: 0.95, metalness: 0 })
    );
    road.position.set(0, 0.04, -12);
    road.receiveShadow = true;
    this._mark(road);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x4a7a32, roughness: 0.9 });
    const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 86), edgeMat);
    e1.position.set(3.7, 0.07, -12);
    const e2 = e1.clone();
    e2.position.x = -3.7;
    this._mark(e1);
    this._mark(e2);
  }

  _camp(level, theme) {
    const [sx, , sz] = level.spawn || [0, 0, 18];
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(5.4, 5.4, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x6e4a28, roughness: 0.92 })
    );
    pad.position.set(sx, 0.06, sz);
    this._mark(pad);

    this._put("tent", sx + 4.2, sz + 1.6, { scale: 1, collide: true, radius: 1.35, rot: -0.8 });
    this._put("tentSmall", sx - 4.4, sz + 1.2, { scale: 1, collide: true, radius: 1.1, rot: 0.9 });
    this._put("campfire", sx, sz - 0.4, { scale: 1, collide: false });
    const fire = new THREE.PointLight(0xff9a3c, 2.4, 14);
    fire.position.set(sx, 1.4, sz - 0.4);
    this._mark(fire);
    this._put("sign", sx + 2.2, sz + 3.2, { scale: 1, collide: false, rot: Math.PI });
    this._put("crate", sx - 2.6, sz + 2.4, { scale: 1, collide: true, radius: 0.55 });
    this._put("log", sx - 1.2, sz + 3.4, { scale: 1, collide: true, radius: 0.45, rot: 1.2 });
    this._put("fence", sx + 6.2, sz + 0.2, { scale: 1, collide: true, radius: 0.25, rot: 1.57 });
    this._put("fence", sx - 6.2, sz + 0.2, { scale: 1, collide: true, radius: 0.25, rot: 1.57 });

    const npc = this._put("npc", sx + 3.4, sz - 1.6, { scale: 1, collide: false, rot: Math.PI });
    let mixer = null;
    if (this._lastClone?.animations?.length) {
      mixer = new THREE.AnimationMixer(npc);
      const idle = this._lastClone.animations.find((c) => c.name.toLowerCase().includes("idle")) || this._lastClone.animations[0];
      mixer.clipAction(idle).play();
    }
    this.npcs.push({
      object: npc,
      mixer,
      message: "ระวังมอนสเตอร์! กระโดดลงบนหัวมัน แล้วไปหาแสงทองจากกล่องสมบัติ"
    });
  }

  _pathTrees(theme, key) {
    const kinds = this._treeKind(key);
    for (let z = 22; z >= -48; z -= 5) {
      const left = kinds[Math.abs(z) % kinds.length];
      const right = kinds[(Math.abs(z) + 1) % kinds.length];
      this._put(left, -8.4, z + (z % 5) * 0.15, { scale: 0.95, collide: true, radius: 0.42 });
      this._put(right, 8.4, z - (z % 4) * 0.12, { scale: 0.95, collide: true, radius: 0.42 });
      this._put(kinds[(Math.abs(z) + 2) % kinds.length], -12.5, z + 1.5, { scale: 1.05, collide: true, radius: 0.42 });
      this._put(kinds[(Math.abs(z) + 3) % kinds.length], 12.5, z - 1.2, { scale: 1.05, collide: true, radius: 0.42 });
      this._put("bush", -5.6, z + 1.2, { collide: false });
      this._put(z % 10 === 0 ? "flowerY" : "flower", 5.6, z - 0.8, { collide: false });
      if (z % 15 === 0) this._put("log", (z % 2 ? -6.6 : 6.6), z, { collide: true, radius: 0.4, rot: 0.4 });
    }
  }

  _scatter(theme, key, level) {
    const kinds = this._treeKind(key);
    const rocks = ["rock", "rockTall", "rockSmall", "rockB"];
    const avoid = [
      ...(level.treasures || []).map((t) => t.position),
      level.spawn,
      level.checkpoint,
      level.portal,
      level.secret?.position
    ].filter(Boolean);

    const blocked = (x, z) => {
      if (KEEP_CLEAR(x, z)) return true;
      return avoid.some(([ax, , az]) => {
        const dx = x - ax;
        const dz = z - az;
        return dx * dx + dz * dz < 25;
      });
    };

    for (let i = 0; i < 40; i++) {
      let x = (Math.random() - 0.5) * 96;
      let z = (Math.random() - 0.5) * 96;
      if (blocked(x, z)) continue;
      const kind = kinds[i % kinds.length];
      this._put(kind, x, z, { scale: 0.85 + Math.random() * 0.45, collide: true, radius: 0.4 });
    }
    for (let i = 0; i < 22; i++) {
      let x = (Math.random() - 0.5) * 90;
      let z = (Math.random() - 0.5) * 90;
      if (blocked(x, z)) continue;
      this._put(rocks[i % rocks.length], x, z, { scale: 0.9, collide: true, radius: 0.85 });
    }
    for (let i = 0; i < 48; i++) {
      let x = (Math.random() - 0.5) * 80;
      let z = (Math.random() - 0.5) * 80;
      if (KEEP_CLEAR(x, z)) continue;
      const flora = i % 4 === 0 ? "flowerY" : i % 4 === 1 ? "bush" : i % 4 === 2 ? "flower" : "bushSmall";
      this._put(flora, x, z, { collide: false });
    }
  }

  _treasureClearings(treasures, theme) {
    treasures.forEach((t) => {
      const [x, , z] = t.position;
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 0.1, 18),
        new THREE.MeshStandardMaterial({ color: 0x6a4a24, roughness: 0.9 })
      );
      pad.position.set(x, 0.05, z);
      this._mark(pad);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.7, 0.08, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd166 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.12, z);
      this._mark(ring);
      this._put("flag", x + 1.8, z + 1.6, { scale: 1, collide: false, rot: -0.4 });
    });
  }

  _bossArena(theme) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      this._put(i % 2 ? "treeTall" : "rock", Math.cos(a) * 12, Math.sin(a) * 12 - 22, {
        scale: 1.1,
        collide: true,
        radius: i % 2 ? 0.45 : 0.9
      });
    }
    this._put("campfire", 0, -18, { collide: false });
    const light = new THREE.PointLight(0xffd166, 2.6, 22);
    light.position.set(0, 3, -22);
    this._mark(light);
  }

  _bounds() {
    const s = 50;
    this.collision.addBox({ x: -s - 2, z: -s }, { x: -s, y: 8, z: s });
    this.collision.addBox({ x: s, z: -s }, { x: s + 2, y: 8, z: s });
    this.collision.addBox({ x: -s, z: -s - 2 }, { x: s, y: 8, z: -s });
    this.collision.addBox({ x: -s, z: s }, { x: s, y: 8, z: s + 2 });
  }

  dispose() {
    if (this.root && this.root.parent) this.root.parent.remove(this.root);
    this.root = null;
    this.collision.clear();
  }
}
