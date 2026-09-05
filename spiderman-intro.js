/* =====================================================================
   OCEAN RISE — Spider-Man изскача от морето
   Логическа сцена 720 x 1280, 60 fps, продължителност 6.80 s.

   Таймлайн
     0.00 - 0.20  черно
     0.20 - 1.20  fade-in от черно (под водата)
     1.20 - 2.40  бавно издигане, мехурчета, светлинни лъчи
     2.40 - 3.10  anticipation: свива се, изхвърля мехурчета
     3.10 - 3.25  експлозивно изстрелване + motion blur
     3.25         ПРОБИВ НА ПОВЪРХНОСТТА: бял flash + splash
     3.25 - 3.55  излитане, водна следа
     3.55 / 3.65  два изстрела паяжина (thwip)
     3.55 - 3.95  заключване в позата с overshoot + camera shake
     3.95 - 5.60  задържане на позата, бавен push-in
     5.60 - 6.00  fade to black (0.40 s)
     6.00 - 6.80  черно
   ===================================================================== */

const W = 720;
const H = 1280;
const DUR = 6.8;

/* --- ключови моменти -------------------------------------------------- */
const T = {
  fadeIn:   [0.20, 1.20],
  rise:     [1.20, 2.40],
  charge:   [2.40, 3.10],
  launch:   [3.10, 3.25],
  breach:    3.25,
  thwipA:    3.55,
  thwipB:    3.65,
  lock:      3.95,
  hold:     [3.95, 5.60],
  fadeOut:  [5.60, 6.00],
};

const SURFACE_Y = 300;      // морската повърхност в световни координати

/* --- помощни ---------------------------------------------------------- */
const clamp  = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp   = (a, b, t) => a + (b - a) * t;
const inv    = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const easeOut     = t => 1 - Math.pow(1 - t, 3);
const easeIn      = t => t * t * t;
const easeInOut   = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

function rand(a, b) { return a + Math.random() * (b - a); }

/* =====================================================================
   ЗВУК — всичко е синтезирано в Web Audio, без външни файлове
   ===================================================================== */
