const KEY = "rm3d_leaderboard";
const API = "api/leaderboard";
const STATUS = "api/status";

export class Leaderboard {
  static online = false;
  static lanUrl = "";
  static sheets = false;
  static sheetsUrl = "";

  static isLanHost() {
    const host = location.hostname;
    return host === "localhost" || host === "127.0.0.1" || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  }

  static async ping() {
    if (!this.isLanHost()) {
      this.online = false;
      this.lanUrl = "";
      return false;
    }
    try {
      const res = await fetch(STATUS, { cache: "no-store" });
      if (!res.ok) {
        this.online = false;
        this.sheets = false;
        return false;
      }
      const info = await res.json();
      this.online = !!info.online;
      this.lanUrl = info.lan || "";
      this.sheets = !!info.sheets;
      return this.online;
    } catch {
      this.online = false;
      this.lanUrl = "";
      this.sheets = false;
      return false;
    }
  }

  static loadLocal() {
    try {
      const rows = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  static saveLocal(rows) {
    try {
      localStorage.setItem(KEY, JSON.stringify((rows || []).slice(0, 50)));
    } catch (err) {
      console.warn("[Leaderboard] local save failed", err);
    }
  }

  static async load() {
    if (await this.ping()) {
      const res = await fetch(API, { cache: "no-store" });
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];
      this.saveLocal(list);
      return list;
    }
    return this.loadLocal();
  }

  static async add(entry) {
    const row = {
      name: entry.name || "ผู้เล่น",
      grade: entry.grade || "",
      school: entry.school || "",
      score: Number(entry.score) || 0,
      treasures: Number(entry.treasures) || 0,
      correct: Number(entry.correct) || 0,
      wrong: Number(entry.wrong) || 0,
      time: entry.time || "00:00",
      timeUsed: Number(entry.timeUsed) || 0,
      world: Number(entry.world) || 1,
      reason: entry.reason || "",
      date: entry.date || new Date().toISOString()
    };
    if (this.online || (await this.ping())) {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row)
      });
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];
      this.saveLocal(list);
      if (!this.sheets) this.pushSheets(row);
      return list;
    }
    this.pushSheets(row);
    const rows = this.loadLocal();
    rows.push(row);
    rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.treasures !== a.treasures) return b.treasures - a.treasures;
      if (b.correct !== a.correct) return b.correct - a.correct;
      return (a.timeUsed || 0) - (b.timeUsed || 0);
    });
    this.saveLocal(rows);
    return rows;
  }

  static async reset() {
    if (this.online || (await this.ping())) {
      await fetch(API, { method: "DELETE" });
    }
    this.saveLocal([]);
  }

  static sheetsReady() {
    return this.sheets || (this.sheetsUrl || "").startsWith("https://script.google.com/");
  }

  static pushSheets(row) {
    const url = this.sheetsUrl || "";
    if (!url.startsWith("https://script.google.com/")) return;
    fetch(url, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(row)
    }).catch((err) => console.warn("[Leaderboard] sheets", err));
  }

  static async saveSheetsUrl(url) {
    this.sheetsUrl = String(url || "").trim();
    if (!(this.online || (await this.ping()))) return;
    const res = await fetch("api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: this.sheetsUrl })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "บันทึกลิงก์ชีตไม่สำเร็จ");
    this.sheets = !!data.sheets;
  }

  static async testSheets() {
    if (this.online || (await this.ping())) {
      const res = await fetch("api/sheets-test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "ยังไม่ได้วางลิงก์ Google Sheets");
      return;
    }
    if (!this.sheetsUrl.startsWith("https://script.google.com/")) {
      throw new Error("ยังไม่ได้วางลิงก์ Google Sheets");
    }
    this.pushSheets({
      name: "ทดสอบระบบ",
      grade: "-",
      school: "-",
      score: 0,
      treasures: 0,
      correct: 0,
      wrong: 0,
      time: "00:00",
      timeUsed: 0,
      world: 1,
      reason: "ทดสอบ Google Sheets",
      date: new Date().toISOString()
    });
  }

  static sheetsNote() {
    return this.sheetsReady() ? "  •  ส่งคะแนนเข้า Google Sheets" : "";
  }

  static async render(tbody, statusEl) {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" class="leaderboard-empty">กำลังโหลดอันดับ...</td></tr>`;
    let rows = [];
    try {
      rows = await this.load();
    } catch (err) {
      console.warn("[Leaderboard]", err);
    }
    if (statusEl) {
      statusEl.textContent = this.online
        ? `โหมดออนไลน์ (LAN) — ทุกเครื่องใช้กระดานเดียวกัน${this.lanUrl ? `  •  ${this.lanUrl}` : ""}${this.sheetsNote()}`
        : `โหมดเว็บ — คะแนนเก็บในเบราว์เซอร์เครื่องนี้${this.sheetsNote()}`;
      statusEl.classList.toggle("online", this.online);
    }
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="leaderboard-empty">${
        this.online ? "ยังไม่มีคะแนนบนกระดานกลาง" : "ยังไม่มีคะแนนบนเครื่องนี้"
      }</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map(
        (r, i) => `<tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(r.name)}</td>
          <td>${escapeHtml(r.grade)}</td>
          <td class="mono">${Number(r.score).toLocaleString()}</td>
          <td>${r.treasures ?? 0}</td>
          <td>${r.correct ?? 0}</td>
          <td>${r.wrong ?? 0}</td>
          <td class="mono">${escapeHtml(r.time)}</td>
        </tr>`
      )
      .join("");
  }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
