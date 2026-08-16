let nid = 1;
export function makeBlock(type, params = {}, children = []) {
  return { id: `b${nid++}`, type, params: { ...params }, children: children.map((c) => ({ ...c })) };
}

export const BLOCK_META = {
  MOVE_FORWARD: { label: "เดินหน้า", color: "move" },
  MOVE_BACKWARD: { label: "ถอยหลัง", color: "move" },
  TURN_LEFT: { label: "เลี้ยวซ้าย", color: "turn" },
  TURN_RIGHT: { label: "เลี้ยวขวา", color: "turn" },
  JUMP: { label: "กระโดด", color: "action" },
  REPEAT: { label: "ทำซ้ำ", color: "loop", nest: true },
  IF: { label: "ถ้า", color: "condition", nest: true },
  COLLECT: { label: "เก็บ", color: "action" },
  OPEN: { label: "เปิด", color: "action" },
  WAIT: { label: "รอ", color: "wait" }
};

export const CONDITIONS = [
  { id: "WALL_AHEAD", label: "เจอกำแพง" },
  { id: "HAS_KEY", label: "มีกุญแจ" },
  { id: "ON_ENERGY", label: "อยู่บน Energy" }
];
