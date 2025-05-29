// Add avatar cosmetics integrations
import { getAvatarSvg, getAvatarCosmeticsDef, userUnlockedCosmetics } from "../ui/AvatarCosmetics.js";
import { RPGToast } from "../ui/RPGToast.js";

// PUBLIC_INTERFACE
export function Inventory(authCtx, themeCtx, gameCtx, mountNode) {
  const state = gameCtx.getState();
  // Cosmetics logic
  const unlocked = userUnlockedCosmetics(state);
  const equipped = state.avatar || "base";
  const allCos = getAvatarCosmeticsDef();
  mountNode.innerHTML = `
    <section class="rpg-glow-card rpg-fadein">
      <h1>💎 Inventory</h1>
      <h2 style="font-size:1.07em">Unlocked Cosmetics</h2>
      <div style="display:flex;flex-wrap:wrap;gap:1.2em;margin-bottom:1em">
        ${allCos.filter(c => unlocked.includes(c.id)).map(c => `
          <div style="padding:0.6em;cursor:pointer;min-width:58px;align-items:center;text-align:center;border-radius:11px;border:${equipped===c.id?'3.3px solid var(--color-accent)':'2px solid #a7f3d0'};background:linear-gradient(93deg,var(--color-bg) 60%,#ffffff15 100%);" data-id="${c.id}">
            <div style="width:58px;height:58px;margin-bottom:2px;">${getAvatarSvg({ state, equipped: c.id })}</div>
            <span style="font-size:0.92em;color:#a7f3d0">${c.name}</span>
            ${equipped===c.id?'<span style="position:absolute;right:3px;top:2px;color:var(--color-accent);font-size:1.14em;">★</span>':''}
          </div>
        `).join("")}
      </div>
      <div style="margin-top:1.1em"><b>Other Inventory:</b> ${(state.inventory||[]).map(i=>`<span class="inv-slot">${i}</span>`).join("")||'None'}</div>
      <button class="rpg-btn" style="margin-top:1.6em;" id="back-dashboard-btn">Back to Dashboard</button>
    </section>
  `;

  // Avatar equip logic
  Array.from(mountNode.querySelectorAll("div[data-id]")).forEach(div=>{
    div.onclick = function() {
      if (typeof gameCtx.setAvatar==="function") {
        gameCtx.setAvatar(div.dataset.id);
        RPGToast({ message: `Equipped: ${(allCos.find(c=>c.id===div.dataset.id)||{}).name}`, variant:"success" });
      }
    }
  });
  const btn = mountNode.querySelector("#back-dashboard-btn");
  if (btn) btn.onclick = ()=>globalThis.location.hash="/";
}
