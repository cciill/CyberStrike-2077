/**
 * CyberStrike 2077 - 玩家控制器
 * 处理玩家移动、视角控制、武器操作
 */

class Player {
    constructor(spawnPosition) {
        // 位置
        this.position = { ...spawnPosition };
        this.velocity = { x: 0, y: 0, z: 0 };
        
        // 旋转（欧拉角）
        this.rotation = { x: 0, y: 0 }; // x: pitch, y: yaw
        
        // 状态
        this.isAlive = true;
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 50;
        this.maxArmor = 100;
        
        // 移动参数
        this.moveSpeed = 8; // 单位/秒
        this.sprintSpeed = 14;
        this.crouchSpeed = 4;
        this.currentSpeed = this.moveSpeed;
        
        // 物理参数
        this.height = 1.8;
        this.crouchHeight = 1.0;
        this.currentHeight = this.height;
        this.radius = 0.3;
        this.isOnGround = false;
        this.isCrouching = false;
        this.isSprinting = false;
        
        // 跳跃
        this.jumpForce = 8;
        this.gravity = 25;
        
        // 武器系统
        this.weapons = [];
        this.currentWeaponIndex = 0;
        this.currentWeapon = null;
        
        // 初始化武器
        this.initWeapons();
        
        // 鼠标控制
        this.mouseSensitivity = 0.002;
        
        // 视角限制
        this.maxPitch = Math.PI / 2 - 0.1;
        this.minPitch = -Math.PI / 2 + 0.1;
        
        // 脚步声计时
        this.footstepTimer = 0;
        this.footstepInterval = 0.4;
        
        // 受伤效果
        this.damageFlash = 0;
    }
    
    /**
     * 初始化武器
     */
    initWeapons() {
        // 创建武器库
        this.weapons = [
            new AssaultRifle(),
            new Shotgun(),
            new SniperRifle(),
            new RocketLauncher(),
            new Pistol()
        ];
        
        // 装备第一把武器
        this.equipWeapon(0);
    }
    
    /**
     * 装备武器
     */
    equipWeapon(index) {
        if (index < 0 || index >= this.weapons.length) return;
        
        this.currentWeaponIndex = index;
        this.currentWeapon = this.weapons[index];
        
        // 触发武器切换事件
        if (window.gameEngine && window.gameEngine.hud) {
            window.gameEngine.hud.updateWeapon(this.currentWeapon);
        }
        
        console.log(`Equipped: ${this.currentWeapon.name}`);
    }
    
    /**
     * 切换到下一武器
     */
    nextWeapon() {
        const nextIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        this.equipWeapon(nextIndex);
    }
    
    /**
     * 切换到上一武器
     */
    previousWeapon() {
        const prevIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
        this.equipWeapon(prevIndex);
    }
    
    /**
     * 切换到指定槽位的武器
     */
    switchToSlot(slot) {
        const index = slot - 1;
        if (index >= 0 && index < this.weapons.length) {
            this.equipWeapon(index);
        }
    }
    
    /**
     * 更新玩家状态
     */
    update(deltaTime, input) {
        if (!this.isAlive) return;
        
        // 处理输入
        this.handleInput(deltaTime, input);
        
        // 应用物理
        this.applyPhysics(deltaTime);
        
        // 更新武器
        if (this.currentWeapon) {
            this.currentWeapon.update(deltaTime);
        }
        
        // 更新受伤效果
        if (this.damageFlash > 0) {
            this.damageFlash -= deltaTime * 2;
            if (this.damageFlash < 0) this.damageFlash = 0;
        }
        
        // 脚步声
        this.updateFootsteps(deltaTime);
    }
    
    /**
     * 处理输入
     */
    handleInput(deltaTime, input) {
        // 鼠标视角控制
        if (input.mouseDeltaX !== 0 || input.mouseDeltaY !== 0) {
            this.rotation.y -= input.mouseDeltaX * this.mouseSensitivity;
            this.rotation.x -= input.mouseDeltaY * this.mouseSensitivity;
            
            // 限制俯仰角
            this.rotation.x = Math.max(this.minPitch, Math.min(this.maxPitch, this.rotation.x));
            
            // 规范化偏航角
            while (this.rotation.y > Math.PI) this.rotation.y -= Math.PI * 2;
            while (this.rotation.y < -Math.PI) this.rotation.y += Math.PI * 2;
        }
        
        // 计算移动方向
        let moveX = 0;
        let moveZ = 0;
        
        if (input.keys['KeyW'] || input.keys['ArrowUp']) moveZ += 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) moveZ -= 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;
        
        // 冲刺
        this.isSprinting = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
        
        // 蹲下
        const wasCrouching = this.isCrouching;
        this.isCrouching = input.keys['ControlLeft'] || input.keys['ControlRight'];
        
        // 处理蹲下高度变化
        if (this.isCrouching !== wasCrouching) {
            this.currentHeight = this.isCrouching ? this.crouchHeight : this.height;
            this.position.y += wasCrouching ? 0.8 : -0.8;
        }
        
