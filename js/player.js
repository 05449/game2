// ===== プレイヤークラス =====
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.radius = 15;
        this.hitboxRadius = 12; // 当たり判定は少し小さめ
        this.color = '#00ffff';
        this.glowColor = 'rgba(0, 255, 255, 0.5)';
        
        // 状態
        this.isInvincible = false;
        this.invincibleTime = 0;
        this.hasShield = false;
        this.isShrunk = false;
        this.shrinkTime = 0;
        this.hasMagnet = false;
        this.magnetTime = 0;
        
        // スキル
        this.skills = {
            slow: { cooldown: 0, maxCooldown: 20000, duration: 3000, active: false },
            evade: { cooldown: 0, maxCooldown: 30000, duration: 500, active: false }
        };
        
        // 移動補間
        this.lerpFactor = 0.15;
        
        // トレイル用の履歴
        this.trail = [];
        this.maxTrailLength = 10;
        
        // ニアミス検出用
        this.nearMissRadius = 50;
    }
    
    // マウス/タッチ位置を設定
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    // キーボード移動
    move(dx, dy, speed = 8) {
        this.targetX += dx * speed;
        this.targetY += dy * speed;
    }
    
    // 更新
    update(deltaTime, canvasWidth, canvasHeight) {
        // スムーズな移動（補間）
        this.x += (this.targetX - this.x) * this.lerpFactor;
        this.y += (this.targetY - this.y) * this.lerpFactor;
        
        // 画面内に制限
        const margin = this.radius;
        this.x = Math.max(margin, Math.min(canvasWidth - margin, this.x));
        this.y = Math.max(margin, Math.min(canvasHeight - margin, this.y));
        this.targetX = Math.max(margin, Math.min(canvasWidth - margin, this.targetX));
        this.targetY = Math.max(margin, Math.min(canvasHeight - margin, this.targetY));
        
        // トレイル更新
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }
        
        // 無敵時間更新
        if (this.isInvincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.isInvincible = false;
            }
        }
        
        // 縮小状態更新
        if (this.isShrunk) {
            this.shrinkTime -= deltaTime;
            if (this.shrinkTime <= 0) {
                this.isShrunk = false;
                this.hitboxRadius = 12;
            }
        }
        
        // マグネット更新
        if (this.hasMagnet) {
            this.magnetTime -= deltaTime;
            if (this.magnetTime <= 0) {
                this.hasMagnet = false;
            }
        }
        
        // スキルクールダウン更新
        for (const skill of Object.values(this.skills)) {
            if (skill.cooldown > 0) {
                skill.cooldown -= deltaTime;
            }
            if (skill.active) {
                skill.duration -= deltaTime;
                if (skill.duration <= 0) {
                    skill.active = false;
                }
            }
        }
        
        // パーティクル生成
        if (Math.random() > 0.5) {
            const trailColor = this.hasShield ? '#00ff88' : 
                              this.isInvincible ? '#ffffff' : 
                              this.isShrunk ? '#ffff00' : this.color;
            ParticleManager.createPlayerTrail(this.x, this.y, trailColor);
        }
    }
    
    // 描画
    draw(ctx) {
        ctx.save();
        
        // トレイル描画
        this.trail.forEach((pos, i) => {
            const alpha = (1 - i / this.maxTrailLength) * 0.3;
            const size = this.radius * (1 - i / this.maxTrailLength) * 0.8;
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.fill();
        });
        
        // シールドエフェクト
        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ParticleManager.createShieldEffect(this.x, this.y, this.radius + 10);
        }
        
        // マグネットエフェクト
        if (this.hasMagnet) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 30, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // グロー効果
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2
        );
        
        let mainColor = this.color;
        if (this.hasShield) mainColor = '#00ff88';
        if (this.isInvincible) mainColor = '#ffffff';
        if (this.isShrunk) mainColor = '#ffff00';
        if (this.skills.evade.active) mainColor = '#ff00ff';
        
        gradient.addColorStop(0, mainColor);
        gradient.addColorStop(0.5, mainColor.replace(')', ', 0.5)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // メインボディ
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.isShrunk ? this.radius * 0.6 : this.radius, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.fill();
        
        // 中心の輝き
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        
        // 無敵時間中は点滅
        if (this.isInvincible) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // 当たり判定用の半径取得
    getHitboxRadius() {
        if (this.isInvincible || this.skills.evade.active) return 0;
        return this.hitboxRadius;
    }
    
    // 無敵状態を設定
    setInvincible(duration) {
        this.isInvincible = true;
        this.invincibleTime = duration;
    }
    
    // シールド付与
    giveShield() {
        this.hasShield = true;
    }
    
    // シールド消費
    useShield() {
        if (this.hasShield) {
            this.hasShield = false;
            return true;
        }
        return false;
    }
    
    // 縮小状態
    shrink(duration) {
        this.isShrunk = true;
        this.shrinkTime = duration;
        this.hitboxRadius = 6;
    }
    
    // マグネット付与
    giveMagnet(duration) {
        this.hasMagnet = true;
        this.magnetTime = duration;
    }
    
    // スキル使用
    useSkill(skillName) {
        const skill = this.skills[skillName];
        if (skill && skill.cooldown <= 0 && !skill.active) {
            skill.active = true;
            skill.duration = skillName === 'slow' ? 3000 : 500;
            skill.cooldown = skill.maxCooldown;
            return true;
        }
        return false;
    }
    
    // スキルクールダウン取得
    getSkillCooldown(skillName) {
        const skill = this.skills[skillName];
        if (!skill) return 0;
        return Math.max(0, skill.cooldown);
    }
    
    // スキルが使用可能か
    canUseSkill(skillName) {
        const skill = this.skills[skillName];
        return skill && skill.cooldown <= 0 && !skill.active;
    }
    
    // スキルがアクティブか
    isSkillActive(skillName) {
        const skill = this.skills[skillName];
        return skill && skill.active;
    }
    
    // アクティブなパワーアップ一覧
    getActivePowerups() {
        const active = [];
        if (this.hasShield) active.push('シールド');
        if (this.isShrunk) active.push(`小型化 ${Math.ceil(this.shrinkTime / 1000)}s`);
        if (this.hasMagnet) active.push(`マグネット ${Math.ceil(this.magnetTime / 1000)}s`);
        if (this.skills.slow.active) active.push('スロー');
        if (this.skills.evade.active) active.push('無敵');
        return active;
    }
    
    // リセット
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.isInvincible = false;
        this.hasShield = false;
        this.isShrunk = false;
        this.hasMagnet = false;
        this.trail = [];
        this.skills.slow.cooldown = 0;
        this.skills.slow.active = false;
        this.skills.evade.cooldown = 0;
        this.skills.evade.active = false;
    }
}

// グローバルアクセス用
window.Player = Player;
