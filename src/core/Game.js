import * as THREE from "three";
import { SceneManager } from "./SceneManager.js";
import { AssetManager } from "./AssetManager.js";
import { InputManager } from "./InputManager.js";
import { AudioManager } from "./AudioManager.js";
import { Player } from "../player/Player.js";
import { PlayerController } from "../player/PlayerController.js";
import { ThirdPersonCamera } from "../camera/ThirdPersonCamera.js";
import { Collision } from "../world/Collision.js";
import { WorldManager } from "../world/WorldManager.js";
import { QuestionLoader } from "../quiz/QuestionLoader.js";
import { QuestionManager } from "../quiz/QuestionManager.js";
import { ScoreManager } from "../score/ScoreManager.js";
import { Timer } from "../score/Timer.js";
import { CodingChallenge } from "../coding/CodingChallenge.js";
import { HUD } from "../ui/HUD.js";
import { MainMenu } from "../ui/MainMenu.js";
import { SettingsUI } from "../ui/SettingsUI.js";
import { ResultUI } from "../ui/ResultUI.js";
import { Leaderboard } from "../score/Leaderboard.js";
export const GameState = {
  LOADING: "loading",
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  CODING: "coding",
  PORTAL: "portal",
  RESULT: "result"
};

const SAVE_KEY = "rm3d_checkpoint";

export class Game {
  constructor() {
    this.state = GameState.LOADING;
    this.canvas = document.getElementById("game-canvas");
    this.sceneMgr = new SceneManager(this.canvas);
    this.assets = new AssetManager();
    this.input = new InputManager(this.canvas);
    this.audio = new AudioManager();
    this.collision = new Collision();
    this.hud = new HUD();
    this.resultUI = new ResultUI();
    this.ui = {};
    this.playerInfo = { name: "ผู้เล่น", grade: "ป.6", room: "1", school: "" };
    this.lobby = null;
    this._ended = false;
    this._scoreSaved = false;
  }

  async init() {
    this._bindUnlock();
    this.assets.onProgress = (p, text) => this._setLoading(p * 0.7, text);
    try {
      const [settings, levels, questions, sheetsCfg] = await Promise.all([
        fetchJSON("data/settings.json"),
        fetchJSON("data/levels.json"),
        QuestionLoader.load(),
        fetchJSON("data/google_sheets.json").catch(() => ({ webhookUrl: "" }))
      ]);
      this.defaultSettings = settings;
      const override = SettingsUI.loadOverride() || {};
      if (override.gameTimeMinutes === 15 && settings.gameTimeMinutes >= 50) {
        delete override.gameTimeMinutes;
      }
      this.settings = { ...settings, ...override, scores: { ...settings.scores, ...(override.scores || {}) } };
      if (!this.settings.googleSheetsWebhookUrl) {
        this.settings.googleSheetsWebhookUrl = sheetsCfg?.webhookUrl || "";
      }
      this.levels = levels.worlds;
      this.questions = new QuestionManager(questions);
    } catch (err) {
      console.error(err);
      document.getElementById("loading-text").textContent =
        "โหลดข้อมูลไม่สำเร็จ — โปรดเปิดเกมด้วย Live Server (ดู README.md)";
      return;
    }

    await this.assets.loadAll();
    this._setLoading(0.85, "สร้างโลกตัวอย่าง...");
    try {
      this._createLobby();
      this.worlds = new WorldManager(this.sceneMgr.scene, this.collision, this.assets, this.levels);
      this.player = new Player(this.assets);
      this.sceneMgr.scene.add(this.player.group);
      this.player.group.visible = false;
      this.camera = new ThirdPersonCamera(this.sceneMgr.camera, this.player, this.collision);
      this.controller = new PlayerController(this.player, this.collision, this.input, this.camera);
      this.coding = new CodingChallenge(this.audio);
      this.coding.onFinish = (r) => this._onCodingFinish(r);
      this.coding.onFail = () => {
        this.score.failQuestion(this.coding.question.id);
        this._popupScore("wrong");
      };
      this.coding.onHint = () => {
        this.score.useHint();
        this.hud.setScore(this.score.score);
      };
      this.ui.settings = new SettingsUI(this);
      this.ui.menu = new MainMenu(this);
      this.applySettings(this.settings);
    } catch (err) {
      console.error(err);
      document.getElementById("loading-text").textContent = "สร้างฉากไม่สำเร็จ ลองรีเฟรชหน้าใหม่";
      return;
    }
    this._setLoading(1, "พร้อมแล้ว");
    this.goMenu();
    this.loop();
  }

