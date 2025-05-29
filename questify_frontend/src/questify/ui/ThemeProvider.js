// PUBLIC_INTERFACE
export function ThemeProvider(authCtx, onReady) {
  const palette = {
    primary: '#7c3aed',
    secondary: '#4ade80',
    accent: '#ef4444',
    fantasy: '#a7f3d0',
    night: '#0a0f38'
  };
  let mode = 'fantasy';
  try {
    mode = globalThis.localStorage.getItem('q_theme') || 'fantasy';
  } catch (e) { mode = 'fantasy'; }
  let rerender = () => {};
  const ctx = {
    mode,
    palette,
    setMode: (m) => {
      mode = m;
      try { globalThis.localStorage.setItem('q_theme', m); } catch {}
      updateCssVars();
      rerender();
    }
  };
  function updateCssVars() {
    const root = globalThis.document.documentElement;
    if (mode === 'fantasy') {
      root.style.setProperty('--color-bg', palette.night);
      root.style.setProperty('--color-primary', palette.primary);
      root.style.setProperty('--color-secondary', palette.secondary);
      root.style.setProperty('--color-accent', palette.accent);
    } else if (mode === 'light') {
      root.style.setProperty('--color-bg', '#fff');
      root.style.setProperty('--color-primary', palette.primary);
      root.style.setProperty('--color-secondary', palette.secondary);
      root.style.setProperty('--color-accent', palette.accent);
    } else {
      root.style.setProperty('--color-bg', '#222');
      root.style.setProperty('--color-primary', palette.primary);
      root.style.setProperty('--color-secondary', palette.secondary);
      root.style.setProperty('--color-accent', palette.accent);
    }
  }
  updateCssVars();
  onReady({ ...ctx });
}
