import { initFirebase, getAuth, onAuthStateChanged, loginWithGoogle, loginWithEmail, logoutUser } from './firebase.js';

// PUBLIC_INTERFACE
export function AuthProvider(onReady, domNode) {
  initFirebase();
  const state = { user: null, loading: true, error: null };
  const listeners = [];

  function setState(upd) {
    Object.assign(state, upd);
    listeners.forEach(l => l({ ...state }));
  }
  // Auth change callback
  onAuthStateChanged(getAuth(), (u) => {
    setState({ user: u, loading: false, error: null });
    if (u && onReady) onReady(state);
  });

  // UI
  domNode.innerHTML = `<div id="auth-root"></div>`;
  const authRoot = domNode.querySelector('#auth-root');

  // Subscribe: rerender on state change
  listeners.push(authUi);

  function authUi(authState) {
    if (authState.loading) {
      authRoot.innerHTML = `<div class="loader">Loading...</div>`;
      return;
    }
    if (!authState.user) {
      authRoot.innerHTML = `
        <div class="login-card rpg-glow-card">
          <div class="questify-logo"></div>
          <h2>Sign In to Questify</h2>
          <button class="btn rpg-btn" id="google-login">Continue with Google</button>
          <div class="or">— OR —</div>
          <div>
            <input id="email" placeholder="Email" class="input rpg-input" />
            <input id="password" type="password" placeholder="Password" class="input rpg-input" />
            <button id="email-login" class="btn rpg-btn">Login / Register</button>
          </div>
        </div>
      `;
      authRoot.querySelector('#google-login').onclick = async () => {
        setState({ loading: true });
        try { await loginWithGoogle(); } catch (e) { setState({ error: e.message, loading: false }); }
      };
      authRoot.querySelector('#email-login').onclick = async () => {
        setState({ loading: true });
        const em = authRoot.querySelector('#email').value;
        const pw = authRoot.querySelector('#password').value;
        try { await loginWithEmail(em, pw); } catch (e) { setState({ error: e.message, loading: false }); }
      };
      return;
    }
    // Authenticated → show wrapped app
    domNode.innerHTML = '<div id="authed-app"></div>';
    if (onReady) onReady(Object.assign({}, state));
  }
}
