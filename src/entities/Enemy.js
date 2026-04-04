/**
 * CyberStrike 2077 - 敌人 AI
 * 具有智能行为的敌人类
 */

class Enemy {
    constructor(position, type = 'basic') {
        this.position = { ...position };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { y: 0 };
        
        this.type = type;
        this.isAlive = true;
        
        // 根据类型设置属性
        this.setupType();
        
        // AI状态
        this.aiState = 'idle'; // 'idle', 'patrol', 'chase', 'attack', 'retreat'
        this.targetPosition = null;
        this.lastTargetPosition = null;
        this.targetLostTime = 0;
        
        // 视野和感知
        this.viewDistance = 30;
        this.viewAngle = Math.PI / 3; // 60度
        this.hearingRange = 15;
        
        // 攻击
        this.attackRange = this.weaponRange || 20;
        this.attackCooldown = 0;
        this.attackInterval = 1 / (this.fireRate / 60);
        
        // 路径寻找
        this.path = [];
        this.pathIndex = 0;
        this.stuckTime = 0;
        this.lastPosition = { ...position };
        
        // 动画
        this.animTime = 0;
        this.walkCycle = 0;
        
        // 行为树
        this.behaviorTree = this.createBehaviorTree();
    }
    
    /**
     * 根据类型设置属性
     */
    setupType() {
        switch (this.type) {
            case 'basic':
                this.health = 100;
                this.maxHealth = 100;
                this.speed = 3;
                this.damage = 15;
                this.fireRate = 120;
                this.weaponRange = 25;
                this.scoreValue = 100;
                this.size = 1.8;
                this.radius = 0.4;
                this.color = '#ff3333';
                break;
                
            case 'fast':
                this.health = 60;
                this.maxHealth = 60;
                this.speed = 7;
                this.damage = 10;
                this.fireRate = 180;
                this.weaponRange = 15;
                this.scoreValue = 150;
                this.size = 1.6;
                this.radius = 0.35;
                this.color = '#ffaa00';
                break;
                
            case 'tank':
                this.health = 300;
                this.maxHealth = 300;
                this.speed = 1.5;
                this.damage = 30;
                this.fireRate = 60;
                this.weaponRange = 30;
                this.scoreValue = 300;
                this.size = 2.2;
                this.radius = 0.6;
                this.color = '#aa3333';
                break;
                
            case 'sniper':
                this.health = 80;
                this.maxHealth = 80;
                this.speed = 2;
                this.damage = 50;
                this.fireRate = 30;
                this.weaponRange = 80;
                this.scoreValue = 250;
                this.size = 1.8;
                this.radius = 0.4;
                this.color = '#aa00ff';
                break;
                
            default:
                this.health = 100;
                this.maxHealth = 100;
                this.speed = 3;
                this.damage = 15;
                this.fireRate = 120;
                this.weaponRange = 25;
                this.scoreValue = 100;
                this.size = 1.8;
                this.radius = 0.4;
                this.color = '#ff3333';
        }
    }
    
    /**
     * 创建行为树
     */
    createBehaviorTree() {
        return new BehaviorTree({
            selector: [
                // 优先：如果看到玩家则攻击
                {
                    sequence: [
                        { condition: () => this.canSeePlayer() },
                        { action: () => this.attackPlayer() }
                    ]
                },
                // 其次：如果知道玩家最后位置则追击
                {
                    sequence: [
                        { condition: () => this.hasLastKnownPosition() },
                        { action: () => this.investigate() }
                    ]
                },
                // 默认：巡逻
                { action: () => this.patrol() }
            ]
        });
    }
    
    /**
     * 更新敌人
     */
    update(deltaTime, player) {
        if (!this.isAlive) return;
        
        this.animTime += deltaTime;
        
        // 保存玩家引用
        this.player = player;
        
        // 执行行为树
        this.behaviorTree.execute(this);
        
        // 更新移动
        this.updateMovement(deltaTime);
        
        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // 检查是否卡住
        this.checkStuck(deltaTime);
        
        // 更新动画
        this.updateAnimation(deltaTime);
    }
    
