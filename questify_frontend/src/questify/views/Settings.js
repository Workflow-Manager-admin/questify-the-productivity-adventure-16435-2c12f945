/**
 * PUBLIC_INTERFACE
 * Enhanced Settings screen: theme mode (fantasy/dark/light) toggle, reset progress, delete account,
 * feedback/error handling, accessibility, responsive RPG style.
 */
export function Settings(authCtx, themeCtx, gameCtx, mountNode) {
  // Helper: apply safe focus to btn for accessibility
  function safeFocus(id) {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.focus();
    }, 200);
  }

  // State for showing feedback/status
  let status = '', statusType = 'info', saving = false;
  const user = authCtx?.user;
  let selectedTheme = themeCtx.mode || 'fantasy';

  // Re-render for every state change
  function render() {
    mountNode.innerHTML = `
      <section class="rpg-glow-card rpg-fadein" style="max-width:430px;width:96vw;">
        <h1 style="margin-bottom:1.6em;">⚙️ RPG Settings</h1>
        <form id="settings-form" autocomplete="off">
          <fieldset style="border:none;margin-bottom:1.9em;">
            <legend style="font-size:1.18em;font-weight:bold;margin-bottom:0.7em;">Theme/Appearance</legend>
            <div role="radiogroup" aria-labelledby="theme-group-label" style="display:flex;gap:0.7em;flex-wrap:wrap;">
              ${["fantasy","dark","light"].map(mode => `
                <label class="rpg-btn theme-toggle-btn" style="padding:.6em 1.5em;${selectedTheme===mode?'background:var(--color-accent);color:#fff;box-shadow:0 0 13px var(--color-secondary)':'background:var(--color-primary);color:#fff'}" tabindex="0">
                  <input type="radio" name="themeMode" value="${mode}" ${selectedTheme===mode?'checked':''} style="margin-right:0.6em;accent-color:var(--color-primary);" aria-checked="${selectedTheme===mode}">
                  ${mode === "fantasy" ? "🧚 Fantasy" : mode === "dark" ? "🌑 Dark" : "🔆 Light"}
                </label>
              `).join('')}
            </div>
            <small style="font-size:.96em;opacity:.7;display:block;margin-top:.18em;">Fantasy is the full Questify RPG visual experience.</small>
          </fieldset>
          <fieldset style="border:none;margin-bottom:2em;">
            <legend style="font-size:1.15em;font-weight:bold;margin-bottom:0.85em;">Danger Zone</legend>
            <div style="display: flex; gap: 1.2em; flex-wrap:wrap;">
              <button type="button" id="reset-progress-btn" class="rpg-btn danger-btn" style="background:#e14444;color:#fff;">Reset Progress</button>
              <button type="button" id="delete-account-btn" class="rpg-btn danger-btn" style="background:#a70034;color:#fff;">Delete Account</button>
            </div>
            <small style="font-size:0.96em;opacity:0.73;display:block;margin-top:.17em;">These actions are <b>irreversible</b>. Reset clears all RPG progress, quests, and inventory. Account deletion permanently removes your data.</small>
          </fieldset>
          <fieldset style="border:none;margin-bottom:2.2em;">
            <legend style="font-size:1.12em;font-weight:bold;margin-bottom:0.7em;">Feedback</legend>
            <textarea id="feedback-input" rows="2" placeholder="Your suggestion, bug, or praise..." style="width:96%;border-radius:8px;font-size:1em;padding:.7em;"></textarea>
            <button type="submit" class="rpg-btn" id="send-feedback-btn" aria-label="Send Feedback" style="background:var(--color-secondary);margin-top:.6em;">Send Feedback</button>
          </fieldset>
        </form>
        <div id="settings-status" class="settings-status-msg ${statusType}" aria-live="polite" style="min-height:2.4em;margin-top:.9em;margin-bottom:.3em;font-size:1.02em;">
          ${status ? (statusType==="success"
            ? `✅ <span style="color:#4ade80">${status}</span>`
            : statusType==="error"
            ? `❌ <span style="color:#ef4444">${status}</span>`
            : `<span>${status}</span>`
          ) : ''}
        </div>
        <style>
          .theme-toggle-btn { cursor:pointer; outline:none; border: 2.2px solid var(--color-secondary);}
          .theme-toggle-btn:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px #7c3aed60;}
          .danger-btn:focus { border-color: #e14444; box-shadow: 0 0 8px #dd365488; }
          .settings-status-msg {min-height:2.1em;}
          @media (max-width:540px) {
            .rpg-glow-card { padding:1.2em!important; }
            legend { font-size:1em!important; }
            label.rpg-btn.theme-toggle-btn { font-size:1em!important; padding:.5em 1em!important;}
          }
        </style>
      </section>
    `;

    // Theme radio change - update live
    mountNode.querySelectorAll('input[name="themeMode"]').forEach(radio =>
      radio.onchange = (e) => {
        selectedTheme = e.target.value;
        themeCtx.setMode(selectedTheme);
        status = `Theme changed to "${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}"`;
        statusType = 'success';
        render();
      }
    );

    // Reset Progress logic
    const resetBtn = document.getElementById('reset-progress-btn');
    resetBtn.onclick = async () => {
      if(!window.confirm('⚠️ Are you sure you want to reset all progress? This cannot be undone.')) return safeFocus('reset-progress-btn');
      saving = true; status = "Resetting progress..."; statusType = "info"; render();
      try {
        const userId = user?.uid;
        // Reset progress: XP, HP, Level, inventory, quests, logs, streak, boss, calendarEvents, soulTokens
        if (gameCtx && typeof gameCtx.getState === 'function') {
          const db = (window.firebase && window.firebase.firestore) ? window.firebase.firestore() : null;
          if (!db || !userId) throw new Error("DB unavailable");
          await db.collection('users').doc(userId).set({
            xp: 0, hp: 100, level: 1, streak: 0, soulTokens: 0,
            avatar: 'default',
            settings: { ...gameCtx.getState().settings || {}, theme: selectedTheme },
            focus: false, boss: null,
            calendarEvents: [],
            inventory: [],
            quests: [],
            logs: [],
          }, { merge: false });
          gameCtx.subscribe(() => {}); // force local state sync
        }
        status = "Progress reset! You are reborn anew.";
        statusType = "success";
      } catch (err) {
        status = (err?.message || "Failed to reset progress.");
        statusType = "error";
      }
      saving = false; render(); safeFocus('reset-progress-btn');
    };

    // Delete Account logic
    const delBtn = document.getElementById('delete-account-btn');
    delBtn.onclick = async () => {
      if(!window.confirm('⚠️ Are you sure you want to DELETE your account forever?\nThis cannot be undone!')) return safeFocus('delete-account-btn');
      saving = true; status = "Deleting account..."; statusType = "info"; render();
      try {
        const userId = user?.uid;
        const db = (window.firebase && window.firebase.firestore) ? window.firebase.firestore() : null;
        if (!db || !userId || !window.firebase.auth) throw new Error("DB/Auth unavailable");
        // Delete Firestore user data
        await db.collection('users').doc(userId).delete();
        // Delete account from Firebase Auth
        await window.firebase.auth().currentUser.delete();
        status = "Account deleted. Farewell, adventurer!";
        statusType = "success";
        setTimeout(() => { if(window.location) window.location.reload(); }, 1000);
      } catch (err) {
        status = (err?.message || "Failed to delete account. Re-auth may be required.");
        statusType = "error";
      }
      saving = false; render(); safeFocus('delete-account-btn');
    };

    // Feedback submit logic (simulate, since backend is out of current scope)
    const form = document.getElementById('settings-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      if (saving) return;
      const input = document.getElementById('feedback-input');
      const feedback = input.value ? input.value.trim() : '';
      if (!feedback) {
        status = "Please enter feedback before submitting.";
        statusType = "error";
        render();
        safeFocus('feedback-input');
        return;
      }
      saving = true;
      status = "Sending feedback...";
      statusType = "info";
      render();
      setTimeout(() => {
        saving = false;
        status = "Thanks for your feedback! The Questify devs appreciate your input.";
        statusType = "success";
        input.value = "";
        render();
      }, 900);
    };

    // Accessibility: Focus first interactive element
    safeFocus('reset-progress-btn');
  }

  render();
}
