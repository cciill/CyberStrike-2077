/**
 * CyberStrike 2077 - 武器基类
 * 所有武器的基类，定义通用属性和方法
 */

class WeaponBase {
    constructor(config) {
        // 基础属性
        this.name = config.name || 'Unknown Weapon';
        this.type = config.type || 'unknown';
        this.description = config.description || '';
        
        // 弹药
        this.magazineSize = config.magazineSize || 30;
        this.currentAmmo = this.magazineSize;
        this.reserveAmmo = config.reserveAmmo || 120;
        this.maxReserveAmmo = config.maxReserveAmmo || 300;
        
        // 射击参数
        this.damage = config.damage || 25;
        this.fireRate = config.fireRate || 600; // RPM
        this.fireInterval = 60 / this.fireRate; // 秒
        this.lastFireTime = 0;
        
        // 精准度
        this.accuracy = config.accuracy || 0.9; // 0-1
        this.aimAccuracy = config.aimAccuracy || 0.98;
        this.currentAccuracy = this.accuracy;
        
        // 后坐力
        this.recoil = config.recoil || 2;
        this.recoilRecovery = config.recoilRecovery || 5;
        this.currentRecoil = 0;
        this.recoilOffset = 0;
        
        // 射程
        this.range = config.range || 100;
        this.damageFalloff = config.damageFalloff || 0.5;
        
        // 装填
        this.reloadTime = config.reloadTime || 2.0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        
        // 射击模式
        this.fireMode = config.fireMode || 'auto'; // 'auto', 'semi', 'burst'
        this.burstCount = config.burstCount || 3;
        this.currentBurst = 0;
        
        // 状态
        this.isAiming = false;
        
        // 投射物
        this.projectileSpeed = config.projectileSpeed || 100;
        this.projectileType = config.projectileType || 'hitscan'; // 'hitscan', 'projectile'
        
        // 音效
        this.shootSound = config.shootSound || 'shoot_default';
        this.reloadSound = config.reloadSound || 'reload_default';
        
        // 特效
        this.muzzleFlashColor = config.muzzleFlashColor || '#ffffaa';
        this.trailColor = config.trailColor || '#ffff00';
        
        // 武器模型偏移
        this.viewModelOffset = config.viewModelOffset || { x: 0, y: 0, z: 0 };
    }
    
    /**
     * 更新武器状态
     */
    update(deltaTime) {
        // 更新精准度
        if (this.isAiming) {
            this.currentAccuracy = this.aimAccuracy;
        } else {
            this.currentAccuracy = this.accuracy;
        }
        
        // 后坐力恢复
        if (this.currentRecoil > 0) {
            this.currentRecoil -= this.recoilRecovery * deltaTime;
            if (this.currentRecoil < 0) this.currentRecoil = 0;
        }
        
        // 检查装填完成
        if (this.isReloading) {
            const elapsed = (Date.now() - this.reloadStartTime) / 1000;
            if (elapsed >= this.reloadTime) {
                this.finishReload();
            }
        }
    }
    
    /**
     * 检查是否可以射击
     */
    canShoot() {
        if (this.isReloading) return false;
        if (this.currentAmmo <= 0) return false;
        
        const now = Date.now() / 1000;
        if (now - this.lastFireTime < this.fireInterval) return false;
        
        return true;
    }
    
    /**
     * 射击
     */
    shoot(position, direction) {
        if (!this.canShoot()) return null;
        
        this.lastFireTime = Date.now() / 1000;
        this.currentAmmo--;
        
        // 应用后坐力
        this.currentRecoil += this.recoil;
        
        // 计算实际射击方向（添加扩散）
        const actualDirection = this.applySpread(direction);
        
        // 创建投射物
        const projectile = this.createProjectile(position, actualDirection);
        
        // 处理连发
        if (this.fireMode === 'burst') {
            this.currentBurst++;
            if (this.currentBurst >= this.burstCount) {
                this.currentBurst = 0;
            }
        }
        
        return projectile;
    }
    
