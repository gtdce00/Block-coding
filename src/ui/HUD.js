export class HUD {
  constructor() {
    this.el = document.getElementById("hud");
    this.name = document.getElementById("hud-name");
    this.time = document.getElementById("hud-time");
    this.score = document.getElementById("hud-score");
    this.world = document.getElementById("hud-world");
    this.treasure = document.getElementById("hud-treasure");
    this.coins = document.getElementById("hud-coins");
    this.code = document.getElementById("hud-code");
    this.prompt = document.getElementById("interact-prompt");
    this.promptText = document.getElementById("interact-text");
    this.toasts = document.getElementById("toast-layer");
    this.banner = document.getElementById("world-banner");
    this.minimap = document.getElementById("minimap");
    this.mctx = this.minimap ? this.minimap.getContext("2d") : null;
    this.compass = document.getElementById("compass");
    this.needle = document.getElementById("compass-needle");
    this.compassDist = document.getElementById("compass-dist");
    this.lookHint = document.getElementById("look-hint");
    this.bossBar = document.getElementById("boss-bar");
    this.bossFill = document.getElementById("boss-hp-fill");
    this.bossLabel = document.getElementById("boss-hp-label");
    this.monsterHud = document.getElementById("hud-monsters");
    this.explored = [];
  }

  show(v) {
    if (!this.el) return;
    this.el.classList.toggle("hidden", !v);
  }

  setPlayer(name) {
    this.name.textContent = name;
  }

  setTime(text, left) {
    if (!this.time) return;
    this.time.textContent = text;
    const card = this.time.parentElement;
    card?.classList.toggle("warning", left <= 180 && left > 60);
    card?.classList.toggle("danger", left <= 60);
  }

  setScore(n) {
    this.score.textContent = String(Math.max(0, n)).padStart(4, "0");
  }

  setWorld(world, got, total, coins, correct, totalQ) {
    if (this.world) this.world.textContent = `WORLD ${world.id}  ${world.nameTh}`;
    if (this.treasure) this.treasure.textContent = `TREASURE ${got}/${total}`;
    if (this.coins) this.coins.textContent = String(coins);
    if (this.code) this.code.textContent = `${correct}/${totalQ}`;
  }

  setMonsters(alive, total) {
    if (!this.monsterHud) return;
    if (!total) {
      this.monsterHud.classList.add("hidden");
      return;
    }
    this.monsterHud.classList.remove("hidden");
    this.monsterHud.textContent = `MONSTER ${total - alive}/${total}`;
  }

  setBoss(status) {
    if (!this.bossBar) return;
    if (!status || !status.alive) {
      this.bossBar.classList.add("hidden");
      return;
    }
    this.bossBar.classList.remove("hidden");
    const pct = status.max ? (status.hp / status.max) * 100 : 0;
    if (this.bossFill) this.bossFill.style.width = `${pct}%`;
    if (this.bossLabel) {
      this.bossLabel.textContent = status.stunned
        ? `${status.name} • เซ็งแล้ว! กด E`
        : `${status.name}  ${status.hp}/${status.max}`;
    }
  }

  setInteract(text) {
    if (!this.prompt) return;
    if (!text) this.prompt.classList.add("hidden");
    else {
      this.prompt.classList.remove("hidden");
      this.promptText.textContent = text;
    }
  }

  toast(text, kind = "") {
    if (!this.toasts) return;
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.textContent = text;
    this.toasts.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }

  showBanner(html) {
    if (!this.banner) return;
    this.banner.innerHTML = html;
    this.banner.classList.remove("hidden");
    setTimeout(() => this.banner.classList.add("hidden"), 2800);
  }

  setLookHint(show) {
    if (!this.lookHint) return;
    this.lookHint.classList.toggle("hidden", !show);
  }

  resetFog() {
    this.explored = [];
  }

  setCompass(angle, dist) {
    if (!this.compass) return;
    if (angle == null || !this.needle) {
      this.compass.classList.add("hidden");
      return;
    }
    this.compass.classList.remove("hidden");
    const deg = (-angle * 180) / Math.PI;
    this.needle.style.transform = `rotate(${deg}deg)`;
    this.compassDist.textContent = dist < 4 ? "ใกล้แล้ว!" : `${Math.round(dist)} ม.`;
  }

  drawMinimap(player, world, radius = 48) {
    const ctx = this.mctx;
    if (!ctx || !this.minimap) return;
    const w = this.minimap.width;
    const h = this.minimap.height;
    ctx.fillStyle = "#1d4a28";
    ctx.fillRect(0, 0, w, h);

    const mapX = (x) => ((x + radius) / (radius * 2)) * w;
    const mapY = (z) => ((z + radius) / (radius * 2)) * h;

    ctx.fillStyle = "#8a6234";
    ctx.fillRect(mapX(-3.6), mapY(-50), mapX(3.6) - mapX(-3.6), mapY(22) - mapY(-50));

    const px = player.position.x;
    const pz = player.position.z;
    this.explored.push({ x: px, z: pz });
    if (this.explored.length > 400) this.explored.shift();

    ctx.fillStyle = "rgba(255,255,210,0.14)";
    this.explored.forEach((p) => {
      ctx.beginPath();
      ctx.arc(mapX(p.x), mapY(p.z), 7, 0, Math.PI * 2);
      ctx.fill();
    });

    if (world.treasureManager) {
      world.treasureManager.items.forEach((t) => {
        ctx.fillStyle = t.unlocked ? "#3dff9a" : "#ffd166";
        ctx.strokeStyle = "#fff8d0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mapX(t.position.x), mapY(t.position.z), 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
    if (world.checkpoint) {
      ctx.fillStyle = "#7ec8ff";
      ctx.fillRect(mapX(world.checkpoint.position.x) - 3, mapY(world.checkpoint.position.z) - 3, 6, 6);
    }
    if (world.portal) {
      ctx.strokeStyle = world.portal.unlocked ? "#ffe08a" : "#445c38";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mapX(world.portal.position.x), mapY(world.portal.position.z), 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    world.monsters?.items.forEach((m) => {
      if (!m.alive) return;
      ctx.fillStyle = m.isBoss ? "#ff6b3d" : "#ff4d6d";
      ctx.beginPath();
      ctx.arc(mapX(m.position.x), mapY(m.position.z), m.isBoss ? 8 : 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = "rgba(255, 209, 102, 0.55)";
    ctx.strokeRect(1, 1, w - 2, h - 2);

    ctx.save();
    ctx.translate(mapX(px), mapY(pz));
    ctx.rotate(player.yaw);
    ctx.fillStyle = "#fff4c4";
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-6, -7);
    ctx.lineTo(6, -7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
