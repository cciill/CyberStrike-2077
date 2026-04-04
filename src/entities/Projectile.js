/**
 * CyberStrike 2077 - 投射物
 * 子弹、火箭弹等飞行物
 */

class Projectile {
    constructor(config) {
        this.position = { ...config.position };
        this.direction = { ...config.direction };
        this.speed = config.speed || 100;
        this.damage = config.damage || 25;
        this.range = config.range || 100;
        this.damageFalloff = config.damageFalloff || 0.5;
        
        this.color = config.color || '#ffff00';
        this.type = config.type || 'hitscan'; // 'hitscan' 或 'projectile'
        this.isHitscan = config.isHitscan || false;
        
        this.owner = config.owner || null;
        
        // 爆炸属性（火箭弹等）
        this.isExplosive = config.isExplosive || false;
        this.explosionRadius = config.explosionRadius || 0;
        this.explosionDamage = config.explosionDamage || 0;
        
        // 轨迹
        this.trail = [];
        this.maxTrailLength = 20;
        
        // 状态
        this.distanceTraveled = 0;
        this.lifetime = this.range / this.speed;
        this.age = 0;
        this.radius = 0.1;
        
        // 如果是即时命中，立即执行射线检测
        if (this.isHitscan) {
            this.performHitscan();
        }
    }
    
    /**
     * 更新投射物
     */
    update(deltaTime) {
        if (this.isHitscan) return; // 即时命中不需要更新
        
        this.age += deltaTime;
        
        // 保存轨迹点
        this.trail.push({ ...this.position });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 更新位置
        const moveDistance = this.speed * deltaTime;
        this.position.x += this.direction.x * moveDistance;
        this.position.y += this.direction.y * moveDistance;
        this.position.z += this.direction.z * moveDistance;
        
        this.distanceTraveled += moveDistance;
        
        // 火箭弹的重力效果
        if (this.isExplosive) {
            this.direction.y -= 2 * deltaTime; // 重力
            // 重新归一化方向
            const length = Math.sqrt(
                this.direction.x ** 2 + 
                this.direction.y ** 2 + 
                this.direction.z ** 2
            );
            this.direction.x /= length;
            this.direction.y /= length;
            this.direction.z /= length;
        }
    }
    
    /**
     * 执行即时命中检测
     */
    performHitscan() {
        const engine = window.gameEngine;
        if (!engine) return;
        
        // 计算射线终点
        const endPoint = {
            x: this.position.x + this.direction.x * this.range,
            y: this.position.y + this.direction.y * this.range,
            z: this.position.z + this.direction.z * this.range
        };
        
        // 检查与敌人的碰撞
        let closestHit = null;
        let closestDistance = this.range;
        
        for (const enemy of engine.enemies) {
            if (!enemy.isAlive || enemy === this.owner) continue;
            
            const hit = this.raySphereIntersection(
                this.position, 
                this.direction, 
                enemy.position, 
                enemy.radius
            );
            
            if (hit && hit.distance < closestDistance) {
                closestDistance = hit.distance;
                closestHit = { entity: enemy, point: hit.point };
            }
        }
        
        // 检查与玩家的碰撞（如果是敌人发射的）
        if (engine.player && engine.player.isAlive && this.owner !== engine.player) {
            const hit = this.raySphereIntersection(
                this.position,
                this.direction,
                engine.player.position,
                engine.player.radius
            );
            
            if (hit && hit.distance < closestDistance) {
                closestDistance = hit.distance;
                closestHit = { entity: engine.player, point: hit.point };
            }
        }
        
        // 应用伤害
        if (closestHit) {
            const actualDamage = this.calculateDamage(closestDistance);
            closestHit.entity.takeDamage(actualDamage);
            
            // 创建命中效果
            this.createHitEffect(closestHit.point);
            
            // 显示命中标记
            if (closestHit.entity !== engine.player && engine.hud) {
                engine.hud.showHitMarker();
            }
        }
        
        // 创建轨迹效果
        this.createTrailEffect(endPoint);
        
        // 标记为过期
        this.age = this.lifetime + 1;
    }
    
    /**
     * 射线与球体相交检测
     */
    raySphereIntersection(rayOrigin, rayDir, sphereCenter, sphereRadius) {
        const oc = {
            x: rayOrigin.x - sphereCenter.x,
            y: rayOrigin.y - sphereCenter.y,
            z: rayOrigin.z - sphereCenter.z
        };
        
        const a = rayDir.x ** 2 + rayDir.y ** 2 + rayDir.z ** 2;
        const b = 2 * (oc.x * rayDir.x + oc.y * rayDir.y + oc.z * rayDir.z);
        const c = oc.x ** 2 + oc.y ** 2 + oc.z ** 2 - sphereRadius ** 2;
        
        const discriminant = b ** 2 - 4 * a * c;
        
        if (discriminant < 0) return null;
        
        const t = (-b - Math.sqrt(discriminant)) / (2 * a);
        
        if (t < 0) return null;
        
        return {
            distance: t,
            point: {
                x: rayOrigin.x + rayDir.x * t,
                y: rayOrigin.y + rayDir.y * t,
                z: rayOrigin.z + rayDir.z * t
            }
        };
    }
    
