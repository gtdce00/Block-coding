"""Simulate a full campaign: all worlds, treasures, official solutions, scoring, portals."""
import json
import sys
from pathlib import Path

from validate_questions import validate

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]


def flatten(blocks, out=None):
    out = out if out is not None else []
    for b in blocks or []:
        out.append(b["type"])
        if b.get("children"):
            flatten(b["children"], out)
    return out


def js_validate(q, blocks=None):
    payload = dict(q)
    if blocks is not None:
        payload = {**q, "solution": blocks}
    errors = validate(payload)
    used = flatten(payload.get("solution") or [])
    if not payload.get("solution"):
        errors.append("no solution")
    allowed = set(q.get("availableBlocks") or [])
    if allowed:
        extra = [t for t in used if t not in allowed]
        if extra:
            errors.append(f"uses unavailable {extra}")
    for t in q.get("mustUse") or []:
        if t not in used:
            errors.append(f"mustUse missing {t}")
    if q.get("maxBlocks") and len(payload.get("solution") or []) > q["maxBlocks"]:
        errors.append(f"too many top-level blocks {len(payload['solution'])}>{q['maxBlocks']}")
    return errors


def score_campaign(levels, questions):
    scores = {
        "correct": 100,
        "firstTryBonus": 50,
        "treasure": 100,
        "finalBoss": 500,
        "coin": 10,
        "secretTreasure": 300,
    }
    by_id = {q["id"]: q for q in questions}
    score = 0
    correct = 0
    treasures = 0
    log = []
    number_of_worlds = 5

    for world in levels:
        wid = world["id"]
        if wid > number_of_worlds and wid != 6:
            continue
        if wid == 6 and treasures < 15:
            log.append(("FAIL", f"entered boss with only {treasures} treasures"))
        log.append(("WORLD", f"{wid} {world['nameTh']}"))
        unlocked = 0
        for spec in world["treasures"]:
            q = by_id.get(spec["questionId"])
            if not q:
                log.append(("FAIL", f"missing {spec['questionId']}"))
                continue
            if q.get("startBlocks"):
                start_errs = js_validate(q, q["startBlocks"])
                if not start_errs:
                    log.append(("FAIL", f"{q['id']} startBlocks already solves the puzzle"))
            errs = js_validate(q)
            if errs:
                log.append(("FAIL", f"{spec['id']} {q['id']} {q.get('title')} :: {'; '.join(errs)}"))
                continue
            is_boss = bool(spec.get("isBoss") or q.get("isBoss"))
            gained = scores["correct"] + scores["firstTryBonus"]
            if is_boss:
                gained += scores["finalBoss"]
            score += gained
            if not is_boss:
                score += scores["treasure"]
            correct += 1
            treasures += 1
            unlocked += 1
            log.append(
                (
                    "OK",
                    f"{world['nameTh']} / {spec['id']} / {q['id']} {q.get('titleTh') or q.get('title')}  score={score}",
                )
            )
            if is_boss:
                log.append(("WIN", f"boss cleared score={score}"))
        coins = len(world.get("coins") or [])
        score += coins * scores["coin"]
        if world.get("secret"):
            score += scores["secretTreasure"]
            log.append(("OK", f"secret + coins in world {wid}, score={score}"))
        else:
            log.append(("OK", f"coins in world {wid}, score={score}"))
        if wid != 6 and unlocked < len(world["treasures"]):
            log.append(("FAIL", f"portal locked world {wid} unlocked={unlocked}"))
        elif wid < number_of_worlds:
            log.append(("PORTAL", f"world {wid} -> {wid + 1}"))
        elif wid == number_of_worlds:
            log.append(("PORTAL", "world 5 -> boss 6"))
    return score, correct, treasures, log


def walkable(levels):
    """Treasures sit beside the dirt path; spawn should reach them without overlapping camp collision."""
    issues = []
    camp_boxes = [
        # tent / tentSmall / fence near spawn (0,18)
        (4.2, 19.6, 1.35),
        (-4.4, 19.2, 1.1),
        (6.2, 18.2, 0.25),
        (-6.2, 18.2, 0.25),
    ]
    player_r = 0.42
    for world in levels:
        sx, _, sz = world["spawn"]
        for spec in world["treasures"]:
            x, _, z = spec["position"]
            # stay near path then step to chest
            if abs(x) > 8:
                issues.append(f"{world['id']}/{spec['id']} too far from path x={x}")
            if z > sz + 2:
                issues.append(f"{world['id']}/{spec['id']} behind spawn")
            for cx, cz, r in camp_boxes:
                dx, dz = x - cx, z - cz
                if dx * dx + dz * dz < (r + 1.2) ** 2 and world["id"] != 6:
                    # only warn if chest overlaps camp; world 1-5 chests are at z=6,-10,-26
                    if abs(z - sz) < 4:
                        issues.append(f"{world['id']}/{spec['id']} overlaps camp")
            # path trees at x=+-8.4
            if abs(abs(x) - 8.4) < 0.42 + player_r + 0.4:
                issues.append(f"{world['id']}/{spec['id']} too close to path trees")
    return issues


def main():
    questions = json.loads((ROOT / "data/questions.json").read_text(encoding="utf-8"))["questions"]
    levels = json.loads((ROOT / "data/levels.json").read_text(encoding="utf-8"))["worlds"]
    score, correct, treasures, log = score_campaign(levels, questions)
    path_issues = walkable(levels)
    fails = [row for row in log if row[0] == "FAIL"]
    print("=== PLAYTHROUGH ===")
    for kind, msg in log:
        print(f"[{kind}] {msg}")
    print("=== PATH ===")
    if path_issues:
        for p in path_issues:
            print("[PATH]", p)
    else:
        print("[PATH] spawn -> 3 chests -> portal is clear on all worlds")
    print("=== SUMMARY ===")
    print(f"correct={correct}/{len(questions)} treasures={treasures} score={score}")
    print(f"fails={len(fails)} path_issues={len(path_issues)}")
    raise SystemExit(1 if fails or path_issues else 0)


if __name__ == "__main__":
    main()
