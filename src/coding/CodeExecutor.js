const DIRS = [
  { r: -1, c: 0 },
  { r: 0, c: 1 },
  { r: 1, c: 0 },
  { r: 0, c: -1 }
];

export function parseMap(map) {
  const grid = [];
  let start = { r: 1, c: 1 };
  let goal = { r: 1, c: 2 };
  const energy = [];
  let key = null;
  const doors = [];
  const lasers = [];
  map.forEach((row, r) => {
    const cells = [];
    [...row].forEach((ch, c) => {
      if (ch === "S") {
        start = { r, c };
        cells.push(".");
      } else if (ch === "G") {
        goal = { r, c };
        cells.push(".");
      } else if (ch === "*") {
        energy.push({ r, c });
        cells.push(".");
      } else if (ch === "K") {
        key = { r, c };
        cells.push(".");
      } else if (ch === "D") {
        doors.push({ r, c });
        cells.push("D");
      } else if (ch === "X") {
        lasers.push({ r, c });
        cells.push("X");
      } else cells.push(ch);
    });
    grid.push(cells);
  });
  return { grid, start, goal, energy, key, doors, lasers };
}

function cell(state, r, c) {
  if (r < 0 || c < 0 || r >= state.grid.length || c >= state.grid[0].length) return "#";
  return state.grid[r][c];
}

function isBlocked(state, r, c) {
  const t = cell(state, r, c);
  if (t === "#") return true;
  if (t === "D" && !state.openDoors.has(`${r},${c}`)) return true;
  return false;
}

function same(a, b) {
  return a && b && a.r === b.r && a.c === b.c;
}

function consume(list, pos) {
  const i = list.findIndex((p) => same(p, pos));
  if (i >= 0) list.splice(i, 1);
}

export function createState(question) {
  const parsed = parseMap(question.map);
  return {
    ...parsed,
    r: parsed.start.r,
    c: parsed.start.c,
    dir: question.startDir ?? 1,
    hasKey: false,
    energyLeft: parsed.energy.map((p) => ({ ...p })),
    openDoors: new Set(),
    crashed: null,
    steps: 0
  };
}

export function stepBlock(state, block) {
  state.steps += 1;
  if (state.steps > 120) {
    state.crashed = "คำสั่งยาวเกินไป";
    return [state];
  }
  const frames = [];
  const apply = (fn) => {
    fn(state);
    frames.push(snapshot(state));
  };

  switch (block.type) {
    case "MOVE_FORWARD":
      apply(() => tryMove(state, 1, false));
      break;
    case "MOVE_BACKWARD":
      apply(() => tryMove(state, -1, false));
      break;
    case "TURN_LEFT":
      apply(() => {
        state.dir = (state.dir + 3) % 4;
      });
      break;
    case "TURN_RIGHT":
      apply(() => {
        state.dir = (state.dir + 1) % 4;
      });
      break;
    case "JUMP":
      apply(() => tryMove(state, 1, true));
      break;
    case "WAIT":
      apply(() => {});
      break;
    case "COLLECT":
      apply(() => {
        if (state.key && same(state.key, { r: state.r, c: state.c }) && !state.hasKey) {
          state.hasKey = true;
          state.key = null;
        }
        consume(state.energyLeft, { r: state.r, c: state.c });
      });
      break;
    case "OPEN": {
      apply(() => {
        const d = DIRS[state.dir];
        const nr = state.r + d.r;
        const nc = state.c + d.c;
        const hereDoor = cell(state, state.r, state.c) === "D";
        const aheadDoor = cell(state, nr, nc) === "D";
        if (state.hasKey && (hereDoor || aheadDoor)) {
          if (hereDoor) state.openDoors.add(`${state.r},${state.c}`);
          if (aheadDoor) state.openDoors.add(`${nr},${nc}`);
        }
      });
      break;
    }
    case "REPEAT": {
      const n = Math.min(12, Math.max(1, block.params?.count || 1));
      for (let i = 0; i < n; i++) {
        for (const child of block.children || []) {
          frames.push(...stepBlock(state, child));
          if (state.crashed) return frames;
        }
      }
      break;
    }
    case "IF": {
      if (evalCondition(state, block.params?.condition)) {
        for (const child of block.children || []) {
          frames.push(...stepBlock(state, child));
          if (state.crashed) return frames;
        }
      }
      break;
    }
    default:
      break;
  }
  return frames;
}

function evalCondition(state, cond) {
  if (cond === "HAS_KEY") return state.hasKey;
  if (cond === "ON_ENERGY") return state.energyLeft.some((p) => same(p, { r: state.r, c: state.c }));
  const d = DIRS[state.dir];
  return isBlocked(state, state.r + d.r, state.c + d.c);
}

function tryMove(state, sign, jump) {
  const d = DIRS[state.dir];
  const nr = state.r + d.r * sign;
  const nc = state.c + d.c * sign;
  const t = cell(state, nr, nc);
  if (t === "X" && !jump) {
    state.r = nr;
    state.c = nc;
    state.crashed = "Robot ชนเลเซอร์";
    return;
  }
  if (isBlocked(state, nr, nc) && !(jump && t === "X")) {
    return;
  }
  state.r = nr;
  state.c = nc;
}

function snapshot(state) {
  return {
    r: state.r,
    c: state.c,
    dir: state.dir,
    hasKey: state.hasKey,
    energyLeft: state.energyLeft.map((p) => ({ ...p })),
    key: state.key ? { ...state.key } : null,
    openDoors: new Set(state.openDoors),
    crashed: state.crashed
  };
}

export function runProgram(question, blocks) {
  const state = createState(question);
  const frames = [snapshot(state)];
  for (const block of blocks) {
    frames.push(...stepBlock(state, block));
    if (state.crashed) break;
  }
  return { state, frames };
}

export { DIRS };