class Audio {
  constructor() { this.ctx = null; this.master = null; this.nodes = []; }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
  }

  setMuted(m) {
    if (!this.master) return;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  /** буфер с бял шум, преизползван от всички ефекти */
  noiseBuffer(sec = 2) {
    if (this._nb && this._nbSec >= sec) return this._nb;
    const n = Math.ceil(this.ctx.sampleRate * sec);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this._nb = buf; this._nbSec = sec;
    return buf;
  }

  stopAll() {
    this.nodes.forEach(n => { try { n.stop(); } catch (e) {} });
    this.nodes = [];
  }

  /** насрочва целия саундтрак спрямо t0 (ctx.currentTime в началото на клипа) */
  schedule(t0) {
    const c = this.ctx;
    this.stopAll();

    /* ---- 1. подводен ambient: филтриран шум + бавен LFO --------------- */
    const amb = c.createBufferSource();
    amb.buffer = this.noiseBuffer(8);
    amb.loop = true;
    const ambLP = c.createBiquadFilter();
    ambLP.type = 'lowpass';
    ambLP.frequency.setValueAtTime(220, t0);
    ambLP.frequency.setValueAtTime(220, t0 + T.launch[0]);
    ambLP.frequency.exponentialRampToValueAtTime(6000, t0 + T.breach); // отваря се при пробива
    ambLP.Q.value = 0.7;
    const ambG = c.createGain();
    ambG.gain.setValueAtTime(0.0001, t0);
    ambG.gain.exponentialRampToValueAtTime(0.11, t0 + T.fadeIn[1]);
    ambG.gain.setValueAtTime(0.11, t0 + T.charge[0]);
    ambG.gain.exponentialRampToValueAtTime(0.045, t0 + T.breach + 0.4);
    ambG.gain.setValueAtTime(0.045, t0 + T.fadeOut[0]);
    ambG.gain.exponentialRampToValueAtTime(0.0001, t0 + T.fadeOut[1]);
    amb.connect(ambLP).connect(ambG).connect(this.master);
    amb.start(t0); amb.stop(t0 + DUR);
    this.nodes.push(amb);

    /* ---- 2. под-бас пулс под водата ----------------------------------- */
    const sub = c.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(38, t0);
    sub.frequency.linearRampToValueAtTime(52, t0 + T.charge[1]);
    const subG = c.createGain();
    subG.gain.setValueAtTime(0.0001, t0 + T.fadeIn[0]);
    subG.gain.exponentialRampToValueAtTime(0.16, t0 + T.charge[0]);
    subG.gain.exponentialRampToValueAtTime(0.30, t0 + T.launch[0]);
    subG.gain.exponentialRampToValueAtTime(0.0001, t0 + T.breach + 0.25);
    sub.connect(subG).connect(this.master);
    sub.start(t0); sub.stop(t0 + T.breach + 0.4);
    this.nodes.push(sub);

    /* ---- 3. мехурчета ------------------------------------------------- */
    const bubbles = [1.45, 1.72, 2.05, 2.26, 2.55, 2.68, 2.84, 2.96, 3.04];
    bubbles.forEach(t => this.bubble(t0 + t));

    /* ---- 4. riser преди изстрелването --------------------------------- */
    this.riser(t0 + T.charge[0], T.breach - T.charge[0]);

    /* ---- 5. ПЛЯСЪК при пробива ---------------------------------------- */
    this.splash(t0 + T.breach);
    this.thump(t0 + T.breach, 62, 0.55, 0.42);

    /* ---- 6. водна следа / капки след него ------------------------------ */
    this.droplets(t0 + T.breach + 0.08, 0.5);

    /* ---- 7. THWIP x2 --------------------------------------------------- */
    this.thwip(t0 + T.thwipA);
    this.thwip(t0 + T.thwipB);

    /* ---- 8. заключване на позата: удар + шимър ------------------------- */
    this.thump(t0 + T.lock, 48, 0.9, 0.5);
    this.shimmer(t0 + T.lock, 1.8);

    /* ---- 9. вятър / ambient на открито до края ------------------------- */
    const wind = c.createBufferSource();
    wind.buffer = this.noiseBuffer(8);
    wind.loop = true;
    const wLP = c.createBiquadFilter();
    wLP.type = 'bandpass'; wLP.frequency.value = 700; wLP.Q.value = 0.6;
    const wG = c.createGain();
    wG.gain.setValueAtTime(0.0001, t0 + T.breach);
    wG.gain.exponentialRampToValueAtTime(0.05, t0 + T.breach + 0.5);
    wG.gain.setValueAtTime(0.05, t0 + T.fadeOut[0]);
    wG.gain.exponentialRampToValueAtTime(0.0001, t0 + T.fadeOut[1]);
    wind.connect(wLP).connect(wG).connect(this.master);
    wind.start(t0 + T.breach); wind.stop(t0 + DUR);
    this.nodes.push(wind);
  }

  bubble(at) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sine';
    const f0 = rand(300, 620);
    o.frequency.setValueAtTime(f0, at);
    o.frequency.exponentialRampToValueAtTime(f0 * rand(2.2, 3.4), at + 0.09);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(rand(0.05, 0.11), at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    o.connect(g).connect(lp).connect(this.master);
    o.start(at); o.stop(at + 0.16);
    this.nodes.push(o);
  }

  riser(at, len) {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer(4);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 4.5;
    bp.frequency.setValueAtTime(180, at);
    bp.frequency.exponentialRampToValueAtTime(4200, at + len);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.26, at + len * 0.94);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len + 0.05);
    src.connect(bp).connect(g).connect(this.master);
    src.start(at); src.stop(at + len + 0.1);
    this.nodes.push(src);
  }

  splash(at) {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer(3);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(3800, at);
    bp.frequency.exponentialRampToValueAtTime(420, at + 0.55);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 180;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.65, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.08, at + 0.28);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.85);
    src.connect(bp).connect(hp).connect(g).connect(this.master);
    src.start(at); src.stop(at + 0.95);
    this.nodes.push(src);
  }

  droplets(at, len) {
    for (let i = 0; i < 14; i++) {
      const t = at + Math.random() * len;
      const c = this.ctx;
      const src = c.createBufferSource();
      src.buffer = this.noiseBuffer(1);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = 8; bp.frequency.value = rand(1800, 5200);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(rand(0.03, 0.08), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      src.connect(bp).connect(g).connect(this.master);
      src.start(t); src.stop(t + 0.12);
      this.nodes.push(src);
    }
  }

  thwip(at) {
    const c = this.ctx;
    /* шумовият "съсък" на паяжината */
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer(1);
    src.playbackRate.value = 1.6;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(5200, at);
    bp.frequency.exponentialRampToValueAtTime(900, at + 0.13);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.34, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    src.connect(bp).connect(g).connect(this.master);
    src.start(at); src.stop(at + 0.2);
    this.nodes.push(src);

    /* тоналната "струна" отдолу */
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, at);
    o.frequency.exponentialRampToValueAtTime(160, at + 0.12);
    const og = c.createGain();
    og.gain.setValueAtTime(0.0001, at);
    og.gain.exponentialRampToValueAtTime(0.12, at + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, at + 0.15);
    o.connect(og).connect(this.master);
    o.start(at); o.stop(at + 0.18);
    this.nodes.push(o);
  }

  thump(at, freq, len, amp) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 2.2, at);
    o.frequency.exponentialRampToValueAtTime(freq * 0.62, at + len * 0.8);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(amp, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(this.master);
    o.start(at); o.stop(at + len + 0.05);
    this.nodes.push(o);
  }

  shimmer(at, len) {
    const c = this.ctx;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = c.createGain();
      const s = at + i * 0.035;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.05 / (i + 1) + 0.012, s + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, s + len);
      o.connect(g).connect(this.master);
      o.start(s); o.stop(s + len + 0.1);
      this.nodes.push(o);
    });
  }
}

