import { getFirestore } from '../auth/firebase.js';

// PUBLIC_INTERFACE
export function GameProvider({ auth }, onReady) {
  const db = getFirestore();
  let userId = auth?.user?.uid;
  // sync state with Firestore (XP, etc.)
  const defaultState = {
    xp: 0, hp: 100, level: 1, streak: 0, soulTokens: 0, avatar: 'default', settings: {}, focus: false, boss: null, calendarEvents: [],
    inventory: [],
    quests: [],
    logs: [],
  };
  let state = { ...defaultState };
  let rerender = () => {};

  // Subscribe to Firestore doc changes (XP, etc.)
  const unsub = db.collection('users').doc(userId).onSnapshot((doc) => {
    if (doc.exists) {
      Object.assign(state, doc.data());
      rerender();
    }
  });

  function gainXP(amount) {
    state.xp += amount;
    if (state.xp >= 100) { state.level++; state.xp -= 100; }
    db.collection('users').doc(userId).set({ xp: state.xp, level: state.level }, { merge: true });
    rerender();
  }

  function loseHP(amount) {
    state.hp -= amount; if (state.hp < 0) state.hp = 0;
    db.collection('users').doc(userId).set({ hp: state.hp }, { merge: true });
    rerender();
  }

  function addInventory(item) {
    if (!state.inventory.includes(item)) state.inventory.push(item);
    db.collection('users').doc(userId).set({ inventory: state.inventory }, { merge: true });
    rerender();
  }

  // Focus streak logic: called when user passes activity check
  function streakUp() {
    state.streak++;
    // Bonus: unlock cosmetics for streaks (eg. Fox Mask for 5+ streak)
    if (state.streak === 3 && !state.inventory.includes("Cyber Shades")) {
      state.inventory.push("Cyber Shades");
      db.collection('users').doc(userId).set({ inventory: state.inventory }, { merge: true });
      // In-app toast handled via Dashboard's toast tracking
    }
    if (state.streak === 5 && !state.inventory.includes("Fox Mask")) {
      state.inventory.push("Fox Mask");
      db.collection('users').doc(userId).set({ inventory: state.inventory }, { merge: true });
    }
    db.collection('users').doc(userId).set({ streak: state.streak }, { merge: true });
    rerender();
  }

  function setBoss(boss) {
    state.boss = boss;
    db.collection('users').doc(userId).set({ boss: state.boss }, { merge: true });
    rerender();
  }

  function setQuests(quests) {
    state.quests = quests;
    db.collection('users').doc(userId).set({ quests: quests }, { merge: true });
    rerender();
  }

  // PUBLIC_INTERFACE
  function setCalendarEvents(events) {
    state.calendarEvents = events;
    db.collection('users').doc(userId).set({ calendarEvents: state.calendarEvents }, { merge: true });
    rerender();
  }

  const ctx = {
    ...state,
    gainXP, loseHP, addInventory, streakUp, setBoss, setQuests, setCalendarEvents,
    subscribe: (fn) => { rerender = fn; },
    getState: () => ({ ...state }),
    unsubscribe: () => { if (unsub) unsub(); },
  };

  onReady(ctx);
}
