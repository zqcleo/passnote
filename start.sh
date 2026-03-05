#!/bin/bash

echo "🚀 密码备忘录 - 开发环境启动"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
fi

echo ""
echo "🎯 启动开发服务器..."
echo ""
echo "提示："
echo "  - 在手机上安装 Expo Go 应用"
echo "  - 扫描二维码即可预览"
echo "  - 按 a 键在 Android 模拟器中打开"
echo "  - 按 r 键重新加载应用"
echo "  - 按 q 键退出"
echo ""

npm start
