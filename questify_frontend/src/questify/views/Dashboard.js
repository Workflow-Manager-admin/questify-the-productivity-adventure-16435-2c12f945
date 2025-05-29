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
  // Avatar rendering (simple SVG, supports customization by inventory)
  function getAvatarSvg(gameState) {
    // Example basic avatar: add hat/cape if user has inventory items
    const hasHat = (gameState.inventory || []).includes("Wizard Hat");
    const hasCape = (gameState.inventory || []).includes("Mystic Cape");
    return `
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="38" r="22" fill="#fff7e1" stroke="#7c3aed" stroke-width="3"/>
        <ellipse cx="45" cy="67" rx="18" ry="18" fill="#7149d2" stroke="#4ade80" stroke-width="2"/>
        <ellipse cx="45" cy="86" rx="23" ry="7" fill="#201b4c55"/>
        <!-- Eyes -->
        <ellipse cx="38.5" cy="38" rx="2.8" ry="3.3" fill="#212340"/>
        <ellipse cx="51.5" cy="38" rx="2.8" ry="3.3" fill="#212340"/>
        <!-- Smile -->
        <path d="M39 47 Q45 54 51 47" stroke="#ef4444" stroke-width="2" fill="none"/>
        <!-- Hat -->
        ${hasHat?`<polygon points="28,35 44,4 62,35" fill="#3e1d75" stroke="#33176d" stroke-width="2"/>
          <ellipse cx="45" cy="36" rx="18" ry="4.4" fill="#6a38bd" opacity="0.83"/>`:''}
        <!-- Cape -->
        ${hasCape?`<path d="M30,56 Q45,82 60,56 Q54,65 36,65 Q30,62 30,56" fill="#64ffda" opacity="0.78" stroke="#233" stroke-width="1.5"/>`:''}
      </svg>
    `;
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
    const percentHP = Math.max(0, Math.min(100, (gameState.hp || 0)));
    const percentXP = Math.max(0, Math.min(100, (gameState.xp || 0)));
    // Responsive/animated zone grid
    mountNode.innerHTML = `
      <section
        class="rpg-glow-card rpg-fadein"
        style="max-width:1100px;width:98vw;padding:0.7em 1.6em 1.2em 1.6em;margin:2em auto;"
      >
        <div class="dashboard-header" style="display:flex;flex-wrap:wrap;align-items:center;gap:2.2em;justify-content:space-between;margin-bottom:2.3em;">
          <div class="avatar-block rpg-float" style="display:flex;align-items:center;gap:1.2em;">
            <div class="dashboard-avatar" style="width:90px;height:90px">${getAvatarSvg(gameState)}</div>
            <div>
              <div style="font-size:2em;font-family:var(--rpg-font);font-weight:700;">Welcome, <span style="color:var(--color-secondary)">${authCtx.user.email.split('@')[0]}</span></div>
              <div style="display:flex;align-items:center;gap:1.2em;">
                <span>Level <span style="font-weight:bold">${gameState.level||1}</span></span>
                <span>
                  <span style="color:#ec4899">💗</span>
                  <span id="hp-bar" class="stat-bar-bg"><span id="hp-bar-fill" class="stat-bar-fill" style="width:${percentHP}%"></span></span>
                  <span style="font-size:1em">${gameState.hp||0}/100 HP</span>
                </span>
                <span>
                  <span style="color:#facc15">✨</span>
                  <span id="xp-bar" class="stat-bar-bg"><span id="xp-bar-fill" class="stat-bar-fill xp" style="width:${percentXP}%"></span></span>
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
      animateBar(mountNode.querySelector("#hp-bar-fill"), percentHP);
      animateBar(mountNode.querySelector("#xp-bar-fill"), percentXP);
      fantasyZones(gameState).forEach((zone, i) => {
        const meter = mountNode.querySelectorAll(".zone-meter-fill")[i];
        if (meter) {
          animateBar(meter, Math.round(100 * zone.meter / (zone.meterMax || 1)));
        }
      });
    }, 30);

    // Zone dynamic actions
    const bossBtn = mountNode.querySelector("#battle-boss-btn");
    if (bossBtn && typeof gameCtx.loseHP === "function" && typeof gameCtx.gainXP === "function") {
      bossBtn.onclick = () => {
        // Boss battle feedback (toy logic; actual should be deeper)
        gameCtx.loseHP(15);
        gameCtx.gainXP(40);
        globalThis.alert("You bravely battled the deadline boss: +40 XP, -15 HP!");
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