    /**
     * 应用子弹扩散
     */
    applySpread(direction) {
        const spread = 1 - this.currentAccuracy;
        
        if (spread <= 0) return direction;
        
        // 创建垂直于射击方向的向量
        let up = { x: 0, y: 1, z: 0 };
        if (Math.abs(direction.y) > 0.9) {
            up = { x: 1, y: 0, z: 0 };
        }
        
        const right = this.crossProduct(direction, up);
        const actualUp = this.crossProduct(right, direction);
        
        // 随机偏移
        const angle1 = (Math.random() - 0.5) * spread * Math.PI;
        const angle2 = (Math.random() - 0.5) * spread * Math.PI;
        
        // 应用偏移
        const result = {
            x: direction.x + right.x * Math.sin(angle1) * spread + actualUp.x * Math.sin(angle2) * spread,
            y: direction.y + right.y * Math.sin(angle1) * spread + actualUp.y * Math.sin(angle2) * spread,
            z: direction.z + right.z * Math.sin(angle1) * spread + actualUp.z * Math.sin(angle2) * spread
        };
        
        // 归一化
        return this.normalize(result);
    }
    
    /**
     * 创建投射物
     */
    createProjectile(position, direction) {
        // 计算枪口位置
        const muzzlePos = {
            x: position.x + direction.x * 1.5,
            y: position.y + direction.y * 1.5 - 0.2,
            z: position.z + direction.z * 1.5
        };
        
        return new Projectile({
            position: muzzlePos,
            direction: direction,
            speed: this.projectileSpeed,
            damage: this.damage,
            range: this.range,
            damageFalloff: this.damageFalloff,
            color: this.trailColor,
            type: this.projectileType,
            owner: this,
            isHitscan: this.projectileType === 'hitscan'
        });
    }
    
    /**
     * 开始装填
     */
    reload() {
        if (this.isReloading) return;
        if (this.currentAmmo >= this.magazineSize) return;
        if (this.reserveAmmo <= 0) return;
        
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        
        // 播放装填音效
        if (window.gameEngine && window.gameEngine.audio) {
            window.gameEngine.audio.play(this.reloadSound);
        }
        
        console.log(`Reloading ${this.name}...`);
    }
    
    /**
     * 完成装填
     */
    finishReload() {
        const needed = this.magazineSize - this.currentAmmo;
        const available = Math.min(needed, this.reserveAmmo);
        
        this.currentAmmo += available;
        this.reserveAmmo -= available;
        this.isReloading = false;
        
        // 更新HUD
        if (window.gameEngine && window.gameEngine.hud) {
            window.gameEngine.hud.updateAmmo(this.currentAmmo, this.reserveAmmo);
        }
        
        console.log(`${this.name} reloaded. Ammo: ${this.currentAmmo}/${this.reserveAmmo}`);
    }
    
    /**
     * 添加弹药
     */
    addAmmo(amount) {
        this.reserveAmmo = Math.min(this.reserveAmmo + amount, this.maxReserveAmmo);
        
        if (window.gameEngine && window.gameEngine.hud) {
            window.gameEngine.hud.updateAmmo(this.currentAmmo, this.reserveAmmo);
        }
    }
    
    /**
     * 获取装填进度
     */
    getReloadProgress() {
        if (!this.isReloading) return 0;
        
        const elapsed = (Date.now() - this.reloadStartTime) / 1000;
        return Math.min(1, elapsed / this.reloadTime);
    }
    
    /**
     * 向量叉乘
     */
    crossProduct(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }
    
    /**
     * 向量归一化
     */
    normalize(v) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        if (length === 0) return v;
        
        return {
            x: v.x / length,
            y: v.y / length,
            z: v.z / length
        };
    }
}

/**
 * 突击步枪
 */
class AssaultRifle extends WeaponBase {
    constructor() {
        super({
            name: 'AR-2077 突击步枪',
            type: 'assault_rifle',
            description: '标准制式突击步枪，平衡的伤害和射速',
            
            magazineSize: 30,
            reserveAmmo: 120,
            maxReserveAmmo: 300,
            
            damage: 28,
            fireRate: 600,
            
            accuracy: 0.85,
            aimAccuracy: 0.95,
            
            recoil: 1.5,
            recoilRecovery: 4,
            
            range: 150,
            damageFalloff: 0.3,
            
            reloadTime: 2.2,
            fireMode: 'auto',
            
            projectileSpeed: 150,
            projectileType: 'hitscan',
            
            shootSound: 'ar_shoot',
            reloadSound: 'ar_reload',
            
            muzzleFlashColor: '#ffffaa',
            trailColor: '#ffff00'
        });
    }
}

/**
 * 霰弹枪
 */
