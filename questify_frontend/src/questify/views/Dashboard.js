// PUBLIC_INTERFACE
export function Dashboard(authCtx, themeCtx, gameCtx, mountNode) {
  mountNode.innerHTML = `
    <section class="rpg-glow-card rpg-fadein">
      <h1>🏰 Questify Dashboard</h1>
      <div>
        <div>Level: ${gameCtx.getState().level} | XP: ${gameCtx.getState().xp}</div>
        <div>HP: ${gameCtx.getState().hp} | Streak: ${gameCtx.getState().streak}</div>
      </div>
      <p>Welcome, <strong>${authCtx.user.email}</strong>! Adventure awaits...</p>
      <div style="margin-top:2em;">[Full RPG UI goes here]</div>
    </section>
  `;
}
