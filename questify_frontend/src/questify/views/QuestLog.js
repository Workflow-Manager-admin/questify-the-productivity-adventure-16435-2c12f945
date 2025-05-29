// PUBLIC_INTERFACE
/**
 * QuestLog: RPG drag-and-drop quest/task management with real-time Firestore sync and polished fantasy UI
 */
export function QuestLog(authCtx, themeCtx, gameCtx, mountNode) {
  let DND_STATE = {
    draggingIndex: null,
    overIndex: null,
    startY: null,
    offsetY: null,
    order: [],
    isSaving: false,
    error: null,
  };
  const mobileBreakpoint = 600;

  function getQuests() {
    // Defensive: always retrieve current quests from GameProvider.
    return Array.isArray(gameCtx.getState().quests) ? [...gameCtx.getState().quests] : [];
  }

  function render() {
    const quests = DND_STATE.order.length ? DND_STATE.order : getQuests();
    mountNode.innerHTML = `
      <section class="rpg-glow-card rpg-fadein" style="max-width:800px;min-width:270px;">
        <h1>🗡️ Quest Log</h1>
        <div style="margin-bottom:1em;">${DND_STATE.error ? `<span style="color:#f43f5e">${DND_STATE.error}</span>` : "Drag quests to change order, check/uncheck to complete."}
          <span style="float:right;font-size:1em">${DND_STATE.isSaving ? "Syncing..." : ""}</span>
        </div>
        <ul class="rpg-questlog-list" id="rpg-questlog-ul">
          ${
            quests.length
              ? quests
                  .map((q, idx) => `
              <li
                class="rpg-quest-item${DND_STATE.draggingIndex === idx ? " dragging" : ""}${DND_STATE.overIndex === idx && DND_STATE.draggingIndex !== null ? " drag-over" : ""}"
                data-idx="${idx}"
                draggable="true"
                style="${DND_STATE.draggingIndex === idx ? "z-index:9;" : ""}"
              >
                <span class="drag-handle" title="Drag to reorder" draggable="false">
                  <svg width="28" height="40" viewBox="0 0 28 40" style="vertical-align:middle"><g>
                    <ellipse cx="14" cy="20" rx="13.3" ry="19" fill="#e9d4a9" stroke="#7c3aed" stroke-width="3"/>
                    <path d="M14 9v6M14 25v6M14 20l0.01-1M10 16h8" stroke="#7c3aed" stroke-width="2.4" stroke-linecap="round"/>
                    <circle cx="14" cy="20" r="3.5" fill="#fff7db" stroke="#7c3aed" stroke-width="1.5"/>
                  </g></svg>
                </span>
                <label class="rpg-quest-label">
                  <input type="checkbox" class="quest-done" data-idx="${idx}" ${q.done ? "checked" : ""} />
                  <span class="rpg-quest-title${q.done ? " completed" : ""}">${q.title ? q.title : "Unnamed Quest"}</span>
                </label>
                <span class="quest-action-btns">
                  <button class="rpg-btn mini complete-btn" data-idx="${idx}" ${q.done ? "disabled" : ""} title="Complete Quest">✅</button>
                  <button class="rpg-btn mini delete-btn" data-idx="${idx}" title="Delete Quest">🗑️</button>
                </span>
              </li>`)
                  .join("")
              : `<li style="text-align:center;opacity:0.85">No quests yet! <br />Add one from another zone, or begin your journey.</li>`
          }
        </ul>
      </section>
    `;
    // Re-attach event handlers
    wireupDnD();
    wireupActions();
    updateStyles();
  }

  /** Drag and Drop Handlers */
  function wireupDnD() {
    const ul = mountNode.querySelector("#rpg-questlog-ul");
    if (!ul) return;
    const items = [...ul.querySelectorAll(".rpg-quest-item")];
    // Set draggable handlers and animation
    items.forEach((item, idx) => {
      // Prevent default drag behavior on handle (so only handle allows drag)
      item.querySelector('.drag-handle').addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });

      item.addEventListener('dragstart', (e) => {
        DND_STATE.draggingIndex = idx;
        DND_STATE.startY = e.clientY;
        DND_STATE.offsetY = e.offsetY;
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setDragImage(item, 16, 16); } catch { /* no-op */ }
        render(); // visual feedback
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (DND_STATE.draggingIndex === null) return;
        // Determine over which index we are
        DND_STATE.overIndex = idx;
        // Animated feedback
        render();
      });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const { draggingIndex, overIndex } = DND_STATE;
        if (draggingIndex === null || overIndex === null || draggingIndex === overIndex) {
          DND_STATE.draggingIndex = DND_STATE.overIndex = null;
          render();
          return;
        }
        // Move item in order
        let arr = DND_STATE.order.length ? [...DND_STATE.order] : getQuests();
        const [moved] = arr.splice(draggingIndex, 1);
        arr.splice(overIndex, 0, moved);
        DND_STATE.order = arr;
        DND_STATE.draggingIndex = DND_STATE.overIndex = null;
        saveOrder(arr);
      });
      item.addEventListener("dragend", () => {
        DND_STATE.draggingIndex = DND_STATE.overIndex = null;
        render();
      });
    });
    // Touch support (mobile drag-to-reorder)
    if (globalThis.innerWidth < mobileBreakpoint) {
      items.forEach((item, idx) => {
        let dragging = false;
        item.querySelector('.drag-handle').addEventListener('touchstart', (e) => {
          e.stopPropagation();
          DND_STATE.draggingIndex = idx;
          dragging = true;
        });
        item.addEventListener('touchmove', (e) => {
          if (!dragging) return;
          const curY = e.touches[0].clientY;
          // Determine target idx
          let over = idx;
          for (let j=0; j<items.length; j++) {
            const rect = items[j].getBoundingClientRect();
            if (curY > rect.top && curY < rect.bottom) over = j;
          }
          DND_STATE.overIndex = over;
          render();
        });
        item.addEventListener('touchend', () => {
          if (dragging && DND_STATE.draggingIndex !== null && DND_STATE.overIndex !== null) {
            let arr = DND_STATE.order.length ? [...DND_STATE.order] : getQuests();
            const [moved] = arr.splice(DND_STATE.draggingIndex, 1);
            arr.splice(DND_STATE.overIndex, 0, moved);
            DND_STATE.order = arr;
            saveOrder(arr);
            DND_STATE.draggingIndex = DND_STATE.overIndex = null;
            dragging = false;
            render();
          }
        });
      });
    }
  }

  /** Save re-ordered quest array to Firestore (via GameProvider) */
  function saveOrder(newArr) {
    DND_STATE.isSaving = true;
    DND_STATE.error = null;
    render();
    try {
      if (typeof gameCtx.setQuests === "function") {
        // Defensive: remove non-quest extras from array
        const cleaned = newArr.map(q => ({ ...q })); // shallow copy
        gameCtx.setQuests(cleaned);
        // Clear local override on remote update in onSnapshot (GameProvider)
        globalThis.setTimeout(() => {
          DND_STATE.isSaving = false;
          DND_STATE.order = [];
          render();
        }, 800); // Small delay to allow Firestore to push latest state
      }
    } catch {
      DND_STATE.isSaving = false;
      DND_STATE.error = "Sync error! Try again.";
      render();
    }
  }

  /** Quest Complete & Delete Logic */
  function wireupActions() {
    mountNode.querySelectorAll('.quest-done').forEach(cb => {
      cb.onchange = function() {
        const idx = +cb.dataset.idx;
        let arr = DND_STATE.order.length ? [...DND_STATE.order] : getQuests();
        arr[idx].done = cb.checked;
        saveOrder(arr);
      };
    });
    mountNode.querySelectorAll('.complete-btn').forEach(btn => {
      btn.onclick = function() {
        const idx = +btn.dataset.idx;
        let arr = DND_STATE.order.length ? [...DND_STATE.order] : getQuests();
        arr[idx].done = true;
        saveOrder(arr);
      };
    });
    mountNode.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = function() {
        if (!globalThis.confirm || !globalThis.confirm("Delete this quest?")) return;
        const idx = +btn.dataset.idx;
        let arr = DND_STATE.order.length ? [...DND_STATE.order] : getQuests();
        arr.splice(idx, 1);
        saveOrder(arr);
      };
    });
  }

  /** Add RPG-glow & drag styles */
  function updateStyles() {
    // Dynamic style block for drag-highlight and RPG flair
    if (!document.getElementById('rpg-questlog-style')) {
      const s = document.createElement('style');
      s.id = 'rpg-questlog-style';
      s.innerHTML = `
        .rpg-questlog-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .rpg-quest-item {
          display: flex;
          align-items: center;
          background: linear-gradient(90deg,var(--color-secondary) 0%,var(--color-bg) 100%);
          margin: 0.4em 0;
          padding: 1em;
          border-radius: 12px;
          box-shadow: 0 2px 12px #1b2734af;
          font-size: 1.1em;
          min-height: 48px;
          position: relative;
          transition: box-shadow 0.2s,transform 0.2s,background 0.2s;
        }
        .rpg-quest-item.drag-over {
          background: linear-gradient(90deg,var(--color-accent) 0%,var(--color-primary) 100%);
          box-shadow: 0 0 24px var(--color-accent);
          animation: rpg-glow-pulse 1.2s;
          z-index: 8;
        }
        .rpg-quest-item.dragging {
          opacity: 0.85;
          background: linear-gradient(90deg,var(--color-primary) 10%,#fff2 90%);
          transform: scale(1.04) rotate(-2.5deg);
          box-shadow: 0 0 30px 6px var(--color-secondary);
        }
        .drag-handle {
          display: inline-block;
          cursor: grab;
          margin-right: 1.1em;
          border-radius: 8px;
          background: #36205e33;
          box-shadow: 0 0 10px var(--color-primary) inset;
          user-select: none;
          padding: 0.15em 0.28em 0.05em 0.2em;
          transition: background 0.19s;
        }
        .drag-handle:active { cursor: grabbing; background: #6841c033;}
        .rpg-quest-title { margin-left: 0.35em; }
        .rpg-quest-title.completed { text-decoration:line-through; opacity:0.64;}
        .rpg-quest-label { flex: 1; display: flex; align-items: center; cursor: pointer;}
        .quest-action-btns { margin-left: 1em; display:inline-flex; gap:6px;}
        .rpg-btn.mini { font-size:1em;padding:0.16em 0.66em;}
        @media (max-width:600px) {
          .rpg-glow-card { max-width:98vw !important; padding:1.2em !important;}
          .rpg-quest-item { font-size:1em; padding:0.75em; min-height:40px;}
          .drag-handle svg { width:20px;height:30px;}
        }
      `;
      document.head.appendChild(s);
    }
  }

  // Real-time quest sync: update UI when quests are changed via GameProvider
  if (!gameCtx._rpg_quest_subscribed) {
    gameCtx.subscribe(() => {
      if (!DND_STATE.isSaving) {
        DND_STATE.order = [];
        render();
      }
    });
    gameCtx._rpg_quest_subscribed = true;
  }

  // Initial render (on mount)
  DND_STATE.order = [];
  DND_STATE.error = null;
  DND_STATE.isSaving = false;
  render();
}
