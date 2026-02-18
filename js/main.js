// ===== メインエントリーポイント =====

// ページ読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('EVADE∞ - 初期化開始');
    
    // オーディオ初期化
    Audio.init();
    
    // UI初期化
    UI.init();
    
    // ゲーム初期化
    Game.init();
    
    // 設定をパーティクルマネージャーに適用
    const settings = Storage.getSettings();
    ParticleManager.setLevel(settings.particleLevel);
    
    // タイトル画面の背景パーティクル
    initTitleParticles();
    
    console.log('EVADE∞ - 初期化完了');
});

// タイトル画面の背景パーティクル
function initTitleParticles() {
    const container = document.getElementById('title-particles');
    if (!container) return;
    
    // CSSアニメーションでパーティクルを生成
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: rgba(0, 255, 255, ${Math.random() * 0.5 + 0.2});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * 10}s;
        `;
        container.appendChild(particle);
    }
    
    // アニメーション用のスタイルを追加
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% {
                transform: translateY(0) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// エラーハンドリング
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, '\nURL: ', url, '\nLine: ', lineNo, '\nColumn: ', columnNo, '\nError object: ', error);
    return false;
};

// コンソールにゲーム情報を表示
console.log('%c EVADE∞ ', 'background: #0a0a1a; color: #00ffff; font-size: 24px; font-weight: bold; padding: 10px 20px;');
console.log('%c 1秒でも長く生き残れ ', 'color: #888; font-size: 12px;');
