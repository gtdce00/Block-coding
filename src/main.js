import { Game } from "./core/Game.js";

try {
  const game = new Game();
  game.init().catch((err) => {
    console.error("[Robot Mission 3D]", err);
    const el = document.getElementById("loading-text");
    if (el) el.textContent = "เกิดข้อผิดพลาดตอนเริ่มเกม ดู Console สำหรับรายละเอียด";
  });
  window.__RM3D = game;
} catch (err) {
  console.error("[Robot Mission 3D] constructor", err);
  const el = document.getElementById("loading-text");
  if (el) el.textContent = "เกิดข้อผิดพลาดตอนเริ่มเกม ดู Console สำหรับรายละเอียด";
}
