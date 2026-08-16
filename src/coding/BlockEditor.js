import { makeBlock, BLOCK_META, CONDITIONS } from "./Block.js";

function deepClone(blocks) {
  return JSON.parse(JSON.stringify(blocks || []));
}

export class BlockEditor {
  constructor(paletteEl, workspaceEl) {
    this.paletteEl = paletteEl;
    this.workspaceEl = workspaceEl;
    this.blocks = [];
    this.available = [];
    this.onChange = null;
    this._pending = null;
    this.drag = null;
    this._htmlDrag = false;
    this._onWinMove = (e) => this._onPointerMove(e);
    this._onWinUp = (e) => this._onPointerUp(e);
    this._onWinCancel = () => {
      this._pending = null;
      if (this.drag) this._cancelDrag(true);
    };
    window.addEventListener("pointermove", this._onWinMove);
    window.addEventListener("pointerup", this._onWinUp);
    window.addEventListener("pointercancel", this._onWinCancel);
    this._bindHtml5Drop();
  }

  load(available, startBlocks = []) {
    this._cancelDrag(false);
    this.available = available;
    this.blocks = deepClone(startBlocks).map((b) => normalize(b));
    this.renderPalette();
    this.render();
  }

  clear() {
    this._cancelDrag(false);
    this.blocks = [];
    this.render();
  }

  toProgram() {
    return deepClone(this.blocks);
  }

  renderPalette() {
    this.paletteEl.innerHTML = "<p class='workspace-label'>บล็อกคำสั่ง — ลากไปวางหรือคลิก</p>";
    this.available.forEach((type) => {
      const meta = BLOCK_META[type] || { label: type, color: "wait" };
      const btn = document.createElement("div");
      btn.className = `block pal-block ${meta.color}`;
      btn.textContent = meta.label;
      btn.tabIndex = 0;
      btn.setAttribute("role", "button");
      this._bindSource(btn, { from: "palette", type, label: meta.label, color: meta.color });
      this.paletteEl.appendChild(btn);
    });
  }

  render() {
    this.workspaceEl.innerHTML = "";
    this.workspaceEl.dataset.drop = "root";
    if (!this.blocks.length) {
      const empty = document.createElement("p");
      empty.className = "muted drop-empty";
      empty.textContent = "ลากบล็อกจากด้านซ้ายมาวางที่นี่";
      this.workspaceEl.appendChild(empty);
    }
    this.workspaceEl.appendChild(this._slot(null, 0));
    this.blocks.forEach((block, index) => {
      this.workspaceEl.appendChild(this._row(block, this.blocks, index));
      this.workspaceEl.appendChild(this._slot(null, index + 1));
    });
    this.onChange?.(this.blocks);
  }

