# CyberStrike 2077 - 赛博突击2077

🎮 一个基于 Web 技术的大型开源第一人称射击游戏

## 🌟 游戏特色

### 核心玩法
- **经典 FPS 体验**：流畅的第一人称射击，精准的枪械手感
- **多种游戏模式**：
  - 战役模式：沉浸式单人剧情
  - 生存模式：无尽波次敌人挑战
  - 多人对战：支持局域网 PvP（WebSocket）
- **丰富的武器系统**：突击步枪、狙击枪、霰弹枪、火箭筒等 15+ 种武器
- **智能敌人 AI**：具有巡逻、追击、掩体、包抄等战术行为

### 技术亮点
- **现代 Web 图形**：WebGL 2.0 渲染，支持动态光照、阴影、粒子效果
- **物理引擎**：基于 Cannon.js 的完整物理系统
- **空间音效**：3D 定位音效，沉浸式战场体验
- **模块化架构**：清晰的代码结构，易于扩展

### 视觉效果
- 赛博朋克美术风格
- 动态天气系统
- 实时全局光照
- 后处理特效（Bloom、SSAO、运动模糊）

## 🚀 快速开始

### 在线试玩
访问：https://yourusername.github.io/CyberStrike-2077

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/yourusername/CyberStrike-2077.git
cd CyberStrike-2077

# 启动本地服务器
# Python 3
python -m http.server 8080

# 或 Node.js
npx serve .

# 然后访问 http://localhost:8080
```

## 🎮 操作指南

| 按键 | 功能 |
|------|------|
| W/A/S/D | 移动 |
| 鼠标 | 瞄准 |
| 左键 | 射击 |
| 右键 | 瞄准镜 |
| R | 换弹 |
| 1-5 | 切换武器 |
| Shift | 冲刺 |
| Space | 跳跃 |
| Ctrl | 蹲下 |
| E | 互动/拾取 |
| Tab | 查看地图 |
| Esc | 暂停菜单 |

## 🏗️ 项目结构

```
CyberStrike-2077/
├── src/
│   ├── core/           # 游戏引擎核心
│   │   ├── GameEngine.js
│   │   ├── Renderer.js
│   │   ├── Physics.js
│   │   └── Audio.js
│   ├── entities/       # 游戏实体
│   │   ├── Player.js
│   │   ├── Enemy.js
│   │   ├── Weapon.js
│   │   └── Projectile.js
│   ├── ai/             # AI 系统
│   │   ├── BehaviorTree.js
│   │   └── Pathfinding.js
│   ├── weapons/        # 武器系统
│   │   ├── WeaponBase.js
│   │   └── weapons/
│   ├── levels/         # 关卡系统
│   │   ├── LevelManager.js
│   │   └── maps/
│   ├── ui/             # 用户界面
│   │   ├── HUD.js
│   │   ├── Menu.js
│   │   └── components/
│   ├── effects/        # 特效系统
│   │   ├── Particles.js
│   │   └── PostProcessing.js
│   ├── network/        # 网络对战
│   │   └── Multiplayer.js
│   └── utils/          # 工具函数
├── assets/             # 游戏资源
│   ├── models/
│   ├── textures/
│   ├── audio/
│   └── fonts/
├── shaders/            # GLSL 着色器
├── docs/               # 文档
├── tests/              # 测试
└── index.html
```

## 🛠️ 技术栈

- **核心引擎**：原生 JavaScript + WebGL 2.0
- **物理引擎**：Cannon-es
- **音频**：Web Audio API + Howler.js
- **网络**：WebSocket + Socket.io
- **构建工具**：Vite（可选）

## 📝 开发计划

- [x] 核心引擎架构
- [x] 基础 FPS 控制器
- [x] 武器系统
- [x] 敌人 AI
- [x] 物理系统
- [ ] 多人对战（开发中）
- [ ] 战役剧情
- [ ] 更多武器和地图
- [ ] 成就系统

## 🤝 贡献指南

欢迎提交 Issue 和 PR！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- 感谢所有贡献者和测试玩家
- 特别感谢开源社区的支持

---

**Made with 💜 by the CyberStrike Team**