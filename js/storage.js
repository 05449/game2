// ===== ストレージ管理 =====
const Storage = {
    STORAGE_KEY: 'evade_infinity_data',
    
    // デフォルトデータ
    defaultData: {
        bestTime: 0,
        topScores: [],
        totalPlayTime: 0,
        totalDeaths: 0,
        nearMissCount: 0,
        settings: {
            bgmVolume: 80,
            seVolume: 100,
            screenShake: true,
            particleLevel: 'high'
        },
        achievements: []
    },
    
    // データ取得
    getData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return { ...this.defaultData, ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('Storage load error:', e);
        }
        return { ...this.defaultData };
    },
    
    // データ保存
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Storage save error:', e);
        }
    },
    
    // ベストタイム取得
    getBestTime() {
        return this.getData().bestTime;
    },
    
    // ベストタイム更新
    updateBestTime(time) {
        const data = this.getData();
        let isNewRecord = false;
        
        if (time > data.bestTime) {
            data.bestTime = time;
            isNewRecord = true;
        }
        
        // トップスコアリストに追加
        data.topScores.push(time);
        data.topScores.sort((a, b) => b - a);
        data.topScores = data.topScores.slice(0, 10); // 上位10件のみ保持
        
        data.totalDeaths++;
        this.saveData(data);
        
        return isNewRecord;
    },
    
    // トップスコア取得
    getTopScores() {
        return this.getData().topScores;
    },
    
    // 総プレイ時間更新
    addPlayTime(time) {
        const data = this.getData();
        data.totalPlayTime += time;
        this.saveData(data);
    },
    
    // ニアミスカウント更新
    addNearMiss(count = 1) {
        const data = this.getData();
        data.nearMissCount += count;
        this.saveData(data);
    },
    
    // 設定取得
    getSettings() {
        return this.getData().settings;
    },
    
    // 設定保存
    saveSettings(settings) {
        const data = this.getData();
        data.settings = { ...data.settings, ...settings };
        this.saveData(data);
    },
    
    // 統計情報取得
    getStats() {
        const data = this.getData();
        return {
            totalPlayTime: data.totalPlayTime,
            totalDeaths: data.totalDeaths,
            nearMissCount: data.nearMissCount
        };
    }
};

// グローバルアクセス用
window.Storage = Storage;
