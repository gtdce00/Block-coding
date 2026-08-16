const DEFAULTS = {
  correct: 100,
  firstTryBonus: 50,
  treasure: 100,
  coin: 10,
  energy: 10,
  secretTreasure: 300,
  finalBoss: 500,
  monster: 40,
  bossHit: 80,
  wrong: -30,
  hint: -20
};

export class ScoreManager {
  constructor(settings) {
    this.settings = { ...DEFAULTS, ...(settings || {}) };
    this.reset();
  }

  reset() {
    this.score = 0;
    this.coins = 0;
    this.correct = 0;
    this.wrong = 0;
    this.hints = 0;
    this.treasures = 0;
    this.secrets = 0;
    this.monsters = 0;
    this.firstFail = new Set();
    this.unlocked = new Set();
  }

  add(amount, reason) {
    this.score = Math.max(0, this.score + amount);
    return { amount, reason, score: this.score };
  }

  collectCoin() {
    this.coins += 1;
    return this.add(this.settings.coin, "coin");
  }

  useHint() {
    this.hints += 1;
    return this.add(this.settings.hint, "hint");
  }

  failQuestion(id) {
    this.wrong += 1;
    this.firstFail.add(id);
    return this.add(this.settings.wrong, "wrong");
  }

  solveQuestion(id, isBoss) {
    this.correct += 1;
    let gained = this.settings.correct;
    if (!this.firstFail.has(id)) gained += this.settings.firstTryBonus;
    if (isBoss) gained += this.settings.finalBoss;
    return this.add(gained, "correct");
  }

  unlockTreasure(id, isBoss) {
    if (this.unlocked.has(id)) return this.add(0, "already");
    this.unlocked.add(id);
    this.treasures += 1;
    return this.add(isBoss ? 0 : this.settings.treasure, "treasure");
  }

  collectSecret() {
    this.secrets += 1;
    return this.add(this.settings.secretTreasure, "secret");
  }

  stompMonster(isBoss) {
    this.monsters += 1;
    return this.add(isBoss ? (this.settings.bossHit || 80) : (this.settings.monster || 40), "monster");
  }
}
