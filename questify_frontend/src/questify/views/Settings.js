// PUBLIC_INTERFACE
export function Settings(authCtx, themeCtx, gameCtx, mountNode) {
  mountNode.innerHTML = `
    <section class="rpg-glow-card rpg-fadein">
      <h1>⚙️ Settings</h1>
      <div>
        <button class="rpg-btn" onclick="alert('Reset coming soon')">Danger Zone: Reset</button>
        <button class="rpg-btn" onclick="alert('Account deletion coming soon')">Delete Account</button>
      </div>
      <div style="margin-top:2em;">(Theme toggle and other settings go here.)</div>
    </section>
  `;
}
