import { generateOrEnhanceQuest } from "../ai/openai.js";

/**
 * PUBLIC_INTERFACE
 * QuestAIModal: Show modal to generate RPG questline or enhance an existing quest via OpenAI.
 * @param {'generate'|'enhance'} mode
 * @param {function} onDone - called with {main_quest, side_quests, daily_tasks} or enhanced string
 * @param {function} onClose - called on cancel/close
 * @param {object} [options] Optionally, initialQuest string for enhance
 * Renders DOM in #questify-root overlay.
 */
export function QuestAIModal({ mode, onDone, onClose, options = {} }) {
  let modal = document.createElement('div');
  modal.className = 'rpg-modal-overlay';
  modal.innerHTML = `
    <div class="rpg-modal">
      <h2>${mode === 'enhance' ? "Enhance Quest" : "Generate RPG Questline"}</h2>
      <form id="quest-ai-form">
        <label style="display:block;margin-bottom:0.6em;">
          ${mode === 'enhance'
            ? "Paste your existing quest for enhancement:"
            : "Describe your big goal or theme for adventure quest generation:"}
        </label>
        <textarea required rows="4" style="width:99%;resize:vertical" id="ai-quest-input" placeholder="${mode === 'enhance' ? "Enter quest to enhance" : "E.g., Learn piano, run a marathon, get straight A's..."}">${options.initialQuest||''}</textarea>
        <div id="ai-quest-status" style="margin-top:1em;min-height:2em;font-size:1em"></div>
        <div style="margin-top:1.2em;">
          <button type="submit" class="rpg-btn">${mode === 'enhance' ? "Enhance" : "Generate"}</button>
          <button type="button" class="rpg-btn" id="btn-cancel-modal" style="background:#a7a7a799;color:#222;margin-left:1em;">Cancel</button>
        </div>
      </form>
    </div>
    <style>
    .rpg-modal-overlay {
      position: fixed; z-index:9999;
      left:0;top:0;width:100vw;height:100vh;
      background:rgba(12,14,30,0.72);
      display:flex;align-items:center;justify-content:center;
      animation:fade-in 260ms;
    }
    .rpg-modal {
      background: linear-gradient(120deg,var(--color-secondary) 5%, var(--color-primary) 93%);
      box-shadow: 0 8px 42px #210944cc;
      border-radius:16px;
      border:2px solid var(--color-accent);
      padding:2.6em 2.4em 2em 2.4em;
      min-width:330px;max-width:470px;width:94vw;
      color:#201b4c;
      font-family:var(--rpg-font),serif!important;
      animation: rpg-fadein 430ms;
    }
    .rpg-modal textarea{font-family:inherit;font-size:1.08em;border-radius:9px;border:1.2px solid var(--color-primary);padding:0.7em;}
    #ai-quest-status{min-height:1em;}
    </style>
  `;
  document.body.appendChild(modal);

  const form = modal.querySelector('#quest-ai-form');
  const status = modal.querySelector('#ai-quest-status');
  const btnCancel = modal.querySelector('#btn-cancel-modal');
  let submitted = false;

  function cleanup() {
    modal.remove();
    if (typeof onClose === 'function') onClose();
  }

  btnCancel.onclick = cleanup;

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (submitted) return;
    submitted = true;
    status.textContent = "⚡ Talking to the RPG AI Wizard...";
    form.querySelector('button[type="submit"]').disabled = true;

    const input = form.querySelector('#ai-quest-input').value.trim();
    if (!input) {
      status.textContent = "Please enter some text.";
      submitted = false;
      form.querySelector('button[type="submit"]').disabled = false;
      return;
    }
    const res = await generateOrEnhanceQuest(input, { mode: mode });
    if (!res.success) {
      status.innerHTML = `<span style="color:#d21515">❌ ${res.error || "An error occurred."}</span>`;
      submitted = false;
      form.querySelector('button[type="submit"]').disabled = false;
      return;
    }
    // Success
    if (typeof onDone === 'function') onDone(res.quests);
    cleanup();
  };

  // Allow esc-close
  globalThis.addEventListener('keydown', function escListener(evt) {
    if (evt.key === "Escape") {
      modal.remove();
      if (typeof onClose === 'function') onClose();
      globalThis.removeEventListener('keydown', escListener);
    }
  });
}
