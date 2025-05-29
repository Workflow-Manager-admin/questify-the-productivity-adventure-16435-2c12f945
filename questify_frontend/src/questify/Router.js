import { Dashboard } from './views/Dashboard.js';
import { QuestLog } from './views/QuestLog.js';
import { CalendarView } from './views/CalendarView.js';
import { Inventory } from './views/Inventory.js';
import { Settings } from './views/Settings.js';

const routes = [
  { path: '/', component: Dashboard },
  { path: '/quests', component: QuestLog },
  { path: '/calendar', component: CalendarView },
  { path: '/inventory', component: Inventory },
  { path: '/settings', component: Settings }
];

// PUBLIC_INTERFACE
export function AppRouter(authCtx, themeCtx, gameCtx, domNode) {
  function renderCurrent() {
    domNode.innerHTML = '<div id="rpg-navbar"></div><main id="main-content"></main>';
    const navbar = domNode.querySelector('#rpg-navbar');
    navbar.innerHTML = `
      <nav class="rpg-navbar">
        <button data-path="/" class="rpg-nav-btn"><span>🏰</span> Dashboard</button>
        <button data-path="/quests" class="rpg-nav-btn"><span>🗡️</span> Quests</button>
        <button data-path="/calendar" class="rpg-nav-btn"><span>📅</span> Calendar</button>
        <button data-path="/inventory" class="rpg-nav-btn"><span>💎</span> Inventory</button>
        <button data-path="/settings" class="rpg-nav-btn"><span>⚙️</span> Settings</button>
        <span class="rpg-avatar" id="navbar-avatar"></span>
      </nav>
    `;
    navbar.querySelectorAll('button[data-path]').forEach(btn => {
      btn.onclick = () => (window.location.hash = btn.dataset.path);
    });

    const main = domNode.querySelector('#main-content');
    let route = window.location.hash.replace('#', '') || '/';
    let found = routes.find(r => r.path === route);
    if (!found) { route = '/'; found = routes[0]; }
    found.component(authCtx, themeCtx, gameCtx, main);
  }
  window.addEventListener('hashchange', renderCurrent);
  renderCurrent();
}
