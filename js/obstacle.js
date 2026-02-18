// ===== 障害物クラス =====

// 障害物タイプ
const ObstacleType = {
    NORMAL: 'normal',
    FAST: 'fast',
    LARGE: 'large',
    HOMING: 'homing',
    SPLITTER: 'splitter',
    WAVE: 'wave',
    GHOST: 'ghost',
    LASER: 'laser'
};

// 基本障害物クラス
class Obstacle {
    constructor(x, y, type = ObstacleType.NORMAL) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        
        // タイプ別のプロパティ設定
        this.setProperties();
        
        // 状態
        this.isAlive = true;
        this.age = 0;
        this.hasPassedPlayer = false; // ニアミス判定用
    }
    
    setProperties() {
        switch (this.type) {
            case ObstacleType.NORMAL:
                this.radius = 12;
                this.speed = 3;
                this.color = '#ff3366';
                this.glowColor = 'rgba(255, 51, 102, 0.5)';
                break;
                
            case ObstacleType.FAST:
                this.radius = 8;
                this.speed = 6;
                this.color = '#ff8800';
                this.glowColor = 'rgba(255, 136, 0, 0.5)';
                break;
                
            case ObstacleType.LARGE:
                this.radius = 25;
                this.speed = 1.5;
                this.color = '#cc0033';
                this.glowColor = 'rgba(204, 0, 51, 0.5)';
                break;
                
            case ObstacleType.HOMING:
                this.radius = 10;
                this.speed = 2;
                this.color = '#ff00ff';
                this.glowColor = 'rgba(255, 0, 255, 0.5)';
                this.homingStrength = 0.02;
                break;
                
            case ObstacleType.SPLITTER:
                this.radius = 18;
                this.speed = 2.5;
                this.color = '#00ff00';
                this.glowColor = 'rgba(0, 255, 0, 0.5)';
                this.canSplit = true;
                break;
                
            case ObstacleType.WAVE:
                this.radius = 10;
                this.speed = 3;
                this.color = '#00ffff';
                this.glowColor = 'rgba(0, 255, 255, 0.5)';
                this.waveAmplitude = 50;
                this.waveFrequency = 0.05;
                this.initialX = this.x;
                this.initialY = this.y;
                break;
                
            case ObstacleType.GHOST:
                this.radius = 12;
                this.speed = 2.5;
                this.color = '#8888ff';
                this.glowColor = 'rgba(136, 136, 255, 0.3)';
                this.flickerRate = 0.1;
                this.visible = true;
                break;
                
            case ObstacleType.LASER:
                this.radius = 5;
                this.speed = 15;
                this.color = '#ffff00';
                this.glowColor = 'rgba(255, 255, 0, 0.5)';
                this.length = 100;
                break;
                
            default:
                this.radius = 12;
                this.speed = 3;
                this.color = '#ff3366';
                this.glowColor = 'rgba(255, 51, 102, 0.5)';
        }
    }
    
    // 方向を設定
    setDirection(angle) {
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        if (this.type === ObstacleType.WAVE) {
            this.baseVx = this.vx;
            this.baseVy = this.vy;
        }
    }
    
    // ターゲットに向かって設定
    setTarget(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
            
            // WAVE型の場合はベース速度も設定
            if (this.type === ObstacleType.WAVE) {
                this.baseVx = this.vx;
                this.baseVy = this.vy;
            }
        }
    }
    
    // 更新
    update(deltaTime, playerX, playerY, slowFactor = 1) {
        this.age += deltaTime;
        
        const adjustedSpeed = slowFactor;
        
        // タイプ別の更新処理
        switch (this.type) {
            case ObstacleType.HOMING:
                // プレイヤーを追尾
                const dx = playerX - this.x;
                const dy = playerY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    this.vx += (dx / dist) * this.homingStrength;
                    this.vy += (dy / dist) * this.homingStrength;
                    
                    // 速度制限
                    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (currentSpeed > this.speed) {
                        this.vx = (this.vx / currentSpeed) * this.speed;
                        this.vy = (this.vy / currentSpeed) * this.speed;
                    }
                }
                break;
                
            case ObstacleType.WAVE:
                // 波状移動
                // baseVxとbaseVyが設定されていない場合は通常移動にフォールバック
                if (this.baseVx === undefined || this.baseVy === undefined) {
                    this.baseVx = this.vx || 0;
                    this.baseVy = this.vy || 0;
                }
                
                const waveOffset = Math.sin(this.age * this.waveFrequency) * this.waveAmplitude;
                // 進行方向に垂直なオフセットを追加
                const perpX = -this.baseVy;
                const perpY = this.baseVx;
                const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
                
                if (perpDist > 0) {
                    this.x += this.baseVx * adjustedSpeed + (perpX / perpDist) * waveOffset * 0.1;
                    this.y += this.baseVy * adjustedSpeed + (perpY / perpDist) * waveOffset * 0.1;
                } else {
                    // 垂直方向がない場合は通常移動
                    this.x += this.vx * adjustedSpeed;
                    this.y += this.vy * adjustedSpeed;
                }
                return; // 通常の移動をスキップ
                
            case ObstacleType.GHOST:
                // 点滅
                if (Math.random() < this.flickerRate) {
                    this.visible = !this.visible;
                }
                break;
        }
        
        // 通常の移動
        this.x += this.vx * adjustedSpeed;
        this.y += this.vy * adjustedSpeed;
    }
    
    // 描画
    draw(ctx) {
        // ゴーストで見えない状態
        if (this.type === ObstacleType.GHOST && !this.visible) {
            // 薄く描画
            ctx.save();
            ctx.globalAlpha = 0.2;
            this.drawBody(ctx);
            ctx.restore();
            return;
        }
        
        this.drawBody(ctx);
    }
    
    drawBody(ctx) {
        ctx.save();
        
        // グロー効果
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.glowColor);
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // メインボディ
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 内側のハイライト
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.2, this.y - this.radius * 0.2, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        
        // タイプ別の追加描画
        if (this.type === ObstacleType.HOMING) {
            // 追尾マーク
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        if (this.type === ObstacleType.SPLITTER) {
            // 分裂マーク
            ctx.fillStyle = '#ffffff';
            ctx.font = `${this.radius}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('×', this.x, this.y);
        }
        
        ctx.restore();
    }
    
    // 画面外判定
    isOutOfBounds(canvasWidth, canvasHeight, margin = 100) {
        return this.x < -margin || 
               this.x > canvasWidth + margin ||
               this.y < -margin ||
               this.y > canvasHeight + margin;
    }
    
    // 分裂（スプリッター用）
    split() {
        if (this.type !== ObstacleType.SPLITTER || !this.canSplit) return [];
        
        this.isAlive = false;
        const fragments = [];
        
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i + Math.random() * 0.5;
            const frag = new Obstacle(this.x, this.y, ObstacleType.FAST);
            frag.radius = 6;
            frag.color = '#88ff88';
            frag.setDirection(angle);
            fragments.push(frag);
        }
        
        return fragments;
    }
}

// 障害物マネージャー
const ObstacleManager = {
    obstacles: [],
    spawnTimer: 0,
    spawnInterval: 1000, // ミリ秒
    difficultyMultiplier: 1,
    
    // 利用可能なタイプ（時間経過で増える）
    availableTypes: [ObstacleType.NORMAL],
    
    // 初期化
    init() {
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1000;
        this.difficultyMultiplier = 1;
        this.availableTypes = [ObstacleType.NORMAL];
    },
    
    // 難易度更新
    updateDifficulty(elapsedTime) {
        // 時間経過で難易度上昇
        this.difficultyMultiplier = 1 + (elapsedTime / 60000); // 1分ごとに+1
        
        // スポーン間隔を短く
        this.spawnInterval = Math.max(200, 1000 - elapsedTime / 100);
        
        // 新しい障害物タイプを解放
        if (elapsedTime >= 15000 && !this.availableTypes.includes(ObstacleType.FAST)) {
            this.availableTypes.push(ObstacleType.FAST);
        }
        if (elapsedTime >= 20000 && !this.availableTypes.includes(ObstacleType.LARGE)) {
            this.availableTypes.push(ObstacleType.LARGE);
        }
        if (elapsedTime >= 30000 && !this.availableTypes.includes(ObstacleType.HOMING)) {
            this.availableTypes.push(ObstacleType.HOMING);
        }
        if (elapsedTime >= 45000 && !this.availableTypes.includes(ObstacleType.SPLITTER)) {
            this.availableTypes.push(ObstacleType.SPLITTER);
        }
        if (elapsedTime >= 60000 && !this.availableTypes.includes(ObstacleType.WAVE)) {
            this.availableTypes.push(ObstacleType.WAVE);
        }
        if (elapsedTime >= 90000 && !this.availableTypes.includes(ObstacleType.GHOST)) {
            this.availableTypes.push(ObstacleType.GHOST);
        }
        if (elapsedTime >= 120000 && !this.availableTypes.includes(ObstacleType.LASER)) {
            this.availableTypes.push(ObstacleType.LASER);
        }
    },
    
    // スポーン
    spawn(canvasWidth, canvasHeight, playerX, playerY) {
        // ランダムなタイプを選択
        const type = this.availableTypes[Math.floor(Math.random() * this.availableTypes.length)];
        
        // スポーン位置（画面外から）
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: // 上
                x = Math.random() * canvasWidth;
                y = -30;
                break;
            case 1: // 右
                x = canvasWidth + 30;
                y = Math.random() * canvasHeight;
                break;
            case 2: // 下
                x = Math.random() * canvasWidth;
                y = canvasHeight + 30;
                break;
            case 3: // 左
            default:
                x = -30;
                y = Math.random() * canvasHeight;
                break;
        }
        
        const obstacle = new Obstacle(x, y, type);
        
        // プレイヤー方向に向かわせる（少しランダム性を持たせる）
        const targetX = playerX + (Math.random() - 0.5) * 200;
        const targetY = playerY + (Math.random() - 0.5) * 200;
        obstacle.setTarget(targetX, targetY);
        
        // 難易度に応じて速度上昇
        obstacle.speed *= this.difficultyMultiplier;
        obstacle.vx *= this.difficultyMultiplier;
        obstacle.vy *= this.difficultyMultiplier;
        
        this.obstacles.push(obstacle);
        
        // 控えめなスポーン音
        if (Math.random() > 0.7) {
            Audio.playObstacleSpawn();
        }
    },
    
    // 包囲スポーン（特殊イベント）
    spawnSurround(canvasWidth, canvasHeight, playerX, playerY, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const distance = 300;
            
            const x = playerX + Math.cos(angle) * distance;
            const y = playerY + Math.sin(angle) * distance;
            
            const obstacle = new Obstacle(x, y, ObstacleType.NORMAL);
            obstacle.setTarget(playerX, playerY);
            obstacle.speed *= 0.7;
            
            this.obstacles.push(obstacle);
        }
    },
    
    // 更新
    update(deltaTime, canvasWidth, canvasHeight, playerX, playerY, slowFactor = 1) {
        // スポーンタイマー
        this.spawnTimer += deltaTime * slowFactor;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            
            // 難易度に応じて複数スポーン
            const spawnCount = Math.min(3, Math.floor(this.difficultyMultiplier));
            for (let i = 0; i < spawnCount; i++) {
                this.spawn(canvasWidth, canvasHeight, playerX, playerY);
            }
        }
        
        // 各障害物の更新
        const newObstacles = [];
        
        this.obstacles = this.obstacles.filter(obs => {
            obs.update(deltaTime, playerX, playerY, slowFactor);
            
            // 画面外に出たら削除
            if (obs.isOutOfBounds(canvasWidth, canvasHeight)) {
                return false;
            }
            
            // 死んでいたら削除（分裂後など）
            if (!obs.isAlive) {
                return false;
            }
            
            return true;
        });
        
        // 新しく追加された障害物（分裂など）
        this.obstacles.push(...newObstacles);
    },
    
    // 描画
    draw(ctx) {
        this.obstacles.forEach(obs => obs.draw(ctx));
    },
    
    // マグネット効果（障害物を弾く）
    applyMagnet(playerX, playerY, radius, force) {
        this.obstacles.forEach(obs => {
            const dx = obs.x - playerX;
            const dy = obs.y - playerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < radius && dist > 0) {
                const pushForce = (1 - dist / radius) * force;
                obs.vx += (dx / dist) * pushForce;
                obs.vy += (dy / dist) * pushForce;
            }
        });
    },
    
    // クリア
    clear() {
        this.obstacles = [];
    },
    
    // 障害物数取得
    getCount() {
        return this.obstacles.length;
    }
};

// グローバルアクセス用
window.ObstacleType = ObstacleType;
window.Obstacle = Obstacle;
window.ObstacleManager = ObstacleManager;
