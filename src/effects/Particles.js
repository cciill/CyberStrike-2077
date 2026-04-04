/**
 * CyberStrike 2077 - 粒子系统
 * 视觉效果粒子
 */

class Particle {
    constructor(config) {
        this.position = { ...config.position };
        this.velocity = { ...config.velocity };
        this.color = config.color || '#ffffff';
        this.size = config.size || 2;
        this.lifetime = config.lifetime || 1;
        this.age = 0;
        this.isAlive = true;
        
        // 可选属性
        this.gravity = config.gravity !== undefined ? config.gravity : 9.8;
        this.drag = config.drag || 0.5;
        this.growthRate = config.growthRate || 0;
        this.alpha = config.alpha !== undefined ? config.alpha : 1;
        this.alphaDecay = config.alphaDecay || 1;
    }
    
    /**
     * 更新粒子
     */
    update(deltaTime) {
        this.age += deltaTime;
        
        // 检查生命周期
        if (this.age >= this.lifetime) {
            this.isAlive = false;
            return;
        }
        
        // 应用重力
        this.velocity.y -= this.gravity * deltaTime;
        
        // 应用阻力
        this.velocity.x *= (1 - this.drag * deltaTime);
        this.velocity.y *= (1 - this.drag * deltaTime);
        this.velocity.z *= (1 - this.drag * deltaTime);
        
        // 更新位置
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // 更新大小
        this.size += this.growthRate * deltaTime;
        if (this.size < 0) this.size = 0;
        
        // 更新透明度
        this.alpha -= this.alphaDecay * deltaTime;
        if (this.alpha < 0) this.alpha = 0;
    }
}

/**
 * 粒子发射器
 * 用于持续生成粒子效果
 */
class ParticleEmitter {
    constructor(config) {
        this.position = { ...config.position };
        this.emissionRate = config.emissionRate || 10; // 每秒发射数量
        this.particleConfig = config.particleConfig || {};
        
        this.isActive = true;
        this.emissionTimer = 0;
        this.lifetime = config.lifetime || Infinity;
        this.age = 0;
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        this.age += deltaTime;
        
        // 检查生命周期
        if (this.age >= this.lifetime) {
            this.isActive = false;
            return;
        }
        
        // 发射粒子
        this.emissionTimer += deltaTime;
        const emissionInterval = 1 / this.emissionRate;
        
        while (this.emissionTimer >= emissionInterval) {
            this.emit();
            this.emissionTimer -= emissionInterval;
        }
    }
    
    emit() {
        const config = { ...this.particleConfig };
        
        // 添加随机偏移
        if (config.position) {
            config.position = {
                x: this.position.x + (Math.random() - 0.5) * (config.spawnRadius || 0),
                y: this.position.y + (Math.random() - 0.5) * (config.spawnRadius || 0),
                z: this.position.z + (Math.random() - 0.5) * (config.spawnRadius || 0)
            };
        } else {
            config.position = { ...this.position };
        }
        
        const particle = new Particle(config);
        
        if (window.gameEngine) {
            window.gameEngine.addParticle(particle);
        }
    }
}

/**
 * 后处理效果
 */
class PostProcessing {
    constructor(renderer) {
        this.renderer = renderer;
        this.effects = [];
    }
    
    /**
     * 应用Bloom效果
     */
    applyBloom() {
        // 简化的Bloom效果 - 使用叠加混合
        const ctx = this.renderer.ctx;
        
        // 保存当前状态
        ctx.save();
        
        // 设置混合模式
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.3;
        
        // 绘制发光层（这里简化处理，实际应该使用多pass渲染）
        // 在实际WebGL实现中，这里会进行亮度提取、模糊、混合等操作
        
        ctx.restore();
    }
    
    /**
     * 添加屏幕震动效果
     */
    addScreenShake(intensity, duration) {
        this.effects.push({
            type: 'screenshake',
            intensity: intensity,
            duration: duration,
            age: 0
        });
    }
    
    /**
     * 添加模糊效果
     */
    addBlur(amount, duration) {
        this.effects.push({
            type: 'blur',
            amount: amount,
            duration: duration,
            age: 0
        });
    }
    
    /**
     * 更新后处理效果
     */
    update(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.age += deltaTime;
            return effect.age < effect.duration;
        });
    }
    
    /**
     * 应用所有后处理效果
     */
    apply() {
        const ctx = this.renderer.ctx;
        
        // 应用屏幕震动
        const shakeEffect = this.effects.find(e => e.type === 'screenshake');
        if (shakeEffect) {
            const progress = shakeEffect.age / shakeEffect.duration;
            const currentIntensity = shakeEffect.intensity * (1 - progress);
            
            const offsetX = (Math.random() - 0.5) * currentIntensity;
            const offsetY = (Math.random() - 0.5) * currentIntensity;
            
            ctx.translate(offsetX, offsetY);
        }
    }
}