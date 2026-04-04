/**
 * CyberStrike 2077 - 行为树系统
 * AI决策系统
 */

class BehaviorTree {
    constructor(config) {
        this.root = this.parseNode(config);
    }
    
    /**
     * 解析节点配置
     */
    parseNode(config) {
        if (config.selector) {
            return new SelectorNode(config.selector.map(child => this.parseNode(child)));
        }
        
        if (config.sequence) {
            return new SequenceNode(config.sequence.map(child => this.parseNode(child)));
        }
        
        if (config.condition) {
            return new ConditionNode(config.condition);
        }
        
        if (config.action) {
            return new ActionNode(config.action);
        }
        
        return null;
    }
    
    /**
     * 执行行为树
     */
    execute(context) {
        if (this.root) {
            return this.root.execute(context);
        }
        return NodeStatus.FAILURE;
    }
}

/**
 * 节点状态
 */
const NodeStatus = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    RUNNING: 'running'
};

/**
 * 基础节点
 */
class BTNode {
    execute(context) {
        return NodeStatus.FAILURE;
    }
}

/**
 * 选择器节点（OR逻辑）
 * 依次执行子节点，直到有一个成功
 */
class SelectorNode extends BTNode {
    constructor(children) {
        super();
        this.children = children;
        this.currentIndex = 0;
    }
    
    execute(context) {
        for (let i = this.currentIndex; i < this.children.length; i++) {
            const status = this.children[i].execute(context);
            
            if (status === NodeStatus.SUCCESS) {
                this.currentIndex = 0;
                return NodeStatus.SUCCESS;
            }
            
            if (status === NodeStatus.RUNNING) {
                this.currentIndex = i;
                return NodeStatus.RUNNING;
            }
        }
        
        this.currentIndex = 0;
        return NodeStatus.FAILURE;
    }
}

/**
 * 序列节点（AND逻辑）
 * 依次执行子节点，直到有一个失败
 */
class SequenceNode extends BTNode {
    constructor(children) {
        super();
        this.children = children;
        this.currentIndex = 0;
    }
    
    execute(context) {
        for (let i = this.currentIndex; i < this.children.length; i++) {
            const status = this.children[i].execute(context);
            
            if (status === NodeStatus.FAILURE) {
                this.currentIndex = 0;
                return NodeStatus.FAILURE;
            }
            
            if (status === NodeStatus.RUNNING) {
                this.currentIndex = i;
                return NodeStatus.RUNNING;
            }
        }
        
        this.currentIndex = 0;
        return NodeStatus.SUCCESS;
    }
}

/**
 * 条件节点
 */
class ConditionNode extends BTNode {
    constructor(condition) {
        super();
        this.condition = condition;
    }
    
    execute(context) {
        try {
            const result = this.condition(context);
            return result ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
        } catch (e) {
            console.error('Condition evaluation error:', e);
            return NodeStatus.FAILURE;
        }
    }
}

/**
 * 动作节点
 */
class ActionNode extends BTNode {
    constructor(action) {
        super();
        this.action = action;
    }
    
    execute(context) {
        try {
            const result = this.action(context);
            
            // 如果动作返回布尔值
            if (typeof result === 'boolean') {
                return result ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
            }
            
            // 如果动作返回状态字符串
            if (typeof result === 'string') {
                return result;
            }
            
            return NodeStatus.SUCCESS;
        } catch (e) {
            console.error('Action execution error:', e);
            return NodeStatus.FAILURE;
        }
    }
}

/**
 * 装饰器节点 - 反转器
 */
class InverterNode extends BTNode {
    constructor(child) {
        super();
        this.child = child;
    }
    
    execute(context) {
        const status = this.child.execute(context);
        
        if (status === NodeStatus.SUCCESS) {
            return NodeStatus.FAILURE;
        }
        if (status === NodeStatus.FAILURE) {
            return NodeStatus.SUCCESS;
        }
        
        return status;
    }
}

/**
 * 装饰器节点 - 重复器
 */
class RepeaterNode extends BTNode {
    constructor(child, count = -1) {
        super();
        this.child = child;
        this.count = count;
        this.currentCount = 0;
    }
    
    execute(context) {
        while (this.count < 0 || this.currentCount < this.count) {
            const status = this.child.execute(context);
            
            if (status === NodeStatus.RUNNING) {
                return NodeStatus.RUNNING;
            }
            
            this.currentCount++;
            
            if (this.count > 0 && this.currentCount >= this.count) {
                this.currentCount = 0;
                return NodeStatus.SUCCESS;
            }
        }
        
        return NodeStatus.SUCCESS;
    }
}

/**
 * 装饰器节点 - 直到失败
 */
class UntilFailNode extends BTNode {
    constructor(child) {
        super();
        this.child = child;
    }
    
    execute(context) {
        while (true) {
            const status = this.child.execute(context);
            
            if (status === NodeStatus.FAILURE) {
                return NodeStatus.SUCCESS;
            }
            
            if (status === NodeStatus.RUNNING) {
                return NodeStatus.RUNNING;
            }
        }
    }
}