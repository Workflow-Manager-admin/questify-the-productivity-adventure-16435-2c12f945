//
// AvatarCosmetics: Unlocks, Equipment, and SVG merge/composition for avatar/cosmetic system
// All public: getAvatarSvg(opts), getAvatarCosmeticsDef(), userUnlockedCosmetics(state), eq/setAvatarItem
//

// Cosmetic inventory (expands easily)
const COSMETICS = [
  { id: 'base', name: 'Adventurer', svg: '', always: true },
  { id: 'wizard_hat', name: 'Wizard Hat', svg: `<polygon points="28,35 44,4 62,35" fill="#3e1d75" stroke="#33176d" stroke-width="2"/><ellipse cx="45" cy="36" rx="18" ry="4.4" fill="#6a38bd" opacity="0.83"/>` },
  { id: 'mystic_cape', name: 'Mystic Cape', svg: `<path d="M30,56 Q45,82 60,56 Q54,65 36,65 Q30,62 30,56" fill="#64ffda" opacity="0.78" stroke="#233" stroke-width="1.5"/>` },
  { id: 'cyber_shades', name: 'Cyber Shades', svg: `<rect x="32" y="33" width="25" height="8" fill="#201b4c" stroke="#4ade80" stroke-width="1.5" rx="5"/><rect x="32" y="35" width="25" height="4" fill="#25f5ac" opacity="0.3"/>` },
  { id: 'gold_crown', name: 'Royal Crown', svg: `<polygon points="35,32 40,13 45,24 49,13 55,32" fill="#facc15" stroke="#eab308" stroke-width="1.5"/>`, special: true },
  { id: 'fox_mask', name: 'Fox Mask', svg: `<ellipse cx="45" cy="38" rx="10" ry="7" fill="#fff" stroke="#ef4444" stroke-width="2"/><ellipse cx="52" cy="35" rx="3" ry="2" fill="#fff" stroke="#ef4444" stroke-width="1"/><ellipse cx="38" cy="35" rx="3" ry="2" fill="#fff" stroke="#ef4444" stroke-width="1"/>` },
];

// PUBLIC_INTERFACE
export function getAvatarCosmeticsDef() {
  return COSMETICS.map(c => ({ id: c.id, name: c.name, special: !!c.special }));
}

// PUBLIC_INTERFACE
export function userUnlockedCosmetics(gameState) {
  // "base" always, others from inventory, plus gold_crown at level 7+, fox_mask at streak 5+
  let unlocked = new Set(['base']);
  const inv = (gameState.inventory || []).map(i => i.toLowerCase());
  for (let c of COSMETICS) {
    if (c.always) continue;
    if (inv.includes(c.name.toLowerCase())) unlocked.add(c.id);
    if (c.id === 'gold_crown' && (gameState.level || 1) >= 7) unlocked.add('gold_crown');
    if (c.id === 'fox_mask' && (gameState.streak || 0) >= 5) unlocked.add('fox_mask');
  }
  return Array.from(unlocked);
}

// PUBLIC_INTERFACE
export function eqAvatarCosmetic(state, id) {
  // Sets current equipped cosmetic, respects unlocked
  state.avatar = id;
}

// PUBLIC_INTERFACE
export function getAvatarSvg(opts = {}) {
  // opts: { base, equipped, extra, style }
  // Compose SVG layers. Style/skin can affect base color
  const equipped = opts.equipped || 'base';
  const gameState = opts.state || {};
  // Determine what is unlocked for state
  const unlocked = userUnlockedCosmetics(gameState);
  const citems = COSMETICS.filter(c => c.id === 'base' || unlocked.includes(c.id));
  // Layer order: base, Cape, (other), Hat, Mask, Crown, Shades
  const baseSkin = `<circle cx="45" cy="38" r="22" fill="#fff7e1" stroke="#7c3aed" stroke-width="3"/>`;
  const body = `<ellipse cx="45" cy="67" rx="18" ry="18" fill="#7149d2" stroke="#4ade80" stroke-width="2"/>`;
  const shadow = `<ellipse cx="45" cy="86" rx="23" ry="7" fill="#201b4c55"/>`;
  // Order for overlay
  const partSvg = [
    (equipped === 'fox_mask'? getPart('fox_mask', citems):''),
    (equipped === 'gold_crown'? getPart('gold_crown', citems):''),
    (equipped === 'wizard_hat'? getPart('wizard_hat', citems):''),
    (equipped === 'mystic_cape'? getPart('mystic_cape', citems):''),
    (equipped === 'cyber_shades'? getPart('cyber_shades', citems):'')
  ].filter(Boolean).join('');

  // Slight face features are always present
  const eyes = `<ellipse cx="38.5" cy="38" rx="2.8" ry="3.3" fill="#212340"/><ellipse cx="51.5" cy="38" rx="2.8" ry="3.3" fill="#212340"/>`;
  const smile = `<path d="M39 47 Q45 54 51 47" stroke="#ef4444" stroke-width="2" fill="none"/>`;

  return `
    <svg width="90" height="90" viewBox="0 0 90 90">
      ${baseSkin}
      ${body}
      ${shadow}
      ${eyes}
      ${smile}
      ${partSvg}
    </svg>
  `;
}

function getPart(id, citems) {
  const f = citems.find(x => x.id === id && x.svg);
  return f ? f.svg : '';
}
