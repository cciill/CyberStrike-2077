/**
 * CyberStrike 2077 - 关卡管理器
 * 管理关卡加载、地图生成
 */

class LevelManager {
    constructor(engine) {
        this.engine = engine;
        this.currentLevel = null;
        this.levels = new Map();
        
        // 注册关卡
        this.registerLevels();
    }
    
    /**
     * 注册所有关卡
     */
    registerLevels() {
        // 战役模式关卡
        this.levels.set('campaign_01', {
            id: 'campaign_01',
            name: 'Neon District',
            description: '赛博朋克街区',
            type: 'campaign',
            playerSpawn: { x: 0, y: 1.8, z: 0 },
            enemySpawns: [
                { position: { x: 20, y: 0, z: 20 }, type: 'basic' },
                { position: { x: -20, y: 0, z: 20 }, type: 'basic' },
                { position: { x: 20, y: 0, z: -20 }, type: 'fast' },
                { position: { x: -20, y: 0, z: -20 }, type: 'tank' }
            ],
            bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
            walls: this.generateCityWalls(),
            terrain: { type: 'city', size: 100 },
            staticGeometry: this.generateCityGeometry(),
            dynamicObjects: []
        });
        
        // 生存模式关卡
        this.levels.set('survival_arena', {
            id: 'survival_arena',
            name: 'Combat Arena',
            description: '战斗竞技场',
            type: 'survival',
            playerSpawn: { x: 0, y: 1.8, z: 0 },
            enemySpawns: [],
            bounds: { minX: -40, maxX: 40, minZ: -40, maxZ: 40 },
            walls: this.generateArenaWalls(),
            terrain: { type: 'arena', size: 80 },
            staticGeometry: this.generateArenaGeometry(),
            dynamicObjects: []
        });
    }
    
    /**
     * 加载关卡
     */
    loadLevel(levelId) {
        const levelData = this.levels.get(levelId);
        if (!levelData) {
            console.error(`Level not found: ${levelId}`);
            return null;
        }
        
        // 创建关卡实例
        this.currentLevel = new Level(levelData);
        
        console.log(`📍 Level loaded: ${levelData.name}`);
        
        return this.currentLevel;
    }
    
    /**
     * 生成城市墙壁
     */
    generateCityWalls() {
        const walls = [];
        
        // 建筑墙壁
        const buildings = [
            { x: 15, z: 15, width: 10, depth: 10 },
            { x: -15, z: 15, width: 8, depth: 12 },
            { x: 15, z: -15, width: 12, depth: 8 },
            { x: -15, z: -15, width: 10, depth: 10 },
            { x: 0, z: 30, width: 20, depth: 5 },
            { x: 0, z: -30, width: 20, depth: 5 },
            { x: 30, z: 0, width: 5, depth: 20 },
            { x: -30, z: 0, width: 5, depth: 20 }
        ];
        
        buildings.forEach(b => {
            walls.push({
                x: b.x,
                z: b.z,
                width: b.width,
                depth: b.depth,
                height: 10 + Math.random() * 10
            });
        });
        
        return walls;
    }
    
    /**
     * 生成竞技场墙壁
     */
    generateArenaWalls() {
        const walls = [];
        
        // 竞技场围墙
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 35;
            
            walls.push({
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius,
                width: 8,
                depth: 8,
                height: 5
            });
        }
        
        // 中央掩体
        walls.push({ x: 0, z: 0, width: 6, depth: 6, height: 2 });
        walls.push({ x: 15, z: 0, width: 4, depth: 4, height: 2 });
        walls.push({ x: -15, z: 0, width: 4, depth: 4, height: 2 });
        walls.push({ x: 0, z: 15, width: 4, depth: 4, height: 2 });
        walls.push({ x: 0, z: -15, width: 4, depth: 4, height: 2 });
        
        return walls;
    }
    
    /**
     * 生成城市几何体
     */
    generateCityGeometry() {
        const geometry = [];
        
        // 霓虹灯招牌
        const signs = [
            { x: 10, y: 8, z: 10, color: '#ff00ff', size: 3 },
            { x: -10, y: 8, z: 10, color: '#00f0ff', size: 3 },
            { x: 10, y: 8, z: -10, color: '#ffff00', size: 3 },
            { x: -10, y: 8, z: -10, color: '#ff6600', size: 3 }
        ];
        
        signs.forEach(sign => {
            geometry.push({
                type: 'sign',
                position: { x: sign.x, y: sign.y, z: sign.z },
                color: sign.color,
                size: sign.size,
                emissive: true
            });
        });
        
        // 路灯
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = 25;
            
            geometry.push({
                type: 'light',
                position: {
                    x: Math.cos(angle) * radius,
                    y: 6,
                    z: Math.sin(angle) * radius
                },
                color: '#ffaa00',
                size: 1,
                emissive: true
            });
        }
        
        return geometry;
    }
    
    /**
     * 生成竞技场几何体
     */
    generateArenaGeometry() {
        const geometry = [];
        
        // 竞技场灯光
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const radius = 30;
            
            geometry.push({
                type: 'spotlight',
                position: {
                    x: Math.cos(angle) * radius,
                    y: 10,
                    z: Math.sin(angle) * radius
                },
                color: '#00f0ff',
                size: 2,
                emissive: true
            });
        }
        
        return geometry;
    }
}

/**
 * 关卡类
 */
class Level {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.type = data.type;
        
        this.playerSpawn = data.playerSpawn;
        this.enemySpawns = data.enemySpawns;
        
        this.bounds = data.bounds;
        this.walls = data.walls;
        this.terrain = data.terrain;
        this.staticGeometry = data.staticGeometry;
        this.dynamicObjects = data.dynamicObjects;
    }
    
    /**
     * 检查碰撞
     */
    checkCollision(position, radius = 0.3) {
        // 检查墙壁碰撞
        for (const wall of this.walls) {
            const dx = Math.abs(position.x - wall.x);
            const dz = Math.abs(position.z - wall.z);
            
            if (dx < (radius + wall.width / 2) && dz < (radius + wall.depth / 2)) {
                return true;
            }
        }
        
        // 检查边界
        if (position.x < this.bounds.minX || position.x > this.bounds.maxX ||
            position.z < this.bounds.minZ || position.z > this.bounds.maxZ) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取随机出生点
     */
    getRandomSpawnPoint() {
        const margin = 5;
        return {
            x: this.bounds.minX + margin + Math.random() * (this.bounds.maxX - this.bounds.minX - margin * 2),
            y: 0,
            z: this.bounds.minZ + margin + Math.random() * (this.bounds.maxZ - this.bounds.minZ - margin * 2)
        };
    }
}