    /**
     * 计算伤害（根据距离衰减）
     */
    calculateDamage(distance) {
        const falloff = Math.max(0, 1 - (distance / this.range) * this.damageFalloff);
        return Math.floor(this.damage * falloff);
    }
    
    /**
     * 命中回调
     */
    onHit() {
        if (this.isExplosive) {
            this.explode();
        } else {
            this.createHitEffect(this.position);
        }
    }
    
    /**
     * 爆炸
     */
    explode() {
        const engine = window.gameEngine;
        if (!engine) return;
        
        // 创建爆炸效果
        this.createExplosionEffect();
        
        // 对范围内的所有目标造成伤害
        const targets = [...engine.enemies];
        if (engine.player && this.owner !== engine.player) {
            targets.push(engine.player);
        }
        
        for (const target of targets) {
            if (!target.isAlive) continue;
            
            const dx = target.position.x - this.position.x;
            const dy = target.position.y - this.position.y;
            const dz = target.position.z - this.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance <= this.explosionRadius) {
                const damageRatio = 1 - (distance / this.explosionRadius);
                const damage = Math.floor(this.explosionDamage * damageRatio);
                target.takeDamage(damage);
            }
        }
        
        // 播放爆炸音效
        if (engine.audio) {
            engine.audio.play('explosion');
        }
    }
    
    /**
     * 创建命中效果
     */
    createHitEffect(position) {
        // 创建火花粒子
        for (let i = 0; i < 8; i++) {
            const particle = new Particle({
                position: { ...position },
                velocity: {
                    x: (Math.random() - 0.5) * 10,
                    y: Math.random() * 10,
                    z: (Math.random() - 0.5) * 10
                },
                color: '#ffaa00',
                size: 2,
                lifetime: 0.3
            });
            
            if (window.gameEngine) {
                window.gameEngine.addParticle(particle);
            }
        }
    }
    
    /**
     * 创建轨迹效果
     */
    createTrailEffect(endPoint) {
        // 创建轨迹粒子
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const pos = {
                x: this.position.x + (endPoint.x - this.position.x) * t,
                y: this.position.y + (endPoint.y - this.position.y) * t,
                z: this.position.z + (endPoint.z - this.position.z) * t
            };
            
            const particle = new Particle({
                position: pos,
                velocity: { x: 0, y: 0, z: 0 },
                color: this.color,
                size: 1,
                lifetime: 0.1
            });
            
            if (window.gameEngine) {
                window.gameEngine.addParticle(particle);
            }
        }
    }
    
    /**
     * 创建爆炸效果
     */
    createExplosionEffect() {
        // 爆炸核心
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const elevation = (Math.random() - 0.5) * Math.PI;
            const speed = 10 + Math.random() * 20;
            
            const particle = new Particle({
                position: { ...this.position },
                velocity: {
                    x: Math.cos(angle) * Math.cos(elevation) * speed,
                    y: Math.sin(elevation) * speed,
                    z: Math.sin(angle) * Math.cos(elevation) * speed
                },
                color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00',
                size: 4 + Math.random() * 4,
                lifetime: 0.5 + Math.random() * 0.5
            });
            
            if (window.gameEngine) {
                window.gameEngine.addParticle(particle);
            }
        }
        
        // 烟雾
        for (let i = 0; i < 10; i++) {
            const particle = new Particle({
                position: {
                    x: this.position.x + (Math.random() - 0.5) * 2,
                    y: this.position.y + (Math.random() - 0.5) * 2,
                    z: this.position.z + (Math.random() - 0.5) * 2
                },
                velocity: {
                    x: (Math.random() - 0.5) * 3,
                    y: 2 + Math.random() * 3,
                    z: (Math.random() - 0.5) * 3
                },
                color: '#555555',
                size: 5 + Math.random() * 5,
                lifetime: 2 + Math.random()
            });
            
            if (window.gameEngine) {
                window.gameEngine.addParticle(particle);
            }
        }
    }
    
    /**
     * 检查是否过期
     */
    isExpired() {
        return this.age >= this.lifetime || this.distanceTraveled >= this.range;
    }
}