  _bindSource(el, payload) {
    el.draggable = true;
    el.addEventListener("dragstart", (e) => {
      if (e.target.closest("input, select, .ws-ctrl")) {
        e.preventDefault();
        return;
      }
      this._pending = null;
      this._htmlDrag = true;
      const data = JSON.stringify(payload);
      e.dataTransfer.setData("text/plain", data);
      e.dataTransfer.setData("application/json", data);
      e.dataTransfer.effectAllowed = "copy";
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => {
      this._htmlDrag = false;
      el.classList.remove("dragging");
      this._clearHover();
    });
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("input, select, .ws-ctrl")) return;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      this._pending = {
        x: e.clientX,
        y: e.clientY,
        payload,
        pointerId: e.pointerId,
        el
      };
    });
  }

  _bindHtml5Drop() {
    const onOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      this._clearHover();
      const zone = this._hitDrop(e.clientX, e.clientY);
      (zone || this.workspaceEl).classList.add("drop-hover");
    };
    this.workspaceEl.addEventListener("dragover", onOver, true);
    this.workspaceEl.addEventListener("dragenter", (e) => e.preventDefault(), true);
    this.workspaceEl.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._htmlDrag = false;
      this._clearHover();
      let data = this._readDrag(e);
      if (!data && this._pending?.payload) data = this._pending.payload;
      this._pending = null;
      if (!data) return;
      const hit = this._hitDrop(e.clientX, e.clientY) || this.workspaceEl;
      this._place(data, this._destFromEl(hit));
    });
  }

  _destFromEl(hit) {
    if (!hit || hit === this.workspaceEl) return { kind: "root", parentId: null, nestId: null, index: 0 };
    return {
      kind: hit.dataset.drop || "root",
      parentId: hit.dataset.parentId || null,
      nestId: hit.dataset.nestId || null,
      index: Number(hit.dataset.index || 0)
    };
  }

  _clearHover() {
    this.workspaceEl.classList.remove("drop-hover");
    this.workspaceEl.querySelectorAll(".drop-hover").forEach((n) => n.classList.remove("drop-hover"));
  }

  _readDrag(e) {
    try {
      const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain") || "null";
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  _onPointerMove(e) {
    if (this._htmlDrag) return;
    if (this._pending && !this.drag && this._pending.pointerId === e.pointerId) {
      const dx = e.clientX - this._pending.x;
      const dy = e.clientY - this._pending.y;
      if (dx * dx + dy * dy > 16) this._beginDrag(this._pending.payload, e);
    }
    if (!this.drag) return;
    e.preventDefault();
    this._moveGhost(e.clientX, e.clientY);
    this._highlight(e.clientX, e.clientY);
  }

  _onPointerUp(e) {
    if (this._htmlDrag) {
      this._pending = null;
      return;
    }
    if (this.drag) {
      this._finishDrop(e.clientX, e.clientY);
      return;
    }
    if (this._pending && this._pending.pointerId === e.pointerId && this._pending.payload.from === "palette") {
      const { type } = this._pending.payload;
      this.blocks.push(makeBlock(type, defaultParams(type)));
      this._pending = null;
      this.render();
      return;
    }
    this._pending = null;
  }

  _beginDrag(payload, e) {
    this.drag = { ...payload };
    this._pending = null;
    const ghost = document.createElement("div");
    ghost.className = `block block-ghost ${payload.color || "wait"}`;
    ghost.textContent = payload.label || BLOCK_META[payload.type]?.label || "บล็อก";
    document.body.appendChild(ghost);
    this.drag.ghost = ghost;
    document.body.classList.add("block-dragging");
    this._moveGhost(e.clientX, e.clientY);
    if (payload.from === "ws") {
      this.workspaceEl.querySelector(`[data-block-id="${payload.id}"]`)?.classList.add("dragging");
    }
  }

  _moveGhost(x, y) {
    if (!this.drag?.ghost) return;
    this.drag.ghost.style.left = `${x}px`;
    this.drag.ghost.style.top = `${y}px`;
  }

  _highlight(x, y) {
    this.workspaceEl.querySelectorAll(".drop-hover").forEach((n) => n.classList.remove("drop-hover"));
    this._hitDrop(x, y)?.classList.add("drop-hover");
  }

  _hitDrop(x, y) {
    const zones = [...this.workspaceEl.querySelectorAll("[data-drop]")];
    let best = null;
    let bestArea = Infinity;
    for (const z of zones) {
      const r = z.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const area = r.width * r.height;
      if (area < bestArea) {
        best = z;
        bestArea = area;
      }
    }
    return best;
  }

  _finishDrop(x, y) {
    const hit = this._hitDrop(x, y);
    const drag = this.drag;
    this._cancelDrag(false);
    if (!hit || !drag) {
      this.render();
      return;
    }
    const dest = {
      kind: hit.dataset.drop,
      parentId: hit.dataset.parentId || null,
      nestId: hit.dataset.nestId || null,
      index: Number(hit.dataset.index || 0)
    };
    if (!this._place(drag, dest)) this.render();
  }

  _place(drag, dest) {
    if (drag.from === "ws" && dest.nestId && (dest.nestId === drag.id || this._contains(this._find(drag.id), dest.nestId))) {
      return false;
    }
    if (drag.from === "ws" && dest.parentId && (dest.parentId === drag.id || this._contains(this._find(drag.id), dest.parentId))) {
      return false;
    }

    const src = drag.from === "ws" ? this._locate(drag.id) : null;
    if (drag.from === "ws" && !src) return false;

    let destList = null;
    if (dest.kind === "nest") {
      destList = this._find(dest.nestId)?.children;
      if (!this._find(dest.nestId)) return false;
    } else if (dest.kind === "slot") {
      destList = dest.parentId ? this._find(dest.parentId)?.children : this.blocks;
      if (!destList) return false;
    } else {
      destList = this.blocks;
    }

    let incoming;
    if (src) {
      if (dest.kind === "slot") {
        const sameList = src.list === destList;
        if (sameList && src.index < dest.index) dest.index -= 1;
      }
      incoming = src.list.splice(src.index, 1)[0];
    } else {
      incoming = makeBlock(drag.type, defaultParams(drag.type));
    }

    if (dest.kind === "nest") {
      const nest = this._find(dest.nestId);
      nest.children = nest.children || [];
      nest.children.push(incoming);
    } else if (dest.kind === "slot") {
      const list = dest.parentId ? this._find(dest.parentId).children : this.blocks;
      const idx = Math.max(0, Math.min(dest.index, list.length));
      list.splice(idx, 0, incoming);
    } else {
      this.blocks.push(incoming);
    }
    this.render();
    return true;
  }

  _cancelDrag(rerender = true) {
    this._pending = null;
    if (this.drag?.ghost) this.drag.ghost.remove();
    this.drag = null;
    document.body.classList.remove("block-dragging");
    this.workspaceEl?.querySelectorAll(".dragging, .drop-hover").forEach((n) => {
      n.classList.remove("dragging", "drop-hover");
    });
    if (rerender) this.render?.();
  }

  _slot(parentId, index) {
    const el = document.createElement("div");
    el.className = "drop-slot";
    el.dataset.drop = "slot";
    el.dataset.index = String(index);
    if (parentId) el.dataset.parentId = parentId;
    return el;
  }

  _find(id, list = this.blocks) {
    if (!id) return null;
    for (const b of list) {
      if (b.id === id) return b;
      const found = b.children?.length ? this._find(id, b.children) : null;
      if (found) return found;
    }
    return null;
  }

  _locate(id, list = this.blocks, parent = null) {
    const index = list.findIndex((b) => b.id === id);
    if (index >= 0) return { list, index, parent };
    for (const b of list) {
      if (!b.children?.length) continue;
      const found = this._locate(id, b.children, b);
      if (found) return found;
    }
    return null;
  }

  _contains(parent, childId) {
    if (!parent || !childId) return false;
    if (parent.id === childId) return true;
    return (parent.children || []).some((c) => this._contains(c, childId));
  }

  _row(block, list, index) {
    const meta = BLOCK_META[block.type] || { label: block.type, color: "wait" };
    const wrap = document.createElement("div");
    wrap.className = "ws-wrap";
    wrap.dataset.blockId = block.id;

    const el = document.createElement("div");
    el.className = `block ws-block ${meta.color}`;
    el.dataset.blockId = block.id;

    const grip = document.createElement("span");
    grip.className = "ws-grip";
    grip.textContent = "⋮⋮";
    grip.title = "ลากย้าย";

    const num = document.createElement("span");
    num.className = "ws-num";
    num.textContent = String(index + 1);

    const up = document.createElement("button");
    up.type = "button";
    up.className = "ws-ctrl";
    up.textContent = "↑";
    up.onclick = () => {
      if (index > 0) {
        [list[index - 1], list[index]] = [list[index], list[index - 1]];
        this.render();
      }
    };
    const down = document.createElement("button");
    down.type = "button";
    down.className = "ws-ctrl";
    down.textContent = "↓";
    down.onclick = () => {
      if (index < list.length - 1) {
        [list[index + 1], list[index]] = [list[index], list[index + 1]];
        this.render();
      }
    };

    const label = document.createElement("div");
    label.className = "grow";
    label.textContent = meta.label;

    if (block.type === "REPEAT") {
      const input = document.createElement("input");
      input.type = "number";
      input.min = 1;
      input.max = 12;
      input.value = block.params.count ?? 2;
      input.className = "ws-count";
      input.oninput = () => {
        block.params.count = Math.min(12, Math.max(1, Number(input.value) || 2));
      };
      label.textContent = "ทำซ้ำ";
      label.append(" ", input, " ครั้ง");
    }

    if (block.type === "IF") {
      const sel = document.createElement("select");
      CONDITIONS.forEach((c) => {
        const o = document.createElement("option");
        o.value = c.id;
        o.textContent = c.label;
        sel.appendChild(o);
      });
      sel.value = block.params.condition || "WALL_AHEAD";
      sel.onchange = () => {
        block.params.condition = sel.value;
      };
      label.textContent = "ถ้า ";
      label.appendChild(sel);
    }

    const dup = document.createElement("button");
    dup.type = "button";
    dup.className = "ws-ctrl";
    dup.textContent = "สำเนา";
    dup.onclick = () => {
      list.splice(index + 1, 0, normalize(JSON.parse(JSON.stringify(block))));
      this.render();
    };
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ws-ctrl";
    del.textContent = "ลบ";
    del.onclick = () => {
      list.splice(index, 1);
      this.render();
    };

    el.append(grip, num, up, down, label, dup, del);
    this._bindSource(el, {
      from: "ws",
      id: block.id,
      type: block.type,
      label: meta.label,
      color: meta.color
    });
    wrap.appendChild(el);

    if (meta.nest) {
      block.children = block.children || [];
      const nest = document.createElement("div");
      nest.className = "nested";
      nest.dataset.drop = "nest";
      nest.dataset.nestId = block.id;

      nest.appendChild(this._slot(block.id, 0));
      block.children.forEach((child, i) => {
        nest.appendChild(this._row(child, block.children, i));
        nest.appendChild(this._slot(block.id, i + 1));
      });

      const hint = document.createElement("p");
      hint.className = "nest-drop-hint";
      hint.textContent = "ลากบล็อกมาวางในกรอบนี้";

      const chips = document.createElement("div");
      chips.className = "nest-chips";
      this.available.forEach((type) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `block nest-chip ws-ctrl ${BLOCK_META[type]?.color || "wait"}`;
        chip.textContent = BLOCK_META[type]?.label || type;
        chip.onclick = (ev) => {
          ev.stopPropagation();
          block.children.push(makeBlock(type, defaultParams(type)));
          this.render();
        };
        chips.appendChild(chip);
      });
      nest.append(hint, chips);
      wrap.appendChild(nest);
    }
    return wrap;
  }
}

function defaultParams(type) {
  if (type === "REPEAT") return { count: 2 };
  if (type === "IF") return { condition: "WALL_AHEAD" };
  return {};
}

function normalize(b) {
  return {
    id: b.id || makeBlock(b.type).id,
    type: b.type,
    params: b.params || defaultParams(b.type),
    children: (b.children || []).map(normalize)
  };
}
