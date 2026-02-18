// ===== ゲームメインループ =====
const Game = {
    canvas: null,
    ctx: null,
    
    // ゲーム状態
    state: 'idle', // idle, countdown, playing, paused, gameover
    player: null,
    
    // 時間管理
    startTime: 0,
    elapsedTime: 0,
    lastFrameTime: 0,
    
    // 統計
    nearMissCount: 0,
    itemCount: 0,
    
    // コンボシステム
    combo: 0,
    comboTimer: 0,
    comboDecayTime: 2000, // 2秒でコンボリセット
    maxCombo: 0,
    
    // スコアポップアップ
    scorePopups: [],
    
    // 特殊イベント
    lastEventTime: 0,
    eventInterval: 45000, // 45秒ごと
    
    // 危険警告
    dangerLevel: 0,
    
    // 背景の星
    backgroundStars: [],
    
    // 入力状態
    keys: {},
    mouseX: 0,
    mouseY: 0,
    
    // グリッド
    gridOffset: 0,
    
    // 初期化
    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // キャンバスサイズ設定
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 入力イベント設定
        this.setupInput();
        
        // 背景の星を生成
        this.initBackgroundStars();
        
        // ゲームループ開始
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },
    
    // キャンバスリサイズ
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    // 入力設定
    setupInput() {
        // キーボード
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // ポーズ切り替え
            if (e.code === 'Escape') {
                if (this.state === 'playing') {
                    this.pause();
                    e.preventDefault();
                } else if (this.state === 'paused') {
                    this.resume();
                    e.preventDefault();
                }
            }
            
            // スキル発動
            if (this.state === 'playing') {
                if (e.code === 'Space') {
                    this.useSkill('slow');
                    e.preventDefault();
                }
                if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                    this.useSkill('evade');
                    e.preventDefault();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // マウス
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            if (this.state === 'playing' && this.player) {
                this.player.setTarget(this.mouseX, this.mouseY);
            }
        });
        
        // タッチ
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
            
            if (this.state === 'playing' && this.player) {
                this.player.setTarget(this.mouseX, this.mouseY);
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
            
            if (this.state === 'playing' && this.player) {
                this.player.setTarget(this.mouseX, this.mouseY);
            }
        });
        
        // ダブルタップでスキル（モバイル）
        let lastTap = 0;
        this.canvas.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTap < 300) {
                this.useSkill('slow');
            }
            lastTap = now;
        });
    },
    
    // 背景の星を初期化
    initBackgroundStars() {
        this.backgroundStars = [];
        for (let i = 0; i < 100; i++) {
            this.backgroundStars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.2,
                alpha: Math.random() * 0.5 + 0.2
            });
        }
    },
    
    // ゲーム開始
    start() {
        this.state = 'countdown';
        this.nearMissCount = 0;
        this.itemCount = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.scorePopups = [];
        this.lastEventTime = 0;
        this.dangerLevel = 0;
        
        // プレイヤー初期化
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        
        // マネージャー初期化
        ObstacleManager.init();
        PowerupManager.init();
        ParticleManager.clear();
        
        // UI更新
        UI.showScreen('game');
        UI.updateBestTimeDisplay();
        
        // カウントダウン開始
        this.countdown(3);
    },
    
    // カウントダウン
    countdown(count) {
        if (count > 0) {
            UI.showCountdown(count);
            Audio.playCountdown(false);
            
            setTimeout(() => this.countdown(count - 1), 1000);
        } else {
            UI.showCountdown(0); // "GO!"
            Audio.playCountdown(true);
            
            setTimeout(() => {
                UI.hideCountdown();
                this.state = 'playing';
                this.startTime = performance.now();
                this.elapsedTime = 0;
                
                // 初期無敵時間
                this.player.setInvincible(3000);
                
                // BGM開始
                Audio.startGameBGM();
            }, 500);
        }
    },
    
    // スキル使用
    useSkill(skillName) {
        if (this.state !== 'playing' || !this.player) return;
        
        if (this.player.useSkill(skillName)) {
            Audio.playSkill();
            
            if (skillName === 'slow') {
                // スローモーション開始時のエフェクト
                ParticleManager.createExplosion(
                    this.player.x, this.player.y,
                    '#8888ff', 20
                );
            } else if (skillName === 'evade') {
                // 無敵発動時のエフェクト
                ParticleManager.createExplosion(
                    this.player.x, this.player.y,
                    '#ff00ff', 30
                );
            }
        }
    },
    
    // ポーズ
    pause() {
        if (this.state !== 'playing') return;
        
        this.state = 'paused';
        this.pauseTime = performance.now();
        Audio.stopBGM();
        UI.showPause();
    },
    
    // 再開
    resume() {
        if (this.state !== 'paused') return;
        
        // ポーズ時間分を補正
        const pauseDuration = performance.now() - this.pauseTime;
        this.startTime += pauseDuration;
        
        this.state = 'playing';
        Audio.startGameBGM();
        UI.hidePause();
    },
    
    // メインループ
    loop(currentTime) {
        try {
            // デルタタイム計算
            const deltaTime = Math.min(currentTime - this.lastFrameTime, 50);
            this.lastFrameTime = currentTime;
            
            // 更新と描画
            this.update(deltaTime);
            this.draw();
        } catch (e) {
            console.error('Game loop error:', e);
        }
        
        requestAnimationFrame((t) => this.loop(t));
    },
    
    // 更新
    update(deltaTime) {
        // 背景更新
        this.updateBackground(deltaTime);
        
        if (this.state !== 'playing') {
            ParticleManager.update();
            return;
        }
        
        // 経過時間
        this.elapsedTime = performance.now() - this.startTime;
        UI.updateGameTime(this.elapsedTime);
        
        // スローモーション判定
        const slowFactor = this.player.isSkillActive('slow') ? 0.3 : 1;
        
        // キーボード入力処理
        this.handleKeyboardInput();
        
        // プレイヤー更新
        this.player.update(deltaTime, this.canvas.width, this.canvas.height);
        
        // マグネット効果
        if (this.player.hasMagnet) {
            ObstacleManager.applyMagnet(this.player.x, this.player.y, 150, 0.5);
        }
        
        // 難易度更新
        ObstacleManager.updateDifficulty(this.elapsedTime);
        
        // 障害物更新
        ObstacleManager.update(
            deltaTime * slowFactor,
            this.canvas.width,
            this.canvas.height,
            this.player.x,
            this.player.y,
            slowFactor
        );
        
        // パワーアップ更新
        PowerupManager.update(
            deltaTime,
            this.canvas.width,
            this.canvas.height,
            this.player.x,
            this.player.y
        );
        
        // パーティクル更新
        ParticleManager.update();
        
        // 当たり判定
        this.checkCollisions();
        
        // コンボタイマー更新
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        // スコアポップアップ更新
        this.scorePopups = this.scorePopups.filter(popup => {
            popup.y -= 1;
            popup.alpha -= 0.02;
            return popup.alpha > 0;
        });
        
        // 危険警告計算
        this.updateDangerLevel();
        
        // 特殊イベントチェック
        this.checkSpecialEvent();
        
        // UI更新
        UI.updatePowerupIndicator(this.player.getActivePowerups());
        UI.updateSkillUI(this.player);
        UI.updateCombo(this.combo);
    },
    
    // キーボード入力処理
    handleKeyboardInput() {
        if (!this.player) return;
        
        let dx = 0;
        let dy = 0;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) dx += 1;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) dy -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) dy += 1;
        
        if (dx !== 0 || dy !== 0) {
            // 斜め移動の正規化
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
            
            this.player.move(dx, dy, 10);
        }
    },
    
    // 当たり判定
    checkCollisions() {
        if (!this.player) return;
        
        const playerX = this.player.x;
        const playerY = this.player.y;
        const playerRadius = this.player.getHitboxRadius();
        
        // パワーアップとの当たり判定
        const powerup = PowerupManager.checkCollision(playerX, playerY, this.player.radius);
        if (powerup) {
            this.collectPowerup(powerup);
        }
        
        // 障害物がない場合はスキップ
        if (!ObstacleManager.obstacles || ObstacleManager.obstacles.length === 0) return;
        
        // 障害物との当たり判定
        for (const obs of ObstacleManager.obstacles) {
            if (!obs) continue;
            const dx = obs.x - playerX;
            const dy = obs.y - playerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 当たり判定
            if (dist < obs.radius + playerRadius) {
                // シールドチェック
                if (this.player.useShield()) {
                    // シールドで防いだ
                    Audio.playPowerup();
                    ParticleManager.createExplosion(obs.x, obs.y, '#00ff88', 20);
                    obs.isAlive = false;
                    
                    // スプリッターなら分裂
                    if (obs.type === ObstacleType.SPLITTER) {
                        const fragments = obs.split();
                        ObstacleManager.obstacles.push(...fragments);
                    }
                    continue;
                }
                
                // ゲームオーバー
                this.gameOver();
                return;
            }
            
            // ニアミス判定
            if (!obs.hasPassedPlayer && dist < obs.radius + this.player.nearMissRadius) {
                // ニアミス！
                if (dist > obs.radius + playerRadius + 5) {
                    this.nearMiss(obs);
                }
            }
            
            // プレイヤーを通り過ぎたかチェック
            const distToTarget = Math.sqrt(
                (obs.x - playerX) ** 2 + (obs.y - playerY) ** 2
            );
            if (distToTarget > 100 && 
                ((obs.vx > 0 && obs.x > playerX + 50) ||
                 (obs.vx < 0 && obs.x < playerX - 50) ||
                 (obs.vy > 0 && obs.y > playerY + 50) ||
                 (obs.vy < 0 && obs.y < playerY - 50))) {
                obs.hasPassedPlayer = true;
            }
        }
    },
    
    // ニアミス処理
    nearMiss(obstacle) {
        obstacle.hasPassedPlayer = true;
        this.nearMissCount++;
        
        // コンボ増加
        this.combo++;
        this.comboTimer = this.comboDecayTime;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // スコア計算（コンボボーナス付き）
        const baseScore = 50;
        const comboBonus = Math.floor(baseScore * (this.combo * 0.5));
        const totalScore = baseScore + comboBonus;
        
        // スコアポップアップを追加
        this.scorePopups.push({
            x: this.player.x + (Math.random() - 0.5) * 30,
            y: this.player.y - 30,
            score: totalScore,
            combo: this.combo,
            alpha: 1
        });
        
        UI.showNearMiss();
        Audio.playNearMiss();
        
        ParticleManager.createSpark(this.player.x, this.player.y);
        
        // ニアミス回数を保存
        Storage.addNearMiss(1);
    },
    
    // パワーアップ取得
    collectPowerup(powerup) {
        this.itemCount++;
        
        Audio.playPowerup();
        ParticleManager.createPowerupEffect(powerup.x, powerup.y, powerup.color);
        
        switch (powerup.type) {
            case PowerupType.SHIELD:
                this.player.giveShield();
                break;
                
            case PowerupType.SLOW:
                // 一時的にスローモーション
                this.player.skills.slow.active = true;
                this.player.skills.slow.duration = 5000;
                break;
                
            case PowerupType.SHRINK:
                this.player.shrink(8000);
                break;
                
            case PowerupType.MAGNET:
                this.player.giveMagnet(6000);
                break;
                
            case PowerupType.TIME_BONUS:
                // タイムボーナス（表示上の演出のみ）
                // スコアには直接加算しないが、ボーナスタイムとして表示
                break;
        }
    },
    
    // ゲームオーバー
    gameOver() {
        this.state = 'gameover';
        
        // BGM停止
        Audio.stopBGM();
        
        // 死亡エフェクト
        Audio.playDeath();
        ParticleManager.createExplosion(this.player.x, this.player.y, '#ff3366', 50);
        UI.screenShake();
        
        // スコア保存
        const isNewRecord = Storage.updateBestTime(this.elapsedTime);
        Storage.addPlayTime(this.elapsedTime);
        
        if (isNewRecord) {
            Audio.playNewRecord();
        }
        
        // 少し遅延してゲームオーバー画面表示
        setTimeout(() => {
            UI.showGameOver(this.elapsedTime, isNewRecord, this.nearMissCount, this.itemCount);
            UI.updateBestTimeDisplay();
        }, 1000);
    },
    
    // 背景更新
    updateBackground(deltaTime) {
        // グリッドスクロール
        this.gridOffset = (this.gridOffset + 0.5) % 50;
        
        // 星の移動
        this.backgroundStars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
    },
    
    // 危険レベル更新
    updateDangerLevel() {
        if (!this.player) return;
        
        let minDist = Infinity;
        
        for (const obs of ObstacleManager.obstacles) {
            if (!obs) continue;
            const dx = obs.x - this.player.x;
            const dy = obs.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
            }
        }
        
        // 距離に応じて危険レベル0-1を計算
        const dangerThreshold = 150;
        if (minDist < dangerThreshold) {
            this.dangerLevel = 1 - (minDist / dangerThreshold);
        } else {
            this.dangerLevel = 0;
        }
    },
    
    // 特殊イベントチェック
    checkSpecialEvent() {
        // 最初のイベントは30秒後から
        if (this.elapsedTime < 30000) return;
        
        // イベント間隔チェック
        if (this.elapsedTime - this.lastEventTime >= this.eventInterval) {
            this.lastEventTime = this.elapsedTime;
            this.triggerSpecialEvent();
        }
    },
    
    // 特殊イベント発動
    triggerSpecialEvent() {
        // イベントタイプをランダムに選択
        const eventTypes = ['surround', 'wave', 'rain'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        // 警告表示
        UI.showEventWarning(eventType);
        
        // 1.5秒後にイベント発動
        setTimeout(() => {
            switch (eventType) {
                case 'surround':
                    // 包囲攻撃
                    ObstacleManager.spawnSurround(
                        this.canvas.width,
                        this.canvas.height,
                        this.player.x,
                        this.player.y,
                        12
                    );
                    break;
                    
                case 'wave':
                    // 大量ウェーブ
                    for (let i = 0; i < 15; i++) {
                        setTimeout(() => {
                            ObstacleManager.spawn(
                                this.canvas.width,
                                this.canvas.height,
                                this.player.x,
                                this.player.y
                            );
                        }, i * 100);
                    }
                    break;
                    
                case 'rain':
                    // 上からの雨
                    for (let i = 0; i < 20; i++) {
                        setTimeout(() => {
                            const x = Math.random() * this.canvas.width;
                            const obs = new Obstacle(x, -30, ObstacleType.FAST);
                            obs.setDirection(Math.PI / 2); // 真下
                            ObstacleManager.obstacles.push(obs);
                        }, i * 80);
                    }
                    break;
            }
        }, 1500);
    },
    
    // 描画
    draw() {
        const ctx = this.ctx;
        
        // 背景クリア
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッド描画
        this.drawGrid();
        
        // 背景の星
        this.drawBackgroundStars();
        
        // ゲーム中の描画
        if (this.state === 'playing' || this.state === 'countdown' || this.state === 'gameover') {
            // パワーアップ
            PowerupManager.draw(ctx);
            
            // 障害物
            ObstacleManager.draw(ctx);
            
            // パーティクル
            ParticleManager.draw(ctx);
            
            // プレイヤー
            if (this.player && this.state !== 'gameover') {
                this.player.draw(ctx);
            }
            
            // スローモーション時のオーバーレイ
            if (this.player && this.player.isSkillActive('slow')) {
                ctx.fillStyle = 'rgba(100, 100, 200, 0.1)';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            
            // スコアポップアップ描画
            this.drawScorePopups();
            
            // 危険警告エフェクト
            this.drawDangerEffect();
        }
    },
    
    // スコアポップアップ描画
    drawScorePopups() {
        const ctx = this.ctx;
        
        for (const popup of this.scorePopups) {
            ctx.save();
            ctx.globalAlpha = popup.alpha;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            
            // コンボが高いほど大きく、色も変化
            const scale = 1 + (popup.combo * 0.1);
            const hue = Math.min(popup.combo * 30, 300); // 黄色→マゼンタ
            
            ctx.fillStyle = `hsl(${60 - hue}, 100%, 60%)`;
            ctx.font = `bold ${Math.floor(18 * scale)}px Arial`;
            
            // スコア表示
            ctx.fillText(`+${popup.score}`, popup.x, popup.y);
            
            // コンボ表示（2以上の場合）
            if (popup.combo >= 2) {
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#ff00ff';
                ctx.fillText(`${popup.combo}x COMBO!`, popup.x, popup.y + 20);
            }
            
            ctx.restore();
        }
    },
    
    // 危険警告エフェクト描画
    drawDangerEffect() {
        if (this.dangerLevel <= 0) return;
        
        const ctx = this.ctx;
        const intensity = this.dangerLevel * 0.4;
        
        // 画面端を赤く光らせる
        const gradient = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2,
            Math.min(this.canvas.width, this.canvas.height) * 0.3,
            this.canvas.width / 2, this.canvas.height / 2,
            Math.max(this.canvas.width, this.canvas.height) * 0.7
        );
        
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `rgba(255, 0, 0, ${intensity})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    // グリッド描画
    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 50;
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // 縦線
        for (let x = -gridSize + (this.gridOffset % gridSize); x < this.canvas.width + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        
        // 横線
        for (let y = -gridSize + (this.gridOffset % gridSize); y < this.canvas.height + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    },
    
    // 背景の星描画
    drawBackgroundStars() {
        const ctx = this.ctx;
        
        this.backgroundStars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            ctx.fill();
        });
    }
};

// グローバルアクセス用
window.Game = Game;
