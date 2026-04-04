/**
 * CyberStrike 2077 - 输入处理器
 * 处理键盘、鼠标输入
 */

class InputHandler {
    constructor() {
        // 键盘状态
        this.keys = {};
        this.keysPressed = {}; // 只触发一次的按键
        
        // 鼠标状态
        this.mouseButtons = [false, false, false];
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.mouseWheel = 0;
        
        // 锁定状态
        this.isPointerLocked = false;
        
        // 初始化事件监听
        this.initEventListeners();
    }
    
    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // 鼠标事件
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('wheel', (e) => this.onMouseWheel(e));
        
        // 指针锁定事件
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('mozpointerlockchange', () => this.onPointerLockChange());
    }
    
    /**
     * 键盘按下
     */
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // 特殊处理
        if (event.code === 'Escape') {
            if (window.gameEngine && window.gameEngine.isRunning) {
                if (window.gameEngine.isPaused) {
                    window.gameEngine.resume();
                } else {
                    window.gameEngine.pause();
                }
            }
        }
        
        // 阻止默认行为（除了F5刷新等）
        if (!['F5', 'F12', 'F11'].includes(event.code)) {
            event.preventDefault();
        }
    }
    
    /**
     * 键盘释放
     */
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    /**
     * 鼠标按下
     */
    onMouseDown(event) {
        this.mouseButtons[event.button] = true;
        
        // 请求指针锁定
        if (!this.isPointerLocked && window.gameEngine && window.gameEngine.isRunning) {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
                canvas.requestPointerLock();
            }
        }
    }
    
    /**
     * 鼠标释放
     */
    onMouseUp(event) {
        this.mouseButtons[event.button] = false;
    }
    
    /**
     * 鼠标移动
     */
    onMouseMove(event) {
        if (this.isPointerLocked) {
            this.mouseDeltaX = event.movementX || event.mozMovementX || 0;
            this.mouseDeltaY = event.movementY || event.mozMovementY || 0;
        } else {
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        }
    }
    
    /**
     * 鼠标滚轮
     */
    onMouseWheel(event) {
        this.mouseWheel = event.deltaY > 0 ? 1 : -1;
        event.preventDefault();
    }
    
    /**
     * 指针锁定状态改变
     */
    onPointerLockChange() {
        const canvas = document.getElementById('gameCanvas');
        this.isPointerLocked = document.pointerLockElement === canvas || 
                               document.mozPointerLockElement === canvas;
        
        if (!this.isPointerLocked && window.gameEngine && 
            window.gameEngine.isRunning && !window.gameEngine.isPaused) {
            window.gameEngine.pause();
        }
    }
    
    /**
     * 更新（每帧调用，重置一次性状态）
     */
    update() {
        // 重置鼠标增量
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.mouseWheel = 0;
        
        // 重置一次性按键
        this.keysPressed = {};
    }
    
    /**
     * 检查按键是否按下
     */
    isKeyDown(code) {
        return !!this.keys[code];
    }
    
    /**
     * 检查按键是否刚按下（只触发一次）
     */
    isKeyPressed(code) {
        if (this.keys[code] && !this.keysPressed[code]) {
            this.keysPressed[code] = true;
            return true;
        }
        return false;
    }
    
    /**
     * 检查鼠标按钮是否按下
     */
    isMouseButtonDown(button) {
        return this.mouseButtons[button];
    }
}