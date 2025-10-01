#!/bin/bash

# 答题抽签互动网站 - 快速启动脚本

echo "🚀 启动答题抽签互动网站..."

# 检查 Node.js 版本
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 请先安装 Node.js (版本 >= 16.0.0)"
    exit 1
fi

echo "✅ Node.js 版本: $node_version"

# 检查 MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  未检测到 MongoDB，请确保 MongoDB 已安装并运行"
    echo "   可以使用 Docker: docker run -d --name mongodb -p 27017:27017 mongo:6.0"
fi

# 安装依赖
echo "📦 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "📦 安装后端依赖..."
cd ../backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# 初始化数据
echo "🗄️  初始化数据库数据..."
npm run init

# 启动服务
echo "🎯 启动后端服务..."
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

echo "🎨 启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:5000"
echo "📊 API 健康检查: http://localhost:5000/api/health"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
