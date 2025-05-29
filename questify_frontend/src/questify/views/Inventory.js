// PUBLIC_INTERFACE
export function Inventory(authCtx, themeCtx, gameCtx, mountNode) {
  mountNode.innerHTML = `
    <section class="rpg-glow-card rpg-fadein">
      <h1>💎 Inventory</h1>
      <ul>
        ${(gameCtx.getState().inventory || []).map(i => `<li>${i}</li>`).join('')}
      </ul>
      <div>(Cosmetic items and rewards unlock soon!)</div>
    </section>
  `;
}
