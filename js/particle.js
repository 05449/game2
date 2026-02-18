// ===== パーティクルシステム =====
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 5;
        this.vy = options.vy || (Math.random() - 0.5) * 5;
        this.size = options.size || Math.random() * 3 + 1;
        this.color = options.color || '#00ffff';
        this.alpha = options.alpha || 1;
        this.decay = options.decay || 0.02;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.99;
    }
    
    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.size *= 0.98;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.alpha <= 0 || this.size <= 0.1;
    }
}

// パーティクルマネージャー
const ParticleManager = {
    particles: [],
    maxParticles: 500,
    particleLevel: 'high',
    
    // 設定更新
    setLevel(level) {
        this.particleLevel = level;
        switch (level) {
            case 'low':
                this.maxParticles = 100;
                break;
            case 'medium':
                this.maxParticles = 300;
                break;
            case 'high':
            default:
                this.maxParticles = 500;
                break;
        }
    },
    
    // パーティクル追加
    add(particle) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(particle);
        }
    },
    
    // 複数追加
    addMultiple(particles) {
        particles.forEach(p => this.add(p));
    },
    
    // 更新
    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });
    },
    
    // 描画
    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    },
    
    // クリア
    clear() {
        this.particles = [];
    },
    
    // ===== エフェクト生成 =====
    
    // プレイヤートレイル
    createPlayerTrail(x, y, color = '#00ffff') {
        if (this.particleLevel === 'low' && Math.random() > 0.3) return;
        if (this.particleLevel === 'medium' && Math.random() > 0.6) return;
        
        this.add(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 4 + 2,
            color: color,
            alpha: 0.6,
            decay: 0.03
        }));
    },
    
    // 爆発エフェクト
    createExplosion(x, y, color = '#ff3366', count = 30) {
        const multiplier = this.particleLevel === 'low' ? 0.3 : 
                          this.particleLevel === 'medium' ? 0.6 : 1;
        const actualCount = Math.floor(count * multiplier);
        
        for (let i = 0; i < actualCount; i++) {
            const angle = (Math.PI * 2 / actualCount) * i;
            const speed = Math.random() * 8 + 4;
            
            this.add(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                color: color,
                alpha: 1,
                decay: 0.02,
                friction: 0.95
            }));
        }
    },
    
    // スパーク（ニアミス用）
    createSpark(x, y) {
        const count = this.particleLevel === 'low' ? 3 : 
                     this.particleLevel === 'medium' ? 6 : 10;
        
        for (let i = 0; i < count; i++) {
            this.add(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 2 + 1,
                color: '#ff00ff',
                alpha: 1,
                decay: 0.05
            }));
        }
    },
    
    // パワーアップ取得エフェクト
    createPowerupEffect(x, y, color = '#00ff88') {
        const count = this.particleLevel === 'low' ? 10 : 
                     this.particleLevel === 'medium' ? 20 : 30;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = Math.random() * 5 + 3;
            
            this.add(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: color,
                alpha: 1,
                decay: 0.03
            }));
        }
    },
    
    // 背景の星
    createBackgroundStar(canvasWidth, canvasHeight) {
        if (this.particleLevel === 'low' && Math.random() > 0.1) return null;
        if (this.particleLevel === 'medium' && Math.random() > 0.3) return null;
        
        return new Particle(
            Math.random() * canvasWidth,
            Math.random() * canvasHeight,
            {
                vx: 0,
                vy: Math.random() * 0.5 + 0.2,
                size: Math.random() * 2 + 0.5,
                color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`,
                alpha: 1,
                decay: 0.001
            }
        );
    },
    
    // シールドエフェクト
    createShieldEffect(x, y, radius) {
        const count = this.particleLevel === 'low' ? 2 : 
                     this.particleLevel === 'medium' ? 4 : 8;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.add(new Particle(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                {
                    vx: Math.cos(angle) * 0.5,
                    vy: Math.sin(angle) * 0.5,
                    size: Math.random() * 3 + 1,
                    color: '#00ff88',
                    alpha: 0.8,
                    decay: 0.04
                }
            ));
        }
    },
    
    // スローモーションエフェクト
    createSlowEffect(x, y, radius) {
        const count = this.particleLevel === 'low' ? 1 : 
                     this.particleLevel === 'medium' ? 2 : 4;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            
            this.add(new Particle(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist,
                {
                    vx: 0,
                    vy: -1,
                    size: Math.random() * 2 + 1,
                    color: '#8888ff',
                    alpha: 0.5,
                    decay: 0.02
                }
            ));
        }
    }
};

// グローバルアクセス用
window.Particle = Particle;
window.ParticleManager = ParticleManager;
