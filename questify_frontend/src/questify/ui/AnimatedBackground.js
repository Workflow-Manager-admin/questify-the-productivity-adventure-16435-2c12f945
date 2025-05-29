// PUBLIC_INTERFACE
export function AnimatedBackground(theme, domNode) {
  let canvas = document.createElement('canvas');
  canvas.id = 'rpg-bg-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = 0; canvas.style.left = 0;
  canvas.style.width = '100vw'; canvas.style.height = '100vh';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  domNode.appendChild(canvas);

  let ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = globalThis.innerWidth;
    canvas.height = globalThis.innerHeight;
  }
  globalThis.addEventListener('resize', resize); resize();

  // Nebula + star fields
  let particles = Array.from({ length: 130 }, () => ({
    x: Math.random() * globalThis.innerWidth,
    y: Math.random() * globalThis.innerHeight,
    r: 0.65 + 2 * Math.random(),
    dx: 0.2 + Math.random() * 0.2,
    dy: 0.2 + Math.random() * 0.23,
    alpha: 0.5 + Math.random() * 0.5,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Nebula BG
    let grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 200,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    grad.addColorStop(0, theme.palette.primary + 'CC');
    grad.addColorStop(0.5, theme.palette.secondary + '55');
    grad.addColorStop(1, '#0a0f3800');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    for (let p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 12; ctx.shadowColor = theme.palette.fantasy;
      ctx.fill();
      ctx.restore();
      // Animate
      p.x += p.dx; if (p.x > canvas.width) p.x = 0;
      p.y += p.dy; if (p.y > canvas.height) p.y = 0;
    }
    globalThis.requestAnimationFrame(draw);
  }
  draw();
}
