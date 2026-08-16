import * as THREE from "three";

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);

    this.hemi = new THREE.HemisphereLight(0xc8e8ff, 0x3a5a28, 1.25);
    this.dir = new THREE.DirectionalLight(0xfff3c8, 1.45);
    this.dir.position.set(18, 28, 12);
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(2048, 2048);
    this.dir.shadow.camera.near = 1;
    this.dir.shadow.camera.far = 90;
    this.dir.shadow.camera.left = -40;
    this.dir.shadow.camera.right = 40;
    this.dir.shadow.camera.top = 40;
    this.dir.shadow.camera.bottom = -40;
    this.scene.add(this.hemi, this.dir, this.dir.target);

    this.useComposer = false;
    this.composer = null;
    this.bloom = null;

    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);
  }

  setTheme(theme) {
    this.scene.background = new THREE.Color(theme.sky);
    this.scene.fog = new THREE.Fog(theme.fog, theme.fogNear, theme.fogFar);
    this.hemi.color.set(theme.ambient);
    if (theme.ground) this.hemi.groundColor.set(theme.ground);
    this.dir.color.set(theme.dir);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.useComposer) {
      this.composer.setSize(w, h);
      this.bloom?.setSize(w, h);
    }
  }

  render() {
    if (this.useComposer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  clearWorld(keep = new Set()) {
    const remove = [];
    this.scene.traverse((obj) => {
      if (obj.userData?.worldObject) remove.push(obj);
    });
    remove.forEach((obj) => {
      if (obj.parent) obj.parent.remove(obj);
      obj.traverse((c) => {
        if (c.geometry && !keep.has(c.geometry)) c.geometry.dispose?.();
      });
    });
  }
}
