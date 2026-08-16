export class QuestionManager {
  constructor(bank) {
    this.bank = bank;
    this.byId = new Map(bank.questions.map((q) => [q.id, q]));
  }

  get(id) {
    return this.byId.get(id);
  }
}
