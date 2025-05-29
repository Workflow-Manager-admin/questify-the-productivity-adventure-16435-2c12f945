import { RPGToast } from "../ui/RPGToast.js";
import { getAvatarSvg, getAvatarCosmeticsDef, userUnlockedCosmetics, eqAvatarCosmetic } from "../ui/AvatarCosmetics.js";

// PUBLIC_INTERFACE
/**
 * RPG Dashboard: Animated HP/XP bars, customizable avatar, themed interactive zones, and full responsive layout.
 */
export function Dashboard(authCtx, themeCtx, gameCtx, mountNode) {
  // Animation helpers
  function animateBar(el, value) {
    if (!el) return;
    const percent = Math.max(0, Math.min(100, value));
    el.style.width = percent + "%";
    el.style.transition = "width 850ms cubic-bezier(.7,.2,.12,1)";
  }
  // Fantasy Zone tiles
  function fantasyZones(gameState) {
    // Each zone: title, emoji, description, visual meter, actions
    return [
      {
        key: "focus",
        emoji: "🌲",
        name: "Focus Forest",
        meter: gameState.streak,
        meterMax: 7,
        meterLabel: `Focus Streak: ${gameState.streak} days`,
        action: "Stay focused to keep your streak alive!",
        active: true,
      },
      {
        key: "deadline",
        emoji: "⛓️",
        name: "Deadline Dungeon",
        meter: (gameState.boss && gameState.boss.hp !== undefined) ? gameState.boss.hp : 0,
        meterMax: (gameState.boss && gameState.boss.maxHp) ? gameState.boss.maxHp : 100,
        meterLabel: gameState.boss
          ? `Boss HP: ${gameState.boss.hp} / ${gameState.boss.maxHp}` 
          : "No boss lurking.",
        action: gameState.boss
          ? `<button class="rpg-btn" id="battle-boss-btn">Battle Boss</button>`
          : "No boss right now."
        ,
        active: !!gameState.boss,
      },
      {
        key: "daily",
        emoji: "⛰️",
        name: "Daily Hills",
        meter: (gameState.quests || []).filter(q=>q.daily && !q.done).length,
        meterMax: Math.max(1,(gameState.quests||[]).filter(q=>q.daily).length),
        meterLabel: `${(gameState.quests||[]).filter(q=>q.daily && !q.done).length} Daily Tasks Left`,
        action: "Complete tasks for bonuses!",
        active: ((gameState.quests||[]).filter(q=>q.daily).length)>0,
      }
    ];
  }
  // Main build
  function render() {
    const gameState = gameCtx.getState ? gameCtx.getState() : {};
    // Cosmetics integration
    let equippedCosmetic = gameState.avatar || "base";
    const unlocked = userUnlockedCosmetics(gameState);
    const cosmeticsDef = getAvatarCosmeticsDef();
    // Track reward state (feedback for cosmetic earn/streak pop)
    if (!window._questify_last_state) window._questify_last_state = {};
    const last = window._questify_last_state;
    // Toast for new cosmetic unlocked
    if (unlocked.length > (last.unlockedLen || 1)) {
      const diff = unlocked.filter(u => !(last.unlockedArr||[]).includes(u));
      if (diff.length > 0) {
        for (let cId of diff) {
          const cObj = cosmeticsDef.find(c=>c.id===cId);
          if (cObj && cObj.name) {
            RPGToast({ message: `You unlocked: ${cObj.name}!`, variant: 'reward', duration: 3500 });
          }
        }
      }
    }
    // Streak celebration
    if ((gameState.streak || 0) !== (last.streakVal || 0) && (gameState.streak || 0) > 0 && (gameState.streak || 0) % 3 === 0) {
      RPGToast({ message: `🔥 Streak! ${gameState.streak} days in Focus Forest!`, variant: 'streak' });
    }
    window._questify_last_state = {
      unlockedArr: unlocked,
      unlockedLen: unlocked.length,
      streakVal: gameState.streak || 0
    };
    // Responsive/animated zone grid
    mountNode.innerHTML = `
      <section
        class="rpg-glow-card rpg-fadein"
        style="max-width:1100px;width:98vw;padding:0.7em 1.6em 1.2em 1.6em;margin:2em auto;"
      >
        <div class="dashboard-header" style="display:flex;flex-wrap:wrap;align-items:center;gap:2.2em;justify-content:space-between;margin-bottom:2.3em;">
          <div class="avatar-block rpg-float" style="display:flex;align-items:center;gap:1.2em;">
            <div class="dashboard-avatar" style="width:90px;height:90px; position:relative; cursor:pointer;" id="avatar-cosmetic-view">
              ${getAvatarSvg({ state: gameState, equipped: equippedCosmetic })}
              <span id="avatar-cosmetic-btn" style="position:absolute;bottom:-2px;right:-7px;background:var(--color-accent);color:#fff;border-radius:50%;font-size:1.4em;box-shadow:0 0 9px var(--color-primary);padding:0.05em 0.19em;cursor:pointer;">⚙️</span>
            </div>
            <div>
              <div style="font-size:2em;font-family:var(--rpg-font);font-weight:700;">Welcome, <span style="color:var(--color-secondary)">${authCtx.user.email.split('@')[0]}</span></div>
              <div style="display:flex;align-items:center;gap:1.2em;">
                <span>Level <span style="font-weight:bold">${gameState.level||1}</span></span>
                <span>
                  <span style="color:#ec4899">💗</span>
                  <span id="hp-bar" class="stat-bar-bg"><span id="hp-bar-fill" class="stat-bar-fill" style="width:${Math.max(0, Math.min(100, (gameState.hp || 0)))}%"></span></span>
                  <span style="font-size:1em">${gameState.hp||0}/100 HP</span>
                </span>
                <span>
                  <span style="color:#facc15">✨</span>
                  <span id="xp-bar" class="stat-bar-bg"><span id="xp-bar-fill" class="stat-bar-fill xp" style="width:${Math.max(0, Math.min(100, (gameState.xp || 0)))}%"></span></span>
                  <span style="font-size:1em">${gameState.xp||0}/100 XP</span>
                </span>
                <span>
                  <span style="color:#38bdf8">🔥</span>
                  Streak: <b>${gameState.streak||0}</b>
                </span>
              </div>
              <div style="margin-top:0.4em;font-size:1.13em">
                Soul Tokens: <span style="color:var(--color-accent)">🪙 ${gameState.soulTokens||0}</span>
              </div>
            </div>
          </div>
          <div class="dashboard-inventory" style="display:flex;flex-direction:column;align-items:flex-end;font-size:1em;">
            <div>
              <span style="font-family:monospace;opacity:0.84">Inventory:</span>
              ${(gameState.inventory||[]).map(i=>`<span class="inv-slot">${i}</span>`).join("")||"None"}
            </div>
            <button class="rpg-btn" id="go-inventory-btn" style="margin-top:0.8em;">Open Inventory</button>
            <button class="rpg-btn" id="go-settings-btn" style="margin-top:0.6em; background:var(--color-secondary)">Settings</button>
          </div>
        </div>
        <div class="dashboard-zones-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:2.5em;margin-bottom:2em;">
          ${fantasyZones(gameState).map(zone=>`
            <div class="zone-tile rpg-fadein${zone.active?" act":""}" style="background:linear-gradient(124deg,var(--color-secondary)18%,var(--color-primary)92%);box-shadow:0 0 18px #0ff4;">
              <div style="font-size:2.4em">${zone.emoji}</div>
              <div style="font-size:1.37em;font-weight:bold;margin-bottom:0.4em">${zone.name}</div>
              <div class="zone-meter-bg" style="width:95%;margin:0.6em auto 0.8em auto;">
                <div class="zone-meter-fill" style="width:${Math.round(100*zone.meter/zone.meterMax) || 0}%"></div>
              </div>
              <div style="font-size:1em;margin-bottom:0.6em">${zone.meterLabel}</div>
              <div style="margin-bottom:0.5em;">${zone.action}</div>
            </div>
          `).join("")}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:2em;justify-content:center;margin-top:2em;">
          <button class="rpg-btn" id="go-quests-btn" style="font-size:1.12em;">🗡️ Go to Quest Log</button>
          <button class="rpg-btn" id="go-calendar-btn" style="font-size:1.12em;">📅 RPG Calendar</button>
        </div>
      </section>
      <style>
      .stat-bar-bg {
        display:inline-block;
        width:82px;
        background:#292353;
        border-radius:5px;
        border:1.5px solid var(--color-secondary);
        height:16px;
        margin:0 0.4em;
        vertical-align:middle;
        position:relative;
        overflow:hidden;
      }
      .stat-bar-fill {
        display:block;
        background:var(--color-accent);
        height:100%;
        border-radius:5px 0 0 5px;
        width:0;
        transition:width .91s cubic-bezier(.66,0,.19,1);
        box-shadow:0 0 10px #f43f5e80 inset;
      }
      .stat-bar-fill.xp {
        background:linear-gradient(90deg,#facc15 0%,#fff7cc 100%);
        box-shadow:0 0 14px #fffbe680 inset;
      }
      .dashboard-avatar svg {
        animation: float-orb 3.2s ease-in-out infinite;
        background:transparent;
      }
      .inv-slot {
        display:inline-block;
        background:#facc1511;
        color:#ffe;
        border:1.1px solid #facc15cc;
        border-radius:7px;
        padding:0.14em 0.42em;
        margin-right:0.25em;
        font-size:1em;
        vertical-align:middle;
        box-shadow:0 0 7px #facc15cc;
      }
      .dashboard-zones-grid .zone-tile {
        border-radius:18px;
        box-shadow:0 0 14px 2px var(--color-bg);
        padding:1.8em 0.8em 1.3em 0.8em;
        min-height:170px;
        min-width:210px;
        position:relative;
        animation: rpg-fadein 0.7s;
        transition:box-shadow 0.18s, background 0.21s;
      }
      .dashboard-zones-grid .zone-tile.act {
        box-shadow: 0 0 26px 3px var(--color-accent), 0 0 9px 5px var(--color-secondary);
        border:2.5px solid var(--color-accent);
        background:linear-gradient(123deg,var(--color-accent)13%,var(--color-primary)97%);
      }
      .zone-meter-bg {
        background:rgba(255,255,255,0.09);
        border-radius:7px;
        height:16px;
        box-shadow:0 0 7px #38bdf855 inset;
        position: relative;
        overflow: hidden;
      }
      .zone-meter-fill {
        background:linear-gradient(90deg,var(--color-accent),var(--color-secondary));
        height: 100%;
        border-radius:7px 0 0 7px;
        box-shadow: 0 0 10px 2px #ef444488 inset;
        transition: width 1s cubic-bezier(.71,.02,.14,1);
      }
      @media (max-width: 780px) {
        .dashboard-header { flex-direction:column;gap:1.6em;align-items:flex-start;}
        .dashboard-inventory{align-items:flex-start;}
      }
      @media (max-width: 540px) {
        .dashboard-zones-grid{ grid-template-columns:1fr; gap:1.2em;}
        .dashboard-header > .avatar-block {flex-direction:column;gap:0.6em;}
        .dashboard-avatar {margin-bottom:0.7em;}
      }
      </style>
    `;

    // Animate bars (after DOM present)
    globalThis.setTimeout(() => {
      animateBar(mountNode.querySelector("#hp-bar-fill"), gameState.hp || 0);
      animateBar(mountNode.querySelector("#xp-bar-fill"), gameState.xp || 0);
      fantasyZones(gameState).forEach((zone, i) => {
        const meter = mountNode.querySelectorAll(".zone-meter-fill")[i];
        if (meter) {
          animateBar(meter, Math.round(100 * zone.meter / (zone.meterMax || 1)));
        }
      });
    }, 30);

    // Avatar cosmetic picker popup logic
    const avatarBtn = mountNode.querySelector("#avatar-cosmetic-btn");
    if (avatarBtn) avatarBtn.onclick = () => {
      if (document.getElementById("avatar-cosmetic-modal")) return;
      const modal = document.createElement("div");
      modal.id = "avatar-cosmetic-modal";
      modal.className = "rpg-modal-overlay";
      modal.innerHTML = `
        <div class="rpg-modal" style="text-align:center;">
          <h3>Avatar Customization</h3>
          <div style="display:flex; flex-wrap:wrap;gap:1.2em;justify-content:center;align-items:center;">
            ${cosmeticsDef.filter(c => unlocked.includes(c.id)).map(c=>`
              <div style="padding:0.7em;cursor:pointer;border:${equippedCosmetic===c.id?'3.6px solid var(--color-accent)':'2px solid #a7f3d0'};border-radius:13px;transition:.13s;position:relative;min-width:68px;display:flex;flex-direction:column;align-items:center;gap:3px;background:linear-gradient(99deg,var(--color-bg) 70%,#ffffff15 100%);" data-id="${c.id}">
                <div style="width:68px;height:68px">${getAvatarSvg({ state: gameState, equipped: c.id })}</div>
                <span style="font-size:0.96em;color:#a7f3d0">${c.name}</span>
                ${equippedCosmetic===c.id?'<span style="position:absolute;right:3px;top:2px;color:var(--color-accent);font-size:1.3em;">★</span>':''}
              </div>`).join("")}
          </div>
          <button class="rpg-btn" style="margin-top:1.4em;" id="close-avatar-modal">Close</button>
        </div>
      `;
      document.body.appendChild(modal);
      Array.from(modal.querySelectorAll("div[data-id]")).forEach(div=>{
        div.onclick = function() {
          eqAvatarCosmetic(gameState, div.dataset.id);
          if (typeof gameCtx.setAvatar === "function") {
            gameCtx.setAvatar(div.dataset.id); // If syncing with server, provide this
          }
          RPGToast({ message: `Equipped: ${(cosmeticsDef.find(c=>c.id===div.dataset.id)||{}).name}`, variant: 'success'});
          modal.remove();
          render();
        }
      });
      modal.querySelector("#close-avatar-modal").onclick = ()=>modal.remove();
    };

    // Zone dynamic actions
    const bossBtn = mountNode.querySelector("#battle-boss-btn");
    if (bossBtn && typeof gameCtx.loseHP === "function" && typeof gameCtx.gainXP === "function") {
      bossBtn.onclick = () => {
        // Boss battle feedback (toy logic; actual should be deeper)
        gameCtx.loseHP(15);
        gameCtx.gainXP(40);
        RPGToast({message:"You bravely battled the deadline boss: +40 XP, -15 HP!",variant:"success"});
      };
    }
    // Navigation buttons
    const qBtn = mountNode.querySelector("#go-quests-btn");
    if (qBtn) { qBtn.onclick = () => (globalThis.location.hash = "/quests"); }
    const cBtn = mountNode.querySelector("#go-calendar-btn");
    if (cBtn) { cBtn.onclick = () => (globalThis.location.hash = "/calendar"); }
    const invBtn = mountNode.querySelector("#go-inventory-btn");
    if (invBtn) { invBtn.onclick = () => (globalThis.location.hash = "/inventory"); }
    const setBtn = mountNode.querySelector("#go-settings-btn");
    if (setBtn) { setBtn.onclick = () => (globalThis.location.hash = "/settings"); }
  }

  // Subscribe to game state for dynamic updates
  if (!gameCtx._rpg_dashboard_subscribed) {
    gameCtx.subscribe(render);
    gameCtx._rpg_dashboard_subscribed = true;
  }
  render();
}
