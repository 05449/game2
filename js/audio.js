// ===== オーディオ管理 =====
const Audio = {
    context: null,
    gainNodes: {
        master: null,
        bgm: null,
        se: null
    },
    
    // 現在のBGM
    currentBGM: null,
    bgmInterval: null,
    
    // 初期化
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // マスターゲイン
            this.gainNodes.master = this.context.createGain();
            this.gainNodes.master.connect(this.context.destination);
            
            // BGMゲイン
            this.gainNodes.bgm = this.context.createGain();
            this.gainNodes.bgm.connect(this.gainNodes.master);
            
            // SEゲイン
            this.gainNodes.se = this.context.createGain();
            this.gainNodes.se.connect(this.gainNodes.master);
            
            // 設定を適用
            this.applySettings();
        } catch (e) {
            console.error('Audio init error:', e);
        }
    },
    
    // 設定適用
    applySettings() {
        const settings = Storage.getSettings();
        if (this.gainNodes.bgm) {
            this.gainNodes.bgm.gain.value = settings.bgmVolume / 100;
        }
        if (this.gainNodes.se) {
            this.gainNodes.se.gain.value = settings.seVolume / 100;
        }
    },
    
    // コンテキスト再開（ユーザー操作後に呼び出し）
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },
    
    // シンセ音を生成
    createOscillator(type, frequency, duration, gainValue = 0.3) {
        if (!this.context) return null;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(gainValue, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.gainNodes.se);
        
        return { osc, gain };
    },
    
    // ===== 効果音 =====
    
    // ゲーム開始音
    playStart() {
        if (!this.context) return;
        
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const result = this.createOscillator('sine', freq, 0.3, 0.2);
                if (result && result.osc) {
                    result.osc.start();
                    result.osc.stop(this.context.currentTime + 0.3);
                }
            }, i * 100);
        });
    },
    
    // カウントダウン音
    playCountdown(isGo = false) {
        if (!this.context) return;
        
        const freq = isGo ? 880 : 440;
        const duration = isGo ? 0.5 : 0.2;
        const result = this.createOscillator('sine', freq, duration, 0.3);
        if (result && result.osc) {
            result.osc.start();
            result.osc.stop(this.context.currentTime + duration);
        }
    },
    
    // ニアミス音
    playNearMiss() {
        if (!this.context) return;
        
        const result = this.createOscillator('sine', 1200, 0.15, 0.15);
        if (result && result.osc) {
            result.osc.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.15);
            result.osc.start();
            result.osc.stop(this.context.currentTime + 0.15);
        }
    },
    
    // パワーアップ取得音
    playPowerup() {
        if (!this.context) return;
        
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const result = this.createOscillator('sine', freq, 0.15, 0.15);
                if (result && result.osc) {
                    result.osc.start();
                    result.osc.stop(this.context.currentTime + 0.15);
                }
            }, i * 50);
        });
    },
    
    // スキル発動音
    playSkill() {
        if (!this.context) return;
        
        const result = this.createOscillator('sawtooth', 200, 0.3, 0.1);
        if (result && result.osc) {
            result.osc.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.1);
            result.osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.3);
            result.osc.start();
            result.osc.stop(this.context.currentTime + 0.3);
        }
    },
    
    // 死亡音
    playDeath() {
        if (!this.context) return;
        
        // 爆発音
        const noise = this.context.createBufferSource();
        const bufferSize = this.context.sampleRate * 0.5;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        noise.buffer = buffer;
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.5);
        
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.4, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.gainNodes.se);
        
        noise.start();
    },
    
    // 新記録音
    playNewRecord() {
        if (!this.context) return;
        
        const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
        melody.forEach((freq, i) => {
            setTimeout(() => {
                const result = this.createOscillator('sine', freq, 0.2, 0.2);
                if (result && result.osc) {
                    result.osc.start();
                    result.osc.stop(this.context.currentTime + 0.2);
                }
            }, i * 150);
        });
    },
    
    // 障害物出現音（控えめ）
    playObstacleSpawn() {
        if (!this.context) return;
        
        const result = this.createOscillator('sine', 150, 0.1, 0.05);
        if (result && result.osc) {
            result.osc.start();
            result.osc.stop(this.context.currentTime + 0.1);
        }
    },
    
    // ===== BGM =====
    
    // ゲームBGM開始
    startGameBGM() {
        if (!this.context) return;
        this.stopBGM();
        
        let beat = 0;
        const bpm = 140;
        const beatInterval = 60000 / bpm / 4; // 16分音符
        
        const bassNotes = [65.41, 65.41, 87.31, 87.31, 98, 98, 87.31, 87.31]; // Low notes
        const melodyNotes = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66];
        
        this.bgmInterval = setInterval(() => {
            const beatInBar = beat % 16;
            
            // ベースドラム（4拍ごと）
            if (beatInBar % 4 === 0) {
                this.playBGMKick();
            }
            
            // ハイハット（2拍ごと）
            if (beatInBar % 2 === 0) {
                this.playBGMHihat();
            }
            
            // ベース（8拍ごと）
            if (beatInBar % 8 === 0) {
                const noteIndex = Math.floor(beat / 8) % bassNotes.length;
                this.playBGMBass(bassNotes[noteIndex]);
            }
            
            // メロディ（ランダムに）
            if (beatInBar % 4 === 2 && Math.random() > 0.5) {
                const noteIndex = Math.floor(Math.random() * melodyNotes.length);
                this.playBGMMelody(melodyNotes[noteIndex]);
            }
            
            beat++;
        }, beatInterval);
    },
    
    playBGMKick() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.gainNodes.bgm);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.2);
    },
    
    playBGMHihat() {
        if (!this.context) return;
        
        const bufferSize = this.context.sampleRate * 0.05;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        
        const gain = this.context.createGain();
        gain.gain.value = 0.1;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.gainNodes.bgm);
        
        noise.start();
    },
    
    playBGMBass(freq) {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.gainNodes.bgm);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    },
    
    playBGMMelody(freq) {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'square';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.08, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.gainNodes.bgm);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.2);
    },
    
    // BGM停止
    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
};

// グローバルアクセス用
window.Audio = Audio;
