import { BlockEditor } from "./BlockEditor.js";
import { CodeValidator } from "./CodeValidator.js";
import { parseMap, DIRS } from "./CodeExecutor.js";
import { BLOCK_META } from "./Block.js";

export class CodingChallenge {
  constructor(audio) {
    this.audio = audio;
    this.editor = new BlockEditor(
      document.getElementById("block-palette"),
      document.getElementById("block-workspace")
    );
    this.validator = new CodeValidator();
    this.canvas = document.getElementById("code-preview");
    this.ctx = this.canvas.getContext("2d");
    this.question = null;
    this.running = false;
    this.onFinish = null;
    this.hintUsed = false;

    document.getElementById("btn-run").onclick = () => this.run();
    document.getElementById("btn-clear").onclick = () => this.editor.clear();
    document.getElementById("btn-hint").onclick = () => this.showHint();
    document.getElementById("btn-close-coding").onclick = () => this.close(false);
  }

  open(question, meta) {
    this.question = question;
    this.hintUsed = false;
    this.running = false;
    document.getElementById("coding-world").textContent = meta.eyebrow;
    document.getElementById("coding-title").textContent = question.title;
    document.getElementById("coding-question").textContent = question.question;
    document.getElementById("coding-status").textContent = "จัดบล็อกแล้วกด RUN CODE";
    document.getElementById("coding-result").classList.add("hidden");
    this.editor.load(question.availableBlocks, question.startBlocks || []);
    this.drawFrame(this._initialFrame());
    document.getElementById("screen-coding").classList.remove("hidden");
  }

  close(success) {
    document.getElementById("screen-coding").classList.add("hidden");
    document.getElementById("coding-result").classList.add("hidden");
    this.onFinish?.({ success, hintUsed: this.hintUsed, question: this.question });
  }

  showHint() {
    this.hintUsed = true;
    document.getElementById("coding-status").textContent = `คำใบ้: ${this.question.hint}`;
    this.audio.play("button");
    this.onHint?.();
  }

  async run() {
    if (this.running || !this.question) return;
    this.running = true;
    const program = this.editor.toProgram();
    const result = this.validator.validate(this.question, program);
    document.getElementById("coding-status").textContent = "กำลังรันโค้ด...";
    await this.playFrames(result.frames);
    this.showResult(result);
    this.running = false;
  }

  showResult(result) {
    const box = document.getElementById("coding-result");
    box.classList.remove("hidden");
    const solutionHtml = this.question.solution
      ? `<p><strong>คำตอบที่ถูกต้องคือ</strong></p><p>${formatSolution(this.question.solution)}</p>`
      : "";
    if (result.ok) {
      this.audio.play("correct");
      box.innerHTML = `<div class="result-box ok">
        <h3>CODE SUCCESS!</h3>
        <p>ยอดเยี่ยม! Robot ทำภารกิจสำเร็จ</p>
        <div class="btn-row"><button class="btn btn-primary" id="coding-ok">รับสมบัติ</button></div>
      </div>`;
      document.getElementById("coding-ok").onclick = () => this.close(true);
    } else {
      this.audio.play("wrong");
      box.innerHTML = `<div class="result-box bad">
        <h3>CODE ERROR</h3>
        <p>ลองสังเกตลำดับคำสั่งอีกครั้ง</p>
        <p>${result.errors.map((e) => `• ${e}`).join("<br>")}</p>
        ${solutionHtml}
        <p><strong>เพราะว่า</strong> ${this.question.explanation}</p>
        <div class="btn-row"><button class="btn btn-primary" id="coding-retry">ลองใหม่</button></div>
      </div>`;
      document.getElementById("coding-retry").onclick = () => {
        box.classList.add("hidden");
        this.onFail?.();
      };
    }
  }

  _initialFrame() {
    const parsed = parseMap(this.question.map);
    return {
      r: parsed.start.r,
      c: parsed.start.c,
      dir: this.question.startDir ?? 1,
      energyLeft: parsed.energy,
      key: parsed.key,
      openDoors: new Set(),
      crashed: null
    };
  }

  playFrames(frames) {
    return new Promise((resolve) => {
      let i = 0;
      const tick = () => {
        this.drawFrame(frames[i], parseMap(this.question.map));
        i += 1;
        if (i >= frames.length) resolve();
        else setTimeout(tick, 220);
      };
      tick();
    });
  }

  drawFrame(frame, parsed) {
    const ctx = this.ctx;
    const map = this.question.map;
    parsed = parsed || parseMap(map);
    const rows = map.length;
    const cols = map[0].length;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const size = Math.min(w / cols, h / rows);
    const ox = (w - size * cols) / 2;
    const oy = (h - size * rows) / 2;
    ctx.fillStyle = "#d7efc2";
    ctx.fillRect(0, 0, w, h);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * size;
        const y = oy + r * size;
        const ch = map[r][c];
        ctx.fillStyle = tileColor(ch, frame, r, c, parsed);
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        if (parsed.goal.r === r && parsed.goal.c === c) {
          ctx.fillStyle = "#f0c14a";
          ctx.fillRect(x + size * 0.22, y + size * 0.22, size * 0.56, size * 0.56);
        }
      }
    }

    if (frame.key) drawMark(ctx, ox, oy, size, frame.key, "#ffd166", "K");
    (frame.energyLeft || []).forEach((p) => drawMark(ctx, ox, oy, size, p, "#00f5ff", "*"));

    const rx = ox + frame.c * size + size / 2;
    const ry = oy + frame.r * size + size / 2;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate((DIRS[frame.dir].c === 1 ? 0 : DIRS[frame.dir].c === -1 ? Math.PI : DIRS[frame.dir].r === 1 ? Math.PI / 2 : -Math.PI / 2));
    ctx.fillStyle = frame.crashed ? "#ff4d6d" : "#1a6dff";
    ctx.beginPath();
    ctx.moveTo(size * 0.32, 0);
    ctx.lineTo(-size * 0.22, -size * 0.22);
    ctx.lineTo(-size * 0.22, size * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function tileColor(ch, frame, r, c, parsed) {
  if (ch === "#") return "#6b5344";
  if (ch === "X") return "#e85d4c";
  if (ch === "D" && !frame.openDoors?.has?.(`${r},${c}`)) return "#8d6b3a";
  if (parsed.goal.r === r && parsed.goal.c === c) return "#2f8a46";
  return "#b7e08a";
}

function drawMark(ctx, ox, oy, size, p, color, text) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ox + p.c * size + size / 2, oy + p.r * size + size / 2, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#041018";
  ctx.font = `${Math.floor(size * 0.28)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, ox + p.c * size + size / 2, oy + p.r * size + size / 2);
}

function formatSolution(blocks, prefix = "") {
  return blocks
    .map((b) => {
      const name = BLOCK_META[b.type]?.label || b.type;
      if (b.type === "REPEAT") {
        return `${prefix}[${name} ${b.params?.count || 2} ครั้ง] ${formatSolution(b.children || [], prefix + "→ ")}`;
      }
      if (b.type === "IF") return `${prefix}[${name} ${b.params?.condition || ""}] ${formatSolution(b.children || [], prefix + "→ ")}`;
      return `${prefix}[${name}]`;
    })
    .join(" ");
}
