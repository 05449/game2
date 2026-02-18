// ===== UI管理 =====
const UI = {
    // DOM要素
    screens: {},
    elements: {},
    
    // 初期化
    init() {
        // 画面
        this.screens = {
            title: document.getElementById('title-screen'),
            game: document.getElementById('game-screen'),
            gameover: document.getElementById('gameover-screen'),
            settings: document.getElementById('settings-screen'),
            ranking: document.getElementById('ranking-screen'),
            howto: document.getElementById('howto-screen')
        };
        
        // 要素
        this.elements = {
            // タイトル
            titleBestTime: document.getElementById('title-best-time'),
            startBtn: document.getElementById('start-btn'),
            howtoBtn: document.getElementById('howto-btn'),
            rankingBtn: document.getElementById('ranking-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            
            // 操作説明
            howtoBackBtn: document.getElementById('howto-back-btn'),
            
            // ゲーム
            currentTime: document.getElementById('current-time'),
            gameBestTime: document.getElementById('game-best-time'),
            countdown: document.getElementById('countdown'),
            nearMiss: document.getElementById('near-miss'),
            comboDisplay: document.getElementById('combo-display'),
            powerupIndicator: document.getElementById('powerup-indicator'),
            skillSlow: document.getElementById('skill-slow'),
            skillEvade: document.getElementById('skill-evade'),
            skillSlowCd: document.getElementById('skill-slow-cd'),
            skillEvadeCd: document.getElementById('skill-evade-cd'),
            
            // ゲームオーバー
            resultTime: document.getElementById('result-time'),
            resultBest: document.getElementById('result-best'),
            newRecord: document.getElementById('new-record'),
            statNearmiss: document.getElementById('stat-nearmiss'),
            statItems: document.getElementById('stat-items'),
            retryBtn: document.getElementById('retry-btn'),
            titleBtn: document.getElementById('title-btn'),
            
            // 設定
            bgmVolume: document.getElementById('bgm-volume'),
            seVolume: document.getElementById('se-volume'),
            bgmValue: document.getElementById('bgm-value'),
            seValue: document.getElementById('se-value'),
            shakeToggle: document.getElementById('shake-toggle'),
            particleLevel: document.getElementById('particle-level'),
            settingsBackBtn: document.getElementById('settings-back-btn'),
            
            // ランキング
            rankingList: document.getElementById('ranking-list'),
            totalPlaytime: document.getElementById('total-playtime'),
            totalPlays: document.getElementById('total-plays'),
            rankingBackBtn: document.getElementById('ranking-back-btn')
        };
        
        // イベントリスナー設定
        this.setupEventListeners();
        
        // 初期表示更新
        this.updateBestTimeDisplay();
        this.loadSettings();
    },
    
    // イベントリスナー設定
    setupEventListeners() {
        // タイトル画面
        this.elements.startBtn.addEventListener('click', () => {
            Audio.resume();
            Audio.playStart();
            if (window.Game) Game.start();
        });
        
        this.elements.rankingBtn.addEventListener('click', () => {
            Audio.resume();
            this.showScreen('ranking');
            this.updateRanking();
        });
        
        this.elements.howtoBtn.addEventListener('click', () => {
            Audio.resume();
            this.showScreen('howto');
        });
        
        this.elements.howtoBackBtn.addEventListener('click', () => {
            this.showScreen('title');
        });
        
        this.elements.settingsBtn.addEventListener('click', () => {
            Audio.resume();
            this.showScreen('settings');
        });
        
        // ゲームオーバー画面
        this.elements.retryBtn.addEventListener('click', () => {
            Audio.playStart();
            if (window.Game) Game.start();
        });
        
        this.elements.titleBtn.addEventListener('click', () => {
            this.showScreen('title');
        });
        
        // 設定画面
        this.elements.bgmVolume.addEventListener('input', (e) => {
            const value = e.target.value;
            this.elements.bgmValue.textContent = value + '%';
            this.saveSettings();
        });
        
        this.elements.seVolume.addEventListener('input', (e) => {
            const value = e.target.value;
            this.elements.seValue.textContent = value + '%';
            this.saveSettings();
        });
        
        this.elements.shakeToggle.addEventListener('click', () => {
            const btn = this.elements.shakeToggle;
            if (btn.classList.contains('on')) {
                btn.classList.remove('on');
                btn.classList.add('off');
                btn.textContent = 'OFF';
            } else {
                btn.classList.remove('off');
                btn.classList.add('on');
                btn.textContent = 'ON';
            }
            this.saveSettings();
        });
        
        this.elements.particleLevel.addEventListener('change', () => {
            this.saveSettings();
        });
        
        this.elements.settingsBackBtn.addEventListener('click', () => {
            this.showScreen('title');
        });
        
        // ランキング画面
        this.elements.rankingBackBtn.addEventListener('click', () => {
            this.showScreen('title');
        });
        
        // スキルボタン
        this.elements.skillSlow.addEventListener('click', () => {
            if (window.Game && Game.player) {
                Game.useSkill('slow');
            }
        });
        
        this.elements.skillEvade.addEventListener('click', () => {
            if (window.Game && Game.player) {
                Game.useSkill('evade');
            }
        });
        
        // ポーズ画面ボタン
        const resumeBtn = document.getElementById('resume-btn');
        const pauseTitleBtn = document.getElementById('pause-title-btn');
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                if (window.Game) Game.resume();
            });
        }
        
        if (pauseTitleBtn) {
            pauseTitleBtn.addEventListener('click', () => {
                if (window.Game) {
                    Game.state = 'idle';
                    Audio.stopBGM();
                }
                this.hidePause();
                this.showScreen('title');
            });
        }
    },
    
    // 画面切り替え
    showScreen(name) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (this.screens[name]) {
            this.screens[name].classList.add('active');
        }
    },
    
    // ベストタイム表示更新
    updateBestTimeDisplay() {
        const bestTime = Storage.getBestTime();
        const formatted = this.formatTime(bestTime);
        
        if (this.elements.titleBestTime) {
            this.elements.titleBestTime.textContent = formatted;
        }
        if (this.elements.gameBestTime) {
            this.elements.gameBestTime.textContent = formatted;
        }
    },
    
    // 時間フォーマット
    formatTime(ms) {
        const totalSeconds = ms / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const centiseconds = Math.floor((ms % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    },
    
    // 長時間フォーマット
    formatLongTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    
    // ゲーム時間更新
    updateGameTime(ms) {
        if (this.elements.currentTime) {
            this.elements.currentTime.textContent = this.formatTime(ms);
        }
    },
    
    // カウントダウン表示
    showCountdown(number) {
        if (this.elements.countdown) {
            this.elements.countdown.style.display = 'block';
            this.elements.countdown.textContent = number === 0 ? 'GO!' : number;
            this.elements.countdown.style.animation = 'none';
            this.elements.countdown.offsetHeight; // リフロー強制
            this.elements.countdown.style.animation = 'countdownPop 0.5s ease-out';
        }
    },
    
    hideCountdown() {
        if (this.elements.countdown) {
            this.elements.countdown.style.display = 'none';
        }
    },
    
    // ニアミス表示
    showNearMiss() {
        if (this.elements.nearMiss) {
            this.elements.nearMiss.classList.remove('show');
            this.elements.nearMiss.offsetHeight; // リフロー強制
            this.elements.nearMiss.classList.add('show');
            
            setTimeout(() => {
                this.elements.nearMiss.classList.remove('show');
            }, 800);
        }
    },
    
    // コンボ表示更新
    updateCombo(combo) {
        if (this.elements.comboDisplay) {
            if (combo >= 2) {
                this.elements.comboDisplay.textContent = `${combo}x COMBO`;
                this.elements.comboDisplay.classList.add('show');
                
                // コンボ数に応じてスケールと色を変更
                const scale = 1 + Math.min(combo * 0.05, 0.5);
                const hue = Math.min(combo * 15, 300);
                this.elements.comboDisplay.style.transform = `scale(${scale})`;
                this.elements.comboDisplay.style.color = `hsl(${60 - hue}, 100%, 60%)`;
            } else {
                this.elements.comboDisplay.classList.remove('show');
            }
        }
    },
    
    // イベント警告表示
    showEventWarning(message) {
        // 警告オーバーレイを作成
        const warning = document.createElement('div');
        warning.className = 'event-warning';
        warning.innerHTML = `<span class="warning-icon">⚠</span><span class="warning-text">${message}</span>`;
        document.getElementById('game-screen').appendChild(warning);
        
        // アニメーション
        setTimeout(() => warning.classList.add('show'), 50);
        setTimeout(() => {
            warning.classList.remove('show');
            setTimeout(() => warning.remove(), 500);
        }, 2000);
    },
    
    // パワーアップ表示更新
    updatePowerupIndicator(powerups) {
        if (this.elements.powerupIndicator) {
            this.elements.powerupIndicator.innerHTML = powerups.map(p => 
                `<span class="powerup-active">${p}</span>`
            ).join('');
        }
    },
    
    // スキルUI更新
    updateSkillUI(player) {
        // スローモーション
        const slowCd = player.getSkillCooldown('slow');
        const slowActive = player.isSkillActive('slow');
        
        if (slowCd > 0) {
            this.elements.skillSlow.classList.add('disabled');
            this.elements.skillSlowCd.textContent = Math.ceil(slowCd / 1000) + 's';
        } else {
            this.elements.skillSlow.classList.remove('disabled');
            this.elements.skillSlowCd.textContent = slowActive ? 'ACTIVE' : '';
        }
        
        // 緊急回避
        const evadeCd = player.getSkillCooldown('evade');
        const evadeActive = player.isSkillActive('evade');
        
        if (evadeCd > 0) {
            this.elements.skillEvade.classList.add('disabled');
            this.elements.skillEvadeCd.textContent = Math.ceil(evadeCd / 1000) + 's';
        } else {
            this.elements.skillEvade.classList.remove('disabled');
            this.elements.skillEvadeCd.textContent = evadeActive ? 'ACTIVE' : '';
        }
    },
    
    // ゲームオーバー画面表示
    showGameOver(time, isNewRecord, nearMissCount, itemCount) {
        this.showScreen('gameover');
        
        this.elements.resultTime.textContent = this.formatTime(time);
        this.elements.resultBest.textContent = this.formatTime(Storage.getBestTime());
        
        if (isNewRecord) {
            this.elements.newRecord.classList.add('show');
        } else {
            this.elements.newRecord.classList.remove('show');
        }
        
        this.elements.statNearmiss.textContent = nearMissCount;
        this.elements.statItems.textContent = itemCount;
    },
    
    // ランキング更新
    updateRanking() {
        const scores = Storage.getTopScores();
        const stats = Storage.getStats();
        
        // ランキングリスト
        if (this.elements.rankingList) {
            if (scores.length === 0) {
                this.elements.rankingList.innerHTML = '<p style="text-align:center;color:#888;">まだ記録がありません</p>';
            } else {
                this.elements.rankingList.innerHTML = scores.map((score, i) => `
                    <div class="ranking-item">
                        <span class="ranking-rank">#${i + 1}</span>
                        <span class="ranking-time">${this.formatTime(score)}</span>
                    </div>
                `).join('');
            }
        }
        
        // 統計
        if (this.elements.totalPlaytime) {
            this.elements.totalPlaytime.textContent = this.formatLongTime(stats.totalPlayTime);
        }
        if (this.elements.totalPlays) {
            this.elements.totalPlays.textContent = stats.totalDeaths;
        }
    },
    
    // 設定読み込み
    loadSettings() {
        const settings = Storage.getSettings();
        
        this.elements.bgmVolume.value = settings.bgmVolume;
        this.elements.bgmValue.textContent = settings.bgmVolume + '%';
        
        this.elements.seVolume.value = settings.seVolume;
        this.elements.seValue.textContent = settings.seVolume + '%';
        
        if (settings.screenShake) {
            this.elements.shakeToggle.classList.add('on');
            this.elements.shakeToggle.classList.remove('off');
            this.elements.shakeToggle.textContent = 'ON';
        } else {
            this.elements.shakeToggle.classList.remove('on');
            this.elements.shakeToggle.classList.add('off');
            this.elements.shakeToggle.textContent = 'OFF';
        }
        
        this.elements.particleLevel.value = settings.particleLevel;
        
        // パーティクルマネージャーに適用
        ParticleManager.setLevel(settings.particleLevel);
    },
    
    // 設定保存
    saveSettings() {
        const settings = {
            bgmVolume: parseInt(this.elements.bgmVolume.value),
            seVolume: parseInt(this.elements.seVolume.value),
            screenShake: this.elements.shakeToggle.classList.contains('on'),
            particleLevel: this.elements.particleLevel.value
        };
        
        Storage.saveSettings(settings);
        Audio.applySettings();
        ParticleManager.setLevel(settings.particleLevel);
    },
    
    // 画面シェイク
    screenShake() {
        const settings = Storage.getSettings();
        if (!settings.screenShake) return;
        
        const gameScreen = this.screens.game;
        gameScreen.classList.add('screen-shake');
        
        setTimeout(() => {
            gameScreen.classList.remove('screen-shake');
        }, 300);
    },
    
    // ポーズ表示
    showPause() {
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) {
            pauseOverlay.style.display = 'flex';
        }
    },
    
    // ポーズ非表示
    hidePause() {
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) {
            pauseOverlay.style.display = 'none';
        }
    }
};

// グローバルアクセス用
window.UI = UI;
