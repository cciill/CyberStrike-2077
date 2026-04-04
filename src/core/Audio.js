/**
 * CyberStrike 2077 - 音频管理器
 * 处理游戏音效和音乐
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.sounds = new Map();
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.isMuted = false;
        
        // 初始化音频上下文
        this.init();
    }
    
    /**
     * 初始化音频系统
     */
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    /**
     * 播放音效
     */
    play(soundName) {
        if (this.isMuted || !this.context) return;
        
        // 根据音效名称生成对应的合成音效
        switch (soundName) {
            case 'shoot_default':
            case 'ar_shoot':
                this.playShootSound(800, 0.1);
                break;
            case 'shotgun_shoot':
                this.playShootSound(400, 0.2);
                break;
            case 'sniper_shoot':
                this.playShootSound(1200, 0.3);
                break;
            case 'pistol_shoot':
                this.playShootSound(600, 0.1);
                break;
            case 'rocket_shoot':
                this.playRocketSound();
                break;
            case 'enemy_shoot':
                this.playShootSound(500, 0.1, 0.5);
                break;
            case 'reload_default':
            case 'ar_reload':
                this.playReloadSound();
                break;
            case 'explosion':
                this.playExplosionSound();
                break;
            case 'enemy_death':
                this.playEnemyDeathSound();
                break;
            case 'player_hit':
                this.playPlayerHitSound();
                break;
            case 'player_death':
                this.playPlayerDeathSound();
                break;
            case 'jump':
                this.playJumpSound();
                break;
            case 'footstep':
                this.playFootstepSound();
                break;
            default:
                // 默认音效
                this.playTone(440, 0.1, 0.1);
        }
    }
    
    /**
     * 播放射击音效
     */
    playShootSound(frequency, duration, volume = 1) {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, this.context.currentTime + duration);
        
        gain.gain.setValueAtTime(0.3 * volume * this.sfxVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + duration);
    }
    
    /**
     * 播放火箭发射音效
     */
    playRocketSound() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.context.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.5 * this.sfxVolume, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.5);
    }
    
    /**
     * 播放装填音效
     */
    playReloadSound() {
        if (!this.context) return;
        
        // 模拟装填的机械声音
        const times = [0, 0.1, 0.2, 0.4];
        
        times.forEach((time, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(200 + i * 100, this.context.currentTime + time);
            
            gain.gain.setValueAtTime(0.1 * this.sfxVolume, this.context.currentTime + time);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + time + 0.1);
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.start(this.context.currentTime + time);
            osc.stop(this.context.currentTime + time + 0.1);
        });
    }
    
    /**
     * 播放爆炸音效
     */
    playExplosionSound() {
        if (!this.context) return;
        
        // 使用噪声缓冲创建爆炸声
        const bufferSize = this.context.sampleRate * 0.5;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        
        const noise = this.context.createBufferSource();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.5 * this.sfxVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        noise.start(this.context.currentTime);
    }
    
    /**
     * 播放敌人死亡音效
     */
    playEnemyDeathSound() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.3);
    }
    
    /**
     * 播放玩家受伤音效
     */
    playPlayerHitSound() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.context.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.4 * this.sfxVolume, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.2);
    }
    
    /**
     * 播放玩家死亡音效
     */
    playPlayerDeathSound() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.context.currentTime + 1);
        
        gain.gain.setValueAtTime(0.5 * this.sfxVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 1);
    }
    
    /**
     * 播放跳跃音效
     */
    playJumpSound() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(300, this.context.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.2);
    }
    
    /**
     * 播放脚步声
     */
    playFootstepSound() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.context.currentTime);
        
        gain.gain.setValueAtTime(0.1 * this.sfxVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.1);
    }
    
    /**
     * 播放基础音调
     */
    playTone(frequency, duration, volume = 0.5) {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, this.context.currentTime);
        
        gain.gain.setValueAtTime(volume * this.sfxVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + duration);
    }
    
    /**
     * 设置音量
     */
    setVolume(type, value) {
        if (type === 'music') {
            this.musicVolume = Math.max(0, Math.min(1, value));
        } else if (type === 'sfx') {
            this.sfxVolume = Math.max(0, Math.min(1, value));
        }
    }
    
    /**
     * 静音切换
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}