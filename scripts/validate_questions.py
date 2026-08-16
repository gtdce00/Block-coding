import json
from pathlib import Path

DIRS = [(-1, 0), (0, 1), (1, 0), (0, -1)]

def parse_map(rows):
    grid, energy, doors, lasers = [], [], [], []
    start, goal, key = (1, 1), (1, 2), None
    for r, row in enumerate(rows):
        cells = []
        for c, ch in enumerate(row):
            if ch == "S":
                start = (r, c)
                cells.append(".")
            elif ch == "G":
                goal = (r, c)
                cells.append(".")
            elif ch == "*":
                energy.append((r, c))
                cells.append(".")
            elif ch == "K":
                key = (r, c)
                cells.append(".")
            elif ch == "D":
                doors.append((r, c))
                cells.append("D")
            elif ch == "X":
                lasers.append((r, c))
                cells.append("X")
            else:
                cells.append(ch)
        grid.append(cells)
    return grid, start, goal, energy, key, doors, lasers

def cell(state, r, c):
    if r < 0 or c < 0 or r >= len(state["grid"]) or c >= len(state["grid"][0]):
        return "#"
    return state["grid"][r][c]

def blocked(state, r, c):
    t = cell(state, r, c)
    if t == "#":
        return True
    if t == "D" and (r, c) not in state["open"]:
        return True
    return False

def try_move(state, sign, jump):
    dr, dc = DIRS[state["dir"]]
    nr, nc = state["r"] + dr * sign, state["c"] + dc * sign
    t = cell(state, nr, nc)
    if t == "X" and not jump:
        state["r"], state["c"] = nr, nc
        state["crash"] = "laser"
        return
    if blocked(state, nr, nc) and not (jump and t == "X"):
        return
    state["r"], state["c"] = nr, nc

def run_block(state, block):
    t = block["type"]
    if t == "MOVE_FORWARD":
        try_move(state, 1, False)
    elif t == "MOVE_BACKWARD":
        try_move(state, -1, False)
    elif t == "TURN_LEFT":
        state["dir"] = (state["dir"] + 3) % 4
    elif t == "TURN_RIGHT":
        state["dir"] = (state["dir"] + 1) % 4
    elif t == "JUMP":
        try_move(state, 1, True)
    elif t == "WAIT":
        pass
    elif t == "COLLECT":
        if state["key"] == (state["r"], state["c"]):
            state["has_key"] = True
            state["key"] = None
        state["energy"] = [p for p in state["energy"] if p != (state["r"], state["c"])]
    elif t == "OPEN":
        dr, dc = DIRS[state["dir"]]
        nr, nc = state["r"] + dr, state["c"] + dc
        if state["has_key"]:
            if cell(state, state["r"], state["c"]) == "D":
                state["open"].add((state["r"], state["c"]))
            if cell(state, nr, nc) == "D":
                state["open"].add((nr, nc))
    elif t == "REPEAT":
        n = max(1, min(12, block.get("params", {}).get("count", 1)))
        for _ in range(n):
            for child in block.get("children") or []:
                run_block(state, child)
                if state["crash"]:
                    return
    elif t == "IF":
        cond = (block.get("params") or {}).get("condition")
        ok = False
        if cond == "HAS_KEY":
            ok = state["has_key"]
        elif cond == "ON_ENERGY":
            ok = (state["r"], state["c"]) in state["energy"]
        else:
            dr, dc = DIRS[state["dir"]]
            ok = blocked(state, state["r"] + dr, state["c"] + dc)
        if ok:
            for child in block.get("children") or []:
                run_block(state, child)

def validate(q):
    grid, start, goal, energy, key, doors, lasers = parse_map(q["map"])
    widths = {len(row) for row in q["map"]}
    state = {
        "grid": grid,
        "r": start[0],
        "c": start[1],
        "dir": q.get("startDir", 1),
        "has_key": False,
        "energy": list(energy),
        "key": key,
        "open": set(),
        "crash": None,
        "goal": goal,
    }
    for b in q.get("solution") or []:
        run_block(state, b)
        if state["crash"]:
            break
    errors = []
    if len(widths) != 1:
        errors.append("map not rectangular")
    if state["crash"]:
        errors.append(state["crash"])
    if (state["r"], state["c"]) != goal:
        errors.append(f"not at goal at {(state['r'], state['c'])} want {goal}")
    if q.get("collectAll") and state["energy"]:
        errors.append(f"energy left {state['energy']}")
    return errors

def main():
    bank = json.loads(Path("data/questions.json").read_text(encoding="utf-8"))
    fail = 0
    for q in bank["questions"]:
        errors = validate(q)
        print(q["id"], "OK" if not errors else "FAIL", "; ".join(errors))
        fail += bool(errors)
    raise SystemExit(fail)

if __name__ == "__main__":
    main()
