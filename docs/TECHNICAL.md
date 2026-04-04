# CyberStrike 2077 技术文档

## 项目结构

```
CyberStrike-2077/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自动部署
├── src/
│   ├── core/                   # 核心引擎
│   │   ├── GameEngine.js       # 游戏主引擎
│   │   ├── Renderer.js         # 渲染器
│   │   ├── Physics.js          # 物理系统
│   │   └── Audio.js            # 音频管理器
│   ├── entities/               # 游戏实体
│   │   ├── Player.js           # 玩家控制器
│   │   ├── Enemy.js            # 敌人AI
│   │   └── Projectile.js       # 投射物
│   ├── weapons/                # 武器系统
│   │   └── WeaponBase.js       # 武器基类和具体实现
│   ├── ai/                     # AI系统
│   │   └── BehaviorTree.js     # 行为树
│   ├── levels/                 # 关卡系统
│   │   └── LevelManager.js     # 关卡管理器
│   ├── effects/                # 特效系统
│   │   └── Particles.js        # 粒子系统
│   ├── ui/                     # 用户界面
│   │   └── HUD.js              # HUD控制器
│   ├── utils/                  # 工具函数
│   │   ├── InputHandler.js     # 输入处理
│   │   └── MathUtils.js        # 数学工具
│   └── main.js                 # 主入口
├── index.html                  # 主页面
├── README.md                   # 项目说明
├── LICENSE                     # MIT许可证
├── CONTRIBUTING.md             # 贡献指南
└── CHANGELOG.md                # 更新日志
```

## 核心系统说明

### 游戏引擎 (GameEngine)

游戏引擎是整个游戏的核心，负责：
- 游戏循环管理
- 实体管理
- 场景管理
- 游戏状态控制

主要方法：
- `start()` - 开始游戏
- `pause()` - 暂停游戏
- `update(deltaTime)` - 更新游戏逻辑
- `render()` - 渲染画面

### 渲染器 (Renderer)

渲染器负责所有图形渲染：
- 3D透视投影
- 视锥剔除
- 光照计算
- 后处理效果

### 玩家控制器 (Player)

玩家控制器处理：
- 移动（WASD）
- 视角控制（鼠标）
- 武器操作
- 物理交互

### 敌人AI (Enemy)

敌人AI使用行为树系统，具有以下行为：
- 巡逻（Patrol）
- 追击（Chase）
- 攻击（Attack）
- 调查（Investigate）

### 武器系统

武器基类定义了通用属性：
- 伤害
- 射速
- 精准度
- 后坐力
- 装填时间

具体武器：
- 突击步枪 - 平衡型
- 霰弹枪 - 近距离高伤害
- 狙击步枪 - 远程高精度
- 火箭筒 - 范围伤害
- 手枪 - 无限弹药副武器

## 技术特点

### 3D渲染

使用Canvas 2D API实现伪3D渲染：
- 透视投影
- 深度排序
- 视锥剔除

### 物理系统

简化的物理模拟：
- 重力
- 碰撞检测
- 射线投射

### 音频系统

使用Web Audio API：
- 程序生成音效
- 音量控制
- 静音切换

## 性能优化

- 视锥剔除减少渲染对象
- 对象池减少GC
- Delta time保证流畅性

## 扩展指南

### 添加新武器

1. 继承 `WeaponBase` 类
2. 在 `Player.initWeapons()` 中添加

### 添加新敌人类型

1. 在 `Enemy.setupType()` 中添加类型配置
2. 在 `GameEngine.getRandomEnemyType()` 中添加生成权重

### 添加新关卡

1. 在 `LevelManager.registerLevels()` 中注册关卡
2. 实现关卡几何体和出生点

## API参考

### 全局对象

- `window.gameEngine` - 游戏引擎实例
- `MathUtils` - 数学工具函数

### 事件

游戏引擎触发的事件：
- `enemyKilled` - 敌人被击杀
- `playerDamaged` - 玩家受伤
- `weaponSwitched` - 武器切换

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

需要支持：
- ES6+
- Canvas API
- Web Audio API
- Pointer Lock API

## 性能建议

- 使用现代浏览器获得最佳性能
- 关闭其他标签页释放内存
- 降低分辨率可提高帧率