/**
 * CyberStrike 2077 - 游戏引擎核心
 * 负责游戏循环、场景管理和状态更新
 */

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.gameMode = null; // 'campaign', 'survival', 'multiplayer'
        this.currentLevel = null;
        
        // 游戏对象管理
        this.entities = new Map();
        this.projectiles = [];
        this.particles = [];
        this.enemies = [];
        
        // 玩家
        this.player = null;
        
        // 游戏统计
        this.stats = {
            kills: 0,
            score: 0,
            wave: 1,
            startTime: 0,
            playTime: 0
        };
        
        // 时间控制
        this.lastTime = 0;
        this.deltaTime = 0;
        this.timeScale = 1.0;
        
        // 性能监控
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
        
        // 初始化
        this.init();
    }
    
    init() {
        // 设置画布尺寸
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // 初始化子系统
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.physics = new Physics();
        this.audio = new AudioManager();
        this.input = new InputHandler();
        
        // 初始化关卡管理器
        this.levelManager = new LevelManager(this);
        
        // 初始化HUD
        this.hud = new HUD();
        
        console.log('🎮 CyberStrike 2077 Engine Initialized');
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.renderer) {
            this.renderer.resize(this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * 开始战役模式
     */
    startCampaign() {
        this.gameMode = 'campaign';
        this.loadLevel('campaign_01');
        this.start();
    }
    
    /**
     * 开始生存模式
     */
    startSurvival() {
        this.gameMode = 'survival';
        this.loadLevel('survival_arena');
        this.start();
        
        // 启动生存模式波次系统
        this.startWaveSystem();
    }
    
    /**
     * 开始多人对战
     */
    startMultiplayer() {
        this.gameMode = 'multiplayer';
        // TODO: 实现多人对战逻辑
        console.log('多人模式开发中...');
        this.showMessage('多人模式即将推出', 2000);
    }
    
    /**
     * 加载关卡
     */
    loadLevel(levelId) {
        this.currentLevel = this.levelManager.loadLevel(levelId);
        
        // 创建玩家
        this.player = new Player(this.currentLevel.playerSpawn);
        this.addEntity('player', this.player);
        
        // 初始化敌人
        this.spawnInitialEnemies();
        
        console.log(`📍 Level loaded: ${levelId}`);
    }
    
    /**
     * 开始游戏循环
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.stats.startTime = Date.now();
        this.lastTime = performance.now();
        
        // 隐藏菜单，显示HUD
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('hud').classList.add('active');
        
        // 锁定鼠标指针
        this.canvas.requestPointerLock = this.canvas.requestPointerLock || 
                                         this.canvas.mozRequestPointerLock;
        this.canvas.requestPointerLock();
        
        // 开始游戏循环
        requestAnimationFrame((t) => this.gameLoop(t));
        
        console.log('🚀 Game Started');
    }
    
    /**
     * 暂停游戏
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        document.exitPointerLock();
        document.getElementById('pauseMenu').classList.add('active');
        
        console.log('⏸️ Game Paused');
    }
    
    /**
     * 恢复游戏
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        document.getElementById('pauseMenu').classList.remove('active');
        
        // 重新锁定鼠标
        this.canvas.requestPointerLock();
        
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
        
        console.log('▶️ Game Resumed');
    }
    
    /**
     * 返回主菜单
     */
    returnToMenu() {
        this.stop();
        document.getElementById('pauseMenu').classList.remove('active');
        document.getElementById('hud').classList.remove('active');
        document.getElementById('mainMenu').classList.remove('hidden');
        
        // 清理游戏状态
        this.cleanup();
    }
    
    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        document.exitPointerLock();
        
        console.log('🛑 Game Stopped');
    }
    
    /**
     * 游戏主循环
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        if (this.isPaused) return;
        
        // 计算 delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 限制最大 delta time（防止切换标签页后的大跳变）
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        // 应用时间缩放
        const scaledDelta = this.deltaTime * this.timeScale;
        
        // 更新 FPS
        this.updateFPS(currentTime);
        
        // 更新游戏逻辑
        this.update(scaledDelta);
        
        // 渲染画面
        this.render();
        
        // 下一帧
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    /**
     * 更新游戏逻辑
     */
    update(deltaTime) {
        // 更新游戏时间
        this.stats.playTime += deltaTime;
        
        // 更新输入
        this.input.update();
        
        // 更新玩家
        if (this.player && this.player.isAlive) {
            this.player.update(deltaTime, this.input);
        }
        
        // 更新所有实体
        this.entities.forEach((entity, id) => {
            if (entity !== this.player && entity.update) {
                entity.update(deltaTime);
            }
        });
        
        // 更新敌人
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.isAlive) {
                enemy.update(deltaTime, this.player);
                return true;
            } else {
                this.onEnemyKilled(enemy);
                return false;
            }
        });
        
        // 更新投射物
        this.projectiles = this.projectiles.filter(proj => {
            proj.update(deltaTime);
            
            // 检查碰撞
            if (this.checkProjectileCollision(proj)) {
                proj.onHit();
                return false;
            }
            
            // 检查生命周期
            if (proj.isExpired()) {
                return false;
            }
            
            return true;
        });
        
        // 更新粒子效果
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.isAlive;
        });
        
        // 更新物理
        this.physics.update(deltaTime);
        
        // 更新HUD
        this.hud.update(deltaTime);
        
        // 检查游戏状态
        this.checkGameState();
    }
    
    /**
     * 渲染画面
     */
    render() {
        // 清空画布
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染关卡
        if (this.currentLevel) {
            this.renderer.renderLevel(this.currentLevel, this.player);
        }
        
        // 渲染敌人
        this.enemies.forEach(enemy => {
            this.renderer.renderEnemy(enemy, this.player);
        });
        
        // 渲染投射物
        this.projectiles.forEach(proj => {
            this.renderer.renderProjectile(proj);
        });
        
        // 渲染粒子
        this.particles.forEach(particle => {
            this.renderer.renderParticle(particle);
        });
        
        // 渲染玩家武器
        if (this.player) {
            this.renderer.renderWeapon(this.player.currentWeapon, this.player);
        }
        
        // 应用后处理效果
        this.renderer.applyPostProcessing();
    }
    
    /**
     * 添加实体
     */
    addEntity(id, entity) {
        this.entities.set(id, entity);
        entity.id = id;
        entity.engine = this;
    }
    
    /**
     * 移除实体
     */
    removeEntity(id) {
        this.entities.delete(id);
    }
    
    /**
     * 获取实体
     */
    getEntity(id) {
        return this.entities.get(id);
    }
    
    /**
     * 添加投射物
     */
    addProjectile(projectile) {
        this.projectiles.push(projectile);
        projectile.engine = this;
    }
    
    /**
     * 添加粒子效果
     */
    addParticle(particle) {
        this.particles.push(particle);
    }
    
    /**
     * 生成初始敌人
     */
    spawnInitialEnemies() {
        if (!this.currentLevel) return;
        
        this.currentLevel.enemySpawns.forEach(spawn => {
            const enemy = new Enemy(spawn.position, spawn.type);
            this.enemies.push(enemy);
        });
    }
    
    /**
     * 生存模式波次系统
     */
    startWaveSystem() {
        this.waveTimer = setInterval(() => {
            if (!this.isRunning || this.isPaused) return;
            
            // 根据波次生成敌人
            const enemyCount = 3 + this.stats.wave * 2;
            this.spawnWaveEnemies(enemyCount);
            
            this.stats.wave++;
            this.hud.updateWave(this.stats.wave);
            this.showMessage(`Wave ${this.stats.wave}`, 2000);
            
        }, 30000); // 每30秒一波
    }
    
    /**
     * 生成波次敌人
     */
    spawnWaveEnemies(count) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const spawnPos = this.getRandomSpawnPosition();
                const enemyType = this.getRandomEnemyType();
                const enemy = new Enemy(spawnPos, enemyType);
                this.enemies.push(enemy);
            }, i * 500);
        }
    }
    
    /**
     * 获取随机生成位置
     */
    getRandomSpawnPosition() {
        // 在玩家周围随机位置生成，但保持一定距离
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        
        return {
            x: this.player.position.x + Math.cos(angle) * distance,
            y: this.player.position.y,
            z: this.player.position.z + Math.sin(angle) * distance
        };
    }
    
    /**
     * 获取随机敌人类型
     */
    getRandomEnemyType() {
        const types = ['basic', 'fast', 'tank', 'sniper'];
        const weights = [0.5, 0.3, 0.15, 0.05];
        
        const rand = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (rand < cumulative) return types[i];
        }
        
        return 'basic';
    }
    
    /**
     * 检查投射物碰撞
     */
    checkProjectileCollision(projectile) {
        // 检查与敌人的碰撞
        for (const enemy of this.enemies) {
            if (enemy.isAlive && projectile.owner !== enemy) {
                const dist = this.getDistance(projectile.position, enemy.position);
                if (dist < enemy.radius + projectile.radius) {
                    enemy.takeDamage(projectile.damage);
                    return true;
                }
            }
        }
        
        // 检查与环境的碰撞
        if (this.currentLevel && this.currentLevel.checkCollision(projectile.position)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 敌人被击杀回调
     */
    onEnemyKilled(enemy) {
        this.stats.kills++;
        this.stats.score += enemy.scoreValue;
        
        this.hud.updateKills(this.stats.kills);
        this.hud.updateScore(this.stats.score);
        
        // 显示击杀提示
        this.hud.showKillFeed('Player', enemy.type);
        
        // 生成击杀特效
        this.createDeathEffect(enemy.position);
        
        // 播放音效
        this.audio.play('enemy_death');
    }
    
    /**
     * 创建死亡特效
     */
    createDeathEffect(position) {
        for (let i = 0; i < 20; i++) {
            const particle = new Particle({
                position: { ...position },
                velocity: {
                    x: (Math.random() - 0.5) * 10,
                    y: Math.random() * 10,
                    z: (Math.random() - 0.5) * 10
                },
                color: '#ff3333',
                size: 2 + Math.random() * 3,
                lifetime: 1 + Math.random()
            });
            this.addParticle(particle);
        }
    }
    
    /**
     * 检查游戏状态
     */
    checkGameState() {
        // 检查玩家死亡
        if (this.player && !this.player.isAlive) {
            this.gameOver();
        }
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        this.stop();
        
        const survivalTime = Math.floor(this.stats.playTime);
        const message = `游戏结束！击杀: ${this.stats.kills} | 得分: ${this.stats.score} | 生存时间: ${survivalTime}s`;
        
        this.showMessage(message, 5000);
        
        setTimeout(() => {
            this.returnToMenu();
        }, 5000);
    }
    
    /**
     * 显示游戏消息
     */
    showMessage(text, duration = 2000) {
        this.hud.showMessage(text, duration);
    }
    
    /**
     * 更新FPS
     */
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
        }
    }
    
    /**
     * 计算两点距离
     */
    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * 清理游戏状态
     */
    cleanup() {
        this.entities.clear();
        this.projectiles = [];
        this.particles = [];
        this.enemies = [];
        this.player = null;
        this.currentLevel = null;
        
        this.stats = {
            kills: 0,
            score: 0,
            wave: 1,
            startTime: 0,
            playTime: 0
        };
        
        if (this.waveTimer) {
            clearInterval(this.waveTimer);
            this.waveTimer = null;
        }
    }
}

// 全局游戏引擎实例
let gameEngine;