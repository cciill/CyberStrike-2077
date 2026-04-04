/**
 * CyberStrike 2077 - 物理系统
 * 简单的物理模拟
 */

class Physics {
    constructor() {
        this.gravity = -9.8;
        this.rigidBodies = [];
    }
    
    /**
     * 添加刚体
     */
    addRigidBody(body) {
        this.rigidBodies.push(body);
    }
    
    /**
     * 移除刚体
     */
    removeRigidBody(body) {
        const index = this.rigidBodies.indexOf(body);
        if (index > -1) {
            this.rigidBodies.splice(index, 1);
        }
    }
    
    /**
     * 更新物理
     */
    update(deltaTime) {
        // 这里可以实现更复杂的物理模拟
        // 目前使用简化的物理，主要由各个实体自己处理
    }
    
    /**
     * 射线检测
     */
    raycast(origin, direction, maxDistance, layers = 'all') {
        // 简化的射线检测
        const hits = [];
        
        // 检查与墙壁的碰撞
        if (window.gameEngine && window.gameEngine.currentLevel) {
            const level = window.gameEngine.currentLevel;
            
            for (const wall of level.walls) {
                const hit = this.rayBoxIntersection(origin, direction, wall);
                if (hit && hit.distance <= maxDistance) {
                    hits.push(hit);
                }
            }
        }
        
        // 按距离排序
        hits.sort((a, b) => a.distance - b.distance);
        
        return hits.length > 0 ? hits[0] : null;
    }
    
    /**
     * 射线与AABB相交检测
     */
    rayBoxIntersection(rayOrigin, rayDir, box) {
        const boxMin = {
            x: box.x - box.width / 2,
            y: 0,
            z: box.z - box.depth / 2
        };
        
        const boxMax = {
            x: box.x + box.width / 2,
            y: box.height,
            z: box.z + box.depth / 2
        };
        
        let tMin = -Infinity;
        let tMax = Infinity;
        
        // X轴
        if (Math.abs(rayDir.x) < 0.0001) {
            if (rayOrigin.x < boxMin.x || rayOrigin.x > boxMax.x) {
                return null;
            }
        } else {
            const tx1 = (boxMin.x - rayOrigin.x) / rayDir.x;
            const tx2 = (boxMax.x - rayOrigin.x) / rayDir.x;
            
            tMin = Math.max(tMin, Math.min(tx1, tx2));
            tMax = Math.min(tMax, Math.max(tx1, tx2));
        }
        
        // Y轴
        if (Math.abs(rayDir.y) < 0.0001) {
            if (rayOrigin.y < boxMin.y || rayOrigin.y > boxMax.y) {
                return null;
            }
        } else {
            const ty1 = (boxMin.y - rayOrigin.y) / rayDir.y;
            const ty2 = (boxMax.y - rayOrigin.y) / rayDir.y;
            
            tMin = Math.max(tMin, Math.min(ty1, ty2));
            tMax = Math.min(tMax, Math.max(ty1, ty2));
        }
        
        // Z轴
        if (Math.abs(rayDir.z) < 0.0001) {
            if (rayOrigin.z < boxMin.z || rayOrigin.z > boxMax.z) {
                return null;
            }
        } else {
            const tz1 = (boxMin.z - rayOrigin.z) / rayDir.z;
            const tz2 = (boxMax.z - rayOrigin.z) / rayDir.z;
            
            tMin = Math.max(tMin, Math.min(tz1, tz2));
            tMax = Math.min(tMax, Math.max(tz1, tz2));
        }
        
        if (tMax < 0 || tMin > tMax) {
            return null;
        }
        
        const distance = tMin < 0 ? tMax : tMin;
        
        return {
            distance: distance,
            point: {
                x: rayOrigin.x + rayDir.x * distance,
                y: rayOrigin.y + rayDir.y * distance,
                z: rayOrigin.z + rayDir.z * distance
            }
        };
    }
    
    /**
     * 球体与AABB碰撞检测
     */
    sphereBoxCollision(spherePos, sphereRadius, box) {
        const boxMin = {
            x: box.x - box.width / 2,
            y: 0,
            z: box.z - box.depth / 2
        };
        
        const boxMax = {
            x: box.x + box.width / 2,
            y: box.height,
            z: box.z + box.depth / 2
        };
        
        // 找到球心到盒子的最近点
        const closestPoint = {
            x: Math.max(boxMin.x, Math.min(spherePos.x, boxMax.x)),
            y: Math.max(boxMin.y, Math.min(spherePos.y, boxMax.y)),
            z: Math.max(boxMin.z, Math.min(spherePos.z, boxMax.z))
        };
        
        // 计算距离
        const dx = spherePos.x - closestPoint.x;
        const dy = spherePos.y - closestPoint.y;
        const dz = spherePos.z - closestPoint.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        return distance < sphereRadius;
    }
}