class Shotgun extends WeaponBase {
    constructor() {
        super({
            name: 'SG-12 霰弹枪',
            type: 'shotgun',
            description: '近距离高伤害武器，发射多发弹丸',
            
            magazineSize: 8,
            reserveAmmo: 32,
            maxReserveAmmo: 64,
            
            damage: 15, // 每颗弹丸
            fireRate: 80,
            
            accuracy: 0.7,
            aimAccuracy: 0.75,
            
            recoil: 8,
            recoilRecovery: 3,
            
            range: 30,
            damageFalloff: 0.8,
            
            reloadTime: 0.5, // 单发装填
            fireMode: 'semi',
            
            projectileSpeed: 80,
            projectileType: 'hitscan',
            
            shootSound: 'shotgun_shoot',
            reloadSound: 'shotgun_reload',
            
            muzzleFlashColor: '#ffaa00',
            trailColor: '#ff8800'
        });
        
        this.pelletCount = 8; // 弹丸数量
    }
    
    shoot(position, direction) {
        if (!this.canShoot()) return null;
        
        this.lastFireTime = Date.now() / 1000;
        this.currentAmmo--;
        
        // 创建多发弹丸
        const projectiles = [];
        
        for (let i = 0; i < this.pelletCount; i++) {
            const spreadDir = this.applySpread(direction);
            const projectile = this.createProjectile(position, spreadDir);
            projectile.damage = this.damage;
            projectiles.push(projectile);
        }
        
        // 应用后坐力
        this.currentRecoil += this.recoil;
        
        // 播放音效
        if (window.gameEngine && window.gameEngine.audio) {
            window.gameEngine.audio.play(this.shootSound);
        }
        
        // 返回第一个投射物（实际应该返回数组，这里简化处理）
        return projectiles[0];
    }
}

/**
 * 狙击步枪
 */
class SniperRifle extends WeaponBase {
    constructor() {
        super({
            name: 'SR-X 狙击步枪',
            type: 'sniper',
            description: '高精度远程武器，一击必杀',
            
            magazineSize: 5,
            reserveAmmo: 25,
            maxReserveAmmo: 50,
            
            damage: 150,
            fireRate: 60,
            
            accuracy: 0.95,
            aimAccuracy: 0.999,
            
            recoil: 15,
            recoilRecovery: 2,
            
            range: 500,
            damageFalloff: 0.1,
            
            reloadTime: 3.5,
            fireMode: 'semi',
            
            projectileSpeed: 200,
            projectileType: 'hitscan',
            
            shootSound: 'sniper_shoot',
            reloadSound: 'sniper_reload',
            
            muzzleFlashColor: '#00ff00',
            trailColor: '#00ff88'
        });
    }
}

/**
 * 火箭筒
 */
class RocketLauncher extends WeaponBase {
    constructor() {
        super({
            name: 'RL-9000 火箭筒',
            type: 'rocket_launcher',
            description: '发射爆炸性火箭弹，造成范围伤害',
            
            magazineSize: 1,
            reserveAmmo: 10,
            maxReserveAmmo: 20,
            
            damage: 200,
            fireRate: 30,
            
            accuracy: 0.9,
            aimAccuracy: 0.95,
            
            recoil: 20,
            recoilRecovery: 1,
            
            range: 200,
            damageFalloff: 0,
            
            reloadTime: 4.0,
            fireMode: 'semi',
            
            projectileSpeed: 50,
            projectileType: 'projectile',
            
            shootSound: 'rocket_shoot',
            reloadSound: 'rocket_reload',
            
            muzzleFlashColor: '#ff3333',
            trailColor: '#ff6600'
        });
        
        this.explosionRadius = 5;
        this.explosionDamage = 150;
    }
    
    createProjectile(position, direction) {
        const projectile = super.createProjectile(position, direction);
        
        // 火箭弹特殊属性
        projectile.isExplosive = true;
        projectile.explosionRadius = this.explosionRadius;
        projectile.explosionDamage = this.explosionDamage;
        
        return projectile;
    }
}

/**
 * 手枪
 */
class Pistol extends WeaponBase {
    constructor() {
        super({
            name: 'P-2077 手枪',
            type: 'pistol',
            description: '可靠的副武器，无限备用弹药',
            
            magazineSize: 15,
            reserveAmmo: Infinity,
            maxReserveAmmo: Infinity,
            
            damage: 20,
            fireRate: 300,
            
            accuracy: 0.8,
            aimAccuracy: 0.9,
            
            recoil: 3,
            recoilRecovery: 6,
            
            range: 50,
            damageFalloff: 0.5,
            
            reloadTime: 1.5,
            fireMode: 'semi',
            
            projectileSpeed: 100,
            projectileType: 'hitscan',
            
            shootSound: 'pistol_shoot',
            reloadSound: 'pistol_reload',
            
            muzzleFlashColor: '#ffffaa',
            trailColor: '#ffff00'
        });
    }
}