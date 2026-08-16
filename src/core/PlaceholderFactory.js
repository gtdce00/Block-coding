import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

function metal(color, emissive = 0x000000, intensity = 0.35) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.45,
    roughness: 0.38,
    emissive,
    emissiveIntensity: intensity
  });
}

function glow(color, intensity = 1.4) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.12,
    roughness: 0.28
  });
}

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class PlaceholderFactory {
  static robot() {
    const root = new THREE.Group();
    root.name = "robot";
    const body = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.55, 6, 12), metal(0x2ee6d6, 0x00f5ff, 0.28)));
    body.position.y = 1.05;
    body.name = "body";
    const chest = shadow(new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), glow(0x7bff4d, 1.8)));
    chest.position.set(0, 1.12, 0.36);
    const headPivot = new THREE.Group();
    headPivot.position.y = 1.62;
    headPivot.name = "head";
    const head = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), metal(0x16324a, 0x00f5ff, 0.22)));
    const visor = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0.4, 1.1), glow(0x00f5ff, 1.9)));
    visor.rotation.x = 0.15;
    visor.position.z = 0.08;
    visor.name = "visor";
    const earL = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), glow(0xff3cac, 1.4)));
    earL.position.set(-0.34, 0.08, 0);
    const earR = earL.clone();
    earR.position.x = 0.34;
    const antenna = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), metal(0x8899aa)));
    antenna.position.y = 0.48;
    const tip = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), glow(0xffd166, 2)));
    tip.position.y = 0.64;
    tip.name = "antennaTip";
    headPivot.add(head, visor, earL, earR, antenna, tip);

    const makeLimb = (x, name, len = 0.55) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.28, 0);
      pivot.name = name;
      const limb = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.1, len, 4, 8), metal(0x148a96, 0x00f5ff, 0.2)));
      limb.position.y = -len * 0.45;
      pivot.add(limb);
      return pivot;
    };
    const leftArm = makeLimb(-0.48, "leftArm", 0.42);
    const rightArm = makeLimb(0.48, "rightArm", 0.42);
    const leftLeg = makeLimb(-0.18, "leftLeg", 0.5);
    leftLeg.position.y = 0.72;
    const rightLeg = makeLimb(0.18, "rightLeg", 0.5);
    rightLeg.position.y = 0.72;
    const pack = shadow(new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.4, 0.18, 2, 0.08), metal(0x7b5cff, 0xff3cac, 0.4)));
    pack.position.set(0, 1.12, -0.34);
    root.add(body, chest, headPivot, leftArm, rightArm, leftLeg, rightLeg, pack);
    return root;
  }

  static npc() {
    const g = this.robot();
    g.scale.setScalar(0.92);
    return g;
  }

  static chest(secret = false) {
    const root = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: secret ? 0x8a5a18 : 0x6a4018, roughness: 0.86, metalness: 0.05 });
    const base = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.72, 0.86, 3, 0.08), wood));
    base.position.y = 0.42;
    const lid = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.22, 0.9, 3, 0.08), wood));
    lid.position.set(0, 0.86, 0);
    lid.name = "lid";
    const gem = shadow(new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), glow(0xffd166, 1.6)));
    gem.position.y = 1.18;
    gem.name = "gem";
    root.add(base, lid, gem);
    return root;
  }

  static secretChest() {
    return this.chest(true);
  }

  static tree() {
    const root = new THREE.Group();
    const trunkH = 1.6 + Math.random() * 0.8;
    const bark = new THREE.MeshStandardMaterial({ color: 0x6a4424, roughness: 0.92, metalness: 0 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f8a46, roughness: 0.78, metalness: 0 });
    const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, trunkH, 7), bark));
    trunk.position.y = trunkH / 2;
    const leaf = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.7, 8), leafMat));
    leaf.position.y = trunkH + 0.45;
    const leaf2 = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 8), leafMat));
    leaf2.position.y = trunkH + 1.15;
    root.add(trunk, leaf, leaf2);
    return root;
  }

  static cactus() {
    const root = new THREE.Group();
    const mat = metal(0x2d8a62, 0x3dff9a, 0.4);
    const stem = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.4, 4, 8), mat));
    stem.position.y = 1.0;
    const arm = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.55, 4, 8), mat));
    arm.position.set(0.38, 1.25, 0);
    arm.rotation.z = Math.PI / 2.4;
    const flower = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), glow(0xff3cac, 1.6)));
    flower.position.y = 1.85;
    root.add(stem, arm, flower);
    return root;
  }

  static rock() {
    const mesh = shadow(new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + Math.random() * 0.3, 0), metal(0x5a6578, 0x88cfff, 0.12)));
    mesh.scale.set(1, 0.65 + Math.random() * 0.3, 1.15);
    mesh.position.y = 0.28;
    return mesh;
  }

  static crystal() {
    const root = new THREE.Group();
    const cols = [0x00f5ff, 0x7b5cff, 0x3dff9a];
    for (let i = 0; i < 3; i++) {
      const m = shadow(new THREE.Mesh(new THREE.OctahedronGeometry(0.22 + i * 0.08, 0), glow(cols[i], 1.5)));
      m.position.set((i - 1) * 0.18, 0.38 + i * 0.12, (i % 2) * 0.1);
      m.rotation.z = (i - 1) * 0.25;
      root.add(m);
    }
    return root;
  }

  static coin() {
    const root = new THREE.Group();
    const mesh = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 10, 20), glow(0xffd166, 1.5)));
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 0.55;
    root.add(mesh);
    return root;
  }

  static building() {
    const root = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: 0xc45c2c, roughness: 0.82, metalness: 0 });
    const cone = shadow(new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.4, 8), cloth));
    cone.position.y = 1.4;
    const pole = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 0.9 })));
    pole.position.y = 1.3;
    root.add(cone, pole);
    return root;
  }

  static tower() {
    const root = new THREE.Group();
    const col = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 4.6, 8), metal(0x2a3348, 0x7b5cff, 0.25)));
    col.position.y = 2.3;
    const dish = shadow(new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 10, 0, Math.PI * 2, 0, 1.25), glow(0x00f5ff, 0.55)));
    dish.position.y = 5.0;
    dish.rotation.x = 0.5;
    root.add(col, dish);
    return root;
  }

  static portal() {
    const root = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0x6a6a58, roughness: 0.9, metalness: 0 });
    const left = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.1, 0.55), stone));
    left.position.set(-1.35, 1.55, 0);
    const right = left.clone();
    right.position.x = 1.35;
    const top = shadow(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 0.6), stone));
    top.position.y = 3.2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.1, 10, 28), glow(0xffd166, 1.4));
    ring.position.y = 1.6;
    ring.name = "ring";
    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(1.05, 24),
      new THREE.MeshBasicMaterial({ color: 0x7ec86a, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    inner.position.y = 1.6;
    inner.name = "inner";
    const pad = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 0.95 })));
    pad.position.y = 0.06;
    root.add(left, right, top, ring, inner, pad);
    return root;
  }

  static checkpoint() {
    const root = new THREE.Group();
    const pole = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.3, 10), metal(0x8899aa, 0x3dff9a, 0.5)));
    pole.position.y = 1.15;
    const orb = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), glow(0x3dff9a, 2.1)));
    orb.position.y = 2.35;
    orb.name = "orb";
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.04, 8, 20), glow(0x00f5ff, 1.4));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 2.35;
    root.add(pole, orb, halo);
    return root;
  }

  static slime(color = 0x4adf6a) {
    const root = new THREE.Group();
    root.name = "slime";
    const body = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 12), glow(color, 0.45)));
    body.scale.set(1.05, 0.78, 1.05);
    body.position.y = 0.44;
    body.name = "body";
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.4 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), eyeMat);
    eyeL.position.set(-0.18, 0.58, 0.4);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.18;
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glow(0xffffff, 1.4));
    shine.position.set(-0.14, 0.64, 0.48);
    const shineR = shine.clone();
    shineR.position.x = 0.22;
    const blob = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), glow(color, 0.7)));
    blob.position.set(0.42, 0.28, 0.08);
    blob.scale.set(0.7, 0.55, 0.7);
    root.add(body, eyeL, eyeR, shine, shineR, blob);
    return root;
  }

  static beetle(color = 0x3a6a28) {
    const root = new THREE.Group();
    root.name = "beetle";
    const shell = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), metal(color, 0x88ff44, 0.25)));
    shell.scale.set(1.15, 0.62, 1.45);
    shell.position.y = 0.38;
    shell.name = "body";
    const head = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), metal(0x1a2814, 0x88ff44, 0.2)));
    head.position.set(0, 0.34, 0.62);
    const horn = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.55, 6), metal(0x2a2010)));
    horn.position.set(0, 0.62, 0.72);
    horn.rotation.x = -0.7;
    for (let i = 0; i < 3; i++) {
      const z = -0.18 + i * 0.22;
      [-1, 1].forEach((side) => {
        const leg = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.28, 3, 5), metal(0x2a2010)));
        leg.position.set(side * 0.42, 0.16, z);
        leg.rotation.z = side * 0.9;
        root.add(leg);
      });
    }
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), glow(0xffee88, 1.6));
    eyeL.position.set(-0.1, 0.4, 0.78);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.1;
    root.add(shell, head, horn, eyeL, eyeR);
    return root;
  }

  static wolf(color = 0x4a3a32) {
    const root = new THREE.Group();
    root.name = "wolf";
    const fur = metal(color, 0xff8844, 0.12);
    const body = shadow(new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.48, 1.15, 2, 0.1), fur));
    body.position.y = 0.62;
    body.name = "body";
    const head = shadow(new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.38, 0.48, 2, 0.08), fur));
    head.position.set(0, 0.82, 0.72);
    const snout = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.28), metal(0x3a2a24)));
    snout.position.set(0, 0.72, 1.02);
    const earL = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 5), fur));
    earL.position.set(-0.16, 1.08, 0.62);
    const earR = earL.clone();
    earR.position.x = 0.16;
    const tail = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.45, 3, 6), fur));
    tail.position.set(0, 0.72, -0.7);
    tail.rotation.x = 0.6;
    tail.name = "tail";
    [-1, 1].forEach((x) => {
      [0.32, -0.32].forEach((z) => {
        const leg = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.38, 3, 6), fur));
        leg.position.set(x * 0.2, 0.28, z);
        root.add(leg);
      });
    });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), glow(0xffcc44, 1.8));
    eyeL.position.set(-0.12, 0.88, 0.94);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.12;
    root.add(body, head, snout, earL, earR, tail, eyeL, eyeR);
    return root;
  }

  static guardian() {
    const root = new THREE.Group();
    root.name = "guardian";
    const bark = metal(0x2a3a22, 0x88ff44, 0.22);
    const body = shadow(new THREE.Mesh(new RoundedBoxGeometry(2.15, 2.8, 1.45, 2, 0.16), bark));
    body.position.y = 2.05;
    body.name = "body";
    const head = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.82, 16, 16), metal(0x1a2818, 0xffd166, 0.35)));
    head.position.y = 3.95;
    head.name = "head";
    const visor = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.26, 0.12), glow(0xff6b3d, 2.2)));
    visor.position.set(0, 4.02, 0.68);
    visor.name = "visor";
    const core = shadow(new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), glow(0xffd166, 2.4)));
    core.position.set(0, 2.15, 0.78);
    core.name = "core";
    const antler = (x) => {
      const a = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 1.35, 6), bark));
      a.position.set(x, 4.7, 0);
      a.rotation.z = -x * 0.45;
      const tine = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.7, 5), bark));
      tine.position.set(x * 1.15, 5.15, 0.12);
      tine.rotation.z = -x * 1.1;
      tine.rotation.x = -0.4;
      root.add(a, tine);
    };
    antler(-0.55);
    antler(0.55);
    const armL = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.4, 4, 8), bark));
    armL.position.set(-1.35, 2.1, 0.1);
    armL.rotation.z = 0.25;
    const armR = armL.clone();
    armR.position.x = 1.35;
    armR.rotation.z = -0.25;
    const crown = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 7), new THREE.MeshStandardMaterial({ color: 0x2f8a46, roughness: 0.8 })));
    crown.position.y = 5.05;
    root.add(body, head, visor, core, armL, armR, crown);
    return root;
  }

  static lamp() {
    const root = new THREE.Group();
    const pole = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 3.2, 8), metal(0x1a2a40, 0x00f5ff, 0.25)));
    pole.position.y = 1.6;
    const bulb = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), glow(0xffe08a, 2.2)));
    bulb.position.y = 3.25;
    const hat = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.22, 10), metal(0x7b5cff, 0x7b5cff, 0.4)));
    hat.position.y = 3.48;
    root.add(pole, bulb, hat);
    return root;
  }

  static bird() {
    const root = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.42, 5),
      new THREE.MeshStandardMaterial({ color: 0x3a3a48, roughness: 0.7 })
    );
    body.rotation.x = Math.PI / 2;
    const wingL = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.04, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x5a5a6a })
    );
    wingL.position.set(-0.22, 0.02, 0);
    const wingR = wingL.clone();
    wingR.position.x = 0.22;
    root.add(body, wingL, wingR);
    return root;
  }

  static mushroom() {
    const root = new THREE.Group();
    const stem = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0xf0e0c0, roughness: 0.85 })));
    stem.position.y = 0.28;
    const cap = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10, 0, Math.PI * 2, 0, 1.2), new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0xc43c3c : 0x2f8a46, roughness: 0.7 })));
    cap.position.y = 0.62;
    root.add(stem, cap);
    return root;
  }

  static create(kind) {
    const map = {
      robot: () => this.robot(),
      npc: () => this.npc(),
      chest: () => this.chest(),
      secretChest: () => this.secretChest(),
      tree: () => this.tree(),
      cactus: () => this.cactus(),
      rock: () => this.rock(),
      crystal: () => this.crystal(),
      coin: () => this.coin(),
      building: () => this.building(),
      tower: () => this.tower(),
      portal: () => this.portal(),
      checkpoint: () => this.checkpoint(),
      guardian: () => this.guardian(),
      slime: () => this.slime(),
      beetle: () => this.beetle(),
      wolf: () => this.wolf(),
      lamp: () => this.lamp(),
      mushroom: () => this.mushroom(),
      bird: () => this.bird()
    };
    return (map[kind] || map.rock)();
  }
}
