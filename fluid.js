/**
 * Aether: Liquid Glass Fluid Simulation Engine
 * Handles organic multi-layered glass metaballs, physics boundaries,
 * mouse interactions, and dynamic styling properties.
 */

class LiquidBlob {
    constructor(canvas, x, y, radius, colorStart, colorEnd) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.radius = radius || (120 + Math.random() * 100);
        this.baseRadius = this.radius;
        
        // Random velocity
        const speed = 0.5 + Math.random() * 1.2;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.colorStart = colorStart;
        this.colorEnd = colorEnd;
        
        // Organic pulsing offset
        this.pulseSeed = Math.random() * 100;
        this.pulseSpeed = 0.005 + Math.random() * 0.01;
    }

    update(settings, mouse) {
        const speedFactor = settings.speed;
        
        // Move blob
        this.x += this.vx * speedFactor;
        this.y += this.vy * speedFactor;
        
        // Pulse size organically
        this.pulseSeed += this.pulseSpeed;
        this.radius = this.baseRadius + Math.sin(this.pulseSeed) * (this.baseRadius * 0.1);

        // Physics: Wall Collisions with smooth damping
        const bounceDamp = -1;
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= bounceDamp;
        } else if (this.x + this.radius > this.canvas.width) {
            this.x = this.canvas.width - this.radius;
            this.vx *= bounceDamp;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= bounceDamp;
        } else if (this.y + this.radius > this.canvas.height) {
            this.y = this.canvas.height - this.radius;
            this.vy *= bounceDamp;
        }

        // Mouse interaction
        if (mouse.x !== null && mouse.y !== null && settings.interactiveMode !== 'none') {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.hypot(dx, dy);
            
            // Interaction radius: 300px
            const activeDist = 350;
            if (distance < activeDist) {
                const force = (activeDist - distance) / activeDist;
                const angle = Math.atan2(dy, dx);
                
                // Attract or Repel
                const accel = force * 0.15;
                if (settings.interactiveMode === 'attract') {
                    this.vx += Math.cos(angle) * accel;
                    this.vy += Math.sin(angle) * accel;
                } else if (settings.interactiveMode === 'repel') {
                    this.vx -= Math.cos(angle) * accel;
                    this.vy -= Math.sin(angle) * accel;
                }
            }
        }

        // Limit velocity to prevent wild shooting
        const maxV = 4;
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > maxV) {
            this.vx = (this.vx / currentSpeed) * maxV;
            this.vy = (this.vy / currentSpeed) * maxV;
        }
        
        // Add subtle passive friction to prevent endless acceleration
        this.vx *= 0.99;
        this.vy *= 0.99;
    }

    draw(settings) {
        const ctx = this.ctx;
        
        // Outer glow gradient
        const grad = ctx.createRadialGradient(
            this.x - this.radius * 0.15, 
            this.y - this.radius * 0.15, 
            this.radius * 0.05, 
            this.x, 
            this.y, 
            this.radius
        );
        
        // Convert hex colors to translucent rgba
        const startRGBA = this.hexToRGBA(this.colorStart, settings.opacity);
        const endRGBA = this.hexToRGBA(this.colorEnd, 0.0);
        
        grad.addColorStop(0, startRGBA);
        grad.addColorStop(0.5, this.hexToRGBA(this.colorStart, settings.opacity * 0.6));
        grad.addColorStop(1, endRGBA);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 3D Glass Specular Highlight (creates the glossy liquid shine)
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.clip();

        // Shiny curved reflection overlay
        const shineRadius = this.radius * 0.7;
        const shineX = this.x - this.radius * 0.3;
        const shineY = this.y - this.radius * 0.3;
        
        const shineGrad = ctx.createRadialGradient(
            shineX, shineY, 0,
            shineX, shineY, shineRadius
        );
        shineGrad.addColorStop(0, `rgba(255, 255, 255, ${settings.opacity * 0.9})`);
        shineGrad.addColorStop(0.3, `rgba(255, 255, 255, ${settings.opacity * 0.35})`);
        shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.arc(shineX, shineY, shineRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    hexToRGBA(hex, alpha) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgba(255, 255, 255, ${alpha})`;
    }
}

class LiquidSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Default Configurable Settings
        this.settings = {
            count: 10,
            speed: 1.0,
            opacity: 0.45,
            interactiveMode: 'attract', // attract, repel, none
            theme: 'aether', // aether, solis, abyss, aurora
            blur: 40 // CSS backdrop-filter / filter blur
        };

        this.themes = {
            aether: [
                { start: '#d45dff', end: '#a200ff' }, // Magenta-purple
                { start: '#00f0ff', end: '#0084ff' }, // Cyan-blue
                { start: '#ff5376', end: '#e10034' }  // Hot pink
            ],
            solis: [
                { start: '#ff9d00', end: '#ff5100' }, // Gold-orange
                { start: '#ff377f', end: '#b00045' }, // Pinkish red
                { start: '#ffe600', end: '#ffa200' }  // Sun Yellow
            ],
            abyss: [
                { start: '#0055ff', end: '#000c8f' }, // Deep Blue
                { start: '#00ffaa', end: '#007044' }, // Seafoam Green
                { start: '#7b00ff', end: '#2f008f' }  // Purple Blue
            ],
            aurora: [
                { start: '#00ff66', end: '#006622' }, // Neon Green
                { start: '#00f0ff', end: '#008c9e' }, // Soft Cyan
                { start: '#b3ff00', end: '#608a00' }  // Lime Green
            ]
        };

        this.blobs = [];
        this.mouse = { x: null, y: null };
        this.animationFrameId = null;

        this.init();
        this.bindEvents();
    }

    init() {
        this.resizeCanvas();
        this.generateBlobs();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    generateBlobs() {
        this.blobs = [];
        const currentTheme = this.themes[this.settings.theme];
        const numBlobs = this.settings.count;
        
        for (let i = 0; i < numBlobs; i++) {
            const pair = currentTheme[i % currentTheme.length];
            const size = 120 + Math.random() * 160;
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.blobs.push(new LiquidBlob(this.canvas, x, y, size, pair.start, pair.end));
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.generateBlobs();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    updateSettings(newSettings) {
        let regenerate = false;
        
        if (newSettings.theme && newSettings.theme !== this.settings.theme) {
            regenerate = true;
        }
        if (newSettings.count !== undefined && parseInt(newSettings.count) !== this.settings.count) {
            regenerate = true;
        }

        this.settings = { ...this.settings, ...newSettings };
        this.settings.count = parseInt(this.settings.count);
        this.settings.speed = parseFloat(this.settings.speed);
        this.settings.opacity = parseFloat(this.settings.opacity);
        this.settings.blur = parseInt(this.settings.blur);

        // Apply blur to canvas style
        this.canvas.style.filter = `blur(${this.settings.blur}px)`;

        if (regenerate) {
            this.generateBlobs();
        }
    }

    start() {
        const render = () => {
            // Clear canvas with a very soft, faint fade to create dynamic motion trails
            this.ctx.fillStyle = 'rgba(13, 15, 23, 0.15)'; 
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Update and draw blobs
            for (const blob of this.blobs) {
                blob.update(this.settings, this.mouse);
                blob.draw(this.settings);
            }

            this.animationFrameId = requestAnimationFrame(render);
        };
        
        // Initial filter setup
        this.canvas.style.filter = `blur(${this.settings.blur}px)`;
        render();
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// Export for availability in app.js
window.LiquidSimulation = LiquidSimulation;
