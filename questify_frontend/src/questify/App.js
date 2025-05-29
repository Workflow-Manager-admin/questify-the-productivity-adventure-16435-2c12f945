import { AuthProvider } from './auth/AuthProvider.js';
import { ThemeProvider } from './ui/ThemeProvider.js';
import { GameProvider } from './rpg/GameProvider.js';
import { AppRouter } from './questify/Router.js';
import { AnimatedBackground } from './ui/AnimatedBackground.js';

// PUBLIC_INTERFACE
export function QuestifyApp(domNode) {
  domNode.innerHTML = '';
  // Compose providers (Auth → Theme → Game)
  AuthProvider(async (authCtx) => {
    ThemeProvider(authCtx, (themeCtx) => {
      GameProvider({ auth: authCtx, theme: themeCtx }, (gameCtx) => {
        // Animated RPG nebula background
        AnimatedBackground(themeCtx, domNode);

        // Main App UI (router handles auth/nav/content)
        AppRouter(authCtx, themeCtx, gameCtx, domNode);
      });
    });
  }, domNode);
}