/* =====================================================================
   ЧАСТИЦИ
   ===================================================================== */
class Particles {
  constructor() { this.list = []; }
  clear() { this.list.length = 0; }

  spawnBubble() {
    this.list.push({
      kind: 'bubble',
      x: rand(60, W - 60), y: H + rand(0, 120),
      r: rand(2, 9), vy: rand(-70, -26), vx: rand(-8, 8),
      wob: rand(0, 6.28), life: 1,
    });
  }

  /** експлозия от капки при пробива на повърхността */
  spawnSplash(cx, cy) {
    for (let i = 0; i < 220; i++) {
      const a = rand(-Math.PI, 0);              // нагоре
      const sp = rand(120, 900) * (0.35 + Math.abs(Math.cos(a)) * 0.9);
      this.list.push({
        kind: 'drop',
        x: cx + rand(-70, 70), y: cy + rand(-10, 14),
        vx: Math.cos(a) * sp * rand(0.5, 1.2),
        vy: Math.sin(a) * sp,
        r: rand(1.2, 5.5), life: 1, decay: rand(0.32, 0.75),
      });
    }
    for (let i = 0; i < 26; i++) {                // тежки "буци" вода
      const a = rand(-Math.PI * 0.9, -Math.PI * 0.1);
      this.list.push({
        kind: 'blob',
        x: cx + rand(-45, 45), y: cy,
        vx: Math.cos(a) * rand(90, 340),
        vy: Math.sin(a) * rand(320, 780),
        r: rand(7, 20), life: 1, decay: rand(0.4, 0.7),
      });
    }
  }

  /** капки, които се стичат от него във въздуха */
  spawnTrail(x, y, n = 3) {
    for (let i = 0; i < n; i++) {
      this.list.push({
        kind: 'drop',
        x: x + rand(-110, 110), y: y + rand(-90, 130),
        vx: rand(-24, 24), vy: rand(20, 150),
        r: rand(1, 3.4), life: 1, decay: rand(0.5, 1.0),
      });
    }
  }

