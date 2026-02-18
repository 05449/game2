// ===== パワーアップクラス =====

// パワーアップタイプ
const PowerupType = {
    SHIELD: 'shield',
    SLOW: 'slow',
    SHRINK: 'shrink',
    MAGNET: 'magnet',
    TIME_BONUS: 'timeBonus'
};

// パワーアップクラス
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 18;
        this.isAlive = true;
        this.age = 0;
        this.lifetime = 8000; // 8秒で消える
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        this.setProperties();
    }
    
    setProperties() {
        switch (this.type) {
            case PowerupType.SHIELD:
                this.color = '#00ff88';
                this.icon = '🛡️';
                this.name = 'シールド';
                break;
                
            case PowerupType.SLOW:
                this.color = '#8888ff';
                this.icon = '⏱️';
                this.name = 'スロー';
                break;
                
            case PowerupType.SHRINK:
                this.color = '#ffff00';
                this.icon = '🔽';
                this.name = '小型化';
                break;
                
            case PowerupType.MAGNET:
                this.color = '#ff00ff';
                this.icon = '🧲';
                this.name = 'マグネット';
                break;
                
            case PowerupType.TIME_BONUS:
                this.color = '#ffcc00';
                this.icon = '⭐';
                this.name = '+10秒';
                break;
                
            default:
                this.color = '#ffffff';
                this.icon = '?';
                this.name = '???';
        }
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        this.pulsePhase += 0.1;
        
        // 寿命チェック
        if (this.age >= this.lifetime) {
            this.isAlive = false;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
        const currentRadius = this.radius * pulse;
        
        // 残り時間が少ないと点滅
        if (this.lifetime - this.age < 2000) {
            const flash = Math.sin(this.age / 50) > 0;
            if (!flash) {
                ctx.globalAlpha = 0.5;
            }
        }
        
        // グロー効果
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, currentRadius * 2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color + '4D'); // 30% alpha
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}33`;
        ctx.fill();
        
        // メインボディ
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 内側の円
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        
        // アイコン
        ctx.font = `${currentRadius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
        
        // 外枠
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 回転するリング
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius + 5, this.pulsePhase, this.pulsePhase + Math.PI);
        ctx.strokeStyle = `${this.color}88`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// パワーアップマネージャー
const PowerupManager = {
    powerups: [],
    spawnTimer: 0,
    spawnInterval: 5000, // 5秒ごと
    
    // 出現確率（合計100）
    spawnRates: {
        [PowerupType.TIME_BONUS]: 35,
        [PowerupType.SHRINK]: 25,
        [PowerupType.SLOW]: 20,
        [PowerupType.SHIELD]: 12,
        [PowerupType.MAGNET]: 8
    },
    
    // 初期化
    init() {
        this.powerups = [];
        this.spawnTimer = 0;
    },
    
    // ランダムタイプ選択
    getRandomType() {
        const total = Object.values(this.spawnRates).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (const [type, rate] of Object.entries(this.spawnRates)) {
            random -= rate;
            if (random <= 0) {
                return type;
            }
        }
        
        return PowerupType.TIME_BONUS;
    },
    
    // スポーン
    spawn(canvasWidth, canvasHeight, playerX, playerY) {
        // プレイヤーから離れた位置にスポーン
        let x, y;
        let attempts = 0;
        
        do {
            x = Math.random() * (canvasWidth - 100) + 50;
            y = Math.random() * (canvasHeight - 100) + 50;
            attempts++;
        } while (
            Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2) < 150 &&
            attempts < 10
        );
        
        const type = this.getRandomType();
        this.powerups.push(new Powerup(x, y, type));
    },
    
    // 更新
    update(deltaTime, canvasWidth, canvasHeight, playerX, playerY) {
        // スポーンタイマー
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.spawnInterval && this.powerups.length < 3) {
            this.spawnTimer = 0;
            this.spawn(canvasWidth, canvasHeight, playerX, playerY);
        }
        
        // 各パワーアップの更新
        this.powerups = this.powerups.filter(p => {
            p.update(deltaTime);
            return p.isAlive;
        });
    },
    
    // 描画
    draw(ctx) {
        this.powerups.forEach(p => p.draw(ctx));
    },
    
    // 当たり判定チェック
    checkCollision(playerX, playerY, playerRadius) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            const dx = p.x - playerX;
            const dy = p.y - playerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < p.radius + playerRadius) {
                // 取得！
                this.powerups.splice(i, 1);
                return p;
            }
        }
        return null;
    },
    
    // クリア
    clear() {
        this.powerups = [];
    }
};

// グローバルアクセス用
window.PowerupType = PowerupType;
window.Powerup = Powerup;
window.PowerupManager = PowerupManager;
