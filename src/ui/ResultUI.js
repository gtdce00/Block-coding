export class ResultUI {
  show(game, stats) {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    set("result-rank", stats.rank);
    set("result-name", game.playerInfo?.name || "ผู้เล่น");
    set("result-score", Number(stats.score || 0).toLocaleString());
    const box = document.getElementById("result-stats");
    if (box) {
      box.innerHTML = `
      <div>TREASURE<br><strong>${stats.treasures} / ${stats.treasureMax}</strong></div>
      <div>CORRECT<br><strong>${stats.correct}</strong></div>
      <div>WRONG<br><strong>${stats.wrong}</strong></div>
      <div>HINT USED<br><strong>${stats.hints}</strong></div>
      <div>MONSTER<br><strong>${stats.monsters || 0}</strong></div>
      <div>TIME<br><strong>${stats.time}</strong></div>
      <div>LEVEL<br><strong>WORLD ${stats.world}</strong></div>
    `;
    }
    game.showScreen("screen-result");
  }
}
