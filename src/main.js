/**
 * CyberStrike 2077 - 主入口
 * 游戏初始化和启动
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 CyberStrike 2077 - Initializing...');
    
    // 显示加载画面
    showLoadingScreen();
    
    // 模拟资源加载
    loadResources().then(() => {
        // 初始化游戏引擎
        initGame();
        
        // 隐藏加载画面
        hideLoadingScreen();
        
        console.log('✅ CyberStrike 2077 Ready');
    });
});

/**
 * 显示加载画面
 */
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('loadingProgress');
    const percentage = document.getElementById('loadingPercentage');
    
    loadingScreen.classList.remove('hidden');
    
    // 模拟加载进度
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        
        progressBar.style.width = `${progress}%`;
        percentage.textContent = `${Math.floor(progress)}%`;
    }, 200);
}

/**
 * 隐藏加载画面
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hidden');
}

/**
 * 加载资源
 */
async function loadResources() {
    // 这里可以加载实际的资源（纹理、模型、音效等）
    return new Promise(resolve => {
        setTimeout(resolve, 2000);
    });
}

/**
 * 初始化游戏
 */
function initGame() {
    // 创建游戏引擎实例
    window.gameEngine = new GameEngine();
    
    // 绑定菜单按钮事件
    bindMenuEvents();
    
    // 绑定暂停菜单事件
    bindPauseMenuEvents();
}

/**
 * 绑定菜单事件
 */
function bindMenuEvents() {
    // 菜单按钮事件已在HTML中通过onclick绑定
}

/**
 * 绑定暂停菜单事件
 */
function bindPauseMenuEvents() {
    // 暂停菜单按钮事件已在HTML中通过onclick绑定
}

/**
 * 开始战役模式
 */
function startCampaign() {
    if (window.gameEngine) {
        window.gameEngine.startCampaign();
    }
}

/**
 * 开始生存模式
 */
function startSurvival() {
    if (window.gameEngine) {
        window.gameEngine.startSurvival();
    }
}

/**
 * 开始多人对战
 */
function startMultiplayer() {
    if (window.gameEngine) {
        window.gameEngine.startMultiplayer();
    }
}

/**
 * 打开设置
 */
function openSettings() {
    // TODO: 实现设置菜单
    console.log('Settings menu - coming soon');
    alert('设置功能开发中...');
}

/**
 * 显示制作人员
 */
function showCredits() {
    alert(`CyberStrike 2077

制作人员
========
开发：CyberStrike Team
设计：AI Assistant
音效：开源音效库

感谢游玩！`);
}

/**
 * 继续游戏
 */
function resumeGame() {
    if (window.gameEngine) {
        window.gameEngine.resume();
    }
}

/**
 * 返回主菜单
 */
function returnToMenu() {
    if (window.gameEngine) {
        window.gameEngine.returnToMenu();
    }
}

/**
 * 键盘快捷键
 */
document.addEventListener('keydown', (e) => {
    // F11 全屏
    if (e.code === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
});

/**
 * 切换全屏
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}