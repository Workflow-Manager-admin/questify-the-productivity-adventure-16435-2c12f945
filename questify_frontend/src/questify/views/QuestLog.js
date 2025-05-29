// PUBLIC_INTERFACE
export function QuestLog(authCtx, themeCtx, gameCtx, mountNode) {
  mountNode.innerHTML = `
    <section class="rpg-glow-card rpg-fadein">
      <h1>🗡️ Quest Log</h1>
      <div>This is your current quest log. (Coming soon... drag/drop RPG quest management!)</div>
      <ul>
        ${(gameCtx.getState().quests || []).map(q => `<li>${q.title || "Unnamed Quest"}</li>`).join('')}
      </ul>
    </section>
  `;
}
