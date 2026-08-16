import { Leaderboard } from "../score/Leaderboard.js";

export class MainMenu {
  constructor(game) {
    this.game = game;
    document.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => this.handle(btn.dataset.action));
    });
    document.getElementById("register-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.game.startMission({
        name: document.getElementById("reg-name").value.trim(),
        grade: document.getElementById("reg-grade").value,
        room: document.getElementById("reg-room").value.trim(),
        school: document.getElementById("reg-school").value.trim()
      });
    });
    this.refreshNetStatus();
  }

  async refreshNetStatus() {
    const el = document.getElementById("net-status");
    if (!el) return;
    const online = await Leaderboard.ping();
    el.textContent = online
      ? `กระดานออนไลน์พร้อมแล้ว — เครื่องอื่นเปิด ${Leaderboard.lanUrl || "URL ของเครื่องโฮสต์"}${Leaderboard.sheetsNote()}`
      : `เล่นบนเว็บได้เลย — คะแนนเก็บในเบราว์เซอร์เครื่องนี้${Leaderboard.sheetsNote()}`;
    el.classList.toggle("online", online);
  }

  handle(action) {
    this.game.audio.play("button");
    const map = {
      register: () => this.game.showScreen("screen-register"),
      menu: () => {
        if (this.game.state === "paused") this.game.showScreen("screen-pause");
        else this.game.goMenu();
        this.refreshNetStatus();
      },
      leaderboard: () => this.showLeaderboard(),
      howto: () => this.game.showScreen("screen-howto"),
      settings: () => this.game.ui.settings.open(),
      credits: () => this.game.showScreen("screen-credits"),
      resume: () => this.game.resume(),
      "quit-menu": () => this.game.confirmQuit()
    };
    map[action]?.();
  }

  async showLeaderboard() {
    this.game.showScreen("screen-leaderboard");
    try {
      await Leaderboard.render(
        document.getElementById("leaderboard-body"),
        document.getElementById("leaderboard-status")
      );
    } catch (err) {
      console.error("[Leaderboard]", err);
    }
  }
}
