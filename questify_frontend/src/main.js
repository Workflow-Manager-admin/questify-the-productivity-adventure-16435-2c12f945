import './styles/theme.css';
import './styles/animations.css';
import './styles/calendar.css';
import { QuestifyApp } from './questify/App.js';

// Use globalThis for browser window in linted envs
globalThis.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.createElement('div');
  appContainer.id = 'questify-root';
  globalThis.document.getElementById('app').replaceWith(appContainer);

  // PUBLIC_INTERFACE
  function mountQuestifyApp() {
    QuestifyApp(appContainer);
  }
  mountQuestifyApp();
});
