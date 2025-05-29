Explanation: Calendar view placeholder.

// PUBLIC_INTERFACE
export function CalendarView(authCtx, themeCtx, gameCtx, mountNode) {
  mountNode.innerHTML = `
    <section class="rpg-glow-card rpg-fadein">
      <h1>📅 RPG Calendar</h1>
      <div>(Google Calendar sync and deadline boss battles coming soon!)</div>
    </section>
  `;
}
