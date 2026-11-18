/**
 * DEL-MediCare - Realistic Gentle Falling Snow Effect
 * Lightweight Canvas-based Snow Animation (Non-intrusive, 60fps)
 */
const SnowEffect = {
  canvas: null,
  ctx: null,
  particles: [],
  maxParticles: 70,
  animationId: null,
  isActive: true,
  angle: 0,

  init() {
    this.canvas = document.getElementById('snow-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize());

    // Generate initial snowflakes
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(false));
    }

    if (this.isActive) {
      this.start();
    }
  },

  createParticle(fromTop = false) {
    const width = this.canvas ? this.canvas.width : window.innerWidth;
    const height = this.canvas ? this.canvas.height : window.innerHeight;

    // Palette with crisp light-blue, sky-cyan and white for visibility on light theme
    const palettes = [
      { r: 56, g: 189, b: 248 },  // Sky 400
      { r: 14, g: 165, b: 233 },  // Sky 500
      { r: 96, g: 165, b: 250 },  // Blue 400
      { r: 186, g: 230, b: 253 }, // Sky 200
      { r: 147, g: 197, b: 253 }, // Blue 300
      { r: 255, g: 255, b: 255 }  // Pure White
    ];
    const color = palettes[Math.floor(Math.random() * palettes.length)];

    return {
      x: Math.random() * width,
      y: fromTop ? -15 : Math.random() * height,
      radius: Math.random() * 3.5 + 1.5,
      density: Math.random() * this.maxParticles,
      speed: Math.random() * 1.3 + 0.6,
      swaySpeed: Math.random() * 0.02 + 0.01,
      swayOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.45 + 0.35,
      color: color
    };
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  draw() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.angle += 0.01;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Draw soft glowing snowflake particle
      this.ctx.beginPath();
      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 1.8);
      grad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity})`);
      grad.addColorStop(0.5, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity * 0.6})`);
      grad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);
      this.ctx.fillStyle = grad;
      this.ctx.arc(p.x, p.y, p.radius * 1.8, 0, Math.PI * 2, false);
      this.ctx.fill();

      // Update particle physics
      p.y += p.speed + Math.cos(this.angle + p.density) * 0.4;
      p.x += Math.sin(this.angle + p.swayOffset) * 1.1;

      // Wrap around bounds
      if (p.y > this.canvas.height + 15) {
        this.particles[i] = this.createParticle(true);
      }
      if (p.x > this.canvas.width + 15) {
        p.x = -10;
      } else if (p.x < -15) {
        p.x = this.canvas.width + 10;
      }
    }
  },

  start() {
    this.isActive = true;
    const loop = () => {
      if (!this.isActive) return;
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(loop);
  },

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  toggle() {
    if (this.isActive) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }
};

window.SnowEffect = SnowEffect;