  update(dt) {
    const g = 1500;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.kind === 'bubble') {
        p.wob += dt * 3;
        p.y += p.vy * dt;
        p.x += (p.vx + Math.sin(p.wob) * 14) * dt;
        if (p.y < -20) this.list.splice(i, 1);
      } else {
        p.vy += g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0 || p.y > H + 80) this.list.splice(i, 1);
      }
    }
  }

  draw(ctx, underwater) {
    for (const p of this.list) {
      if (p.kind === 'bubble') {
        if (!underwater) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.strokeStyle = 'rgba(190, 228, 255, .40)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(150, 205, 255, .10)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x - p.r * .3, p.y - p.r * .3, p.r * .28, 0, 6.283);
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.fill();
      } else if (p.kind === 'drop') {
        const a = clamp(p.life, 0, 1);
        const len = clamp(Math.hypot(p.vx, p.vy) * 0.016, 2, 26);
        const ang = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(ang);
        ctx.fillStyle = `rgba(214, 238, 255, ${a * .85})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, len, p.r * .6, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
      } else {
        const a = clamp(p.life, 0, 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(226, 244, 255, ${a * .7})`;
        ctx.fill();
      }
    }
  }
}

/* =====================================================================
   СЦЕНА
   ===================================================================== */
class Scene {
  constructor(canvas, hero) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.hero = hero;                 // <img> със Спайдърмен
    this.parts = new Particles();
    this.stars = Array.from({ length: 150 }, () => ({
      x: rand(0, W), y: rand(0, SURFACE_Y + 40),
      r: rand(0.4, 1.6), p: rand(0, 6.28),
    }));
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  /** рисува спрайта в offscreen буфер и го оцветява там,
      за да не залепне тинтът върху целия кадър (source-atop е глобален) */
  tinted(img, tint, filter) {
    if (!this._buf) {
      this._buf = document.createElement('canvas');
      this._buf.width  = Math.round(img.naturalWidth  * 0.62);
      this._buf.height = Math.round(img.naturalHeight * 0.62);
      this._bctx = this._buf.getContext('2d');
    }
    const b = this._bctx, bw = this._buf.width, bh = this._buf.height;
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.clearRect(0, 0, bw, bh);
    b.filter = filter || 'none';
    b.drawImage(img, 0, 0, bw, bh);
    b.filter = 'none';
    if (tint) {
      b.globalCompositeOperation = 'source-atop';
      b.fillStyle = tint;
      b.fillRect(0, 0, bw, bh);
      b.globalCompositeOperation = 'source-over';
    }
    return this._buf;
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = this.cv.getBoundingClientRect();
    this.cv.width  = Math.round(rect.width  * dpr);
    this.cv.height = Math.round(rect.height * dpr);
    this.sx = this.cv.width / W;
    this.sy = this.cv.height / H;
  }

  reset() {
    this.parts.clear();
    this.splashFired = false;
    this.lastT = 0;
    for (let i = 0; i < 26; i++) {         // мехурчета вече във водата
      this.parts.spawnBubble();
      const p = this.parts.list[this.parts.list.length - 1];
      p.y = rand(SURFACE_Y, H);
    }
  }

  /* ---- анимационни криви ------------------------------------------- */

  /** вертикално изместване на камерата (тя пада надолу, за да го следва) */
  cam(t) {
    return 300 * easeOut(inv(t, T.breach, 4.10));
  }

  /** позиция на героя в световни координати */
  heroPos(t) {
    let y;
    if (t < T.rise[0])         y = 1150;
    else if (t < T.rise[1])    y = lerp(1150, 790, easeInOut(inv(t, T.rise[0], T.rise[1])));
    else if (t < T.charge[1])  y = lerp(790, 845, easeInOut(inv(t, T.charge[0], T.charge[1])));  // сгъване надолу
    else if (t < T.breach)     y = lerp(845, SURFACE_Y, easeIn(inv(t, T.launch[0], T.breach)));
    else if (t < T.thwipA)     y = lerp(SURFACE_Y, 214, easeOut(inv(t, T.breach, T.thwipA)));
    else if (t < T.lock)       y = lerp(214, 252, easeOutBack(inv(t, T.thwipA, T.lock)));
    else                       y = 252 + Math.sin((t - T.lock) * 1.6) * 4;   // лек float
    const x = W * 0.5 + Math.sin(t * 0.7) * (t < T.breach ? 16 : 4);
    return { x, y };
  }

