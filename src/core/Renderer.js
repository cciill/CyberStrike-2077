/**
 * CyberStrike 2077 - 渲染器
 * 负责所有图形渲染，包括3D投影、光照、特效
 */

class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        
        // 渲染设置
        this.fov = 75; // 视野角度
        this.nearPlane = 0.1;
        this.farPlane = 1000;
        
        // 相机
        this.camera = {
            position: { x: 0, y: 1.7, z: 0 },
            rotation: { x: 0, y: 0 },
            forward: { x: 0, y: 0, z: 1 },
            right: { x: 1, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 }
        };
        
        // 渲染缓冲区
        this.zBuffer = new Float32Array(this.width * this.height);
        
        // 光照
        this.lights = [];
        this.ambientLight = 0.2;
        
        // 后处理
        this.postProcessing = new PostProcessing(this);
        
        // 纹理缓存
        this.textures = new Map();
        
        // 性能统计
        this.drawCalls = 0;
        this.trianglesDrawn = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.zBuffer = new Float32Array(width * height);
    }
    
    /**
     * 更新相机位置
     */
    updateCamera(player) {
        this.camera.position = { ...player.position };
        this.camera.rotation = { ...player.rotation };
        
        // 计算相机方向向量
        const yaw = this.camera.rotation.y;
        const pitch = this.camera.rotation.x;
        
        this.camera.forward = {
            x: Math.sin(yaw) * Math.cos(pitch),
            y: Math.sin(pitch),
            z: Math.cos(yaw) * Math.cos(pitch)
        };
        
        this.camera.right = {
            x: Math.cos(yaw),
            y: 0,
            z: -Math.sin(yaw)
        };
        
        this.camera.up = {
            x: -Math.sin(yaw) * Math.sin(pitch),
            y: Math.cos(pitch),
            z: -Math.cos(yaw) * Math.sin(pitch)
        };
    }
    
    /**
     * 渲染关卡
     */
    renderLevel(level, player) {
        this.updateCamera(player);
        
        // 清空Z缓冲
        this.zBuffer.fill(Infinity);
        
        this.drawCalls = 0;
        this.trianglesDrawn = 0;
        
        // 渲染天空盒
        this.renderSkybox();
        
        // 渲染地形
        this.renderTerrain(level.terrain);
        
        // 渲染静态几何体
        level.staticGeometry.forEach(geometry => {
            this.renderGeometry(geometry);
        });
        
        // 渲染动态物体
        level.dynamicObjects.forEach(object => {
            this.renderObject(object);
        });
        
        // 渲染粒子效果
        this.renderParticles();
    }
    
    /**
     * 渲染天空盒
     */
    renderSkybox() {
        // 创建赛博朋克风格的天空渐变
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a0a2e');
        gradient.addColorStop(1, '#2d1b4e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制星星
        this.renderStars();
        
        // 绘制远处的城市轮廓
        this.renderCitySilhouette();
    }
    
    /**
     * 渲染星星
     */
    renderStars() {
        this.ctx.fillStyle = '#ffffff';
        
        // 使用伪随机生成星星位置（基于时间保持相对稳定）
        const time = Date.now() * 0.0001;
        
        for (let i = 0; i < 100; i++) {
            const x = ((Math.sin(i * 12.9898 + time) * 43758.5453) % 1 + 1) % 1 * this.width;
            const y = ((Math.cos(i * 78.233 + time) * 43758.5453) % 1 + 1) % 1 * this.height * 0.6;
            const size = (Math.sin(i) + 1) * 1.5;
            const alpha = (Math.sin(time + i) + 1) * 0.5;
            
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * 渲染城市轮廓
     */
    renderCitySilhouette() {
        const horizon = this.height * 0.6;
        
        this.ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        
        // 生成建筑物轮廓
        for (let x = 0; x <= this.width; x += 20) {
            const height = Math.abs(Math.sin(x * 0.01) * Math.cos(x * 0.005)) * 150 + 50;
            this.ctx.lineTo(x, horizon - height);
        }
        
        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 绘制霓虹灯效果
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * 渲染地形
     */
    renderTerrain(terrain) {
        // 简化的地形渲染
        const gridSize = 50;
        const viewDistance = 20;
        
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const camX = Math.floor(this.camera.position.x / gridSize) * gridSize;
        const camZ = Math.floor(this.camera.position.z / gridSize) * gridSize;
        
        for (let x = -viewDistance; x <= viewDistance; x++) {
            for (let z = -viewDistance; z <= viewDistance; z++) {
                const worldX = camX + x * gridSize;
                const worldZ = camZ + z * gridSize;
                
                // 将世界坐标转换为屏幕坐标
                const p1 = this.worldToScreen({ x: worldX, y: 0, z: worldZ });
                const p2 = this.worldToScreen({ x: worldX + gridSize, y: 0, z: worldZ });
                const p3 = this.worldToScreen({ x: worldX, y: 0, z: worldZ + gridSize });
                
                if (p1 && p2 && p3) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.lineTo(p3.x, p3.y);
                    this.ctx.closePath();
                    this.ctx.stroke();
                }
            }
        }
    }
    
    /**
     * 渲染几何体
     */
    renderGeometry(geometry) {
        // 视锥剔除
        if (!this.isInFrustum(geometry.position, geometry.radius || 5)) {
            return;
        }
        
        // 简化的几何体渲染（使用2D投影）
        const screenPos = this.worldToScreen(geometry.position);
        if (!screenPos) return;
        
        const size = this.getScreenSize(geometry.position, geometry.size || 2);
        
        // 根据距离计算透明度
        const distance = this.getDistance(this.camera.position, geometry.position);
        const alpha = Math.max(0.3, 1 - distance / 100);
        
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = geometry.color || '#00f0ff';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // 绘制几何体轮廓
        this.ctx.beginPath();
        this.ctx.rect(screenPos.x - size / 2, screenPos.y - size, size, size);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 绘制发光效果
        this.ctx.shadowColor = geometry.color || '#00f0ff';
        this.ctx.shadowBlur = 20;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        this.ctx.globalAlpha = 1;
        
        this.drawCalls++;
    }
    
    /**
     * 渲染游戏对象
     */
    renderObject(object) {
        const screenPos = this.worldToScreen(object.position);
        if (!screenPos) return;
        
        const size = this.getScreenSize(object.position, object.size || 1);
        
        this.ctx.fillStyle = object.color || '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y - size / 2, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 渲染敌人
     */
    renderEnemy(enemy, player) {
        const screenPos = this.worldToScreen(enemy.position);
        if (!screenPos) return;
        
        const distance = this.getDistance(this.camera.position, enemy.position);
        const size = this.getScreenSize(enemy.position, enemy.size || 1.8);
        
        // 根据敌人类型选择颜色
        let color = '#ff3333';
        let glowColor = '#ff0000';
        
        switch (enemy.type) {
            case 'fast':
                color = '#ffaa00';
                glowColor = '#ff8800';
                break;
            case 'tank':
                color = '#aa3333';
                glowColor = '#ff0000';
                break;
            case 'sniper':
                color = '#aa00ff';
                glowColor = '#ff00ff';
                break;
        }
        
        // 绘制敌人身体
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = 15;
        
        // 敌人形状（简化为发光的菱形）
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x, screenPos.y - size);
        this.ctx.lineTo(screenPos.x + size / 2, screenPos.y);
        this.ctx.lineTo(screenPos.x, screenPos.y + size / 2);
        this.ctx.lineTo(screenPos.x - size / 2, screenPos.y);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // 绘制血条
        if (enemy.health < enemy.maxHealth) {
            const barWidth = size;
            const barHeight = 4;
            const healthPercent = enemy.health / enemy.maxHealth;
            
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y - size - 10, barWidth, barHeight);
            
            this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            this.ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y - size - 10, barWidth * healthPercent, barHeight);
        }
        
        // 绘制敌人名称
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(enemy.type.toUpperCase(), screenPos.x, screenPos.y - size - 15);
        
        this.drawCalls++;
    }
    
    /**
     * 渲染武器
     */
    renderWeapon(weapon, player) {
        // 在屏幕底部渲染武器模型
        const weaponX = this.width / 2;
        const weaponY = this.height - 100;
        
        // 武器摆动动画
        const time = Date.now() * 0.005;
        const swayX = Math.sin(time) * 5;
        const swayY = Math.cos(time * 0.7) * 3;
        
        // 射击后坐力
        const recoil = weapon.recoilOffset || 0;
        
        this.ctx.save();
        this.ctx.translate(weaponX + swayX, weaponY + swayY + recoil);
        
        // 根据武器类型渲染不同的外观
        switch (weapon.type) {
            case 'assault_rifle':
                this.renderAssaultRifle();
                break;
            case 'shotgun':
                this.renderShotgun();
                break;
            case 'sniper':
                this.renderSniperRifle();
                break;
            case 'rocket_launcher':
                this.renderRocketLauncher();
                break;
            case 'pistol':
                this.renderPistol();
                break;
            default:
                this.renderAssaultRifle();
        }
        
        this.ctx.restore();
        
        // 减少后坐力
        if (weapon.recoilOffset > 0) {
            weapon.recoilOffset *= 0.9;
        }
    }
    
    /**
     * 渲染突击步枪
     */
    renderAssaultRifle() {
        // 枪身
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(-30, -20, 120, 40);
        
        // 枪管
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(80, -15, 60, 20);
        
        // 弹匣
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.beginPath();
        this.ctx.moveTo(10, 20);
        this.ctx.lineTo(30, 60);
        this.ctx.lineTo(50, 60);
        this.ctx.lineTo(50, 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 发光装饰
        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(-30, -20, 120, 40);
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 渲染霰弹枪
     */
    renderShotgun() {
        this.ctx.fillStyle = '#3a2a1a';
        this.ctx.fillRect(-40, -25, 100, 50);
        
        this.ctx.fillStyle = '#2a1a0a';
        this.ctx.fillRect(50, -20, 80, 30);
        
        // 双管
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(120, -18, 40, 10);
        this.ctx.fillRect(120, -2, 40, 10);
        
        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#ffaa00';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(-40, -25, 100, 50);
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 渲染狙击步枪
     */
    renderSniperRifle() {
        this.ctx.fillStyle = '#1a2a1a';
        this.ctx.fillRect(-50, -20, 150, 40);
        
        // 长枪管
        this.ctx.fillStyle = '#0a1a0a';
        this.ctx.fillRect(90, -15, 100, 20);
        
        // 瞄准镜
        this.ctx.fillStyle = '#2a3a2a';
        this.ctx.fillRect(20, -45, 60, 30);
        this.ctx.fillStyle = '#00f0ff';
        this.ctx.fillRect(30, -40, 40, 20);
        
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(-50, -20, 150, 40);
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 渲染火箭筒
     */
    renderRocketLauncher() {
        this.ctx.fillStyle = '#3a1a1a';
        this.ctx.fillRect(-40, -30, 100, 60);
        
        // 大口径炮管
        this.ctx.fillStyle = '#2a0a0a';
        this.ctx.beginPath();
        this.ctx.ellipse(80, 0, 40, 25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#ff3333';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#ff3333';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeRect(-40, -30, 100, 60);
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 渲染手枪
     */
    renderPistol() {
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(-20, -15, 60, 30);
        
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(35, -12, 40, 15);
        
        // 握把
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.beginPath();
        this.ctx.moveTo(-10, 15);
        this.ctx.lineTo(0, 50);
        this.ctx.lineTo(20, 50);
        this.ctx.lineTo(25, 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-20, -15, 60, 30);
    }
    
    /**
     * 渲染投射物
     */
    renderProjectile(projectile) {
        const screenPos = this.worldToScreen(projectile.position);
        if (!screenPos) return;
        
        const size = Math.max(2, 10 - projectile.distanceTraveled * 0.1);
        
        this.ctx.fillStyle = projectile.color || '#ffff00';
        this.ctx.shadowColor = projectile.color || '#ffff00';
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // 绘制轨迹
        if (projectile.trail && projectile.trail.length > 1) {
            this.ctx.strokeStyle = projectile.color || '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.5;
            
            this.ctx.beginPath();
            const start = this.worldToScreen(projectile.trail[0]);
            if (start) {
                this.ctx.moveTo(start.x, start.y);
                for (let i = 1; i < projectile.trail.length; i++) {
                    const point = this.worldToScreen(projectile.trail[i]);
                    if (point) this.ctx.lineTo(point.x, point.y);
                }
                this.ctx.stroke();
            }
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    /**
     * 渲染粒子
     */
    renderParticle(particle) {
        const screenPos = this.worldToScreen(particle.position);
        if (!screenPos) return;
        
        const size = particle.size * (1 - particle.age / particle.lifetime);
        const alpha = 1 - particle.age / particle.lifetime;
        
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = size;
        
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * 渲染粒子集合
     */
    renderParticles() {
        // 这个方法在 renderLevel 中被调用，实际的粒子渲染在 renderParticle 中
    }
    
    /**
     * 应用后处理效果
     */
    applyPostProcessing() {
        // Bloom效果（简化版）
        this.postProcessing.applyBloom();
        
        // 扫描线效果
        this.renderScanlines();
        
        // Vignette效果
        this.renderVignette();
    }
    
    /**
     * 渲染扫描线
     */
    renderScanlines() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = 0; y < this.height; y += 4) {
            this.ctx.fillRect(0, y, this.width, 2);
        }
    }
    
    /**
     * 渲染暗角
     */
    renderVignette() {
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.height * 0.3,
            this.width / 2, this.height / 2, this.height * 0.8
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    /**
     * 世界坐标转屏幕坐标
     */
    worldToScreen(worldPos) {
        // 简化的透视投影
        const dx = worldPos.x - this.camera.position.x;
        const dy = worldPos.y - this.camera.position.y;
        const dz = worldPos.z - this.camera.position.z;
        
        // 旋转到相机空间
        const yaw = this.camera.rotation.y;
        const pitch = this.camera.rotation.x;
        
        const rotatedX = dx * Math.cos(yaw) - dz * Math.sin(yaw);
        const rotatedZ = dx * Math.sin(yaw) + dz * Math.cos(yaw);
        const rotatedY = dy * Math.cos(pitch) - rotatedZ * Math.sin(pitch);
        const finalZ = dy * Math.sin(pitch) + rotatedZ * Math.cos(pitch);
        
        // 在相机后方
        if (finalZ < this.nearPlane) return null;
        
        // 透视投影
        const scale = (this.height / 2) / Math.tan(this.fov * Math.PI / 360) / finalZ;
        
        const screenX = this.width / 2 + rotatedX * scale;
        const screenY = this.height / 2 - rotatedY * scale;
        
        // 检查是否在屏幕范围内
        if (screenX < -100 || screenX > this.width + 100 || 
            screenY < -100 || screenY > this.height + 100) {
            return null;
        }
        
        return { x: screenX, y: screenY, z: finalZ, scale: scale };
    }
    
    /**
     * 获取屏幕上的大小
     */
    getScreenSize(worldPos, worldSize) {
        const dx = worldPos.x - this.camera.position.x;
        const dy = worldPos.y - this.camera.position.y;
        const dz = worldPos.z - this.camera.position.z;
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        const scale = (this.height / 2) / Math.tan(this.fov * Math.PI / 360) / distance;
        
        return worldSize * scale;
    }
    
    /**
     * 视锥剔除检查
     */
    isInFrustum(position, radius) {
        const dx = position.x - this.camera.position.x;
        const dy = position.y - this.camera.position.y;
        const dz = position.z - this.camera.position.z;
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // 距离检查
        if (distance < this.nearPlane || distance > this.farPlane) {
            return false;
        }
        
        // 简化的视锥检查（基于角度）
        const yaw = Math.atan2(dx, dz);
        const yawDiff = Math.abs(this.normalizeAngle(yaw - this.camera.rotation.y));
        
        if (yawDiff > this.fov * Math.PI / 360 + 0.5) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 标准化角度到 -PI 到 PI
     */
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
    
    /**
     * 计算距离
     */
    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}