        // 确定当前速度
        if (this.isCrouching) {
            this.currentSpeed = this.crouchSpeed;
        } else if (this.isSprinting && moveZ > 0) {
            this.currentSpeed = this.sprintSpeed;
        } else {
            this.currentSpeed = this.moveSpeed;
        }
        
        // 将移动方向转换到世界空间
        if (moveX !== 0 || moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;
            
            const cos = Math.cos(this.rotation.y);
            const sin = Math.sin(this.rotation.y);
            
            const worldMoveX = moveX * cos + moveZ * sin;
            const worldMoveZ = -moveX * sin + moveZ * cos;
            
            this.velocity.x = worldMoveX * this.currentSpeed;
            this.velocity.z = worldMoveZ * this.currentSpeed;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
        
        // 跳跃
        if (input.keys['Space'] && this.isOnGround) {
            this.velocity.y = this.jumpForce;
            this.isOnGround = false;
            
            // 播放跳跃音效
            if (window.gameEngine && window.gameEngine.audio) {
                window.gameEngine.audio.play('jump');
            }
        }
        
        // 射击
        if (input.mouseButtons[0] && this.currentWeapon) {
            this.shoot();
        }
        
        // 瞄准
        if (input.mouseButtons[2] && this.currentWeapon) {
            this.currentWeapon.isAiming = true;
        } else if (this.currentWeapon) {
            this.currentWeapon.isAiming = false;
        }
        
        // 换弹
        if (input.keys['KeyR'] && this.currentWeapon) {
            this.currentWeapon.reload();
        }
        
        // 武器切换
        if (input.keys['Digit1']) this.switchToSlot(1);
        if (input.keys['Digit2']) this.switchToSlot(2);
        if (input.keys['Digit3']) this.switchToSlot(3);
        if (input.keys['Digit4']) this.switchToSlot(4);
        if (input.keys['Digit5']) this.switchToSlot(5);
        
        // 滚轮切换武器
        if (input.mouseWheel !== 0) {
            if (input.mouseWheel > 0) {
                this.nextWeapon();
            } else {
                this.previousWeapon();
            }
            input.mouseWheel = 0;
        }
        
        // 互动
        if (input.keys['KeyE']) {
            this.interact();
        }
    }
    
    /**
     * 应用物理
     */
    applyPhysics(deltaTime) {
        // 重力
        if (!this.isOnGround) {
            this.velocity.y -= this.gravity * deltaTime;
        }
        
        // 更新位置
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // 地面碰撞
        if (this.position.y <= this.currentHeight) {
            this.position.y = this.currentHeight;
            this.velocity.y = 0;
            this.isOnGround = true;
        }
        
        // 关卡边界碰撞检测
        if (window.gameEngine && window.gameEngine.currentLevel) {
            this.checkLevelCollision();
        }
    }
    
    /**
     * 检查关卡碰撞
     */
    checkLevelCollision() {
        const level = window.gameEngine.currentLevel;
        
        // 简化的边界检查
        if (this.position.x < level.bounds.minX) this.position.x = level.bounds.minX;
        if (this.position.x > level.bounds.maxX) this.position.x = level.bounds.maxX;
        if (this.position.z < level.bounds.minZ) this.position.z = level.bounds.minZ;
        if (this.position.z > level.bounds.maxZ) this.position.z = level.bounds.maxZ;
        
        // 检查与墙壁的碰撞
        level.walls.forEach(wall => {
            if (this.checkWallCollision(wall)) {
                this.resolveWallCollision(wall);
            }
        });
    }
    
    /**
     * 检查与墙壁的碰撞
     */
    checkWallCollision(wall) {
        const dx = Math.abs(this.position.x - wall.x);
        const dz = Math.abs(this.position.z - wall.z);
        
        return dx < (this.radius + wall.width / 2) && 
               dz < (this.radius + wall.depth / 2);
    }
    
    /**
     * 解决墙壁碰撞
     */
    resolveWallCollision(wall) {
        const dx = this.position.x - wall.x;
        const dz = this.position.z - wall.z;
        
        const overlapX = (this.radius + wall.width / 2) - Math.abs(dx);
        const overlapZ = (this.radius + wall.depth / 2) - Math.abs(dz);
        
        if (overlapX < overlapZ) {
            this.position.x += dx > 0 ? overlapX : -overlapX;
        } else {
            this.position.z += dz > 0 ? overlapZ : -overlapZ;
        }
    }
    
    /**
     * 射击
     */
    shoot() {
        if (!this.currentWeapon || !this.currentWeapon.canShoot()) return;
        
        // 获取射击方向
        const direction = this.getAimDirection();
        
        // 武器射击
        const projectile = this.currentWeapon.shoot(this.position, direction);
        
        if (projectile) {
            // 添加后坐力效果
            this.currentWeapon.recoilOffset = this.currentWeapon.recoil;
            
            // 添加到游戏世界
            window.gameEngine.addProjectile(projectile);
            
            // 播放音效
            window.gameEngine.audio.play(this.currentWeapon.shootSound);
            
            // 更新HUD
            window.gameEngine.hud.updateAmmo(
                this.currentWeapon.currentAmmo,
                this.currentWeapon.reserveAmmo
            );
            
            // 枪口闪光效果
            this.createMuzzleFlash();
        }
    }
    
