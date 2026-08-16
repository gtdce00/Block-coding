import { runProgram } from "./CodeExecutor.js";
import { BLOCK_META } from "./Block.js";

function flatten(blocks, out = []) {
  blocks.forEach((b) => {
    out.push(b.type);
    if (b.children) flatten(b.children, out);
  });
  return out;
}

export class CodeValidator {
  validate(question, blocks) {
    const { state, frames } = runProgram(question, blocks);
    const used = flatten(blocks);
    const errors = [];

    if (!blocks.length) errors.push("ยังไม่มีบล็อกคำสั่ง");
    if (question.mustUse) {
      question.mustUse.forEach((t) => {
        if (!used.includes(t)) errors.push(`โจทย์นี้ควรใช้บล็อก「${BLOCK_META[t]?.label || t}」`);
      });
    }
    if (question.maxBlocks && blocks.length > question.maxBlocks) {
      errors.push(`ใช้บล็อกหลักได้ไม่เกิน ${question.maxBlocks} ก้อน`);
    }
    if (state.crashed) errors.push(state.crashed);

    const onGoal = state.r === state.goal.r && state.c === state.goal.c;
    if (!onGoal) errors.push("Robot ยังไม่ถึงเป้าหมาย");
    if (question.collectAll && state.energyLeft.length) {
      errors.push("ยังเก็บ Energy ไม่ครบ");
    }

    const ok = errors.length === 0;
    return {
      ok,
      errors,
      frames,
      state,
      message: ok ? "ยอดเยี่ยม! Robot ทำภารกิจสำเร็จ" : errors[0]
    };
  }
}