    /**
     * 更新移动
     */
    updateMovement(deltaTime) {
        if (this.targetPosition) {
            // 计算到目标的方向
            const dx = this.targetPosition.x - this.position.x;
            const dz = this.targetPosition.z - this.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 0.5) {
                // 归一化方向
                const moveX = (dx / distance) * this.speed;
                const moveZ = (dz / distance) * this.speed;
                
                // 更新位置
                this.position.x += moveX * deltaTime;
                this.position.z += moveZ * deltaTime;
                
                // 更新朝向
                this.rotation.y = Math.atan2(dx, dz);
                
                // 更新行走动画
                this.walkCycle += deltaTime * this.speed * 2;
            } else {
                // 到达目标
                this.targetPosition = null;
                this.pathIndex++;
                
                if (this.path && this.pathIndex < this.path.length) {
                    this.targetPosition = this.path[this.pathIndex];
                }
            }
        }
        
        // 简单的重力
        if (this.position.y > 0) {
            this.velocity.y -= 20 * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
            
            if (this.position.y < 0) {
                this.position.y = 0;
                this.velocity.y = 0;
            }
        }
    }
    
    /**
     * 检查是否看到玩家
     */
    canSeePlayer() {
        if (!this.player || !this.player.isAlive) return false;
        
        const dx = this.player.position.x - this.position.x;
        const dy = this.player.position.y - this.position.y;
        const dz = this.player.position.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // 距离检查
        if (distance > this.viewDistance) return false;
        
        // 角度检查
        const angleToPlayer = Math.atan2(dx, dz);
        let angleDiff = angleToPlayer - this.rotation.y;
        
        // 规范化角度
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > this.viewAngle / 2) {
            // 如果在视野外，检查是否在听觉范围内
            if (distance > this.hearingRange) return false;
        }
        
        // TODO: 射线检测检查是否有障碍物阻挡
        
        // 更新最后已知位置
        this.lastTargetPosition = { ...this.player.position };
        this.targetLostTime = 0;
        
        return true;
    }
    
    /**
     * 攻击玩家
     */
    attackPlayer() {
        if (!this.player || !this.player.isAlive) {
            this.aiState = 'idle';
            return;
        }
        
        this.aiState = 'attack';
        
        const dx = this.player.position.x - this.position.x;
        const dz = this.player.position.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // 更新朝向
        this.rotation.y = Math.atan2(dx, dz);
        
        // 如果在攻击范围内
        if (distance <= this.attackRange) {
            // 停止移动
            this.targetPosition = null;
            
            // 攻击
            if (this.attackCooldown <= 0) {
                this.shoot();
                this.attackCooldown = this.attackInterval;
            }
        } else {
            // 追击玩家
            this.targetPosition = {
                x: this.player.position.x,
                y: this.player.position.y,
                z: this.player.position.z
            };
        }
    }
    
    /**
     * 射击
     */
    shoot() {
        // 计算射击方向
        const dx = this.player.position.x - this.position.x;
        const dy = this.player.position.y - this.position.y;
        const dz = this.player.position.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        const direction = {
            x: dx / distance,
            y: dy / distance,
            z: dz / distance
        };
        
        // 添加一些不精准度
        const inaccuracy = this.type === 'sniper' ? 0.02 : 0.1;
        direction.x += (Math.random() - 0.5) * inaccuracy;
        direction.y += (Math.random() - 0.5) * inaccuracy;
        direction.z += (Math.random() - 0.5) * inaccuracy;
        
        // 创建投射物
        const projectile = new Projectile({
            position: {
                x: this.position.x,
                y: this.position.y + 1,
                z: this.position.z
            },
            direction: direction,
            speed: 80,
            damage: this.damage,
            range: this.weaponRange,
            color: '#ff3333',
            type: 'hitscan',
            owner: this
        });
        
        if (window.gameEngine) {
            window.gameEngine.addProjectile(projectile);
        }
        
        // 播放音效
        if (window.gameEngine && window.gameEngine.audio) {
            window.gameEngine.audio.play('enemy_shoot');
        }
        
        // 枪口闪光效果
        this.createMuzzleFlash();
    }
    
    /**
     * 创建枪口闪光
     */
    createMuzzleFlash() {
        const flashPos = {
            x: this.position.x + Math.sin(this.rotation.y) * 1,
            y: this.position.y + 1.5,
            z: this.position.z + Math.cos(this.rotation.y) * 1
        };
        
        for (let i = 0; i < 3; i++) {
            const particle = new Particle({
                position: { ...flashPos },
                velocity: {
                    x: (Math.random() - 0.5) * 3,
                    y: Math.random() * 3,
                    z: (Math.random() - 0.5) * 3
                },
                color: '#ffaa00',
                size: 2,
                lifetime: 0.1
            });
            
            if (window.gameEngine) {
                window.gameEngine.addParticle(particle);
            }
        }
    }
    
    /**
     * 检查是否有最后已知位置
     */
    hasLastKnownPosition() {
        if (!this.lastTargetPosition) return false;
        
        this.targetLostTime += 0.016; // 假设60fps
        
        // 5秒后放弃追击
        if (this.targetLostTime > 5) {
            this.lastTargetPosition = null;
            return false;
        }
        
        return true;
    }
    
    /**
     * 调查最后已知位置
     */
    investigate() {
        this.aiState = 'chase';
        
        if (this.lastTargetPosition) {
            this.targetPosition = this.lastTargetPosition;
        }
    }
    
    /**
     * 巡逻
     */
    patrol() {
        this.aiState = 'patrol';
        
        // 如果没有目标位置，随机选择一个
        if (!this.targetPosition) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 10;
            
            this.targetPosition = {
                x: this.position.x + Math.cos(angle) * distance,
                y: this.position.y,
                z: this.position.z + Math.sin(angle) * distance
            };
            
            // 限制在地图范围内
            if (window.gameEngine && window.gameEngine.currentLevel) {
                const bounds = window.gameEngine.currentLevel.bounds;
                this.targetPosition.x = Math.max(bounds.minX + 5, 
                    Math.min(bounds.maxX - 5, this.targetPosition.x));
                this.targetPosition.z = Math.max(bounds.minZ + 5, 
                    Math.min(bounds.maxZ - 5, this.targetPosition.z));
            }
        }
    }
    
    /**
     * 检查是否卡住
     */
    checkStuck(deltaTime) {
        const dx = this.position.x - this.lastPosition.x;
        const dz = this.position.z - this.lastPosition.z;
        const moveDistance = Math.sqrt(dx * dx + dz * dz);
        
        if (moveDistance < 0.1) {
            this.stuckTime += deltaTime;
            
            if (this.stuckTime > 2) {
                // 卡住太久，重新选择目标
                this.targetPosition = null;
                this.stuckTime = 0;
            }
        } else {
            this.stuckTime = 0;
        }
        
        // 每秒更新一次最后位置
        if (Math.floor(this.animTime) > Math.floor(this.animTime - deltaTime)) {
            this.lastPosition = { ...this.position };
        }
    }
    
    /**
     * 更新动画
     */
    updateAnimation(deltaTime) {
        // 行走动画
        if (this.targetPosition) {
            this.walkCycle += deltaTime * 5;
        }
    }
    
    /**
     * 受到伤害
     */
    takeDamage(amount) {
        this.health -= amount;
        
        // 受到伤害时立即转向攻击者
        if (this.player && this.player.isAlive) {
            const dx = this.player.position.x - this.position.x;
            const dz = this.player.position.z - this.position.z;
            this.rotation.y = Math.atan2(dx, dz);
            
            // 立即进入攻击状态
            this.lastTargetPosition = { ...this.player.position };
            this.targetLostTime = 0;
            this.aiState = 'attack';
        }
        
        // 显示伤害数字
        if (window.gameEngine && window.gameEngine.hud) {
            window.gameEngine.hud.showDamageNumber(amount, this.position);
        }
        
        // 检查死亡
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * 死亡
     */
    die() {
        this.isAlive = false;
        
        // 播放死亡动画/效果
        this.createDeathEffect();
    }
    
    /**
     * 创建死亡效果
     */
    createDeathEffect() {
        // 创建粒子效果
        for (let i = 0; i < 15; i++) {
            const particle = new Particle({
                position: { ...this.position },
                velocity: {
                    x: (Math.random() - 0.5) * 8,
                    y: Math.random() * 8,
                    z: (Math.random() - 0.5) * 8
                },
                color: this.color,
                size: 3 + Math.random() * 3,
                lifetime: 1 + Math.random()
            });
            
            if (window.gameEngine) {
                window.gameEngine.addParticle(particle);
            }
        }
    }
}