  heroScale(t) {
    let s;
    if (t < T.rise[0])        s = 0.30;
    else if (t < T.rise[1])   s = lerp(0.30, 0.44, easeInOut(inv(t, T.rise[0], T.rise[1])));
    else if (t < T.charge[1]) s = lerp(0.44, 0.41, easeInOut(inv(t, T.charge[0], T.charge[1])));
    else if (t < T.breach)    s = lerp(0.41, 0.50, easeIn(inv(t, T.launch[0], T.breach)));
    else if (t < T.lock)      s = lerp(0.50, 0.575, easeOutBack(inv(t, T.breach, T.lock)));
    else                      s = lerp(0.575, 0.605, easeInOut(inv(t, T.lock, T.fadeOut[1]))); // бавен push-in
    return s;
  }

  heroRot(t) {
    if (t < T.charge[1]) return (-0.34 + Math.sin(t * 1.1) * 0.06);
    if (t < T.breach)    return lerp(-0.34, -0.12, easeIn(inv(t, T.launch[0], T.breach)));
    if (t < T.lock)      return lerp(-0.12, 0, easeOutBack(inv(t, T.breach, T.lock)));
    return Math.sin((t - T.lock) * 1.1) * 0.012;
  }

  /* ---- рисуване ------------------------------------------------------ */

