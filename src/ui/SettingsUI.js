import { Leaderboard } from "../score/Leaderboard.js";

const STORAGE = "rm3d_settings";

export class SettingsUI {
  constructor(game) {
    this.game = game;
    this.form = document.getElementById("settings-form");
    document.querySelector("[data-action='save-settings']").onclick = () => this.save();
    document.querySelector("[data-action='reset-settings']").onclick = () => this.reset();
    document.querySelector("[data-action='reset-leaderboard']").onclick = async () => {
      if (!confirm("ล้างอันดับคะแนนทั้งหมด?")) return;
      await Leaderboard.reset();
      game.hud?.toast("ล้าง Leaderboard แล้ว", "gold");
    };
    document.querySelector("[data-action='test-sheets']").onclick = async () => {
      try {
        const url = document.getElementById("set-sheets-url").value.trim();
        await Leaderboard.saveSheetsUrl(url);
        await Leaderboard.testSheets();
        game.hud?.toast("ส่งแถวทดสอบไป Google Sheets แล้ว", "gold");
      } catch (err) {
        game.hud?.toast(err.message || "ส่งชีตไม่สำเร็จ", "error");
      }
    };
    document.getElementById("set-time-preset").onchange = (e) => {
      if (e.target.value !== "custom") document.getElementById("set-time").value = e.target.value;
    };
  }

  open() {
    this.sync();
    this.game.showScreen("screen-settings");
  }

  sync() {
    const s = this.game.settings;
    document.getElementById("set-time").value = s.gameTimeMinutes;
    const preset = document.getElementById("set-time-preset");
    const mins = String(s.gameTimeMinutes);
    preset.value = [...preset.options].some((o) => o.value === mins) ? mins : "custom";
    document.getElementById("set-correct").value = s.scores.correct;
    document.getElementById("set-wrong").value = s.scores.wrong;
    document.getElementById("set-treasure").value = s.scores.treasure;
    document.getElementById("set-secret").value = s.scores.secretTreasure;
    document.getElementById("set-hint").value = s.scores.hint;
    document.getElementById("set-difficulty").value = s.difficulty;
    document.getElementById("set-worlds").value = s.numberOfWorlds;
    document.getElementById("set-uiscale").value = s.uiScale;
    document.getElementById("set-sound").checked = s.sound;
    document.getElementById("set-music").checked = s.music;
    document.getElementById("set-explain").checked = s.showExplanation;
    document.getElementById("set-fullscreen").checked = s.fullscreen;
    document.getElementById("set-sheets-url").value = s.googleSheetsWebhookUrl || Leaderboard.sheetsUrl || "";
  }

  read() {
    const minutes = Number(document.getElementById("set-time").value) || 50;
    return {
      ...this.game.defaultSettings,
      gameTimeMinutes: minutes,
      scores: {
        ...this.game.defaultSettings.scores,
        correct: Number(document.getElementById("set-correct").value),
        wrong: Number(document.getElementById("set-wrong").value),
        treasure: Number(document.getElementById("set-treasure").value),
        secretTreasure: Number(document.getElementById("set-secret").value),
        hint: Number(document.getElementById("set-hint").value)
      },
      difficulty: document.getElementById("set-difficulty").value,
      numberOfWorlds: Number(document.getElementById("set-worlds").value),
      uiScale: Number(document.getElementById("set-uiscale").value),
      sound: document.getElementById("set-sound").checked,
      music: document.getElementById("set-music").checked,
      showExplanation: document.getElementById("set-explain").checked,
      fullscreen: document.getElementById("set-fullscreen").checked,
      googleSheetsWebhookUrl: document.getElementById("set-sheets-url").value.trim()
    };
  }

  async save() {
    const next = this.read();
    this.game.applySettings(next);
    localStorage.setItem(STORAGE, JSON.stringify(this.game.settings));
    try {
      await Leaderboard.saveSheetsUrl(next.googleSheetsWebhookUrl || "");
    } catch (err) {
      this.game.hud?.toast(err.message || "บันทึกลิงก์ชีตไม่สำเร็จ", "wrong");
      return;
    }
    this.game.audio.play("button");
    this.game.goMenu();
  }

  reset() {
    localStorage.removeItem(STORAGE);
    this.game.applySettings(this.game.defaultSettings);
    this.sync();
  }

  static loadOverride() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) || "null");
    } catch {
      return null;
    }
  }
}
