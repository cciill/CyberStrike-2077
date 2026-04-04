/**
 * CyberStrike 2077 - 数学工具
 * 各种数学辅助函数
 */

const MathUtils = {
    /**
     * 线性插值
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    /**
     * 平滑插值
     */
    smoothStep(a, b, t) {
        t = t * t * (3 - 2 * t);
        return a + (b - a) * t;
    },
    
    /**
     * 限制值在范围内
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * 角度转弧度
     */
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },
    
    /**
     * 弧度转角度
     */
    radToDeg(radians) {
        return radians * (180 / Math.PI);
    },
    
    /**
     * 规范化角度到 -PI 到 PI
     */
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    },
    
    /**
     * 计算两点距离
     */
    distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    
    /**
     * 计算两点距离（2D）
     */
    distance2D(a, b) {
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dz * dz);
    },
    
    /**
     * 向量归一化
     */
    normalize(v) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        if (length === 0) return { x: 0, y: 0, z: 0 };
        
        return {
            x: v.x / length,
            y: v.y / length,
            z: v.z / length
        };
    },
    
    /**
     * 向量点积
     */
    dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    },
    
    /**
     * 向量叉积
     */
    cross(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    },
    
    /**
     * 向量加法
     */
    add(a, b) {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z
        };
    },
    
    /**
     * 向量减法
     */
    subtract(a, b) {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z
        };
    },
    
    /**
     * 向量数乘
     */
    multiply(v, scalar) {
        return {
            x: v.x * scalar,
            y: v.y * scalar,
            z: v.z * scalar
        };
    },
    
    /**
     * 随机范围
     */
    randomRange(min, max) {
        return min + Math.random() * (max - min);
    },
    
    /**
     * 随机整数
     */
    randomInt(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    },
    
    /**
     * 随机选择
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    /**
     * 加权随机选择
     */
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    },
    
    /**
     * 噪声函数（简单值噪声）
     */
    noise(x, z) {
        const X = Math.floor(x);
        const Z = Math.floor(z);
        
        const xf = x - X;
        const zf = z - Z;
        
        const u = xf * xf * (3 - 2 * xf);
        const v = zf * zf * (3 - 2 * zf);
        
        const n00 = this.random(X, Z);
        const n01 = this.random(X, Z + 1);
        const n10 = this.random(X + 1, Z);
        const n11 = this.random(X + 1, Z + 1);
        
        const x0 = this.lerp(n00, n10, u);
        const x1 = this.lerp(n01, n11, u);
        
        return this.lerp(x0, x1, v);
    },
    
    /**
     * 伪随机数生成
     */
    random(x, z) {
        const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
        return n - Math.floor(n);
    },
    
    /**
     * 贝塞尔曲线
     */
    bezier(t, p0, p1, p2, p3) {
        const oneMinusT = 1 - t;
        
        return {
            x: oneMinusT * oneMinusT * oneMinusT * p0.x +
               3 * oneMinusT * oneMinusT * t * p1.x +
               3 * oneMinusT * t * t * p2.x +
               t * t * t * p3.x,
            y: oneMinusT * oneMinusT * oneMinusT * p0.y +
               3 * oneMinusT * oneMinusT * t * p1.y +
               3 * oneMinusT * t * t * p2.y +
               t * t * t * p3.y,
            z: oneMinusT * oneMinusT * oneMinusT * p0.z +
               3 * oneMinusT * oneMinusT * t * p1.z +
               3 * oneMinusT * t * t * p2.z +
               t * t * t * p3.z
        };
    },
    
    /**
     * 球形插值
     */
    slerp(a, b, t) {
        const dot = this.dot(a, b);
        
        if (dot > 0.9995) {
            const result = this.add(a, this.multiply(this.subtract(b, a), t));
            return this.normalize(result);
        }
        
        const theta0 = Math.acos(dot);
        const theta = theta0 * t;
        
        const sinTheta = Math.sin(theta);
        const sinTheta0 = Math.sin(theta0);
        
        const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
        const s1 = sinTheta / sinTheta0;
        
        return this.add(this.multiply(a, s0), this.multiply(b, s1));
    }
};