  drawSky(ctx, cam, t) {
    const sy = SURFACE_Y + cam;
    const g = ctx.createLinearGradient(0, sy - 900, 0, sy);
    g.addColorStop(0.00, '#01040c');
    g.addColorStop(0.42, '#06172f');
    g.addColorStop(0.74, '#12406b');
    g.addColorStop(0.93, '#2c74a8');
    g.addColorStop(1.00, '#4e9dcd');
    ctx.fillStyle = g;
    ctx.fillRect(0, -400, W, sy + 400);

    for (const s of this.stars) {
      const y = s.y + cam - 260;
      if (y > sy - 4) continue;
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.7 + s.p));
      ctx.fillStyle = `rgba(220, 236, 255, ${tw * 0.85})`;
      ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.283); ctx.fill();
    }

    /* луна + отблясък */
    const mx = W * 0.74, my = sy - 700;
    const mg = ctx.createRadialGradient(mx, my, 8, mx, my, 200);
    mg.addColorStop(0, 'rgba(226, 240, 255, .95)');
    mg.addColorStop(0.12, 'rgba(190, 216, 255, .30)');
    mg.addColorStop(1, 'rgba(120, 170, 255, 0)');
    ctx.fillStyle = mg;
    ctx.fillRect(mx - 220, my - 220, 440, 440);
    ctx.beginPath(); ctx.arc(mx, my, 30, 0, 6.283);
    ctx.fillStyle = '#eaf3ff'; ctx.fill();
  }

  drawWater(ctx, cam, t, submerged) {
    const sy = SURFACE_Y + cam;

    /* обем на водата */
    const g = ctx.createLinearGradient(0, sy, 0, H + 200);
    if (submerged) {
      g.addColorStop(0.00, '#1d6ea3');
      g.addColorStop(0.22, '#0e4a7c');
      g.addColorStop(0.60, '#062a4e');
      g.addColorStop(1.00, '#01101f');
    } else {
      g.addColorStop(0.00, '#0a3357');
      g.addColorStop(0.18, '#05203a');
      g.addColorStop(0.55, '#02101f');
      g.addColorStop(1.00, '#000508');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, sy, W, H - sy + 200);

    /* светлинни лъчи, идващи отгоре (само под водата) */
    if (submerged) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(14px)';
      for (let i = 0; i < 5; i++) {
        const bx = W * (0.12 + i * 0.19) + Math.sin(t * 0.5 + i) * 26;
        const wdt = 34 + Math.sin(t * 0.8 + i * 2) * 14;
        const rg = ctx.createLinearGradient(0, sy, 0, sy + 700);
        rg.addColorStop(0, 'rgba(150, 215, 255, .10)');
        rg.addColorStop(1, 'rgba(120, 190, 255, 0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(bx - wdt, sy);
        ctx.lineTo(bx + wdt, sy);
        ctx.lineTo(bx + wdt * 3.4, sy + 700);
        ctx.lineTo(bx - wdt * 3.4, sy + 700);
        ctx.closePath();
        ctx.fill();
      }
      ctx.filter = 'none';
      ctx.restore();
    }

    /* самата повърхност — вълна */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, sy + 60);
    for (let x = 0; x <= W; x += 8) {
      const y = sy
        + Math.sin(x * 0.014 + t * 1.9) * 5
        + Math.sin(x * 0.037 - t * 2.7) * 2.6
        + Math.sin(x * 0.006 + t * 0.9) * 7;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, sy - 60); ctx.lineTo(0, sy - 60);
    ctx.closePath();
    ctx.clip();
    const sg = ctx.createLinearGradient(0, sy - 30, 0, sy + 30);
    sg.addColorStop(0, 'rgba(150, 214, 255, .0)');
    sg.addColorStop(0.5, 'rgba(178, 228, 255, .55)');
    sg.addColorStop(1, 'rgba(120, 190, 240, .0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, sy - 40, W, 80);
    ctx.restore();

    /* ярка линия на хоризонта, за да се чете морето */
    if (!submerged) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const hg = ctx.createLinearGradient(0, sy - 26, 0, sy + 26);
      hg.addColorStop(0, 'rgba(120, 190, 245, 0)');
      hg.addColorStop(0.5, 'rgba(196, 232, 255, .55)');
      hg.addColorStop(1, 'rgba(90, 160, 220, 0)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, sy - 26, W, 52);
      ctx.restore();
    }

    /* лунна пътека по водата */
    if (!submerged) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) {
        const yy = sy + i * i * 0.9 + 4;
        if (yy > H) break;
        const ww = 14 + i * 5;
        ctx.fillStyle = `rgba(190, 224, 255, ${0.16 - i * 0.005})`;
        ctx.fillRect(W * 0.74 - ww / 2 + Math.sin(t * 2 + i) * 10, yy, ww, 3);
      }
      ctx.restore();
    }
  }

  drawHero(ctx, t, cam) {
    const img = this.hero;
    if (!img.complete || !img.naturalWidth) return;

    const p = this.heroPos(t);
    const s = this.heroScale(t);
    const rot = this.heroRot(t);
    const y = p.y + cam;

    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;

    const submerged = t < T.breach;
    const launching = t >= T.launch[0] && t < T.breach + 0.18;

    /* motion blur при изстрелването — няколко копия под него */
    if (launching) {
      const k = inv(t, T.launch[0], T.breach + 0.18);
      const trail = 5;
      for (let i = trail; i >= 1; i--) {
        ctx.save();
        ctx.globalAlpha = 0.16 * (1 - i / (trail + 1)) * (1 - k * 0.4);
        ctx.translate(p.x, y + i * 52 * (0.4 + k));
        ctx.rotate(rot);
        ctx.filter = 'blur(6px) brightness(0.8)';
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(rot);

    if (submerged) {
      /* размит, потъмнен и обезцветен под водата */
      const depth = 1 - inv(t, T.rise[0], T.breach);      // 1 = дълбоко
      const blur = lerp(0.6, 5.5, depth);
      const bright = lerp(0.95, 0.40, depth);
      const sat = lerp(0.9, 0.28, depth);
      const buf = this.tinted(
        img,
        `rgba(12, 66, 120, ${lerp(0.15, 0.55, depth)})`,
        `blur(${(blur * 0.62).toFixed(2)}px) brightness(${bright.toFixed(2)}) saturate(${sat.toFixed(2)})`
      );
      ctx.drawImage(buf, -w / 2, -h / 2, w, h);
    } else {
      /* мокър блясък веднага след пробива */
      const wet = 1 - inv(t, T.breach, T.breach + 1.1);
      ctx.shadowColor = 'rgba(120, 190, 255, .9)';
      ctx.shadowBlur = lerp(6, 48, wet);
      if (wet > 0.02) {
        ctx.drawImage(this.tinted(img, `rgba(190, 232, 255, ${wet * 0.30})`, null), -w / 2, -h / 2, w, h);
      } else {
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    return { x: p.x, y, w, h, rot };
  }

  drawWebs(ctx, t, hb) {
    if (!hb || t < T.thwipA) return;

    /* две котви върху спрайта (нормализирани координати в изображението) */
    const anchors = [
      { nx: 0.13, ny: 0.035, tx: -W * 0.58, ty: -H * 0.42, at: T.thwipA }, // върховете на горната ръка
      { nx: 0.09, ny: 0.480, tx: -W * 0.80, ty:  H * 0.07, at: T.thwipB }, // "thwip" ръката, наляво
    ];

    for (const a of anchors) {
      const k = inv(t, a.at, a.at + 0.14);
      if (k <= 0) continue;
      const ox = hb.x + (a.nx - 0.5) * hb.w;
      const oy = hb.y + (a.ny - 0.5) * hb.h;
      const ex = lerp(ox, ox + a.tx, easeOut(k));
      const ey = lerp(oy, oy + a.ty, easeOut(k));

      /* вибрация на струната, която затихва */
      const age = t - a.at;
      const vib = Math.exp(-age * 3.2) * 14;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(255,255,255,${0.72 + 0.28 * Math.exp(-age * 2)})`;
      ctx.lineWidth = lerp(9, 4.2, k);
      ctx.shadowColor = 'rgba(190, 228, 255, .95)';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      const seg = 22;
      for (let i = 0; i <= seg; i++) {
        const u = i / seg;
        const nx2 = -(ey - oy), ny2 = (ex - ox);
        const nl = Math.hypot(nx2, ny2) || 1;
        const off = Math.sin(u * Math.PI) * Math.sin(age * 26 + u * 7) * vib;
        const x = lerp(ox, ex, u) + (nx2 / nl) * off;
        const y = lerp(oy, ey, u) + (ny2 / nl) * off;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();

      /* капчици по паяжината */
      ctx.shadowBlur = 0;
      for (let i = 1; i < 6; i++) {
        const u = i / 6;
        ctx.beginPath();
        ctx.arc(lerp(ox, ex, u * k), lerp(oy, ey, u * k), 3.2, 0, 6.283);
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawSpeedLines(ctx, t) {
    const k = inv(t, T.launch[0], T.breach + 0.12);
    if (k <= 0 || k >= 1) return;
    const a = Math.sin(k * Math.PI) * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const x = (i * 137.5 + t * 90) % W;
      const len = rand(140, 460);
      const y = rand(-100, H);
      ctx.fillStyle = `rgba(200, 232, 255, ${a * rand(0.1, 0.35)})`;
      ctx.fillRect(x, y, rand(1, 2.6), len);
    }
    ctx.restore();
  }

  drawGrain(ctx, t) {
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 900; i++) {
      const v = Math.random() * 255 | 0;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.6, 1.6);
    }
    ctx.restore();
  }

  drawVignette(ctx) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.62)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---- главен кадър -------------------------------------------------- */
  render(t) {
    const ctx = this.ctx;
    const dt = clamp(t - this.lastT, 0, 0.05);
    this.lastT = t;

    ctx.setTransform(this.sx, 0, 0, this.sy, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const cam = this.cam(t);
    const submerged = t < T.breach;

    /* --- частици ---------------------------------------------------- */
    if (submerged && Math.random() < (t > T.charge[0] ? 1 : 0.6)) this.parts.spawnBubble();
    if (submerged && t > T.charge[0]) this.parts.spawnBubble();
    if (t >= T.breach && t < T.breach + 1.3 && Math.random() < 0.7) {
      const hp = this.heroPos(t);
      this.parts.spawnTrail(hp.x, hp.y + cam, 2);
    }
    if (!this.splashFired && t >= T.breach) {
      this.splashFired = true;
      this.parts.spawnSplash(W / 2, SURFACE_Y + this.cam(T.breach));
    }
    this.parts.update(dt);

    /* --- camera shake при заключването на позата --------------------- */
    let shx = 0, shy = 0;
    const sk = inv(t, T.lock - 0.02, T.lock + 0.16);
    if (sk > 0 && sk < 1) {
      const amp = (1 - sk) * 16;
      shx = rand(-amp, amp); shy = rand(-amp, amp);
    }
    ctx.save();
    ctx.translate(shx, shy);

    /* --- слоеве ------------------------------------------------------ */
    this.drawSky(ctx, cam, t);
    this.drawWater(ctx, cam, t, submerged);

    if (submerged) this.parts.draw(ctx, true);

    const hb = this.drawHero(ctx, t, cam);
    this.drawWebs(ctx, t, hb);

    if (!submerged) this.parts.draw(ctx, false);

    this.drawSpeedLines(ctx, t);

    /* --- воден стълб веднага след пробива ---------------------------- */
    const col = inv(t, T.breach, T.breach + 0.45);
    if (col > 0 && col < 1) {
      const sy = SURFACE_Y + cam;
      const hgt = 420 * easeOut(col);
      const a = (1 - col) * 0.8;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const cg = ctx.createLinearGradient(0, sy, 0, sy - hgt);
      cg.addColorStop(0, `rgba(210, 240, 255, ${a})`);
      cg.addColorStop(1, 'rgba(180, 225, 255, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 110 * (1 - col * 0.4), sy + 20);
      ctx.lineTo(W / 2 - 26, sy - hgt);
      ctx.lineTo(W / 2 + 26, sy - hgt);
      ctx.lineTo(W / 2 + 110 * (1 - col * 0.4), sy + 20);
      ctx.closePath();
      ctx.fill();
      /* разширяващ се пръстен по повърхността */
      ctx.strokeStyle = `rgba(220, 245, 255, ${a * 0.8})`;
      ctx.lineWidth = 4 * (1 - col);
      ctx.beginPath();
      ctx.ellipse(W / 2, sy + 8, 60 + 400 * col, 12 + 60 * col, 0, 0, 6.283);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    /* --- бял flash при пробива --------------------------------------- */
    const fl = inv(t, T.breach, T.breach + 0.16);
    if (fl > 0 && fl < 1) {
      ctx.fillStyle = `rgba(255,255,255,${Math.pow(1 - fl, 1.6) * 0.95})`;
      ctx.fillRect(0, 0, W, H);
    }

    this.drawGrain(ctx, t);
    this.drawVignette(ctx);

    /* --- fade in / fade out ------------------------------------------ */
    let black = 0;
    if (t < T.fadeIn[1]) black = 1 - easeOut(inv(t, T.fadeIn[0], T.fadeIn[1]));
    if (t >= T.fadeOut[0]) black = easeInOut(inv(t, T.fadeOut[0], T.fadeOut[1]));
    if (black > 0) {
      ctx.fillStyle = `rgba(0,0,0,${black})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

/* =====================================================================
   ПУСКАНЕ
   ===================================================================== */
const canvas   = document.getElementById('scene');
const gate     = document.getElementById('gate');
const playBtn  = document.getElementById('playBtn');
const replayBtn= document.getElementById('replayBtn');
const muteWrap = document.getElementById('muteWrap');
const muteBox  = document.getElementById('muteBox');

const hero = new Image();
hero.src = 'spiderman.png';

const audio = new Audio();
let scene = null;
let raf = 0;

function play() {
  cancelAnimationFrame(raf);
  audio.init();
  if (audio.ctx.state === 'suspended') audio.ctx.resume();

  if (!scene) scene = new Scene(canvas, hero);
  scene.resize();
  scene.reset();
  audio.setMuted(muteBox.checked);
  audio.schedule(audio.ctx.currentTime + 0.06);

  const start = performance.now() + 60;
  const loop = now => {
    const t = (now - start) / 1000;
    scene.render(clamp(t, 0, DUR));
    if (t < DUR) raf = requestAnimationFrame(loop);
    else { replayBtn.hidden = false; muteWrap.hidden = false; }
  };
  raf = requestAnimationFrame(loop);
}

playBtn.addEventListener('click', () => {
  gate.classList.add('hidden');
  const go = () => play();
  hero.complete && hero.naturalWidth ? go() : hero.addEventListener('load', go, { once: true });
});
replayBtn.addEventListener('click', () => { replayBtn.hidden = true; play(); });
muteBox.addEventListener('change', () => audio.setMuted(muteBox.checked));

/* --- дебъг: ?t=3.3 рисува един кадър (за преглед/експорт) ------------- */
const qs = new URLSearchParams(location.search);
if (qs.has('t')) {
  const go = () => {
    gate.classList.add('hidden');
    scene = new Scene(canvas, hero);
    scene.reset();
    for (let i = 0; i < 90; i++) scene.render(i / 60 * parseFloat(qs.get('t')) / 1.5);
    scene.render(parseFloat(qs.get('t')));
    document.body.dataset.ready = '1';
  };
  hero.complete && hero.naturalWidth ? go() : hero.addEventListener('load', go, { once: true });
}