  applySettings(s) {
    this.settings = s;
    document.documentElement.style.setProperty("--ui-scale", String(s.uiScale || 1));
    this.audio.setSfx(s.sound);
    this.audio.setMusic(s.music);
    Leaderboard.sheetsUrl = s.googleSheetsWebhookUrl || "";
    if (s.fullscreen) document.documentElement.requestFullscreen?.().catch(() => {});
  }

  showScreen(id) {
    document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));
    document.getElementById(id)?.classList.remove("hidden");
    this.hud.show(this.state === GameState.PLAYING || this.state === GameState.CODING || this.state === GameState.PAUSED);
  }

  goMenu() {
    if (!this._ended) this._recordScore("กลับเมนู");
    this.state = GameState.MENU;
    this.timer?.stop();
    this.input.setEnabled(false);
    this.worlds?.current?.dispose();
    this.hud.show(false);
    this.player.group.visible = false;
    if (!this.lobby) this._createLobby();
    this.lobby.visible = true;
    this.showScreen("screen-menu");
    this.audio.startMusic();
  }

  async startMission(info) {
    this.playerInfo = info;
    this._ended = false;
    this._scoreSaved = false;
    this.state = GameState.LOADING;
    this.score = new ScoreManager(this.settings.scores);
    this.timer = new Timer((this.settings.gameTimeMinutes || 50) * 60, (left) => {
      this.hud.setTime(this.timer.format(left), left);
    }, () => this.endGame("หมดเวลา"));
    this.timer.onWarning = (mark) => {
      this.audio.play("warning");
      this.hud.toast(mark <= 10 ? `${mark}` : `เหลืออีก ${Math.ceil(mark / 60)} นาที`, mark <= 30 ? "error" : "gold");
    };
    this.lobby.visible = false;
    this.player.group.visible = true;
    this.hud.setPlayer(info.name);
    this.hud.resetFog();
    this.showScreen("screen-loading");
    this._setLoading(0.4, "กำลังเข้าสู่ป่าผจญภัย...");
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      this._setLoading(0.55, "กำลังปลูกป่า...");
      await this._enterWorld(1);
    } catch (err) {
      console.error("[startMission]", err);
      document.getElementById("loading-text").textContent =
        "เข้าป่าไม่สำเร็จ — กดรีเฟรชแล้วลองใหม่";
      return;
    }
    this._setLoading(1, "พร้อมแล้ว");
    this.timer.start();
    this.state = GameState.PLAYING;
    this.hud.show(true);
    document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));
    this.input.setEnabled(true);
  }

  async _enterWorld(id) {
    const world = this.worlds.loadWorld(id);
    this.sceneMgr.setTheme(world.theme);
    const [x, y, z] = world.level.spawn;
    this.player.spawn(x, y, z, Math.PI);
    this.camera.yaw = 0;
    this.camera.pitch = 0.36;
    this.camera.mouseLookTimer = 0;
    this.camera.look.set(x, y + this.camera.height, z);
    this.camera.current.set(x, y + 4.2, z + 8.5);
    this.sceneMgr.camera.position.copy(this.camera.current);
    this.sceneMgr.camera.lookAt(this.camera.look);
    if (this.timer) this.timer.resetForWorld((this.settings.gameTimeMinutes || 50) * 60);
    this.hud.showBanner(`<p class="eyebrow">WORLD ${world.level.id}</p><h2>${world.level.name}</h2><p>${world.level.nameTh}</p>${world.level.id === 6 ? "<p>กระโดดบนบอส 3 ครั้ง แล้วกด E เขียนโค้ด</p>" : ""}`);
    this._refreshHud();
    this._save();
  }

  resume() {
    if (this.state !== GameState.PAUSED) return;
    this.state = GameState.PLAYING;
    this.timer.start();
    document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));
    this.hud.show(true);
    this.input.setEnabled(true);
  }

  confirmQuit() {
    if (confirm("กลับเมนูหลัก? ความคืบหน้าล่าสุดถูกบันทึกที่ Checkpoint")) this.goMenu();
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    const delta = Math.min(0.05, this.sceneMgr.clock.getDelta());
    this.timer?.update(delta);

    if (this.state === GameState.MENU && this.lobby) {
      this.lobbyMixer?.update(delta);
      this.lobby.rotation.y += delta * 0.12;
      const t = this.sceneMgr.clock.elapsedTime;
      this.sceneMgr.camera.position.set(Math.sin(t * 0.18) * 6.5, 2.6, Math.cos(t * 0.18) * 6.5);
      this.sceneMgr.camera.lookAt(0, 1.1, 0);
    }

    if (this.state === GameState.PLAYING) {
      if (this.input.consumePause()) {
        this.state = GameState.PAUSED;
        this.timer.stop();
        this.hud.setLookHint(false);
        this.input.setEnabled(false);
        this.showScreen("screen-pause");
      } else {
        const mouse = this.input.consumeMouse();
        const forwardMove = this.input.move.z < 0;
        this.camera.update(delta, mouse, this.player.yaw, forwardMove);
        const jump = this.controller.update(delta);
        if (jump === "jump") this.audio.play("jump");
        this.player.update(delta);
        this._worldTick(delta);
        this.hud.setLookHint(!this.input.mouse.locked);
      }
    } else {
      this.input.consumeMouse();
      this.input.consumePause();
      this.input.consumeInteract();
      if (this.state === GameState.CODING) this.worlds.current?.update(delta, this.player.position);
    }

    this.sceneMgr.render();
  };

  _worldTick(delta) {
    const world = this.worlds.current;
    if (!world) return;
    world.update(delta, this.player.position);
    this._collectCoins(world);
    this._secrets(world);
    this._checkpoint(world);
    this._combat(world);
    this._interact(world);
    this.hud.drawMinimap(this.player, world);
    this._updateCompass(world);
    this._refreshHud();
  }

  _collectCoins(world) {
    world.coins.forEach((c) => {
      if (c.collected) return;
      if (this.player.position.distanceTo(c.position) < 1.4) {
        c.collected = true;
        c.object.visible = false;
        this.score.collectCoin();
        this.audio.play("coin");
        this.hud.toast("+10 COIN", "gold");
        this.hud.setScore(this.score.score);
      }
    });
  }

  _secrets(world) {
    if (!world.secret || world.secret.collected) return;
    if (this.player.position.distanceTo(world.secret.position) < 1.8) {
      world.secret.collected = true;
      world.secret.object.visible = false;
      this.score.collectSecret();
      this.audio.play("treasure");
      this.hud.toast("SECRET TREASURE +300", "gold");
      this.hud.setScore(this.score.score);
    }
  }

  _checkpoint(world) {
    if (this.player.position.distanceTo(world.checkpoint.position) < 2.2) {
      if (!world.checkpoint.active) {
        world.checkpoint.activate();
        this.hud.toast("CHECKPOINT ACTIVATED", "success");
        this._save();
      }
    }
  }

  _combat(world) {
    const pack = world.monsters;
    if (!pack) return;
    const hit = pack.collidePlayer(this.player);
    if (hit?.type === "defeat" || hit?.type === "hit" || hit?.type === "hitBoss" || hit?.type === "stunBoss") {
      this.player.velocity.y = hit.monster.isBoss ? 8.2 : 7.2;
      this.player.grounded = false;
      this.player.iFrame = 0.4;
      this.score.stompMonster(hit.monster.isBoss);
      this.audio.play(hit.type === "defeat" ? "stomp" : "hit");
      if (hit.type === "defeat") this.hud.toast("มอนสเตอร์ +40", "success");
      else if (hit.type === "stunBoss") this.hud.toast("บอสเซ็งแล้ว! กด E เขียนโค้ด", "gold");
      else if (hit.type === "hitBoss") this.hud.toast("บอสสะเทือน!", "gold");
      this.hud.setScore(this.score.score);
    } else if (hit?.type === "knock") {
      this.player.applyKnock(hit.dir, hit.force);
      this.audio.play("knock");
      this.hud.toast(hit.monster.isBoss ? "บอสผลัก!" : "มอนสเตอร์ผลัก!", "error");
    }
    const boss = pack.bossStatus();
    this.hud.setBoss(boss);
    this.hud.setMonsters(pack.aliveCount(), pack.total());
  }

  _interact(world) {
    const npc = world.builder.npcs.find((n) => this.player.position.distanceTo(n.object.position) < 2.4);
    const treasure = world.treasureManager.nearest(this.player.position);
    const portalReady = world.portal.unlocked && this.player.position.distanceTo(world.portal.position) < 2.8;
    const boss = world.monsters?.boss();
    const nearBoss = boss?.alive && boss.horizDist(this.player.position) < 3.6;

    if (treasure) this.hud.setInteract(treasure.isBoss || nearBoss ? "กด E เพื่อท้าทายบอส (เขียนโค้ด)" : "กด E เพื่อเปิดกล่องสมบัติ");
    else if (nearBoss) this.hud.setInteract("กด E เพื่อท้าทายบอส (เขียนโค้ด)");
    else if (portalReady) this.hud.setInteract("กด E เพื่อเข้าประตูป่า");
    else if (npc) this.hud.setInteract(npc.message);
    else this.hud.setInteract(null);

    if (!this.input.consumeInteract()) return;
    if (treasure || (nearBoss && world.treasureManager.items.find((t) => t.isBoss && !t.unlocked))) {
      const target = treasure || world.treasureManager.items.find((t) => t.isBoss);
      if (!target) return;
      const q = this.questions.get(target.questionId);
      if (!q) return;
      this.audio.play("interact");
      this.activeTreasure = target;
      this.state = GameState.CODING;
      this.input.setEnabled(false);
      this.hud.show(false);
      if (world.monsters) world.monsters.paused = true;
      this.coding.open(q, {
        eyebrow: `WORLD ${world.level.id} • ${target.isBoss ? "FINAL BOSS" : target.id.toUpperCase()}`
      });
    } else if (portalReady) this._openPortal();
  }

  _onCodingFinish({ success, question }) {
    document.getElementById("screen-coding").classList.add("hidden");
    this.input.setEnabled(true);
    this.state = GameState.PLAYING;
    this.hud.show(true);
    if (this.worlds.current?.monsters) this.worlds.current.monsters.paused = false;
    if (success && this.activeTreasure) {
      this.activeTreasure.unlocked = true;
      const isBoss = this.activeTreasure.isBoss || question.isBoss;
      this.score.solveQuestion(question.id, isBoss);
      this.score.unlockTreasure(this.activeTreasure.id, isBoss);
      this.audio.play("treasure");
      this.hud.toast(isBoss ? "CODING MASTER! +500" : "TREASURE UNLOCKED! +100", "success");
      this.hud.setScore(this.score.score);
      this.player.setState("success");
      const world = this.worlds.current;
      if (!isBoss && world.treasureManager.unlockedCount() >= world.treasureManager.total()) {
        world.portal.setUnlocked(true);
        this.audio.play("portal");
        this.hud.toast("ประตูป่าเปิดแล้ว!", "gold");
      }
      if (isBoss) {
        world.monsters?.boss()?.defeat();
        this.hud.setBoss(null);
        this.endGame("ภารกิจสำเร็จ");
      }
      this._save();
    }
    this.activeTreasure = success ? null : this.activeTreasure;
    this._refreshHud();
  }

  _openPortal() {
    const current = this.worlds.worldId;
    const max = this.settings.numberOfWorlds || 5;
    const next = current >= max ? 6 : current + 1;
    if (current === 6 || (current >= max && current === 6)) {
      this.endGame("ภารกิจสำเร็จ");
      return;
    }
    this.audio.play("portal");
    const level = this.levels.find((w) => w.id === next);
    this.hud.toast(next === 6 ? "เข้าสู่ภารกิจสุดท้าย!" : `เข้าสู่ ${level?.nameTh || `โลก ${next}`}`, "gold");
    this._goWorld(next);
  }

  async _goWorld(id) {
    document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));
    try {
      await this._enterWorld(id);
    } catch (err) {
      console.error("[goWorld]", err);
      this.hud.toast("โหลดด่านไม่สำเร็จ", "error");
      return;
    }
    this.state = GameState.PLAYING;
    this.hud.show(true);
    this.input.setEnabled(true);
  }

  _refreshHud() {
    const world = this.worlds?.current;
    if (!world || !this.score) return;
    this.hud.setScore(this.score.score);
    this.hud.setWorld(
      world.level,
      world.treasureManager.unlockedCount(),
      world.treasureManager.total(),
      this.score.coins,
      this.score.correct,
      this.questions.bank.questions.length
    );
  }

  _updateCompass(world) {
    const locked = world.treasureManager?.items.filter((t) => !t.unlocked) || [];
    if (!locked.length) {
      this.hud.setCompass(null);
      return;
    }
    let nearest = locked[0];
    let best = Infinity;
    locked.forEach((t) => {
      const d = this.player.position.distanceTo(t.position);
      if (d < best) {
        best = d;
        nearest = t;
      }
    });
    const dx = nearest.position.x - this.player.position.x;
    const dz = nearest.position.z - this.player.position.z;
    const fx = -Math.sin(this.camera.yaw);
    const fz = -Math.cos(this.camera.yaw);
    const ang = Math.atan2(dx, dz) - Math.atan2(fx, fz);
    this.hud.setCompass(ang, best);
  }

  endGame(reason) {
    if (this._ended) return;
    this._ended = true;
    this.state = GameState.RESULT;
    this.timer?.stop();
    this.input.setEnabled(false);
    this.audio.play("complete");
    this._recordScore(reason);
    const used = (this.timer?.total || 0) - (this.timer?.left || 0);
    const rank = rankOf(this.score?.score || 0);
    try {
      this.resultUI.show(this, {
        rank,
        score: this.score?.score || 0,
        treasures: this.score?.treasures || 0,
        treasureMax: this.questions?.bank?.questions?.length || 16,
        correct: this.score?.correct || 0,
        wrong: this.score?.wrong || 0,
        hints: this.score?.hints || 0,
        monsters: this.score?.monsters || 0,
        time: this.timer?.format(this.timer.left) || "00:00",
        timeUsed: used,
        world: this.worlds?.worldId || 1,
        reason
      });
    } catch (err) {
      console.error("[endGame]", err);
      this.showScreen("screen-result");
    }
    localStorage.removeItem(SAVE_KEY);
  }

  _recordScore(reason = "") {
    if (this._scoreSaved || !this.score) return;
    const played = this.score.score > 0 || this.score.treasures > 0 || this.score.correct > 0;
    if (!played) return;
    this._scoreSaved = true;
    const used = (this.timer?.total || 0) - (this.timer?.left || 0);
    Leaderboard.add({
      name: this.playerInfo?.name || "ผู้เล่น",
      grade: `${this.playerInfo?.grade || ""}/${this.playerInfo?.room || ""}`,
      school: this.playerInfo?.school || "",
      score: this.score.score,
      treasures: this.score.treasures,
      correct: this.score.correct,
      wrong: this.score.wrong,
      time: this.timer?.format(this.timer.left) || "00:00",
      timeUsed: used,
      world: this.worlds?.worldId || 1,
      reason,
      date: new Date().toISOString()
    }).catch((err) => console.warn("[Leaderboard] add failed", err));
  }

  _save() {
    if (!this.score || !this.worlds.current) return;
    const p = this.player.position;
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        player: this.playerInfo,
        worldId: this.worlds.worldId,
        pos: [p.x, p.y, p.z],
        yaw: this.player.yaw,
        score: this.score,
        timeLeft: this.timer?.left,
        unlocked: [...this.score.unlocked]
      })
    );
  }

  _createLobby() {
    this.lobby = new THREE.Group();
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 3.8, 0.16, 28),
      new THREE.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 0.92 })
    );
    const { object, animations } = this.assets.clone("player");
    object.position.y = 0.05;
    this.lobbyMixer = animations.length ? new THREE.AnimationMixer(object) : null;
    if (this.lobbyMixer) {
      const idle = animations.find((c) => c.name.toLowerCase().includes("idle")) || animations[0];
      this.lobbyMixer.clipAction(idle).play();
    }
    const tree = this.assets.clone("tree").object;
    tree.position.set(2.6, 0, 1.4);
    tree.scale.multiplyScalar(0.7);
    const tent = this.assets.clone("tentSmall").object;
    tent.position.set(-2.4, 0, -1.1);
    tent.rotation.y = 0.6;
    const fire = this.assets.clone("campfire").object;
    fire.position.set(1.6, 0, -1.6);
    this.lobby.add(pad, object, tree, tent, fire);
    this.sceneMgr.scene.add(this.lobby);
    this.sceneMgr.setTheme({
      sky: 0x87c6e8, fog: 0x9ec9a8, fogNear: 14, fogFar: 48, ambient: 0xc8e8b0, dir: 0xfff4d2
    });
  }

  _setLoading(p, text) {
    document.getElementById("loading-bar").style.width = `${Math.round(p * 100)}%`;
    document.getElementById("loading-pct").textContent = `${Math.round(p * 100)}%`;
    if (text) document.getElementById("loading-text").textContent = text;
  }

  _bindUnlock() {
    const once = () => {
      this.audio.unlock().then(() => this.audio.startMusic());
      window.removeEventListener("pointerdown", once);
    };
    window.addEventListener("pointerdown", once);
  }

  _popupScore(kind) {
    this.hud.setScore(this.score.score);
    if (kind === "wrong") this.hud.toast("-30", "error");
  }
}

function fetchJSON(url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(url);
    return r.json();
  });
}

function rankOf(score) {
  if (score >= 3500) return "S RANK";
  if (score >= 2500) return "A RANK";
  if (score >= 1600) return "B RANK";
  if (score >= 800) return "C RANK";
  return "D RANK";
}
