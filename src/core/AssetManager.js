import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ASSETS } from "../../config/assets.js";
import { PlaceholderFactory } from "./PlaceholderFactory.js";
import { cloneGltfScene } from "./cloneGltf.js";

export class AssetManager {
  constructor() {
    this.cache = new Map();
    this.byUrl = new Map();
    this.progress = 0;
    this.onProgress = null;
    this.loader = new GLTFLoader();
    this._inflight = new Map();
  }

  async loadAll() {
    const entries = Object.entries(ASSETS.models);
    let done = 0;
    const bump = (key) => {
      done += 1;
      this.progress = done / entries.length;
      this.onProgress?.(this.progress, `โหลด ${key}...`);
    };
    const queue = [...entries];
    const workers = 6;
    const run = async () => {
      while (queue.length) {
        const [key, spec] = queue.shift();
        await this.loadModel(key, spec);
        bump(key);
      }
    };
    await Promise.all(Array.from({ length: workers }, () => run()));
    this.progress = 1;
    this.onProgress?.(1, "พร้อมแล้ว");
  }

  async loadModel(key, spec) {
    if (this.cache.has(key)) return this.cache.get(key);
    if (!spec?.url) {
      this.cache.set(key, { type: "placeholder", spec, fallback: spec?.fallback || key });
      return this.cache.get(key);
    }
    if (this.byUrl.has(spec.url)) {
      const shared = { ...this.byUrl.get(spec.url), spec };
      this.cache.set(key, shared);
      return shared;
    }
    if (this._inflight.has(spec.url)) {
      try {
        const entry = await this._inflight.get(spec.url);
        const shared = { ...entry, spec };
        this.cache.set(key, shared);
        return shared;
      } catch {
        this.cache.set(key, { type: "placeholder", spec, fallback: spec.fallback });
        return this.cache.get(key);
      }
    }
    const pending = this.loadGLTF(spec.url)
      .then((gltf) => {
        const entry = { type: "gltf", gltf, spec, fallback: spec.fallback };
        this.cache.set(key, entry);
        this.byUrl.set(spec.url, entry);
        return entry;
      })
      .catch((err) => {
        console.warn(`[AssetManager] ${key} missing, using placeholder (${spec.fallback})`, err.message || err);
        const entry = { type: "placeholder", spec, fallback: spec.fallback };
        this.cache.set(key, entry);
        return entry;
      })
      .finally(() => this._inflight.delete(spec.url));
    this._inflight.set(spec.url, pending);
    return pending;
  }

  loadGLTF(url) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout ${url}`)), 12000);
      this.loader.load(
        url,
        (gltf) => {
          clearTimeout(timer);
          gltf.scene.traverse((c) => {
            const mats = c.isMesh ? (Array.isArray(c.material) ? c.material : [c.material]) : [];
            mats.forEach((m) => {
              if (!m?.map) return;
              m.map.magFilter = THREE.NearestFilter;
              m.map.minFilter = THREE.NearestFilter;
              m.map.generateMipmaps = false;
              m.map.needsUpdate = true;
            });
          });
          resolve(gltf);
        },
        undefined,
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  }

  _grounded(object) {
    const box = new THREE.Box3().setFromObject(object);
    if (!Number.isFinite(box.min.y)) return object;
    const center = box.getCenter(new THREE.Vector3());
    object.position.x -= center.x;
    object.position.z -= center.z;
    object.position.y -= box.min.y;
    const wrap = new THREE.Group();
    wrap.add(object);
    return wrap;
  }

  clone(key, accent = null) {
    const entry = this.cache.get(key);
    const spec = ASSETS.models[key] || entry?.spec || {};
    const scale = spec.scale ?? 1;
    let object;
    let animations = [];
    if (entry?.type === "gltf") {
      animations = entry.gltf.animations || [];
      object = this._cloneGltf(entry, spec);
    } else {
      object = PlaceholderFactory.create(spec.fallback || entry?.fallback || key);
    }
    if (scale !== 1) object.scale.multiplyScalar(scale);
    if (accent) this._tint(object, accent);
    return { object, animations };
  }

  _cloneGltf(entry, spec) {
    if (entry.gltf.__skinned == null) {
      entry.gltf.__skinned = this._isSkinned(entry.gltf.scene);
    }
    if (entry.gltf.__skinned) {
      const object = cloneGltfScene(entry.gltf.scene);
      object.traverse(enableShadow);
      if (spec.ground !== false) return this._grounded(object);
      return object;
    }
    if (!entry.gltf.__template) {
      const proto = entry.gltf.scene.clone(true);
      proto.traverse(enableShadow);
      entry.gltf.__template = spec.ground !== false ? this._grounded(proto) : proto;
    }
    return entry.gltf.__template.clone(true);
  }

  _isSkinned(root) {
    let skinned = false;
    root.traverse((c) => {
      if (c.isSkinnedMesh) skinned = true;
    });
    return skinned;
  }

  _tint(object, accent) {
    object.traverse((c) => {
      if (!c.isMesh || !c.material) return;
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        if (!m.emissive) return;
        m.emissive = new THREE.Color(accent);
        m.emissiveIntensity = 0.28;
      });
    });
  }
}

function enableShadow(c) {
  if (!c.isMesh) return;
  c.castShadow = true;
  c.receiveShadow = true;
  if (c.isSkinnedMesh) c.frustumCulled = false;
}
