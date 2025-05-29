//
// RPGToast: In-app notification/toast system for rewarding, streaks, cosmetic unlocks, errors, and bonus cues
// Supports animated entrance/exit and visual variants (success, reward, streak, error, neutral)
//
// PUBLIC_INTERFACE
/**
 * @param {Object} opts - { message, variant ('success'|'reward'|'error'|'streak'|'neutral'), duration, onClick }
 * Shows animated toast in #questify-root
 */
export function RPGToast({ message, variant = 'neutral', duration = 2500, onClick = null }) {
  let root = document.getElementById("questify-root") || document.body;
  let toastC = root.querySelector('#rpg-toast-container');
  if (!toastC) {
    toastC = document.createElement('div');
    toastC.id = 'rpg-toast-container';
    toastC.style.position = 'fixed';
    toastC.style.top = '20px';
    toastC.style.right = '28px';
    toastC.style.zIndex = '9999';
    toastC.style.display = 'flex';
    toastC.style.flexDirection = 'column';
    toastC.style.gap = '0.85em';
    root.appendChild(toastC);
  }
  let toast = document.createElement('div');
  let icon;
  switch (variant) {
    case 'success': icon = '🎉'; break;
    case 'reward': icon = '💎'; break;
    case 'error': icon = '❌'; break;
    case 'streak': icon = '🔥'; break;
    default: icon = '✨';
  }
  toast.className = `rpg-toast rpg-toast-${variant}`;
  toast.innerHTML = `<span class="rpg-toast-ico">${icon}</span><span class="rpg-toast-msg">${message}</span>`;
  toast.onclick = () => { if (typeof onClick === 'function') onClick(); toast.remove(); };
  toastC.appendChild(toast);
  // Animate entrance
  globalThis.setTimeout(() => toast.classList.add('show'), 20);

  // Animate exit after duration
  if (duration > 0) {
    globalThis.setTimeout(() => {
      toast.classList.remove('show');
      globalThis.setTimeout(() => toast.remove(), 500);
    }, duration);
  }
  // Toast style (global singleton)
  if (!document.getElementById('rpg-toast-style')) {
    const s = document.createElement('style');
    s.id = 'rpg-toast-style';
    s.textContent = `
      .rpg-toast {
        min-width: 220px;
        background: linear-gradient(93deg, var(--color-secondary) 7%, var(--color-bg) 99%);
        color: #fff;
        padding: 1.08em 1.8em 1.1em 1.2em;
        border-radius: 13px;
        box-shadow: 0 10px 23px #220a67bb, 0 0 17px 2px var(--color-accent) inset;
        font-size: 1.08em;
        font-family: var(--rpg-font),serif;
        border: 2px solid var(--color-accent);
        margin-bottom: 0.2em;
        opacity: 0;
        transform: translateX(120px) scale(0.97);
        pointer-events: auto;
        cursor: pointer;
        user-select: none;
        display: flex; align-items: center; gap: 1.08em;
        transition: opacity .55s cubic-bezier(.77,.07,.31,1), transform 0.53s cubic-bezier(.77,.07,.31,1);
      }
      .rpg-toast.show { opacity: 1; transform: translateX(0) scale(1.0);}
      .rpg-toast-success { border-color: #34d399;}
      .rpg-toast-reward { border-color: #facc15; background:linear-gradient(93deg, #facc15 12%,var(--color-primary) 99%);}
      .rpg-toast-error { border-color: #ef4444; background:#330000cc;}
      .rpg-toast-streak { border-color: #f43f5e; background:linear-gradient(93deg,#f43f5e 6%,var(--color-bg) 98%);}
      .rpg-toast-msg { flex:1;}
      .rpg-toast-ico { font-size:1.4em; display: inline-block;}
      @media (max-width:660px) {
        #rpg-toast-container { right: 8px; top: 12px;}
        .rpg-toast { min-width:140px;font-size:.98em;padding:0.65em 1em 0.81em 0.7em;}
      }
    `;
    document.head.appendChild(s);
  }
}
