/**
 * CyberStrike 2077 - HUD 控制器
 * 管理游戏界面显示
 */

class HUD {
    constructor() {
        this.elements = {
            healthFill: document.getElementById('healthFill'),
            armorFill: document.getElementById('armorFill'),
            ammoCurrent: document.getElementById('ammoCurrent'),
            ammoReserve: document.getElementById('ammoReserve'),
            weaponName: document.getElementById('weaponName'),
            scoreKills: document.getElementById('scoreKills'),
            scoreValue: document.getElementById('scoreValue'),
            waveNumber: document.getElementById('waveNumber'),
            killFeed: document.getElementById('killFeed'),
            gameMessages: document.getElementById('gameMessages'),
            hitMarker: document.getElementById('hitMarker'),
            damageIndicator: document.getElementById('damageIndicator'),
            minimapDirection: document.getElementById('minimapDirection')
        };
        
        this.weaponSlots = document.querySelectorAll('.weapon-slot');
        
        // 伤害数字队列
        this.damageNumbers = [];
        
        // 消息队列
        this.messageQueue = [];
        
        // 击杀提示队列
        this.killFeedQueue = [];
    }
    
    /**
     * 更新HUD
     */
    update(deltaTime) {
        // 更新伤害数字
        this.updateDamageNumbers(deltaTime);
        
        // 更新小地图方向
        this.updateMinimap();
    }
    
    /**
     * 更新生命值显示
     */
    updateHealth(current, max) {
        const percentage = (current / max) * 100;
        this.elements.healthFill.style.width = `${percentage}%`;
        
        // 低血量警告
        if (percentage < 25) {
            this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff3333)';
            this.elements.healthFill.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
        } else {
            this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff3333, #ff6666)';
            this.elements.healthFill.style.boxShadow = '0 0 10px rgba(255, 51, 51, 0.5)';
        }
    }
    
    /**
     * 更新护甲显示
     */
    updateArmor(current, max) {
        const percentage = (current / max) * 100;
        this.elements.armorFill.style.width = `${percentage}%`;
    }
    
    /**
     * 更新弹药显示
     */
    updateAmmo(current, reserve) {
        this.elements.ammoCurrent.textContent = current;
        this.elements.ammoReserve.textContent = reserve === Infinity ? '∞' : reserve;
        
        // 低弹药警告
        if (current === 0) {
            this.elements.ammoCurrent.style.color = '#ff3333';
        } else if (current <= 5) {
            this.elements.ammoCurrent.style.color = '#ffaa00';
        } else {
            this.elements.ammoCurrent.style.color = '#00f0ff';
        }
    }
    
    /**
     * 更新武器显示
     */
    updateWeapon(weapon) {
        this.elements.weaponName.textContent = weapon.name;
        this.updateAmmo(weapon.currentAmmo, weapon.reserveAmmo);
        
        // 更新武器槽高亮
        this.weaponSlots.forEach((slot, index) => {
            slot.classList.toggle('active', index === window.gameEngine.player.currentWeaponIndex);
        });
    }
    
    /**
     * 更新击杀数
     */
    updateKills(kills) {
        this.elements.scoreKills.textContent = kills;
    }
    
    /**
     * 更新分数
     */
    updateScore(score) {
        this.elements.scoreValue.textContent = score;
    }
    
    /**
     * 更新波次
     */
    updateWave(wave) {
        this.elements.waveNumber.textContent = wave;
    }
    
    /**
     * 显示击杀提示
     */
    showKillFeed(killer, victim) {
        const entry = document.createElement('div');
        entry.className = 'kill-entry';
        entry.innerHTML = `<span class="killer">${killer}</span> ⚔️ <span class="victim">${victim}</span>`;
        
        this.elements.killFeed.appendChild(entry);
        
        // 3秒后移除
        setTimeout(() => {
            entry.remove();
        }, 3000);
        
        // 限制显示数量
        while (this.elements.killFeed.children.length > 5) {
            this.elements.killFeed.firstChild.remove();
        }
    }
    
    /**
     * 显示命中标记
     */
    showHitMarker() {
        this.elements.hitMarker.classList.add('active');
        
        setTimeout(() => {
            this.elements.hitMarker.classList.remove('active');
        }, 100);
    }
    
    /**
     * 显示伤害指示器
     */
    showDamageIndicator(attacker) {
        if (!attacker) return;
        
        this.elements.damageIndicator.classList.add('active');
        
        // 计算伤害来源方向
        const player = window.gameEngine.player;
        const dx = attacker.position.x - player.position.x;
        const dz = attacker.position.z - player.position.z;
        const angle = Math.atan2(dx, dz) - player.rotation.y;
        
        // 设置指示器旋转
        const degrees = angle * (180 / Math.PI);
        this.elements.damageIndicator.style.transform = `rotate(${degrees}deg)`;
        
        setTimeout(() => {
            this.elements.damageIndicator.classList.remove('active');
        }, 200);
    }
    
    /**
     * 显示伤害数字
     */
    showDamageNumber(damage, position) {
        const element = document.createElement('div');
        element.textContent = damage;
        element.style.cssText = `
            position: absolute;
            color: #ff3333;
            font-family: 'Orbitron', sans-serif;
            font-size: 1.5rem;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(255, 51, 51, 0.8);
            pointer-events: none;
            z-index: 100;
        `;
        
        // 转换为屏幕坐标
        const screenPos = window.gameEngine.renderer.worldToScreen(position);
        if (screenPos) {
            element.style.left = `${screenPos.x}px`;
            element.style.top = `${screenPos.y}px`;
            
            document.body.appendChild(element);
            
            // 动画
            let opacity = 1;
            let yOffset = 0;
            
            const animate = () => {
                opacity -= 0.02;
                yOffset -= 1;
                
                element.style.opacity = opacity;
                element.style.transform = `translateY(${yOffset}px)`;
                
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    element.remove();
                }
            };
            
            requestAnimationFrame(animate);
        }
    }
    
    /**
     * 显示游戏消息
     */
    showMessage(text, duration = 2000) {
        const message = document.createElement('div');
        message.className = 'message';
        message.textContent = text;
        
        this.elements.gameMessages.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, duration);
    }
    
    /**
     * 更新小地图
     */
    updateMinimap() {
        if (!window.gameEngine || !window.gameEngine.player) return;
        
        const rotation = window.gameEngine.player.rotation.y;
        const degrees = -rotation * (180 / Math.PI);
        
        this.elements.minimapDirection.style.transform = `translate(-50%, -100%) rotate(${degrees}deg)`;
    }
    
    /**
     * 更新伤害数字
     */
    updateDamageNumbers(deltaTime) {
        // 伤害数字的更新在各自的动画中处理
    }
}