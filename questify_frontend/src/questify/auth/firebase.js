// PUBLIC_INTERFACE
export function initFirebase() {
  if (window.firebaseApp) return window.firebaseApp;
  // All keys from import.meta.env
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  window.firebaseApp = window.firebase?.apps?.length
    ? window.firebase.app()
    : window.firebase.initializeApp(firebaseConfig);
  return window.firebaseApp;
}

export function getAuth() {
  return window.firebase.auth();
}

export function onAuthStateChanged(auth, cb) {
  return auth.onAuthStateChanged(cb);
}

export async function loginWithGoogle() {
  const provider = new window.firebase.auth.GoogleAuthProvider();
  await getAuth().signInWithPopup(provider);
}

export async function loginWithEmail(email, password) {
  try {
    await getAuth().signInWithEmailAndPassword(email, password);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      await getAuth().createUserWithEmailAndPassword(email, password);
    } else {
      throw err;
    }
  }
}

export async function logoutUser() {
  await getAuth().signOut();
}

export function getFirestore() {
  return window.firebase.firestore();
}
