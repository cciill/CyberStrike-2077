#!/bin/bash

# CyberStrike 2077 - GitHub 仓库初始化脚本
# 使用方法: ./init-repo.sh

echo "🎮 CyberStrike 2077 - GitHub Repository Setup"
echo "=============================================="
echo ""

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# 检查是否在项目目录中
if [ ! -f "index.html" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

echo "✅ Git is installed"
echo ""

# 提示输入 GitHub 用户名
echo "请输入您的 GitHub 用户名:"
read username

# 提示输入仓库名称
echo "请输入仓库名称 (默认: CyberStrike-2077):"
read repo_name
repo_name=${repo_name:-CyberStrike-2077}

echo ""
echo "设置信息:"
echo "  GitHub 用户名: $username"
echo "  仓库名称: $repo_name"
echo "  仓库 URL: https://github.com/$username/$repo_name"
echo ""

# 确认
echo "是否继续? (y/n)"
read confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "🚀 初始化 Git 仓库..."

# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 创建初始提交
git commit -m "🎮 Initial commit: CyberStrike 2077 v0.1.0

- Complete FPS game engine
- 5 weapon types
- 4 enemy types with AI
- Survival and Campaign modes
- Cyberpunk visual style
- Particle effects system
- Audio system with procedural sound generation
- Full HUD and UI system"

# 添加远程仓库
git remote add origin "https://github.com/$username/$repo_name.git"

echo ""
echo "✅ 本地仓库已初始化!"
echo ""
echo "下一步操作:"
echo ""
echo "1. 在 GitHub 上创建仓库:"
echo "   https://github.com/new"
echo "   仓库名称: $repo_name"
echo "   选择 'Public' 或 'Private'"
echo "   不要初始化 README (我们已经有了)"
echo ""
echo "2. 推送代码到 GitHub:"
echo "   git push -u origin main"
echo "   或"
echo "   git push -u origin master"
echo ""
echo "3. 启用 GitHub Pages:"
echo "   访问: https://github.com/$username/$repo_name/settings/pages"
echo "   Source: Deploy from a branch"
echo "   Branch: main / (root)"
echo "   点击 Save"
echo ""
echo "4. 几分钟后，游戏将在以下地址可用:"
echo "   https://$username.github.io/$repo_name"
echo ""
echo "🎮 祝您游戏开发愉快!"