    /**
     * 获取瞄准方向
     */
    getAimDirection() {
        const pitch = this.rotation.x;
        const yaw = this.rotation.y;
        
        return {
            x: Math.sin(yaw) * Math.cos(pitch),
            y: Math.sin(pitch),
            z: Math.cos(yaw) * Math.cos(pitch)
        };
    }
    
    /**
     * 创建枪口闪光效果
     */
    createMuzzleFlash() {
        // 计算枪口位置
        const direction = this.getAimDirection();
        const muzzlePos = {
            x: this.position.x + direction.x * 1.5,
            y: this.position.y + direction.y * 1.5,
            z: this.position.z + direction.z * 1.5
        };
        
        // 创建闪光粒子
        for (let i = 0; i < 5; i++) {
            const particle = new Particle({
                position: { ...muzzlePos },
                velocity: {
                    x: (Math.random() - 0.5) * 5,
                    y: (Math.random() - 0.5) * 5,
                    z: (Math.random() - 0.5) * 5
                },
                color: '#ffffaa',
                size: 3 + Math.random() * 2,
                lifetime: 0.1
            });
            window.gameEngine.addParticle(particle);
        }
        
        // 添加光源效果
        window.gameEngine.renderer.addLight({
            position: muzzlePos,
            color: '#ffffaa',
            intensity: 2,
            range: 10,
            duration: 0.05
        });
    }
    
    /**
     * 互动
     */
    interact() {
        // 检查范围内的可互动对象
        const interactRange = 3;
        
        // TODO: 实现互动逻辑（拾取武器、开门等）
        console.log('Interact pressed');
    }
    
    /**
     * 更新脚步声
     */
    updateFootsteps(deltaTime) {
        if (this.isOnGround && (this.velocity.x !== 0 || this.velocity.z !== 0)) {
            this.footstepTimer += deltaTime;
            
            const interval = this.isSprinting ? this.footstepInterval * 0.6 : this.footstepInterval;
            
            if (this.footstepTimer >= interval) {
                this.footstepTimer = 0;
                
                // 播放脚步声
                if (window.gameEngine && window.gameEngine.audio) {
                    window.gameEngine.audio.play('footstep');
                }
            }
        } else {
            this.footstepTimer = 0;
        }
    }
    
    /**
     * 受到伤害
     */
    takeDamage(amount, attacker) {
        if (!this.isAlive) return;
        
        // 护甲减伤
        let actualDamage = amount;
        if (this.armor > 0) {
            const armorReduction = Math.min(this.armor, actualDamage * 0.5);
            this.armor -= armorReduction;
            actualDamage -= armorReduction;
        }
        
        this.health -= actualDamage;
        this.damageFlash = 1;
        
        // 播放受伤音效
        if (window.gameEngine && window.gameEngine.audio) {
            window.gameEngine.audio.play('player_hit');
        }
        
        // 显示受伤效果
        if (window.gameEngine && window.gameEngine.hud) {
            window.gameEngine.hud.showDamageIndicator(attacker);
        }
        
        // 检查死亡
        if (this.health <= 0) {
            this.die();
        }
        
        // 更新HUD
        if (window.gameEngine && window.gameEngine.hud) {
            window.gameEngine.hud.updateHealth(this.health, this.maxHealth);
            window.gameEngine.hud.updateArmor(this.armor, this.maxArmor);
        }
    }
    
    /**
     * 治疗
     */
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        
        if (window.gameEngine && window.gameEngine.hud) {
            window.gameEngine.hud.updateHealth(this.health, this.maxHealth);
        }
    }
    
    /**
     * 添加护甲
     */
    addArmor(amount) {
        this.armor = Math.min(this.armor + amount, this.maxArmor);
        
        if (window.gameEngine && window.gameEngine.hud) {
            window.gameEngine.hud.updateArmor(this.armor, this.maxArmor);
        }
    }
    
    /**
     * 死亡
     */
    die() {
        this.isAlive = false;
        this.health = 0;
        
        // 播放死亡音效
        if (window.gameEngine && window.gameEngine.audio) {
            window.gameEngine.audio.play('player_death');
        }
        
        console.log('Player died');
    }
    
    /**
     * 复活
     */
    respawn(spawnPosition) {
        this.isAlive = true;
        this.health = this.maxHealth;
        this.armor = this.maxArmor / 2;
        this.position = { ...spawnPosition };
        this.velocity = { x: 0, y: 0, z: 0 };
        
        // 更新HUD
        if (window.gameEngine && window.gameEngine.hud) {
            window.gameEngine.hud.updateHealth(this.health, this.maxHealth);
            window.gameEngine.hud.updateArmor(this.armor, this.maxArmor);
        }
    }
}