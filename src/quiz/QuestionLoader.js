export class QuestionLoader {
  static async load() {
    const res = await fetch("data/questions.json");
    if (!res.ok) throw new Error("โหลดคลังคำถามไม่สำเร็จ กรุณาเปิดเกมผ่าน Local Server");
    return res.json();
  }
}
