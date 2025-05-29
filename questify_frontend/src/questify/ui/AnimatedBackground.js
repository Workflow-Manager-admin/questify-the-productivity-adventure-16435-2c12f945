/**
 * RPG AnimatedBackground: Enhanced with parallax depth, seasonal effects, and richer nebula/lensflare/particles!
 * PUBLIC_INTERFACE
 */
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

  // Starfields at 2 parallax depths, nebula layers, and occasional RPG comet
  const starsA = Array.from({ length: 80 }, () => ({
    x: Math.random() * globalThis.innerWidth,
    y: Math.random() * globalThis.innerHeight,
    r: 0.65 + 1.3 * Math.random(),
    dx: 0.055 + Math.random() * 0.1,
    dy: 0.05 + Math.random() * 0.1,
    alpha: 0.6 + Math.random() * 0.43,
    layer: 1
  }));
  const starsB = Array.from({ length: 50 }, () => ({
    x: Math.random() * globalThis.innerWidth,
    y: Math.random() * globalThis.innerHeight,
    r: 1.2 + 1.6 * Math.random(),
    dx: 0.12 + Math.random() * 0.14,
    dy: 0.15 + Math.random() * 0.14,
    alpha: 0.5 + Math.random() * 0.48,
    layer: 2
  }));

  let lensflare = {x:0,y:0,t:0};

  // Firefly particles for added RPG season/fantasy
  const fireflies = Array.from({length: 17}, (_,i)=>({
    x: Math.random()*globalThis.innerWidth,
    y: Math.random()*globalThis.innerHeight,
    radius: 2+Math.random()*2.3,
    dx: 0.12+Math.random()*0.08,
    dy: 0.11+Math.random()*0.08,
    alpha: 0.4+0.2*Math.random(),
    g: (i%2?1:-1)*(0.1+Math.random()*0.3)
  }));

  let t = 0;

  function draw() {
    t++; // frame counter

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Parallax Nebula BG with dynamic color movement "waves"
    let nGrad = ctx.createRadialGradient(
      canvas.width/2+Math.sin(t/155)*90, canvas.height/2+Math.cos(t/211)*95, 170+35*Math.sin(t/91),
      canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)*1.09
    );
    nGrad.addColorStop(0, theme.palette.primary + 'FF');
    nGrad.addColorStop(0.4, theme.palette.secondary + '88');
    nGrad.addColorStop(0.8, '#0a0f3855');
    nGrad.addColorStop(1, '#15182f00');
    ctx.save();
    ctx.fillStyle = nGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Star layers/parallax
    for (let p of starsA) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = theme.palette.fantasy;
      ctx.fill();
      ctx.restore();
      p.x += p.dx; if (p.x > canvas.width) p.x = 0;
      p.y += p.dy; if (p.y > canvas.height) p.y = 0;
    }
    for (let p of starsB) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = "#facc15";
      ctx.shadowBlur = 14; ctx.shadowColor = theme.palette.accent;
      ctx.fill();
      ctx.restore();
      p.x += p.dx; if (p.x > canvas.width) p.x = 0;
      p.y += p.dy; if (p.y > canvas.height) p.y = 0;
    }

    // Optional bonus: rare comet
    if (t%333 === 0) {
      lensflare.x = Math.random() * canvas.width * 0.7 + canvas.width*0.15;
      lensflare.y = Math.random() * canvas.height * 0.7 + canvas.height*0.1;
      lensflare.t = 50;
    }
    // Lensflare/comet effect
    if (lensflare.t > 0) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(0.29, lensflare.t/140));
      ctx.beginPath(); ctx.arc(lensflare.x, lensflare.y, 63-lensflare.t, 0, Math.PI*2);
      ctx.fillStyle = "#fff7bb";
      ctx.shadowBlur = 50; ctx.shadowColor = "#facc15";
      ctx.fill();
      ctx.restore();
      lensflare.t--;
    }
    // Fireflies
    for (let f of fireflies) {
      ctx.save();
      ctx.globalAlpha = f.alpha + 0.17*Math.sin(t/23+f.x);
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2);
      ctx.fillStyle = "#ccfff0";
      ctx.shadowBlur = 22;
      ctx.shadowColor = "#38bdf8";
      ctx.fill();
      ctx.restore();
      f.x += f.dx*f.g; f.y += f.dy*f.g;
      if (f.x > canvas.width) f.x = 0;
      if (f.x < 0) f.x = canvas.width;
      if (f.y > canvas.height) f.y = 0;
      if (f.y < 0) f.y = canvas.height;
    }
    globalThis.requestAnimationFrame(draw);
  }
  draw();
}
