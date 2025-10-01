#!/bin/bash

# 答题抽签互动网站 - 快速启动脚本（简化版）

echo "🚀 启动答题抽签互动网站（简化版）..."

# 检查 Node.js 版本
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 请先安装 Node.js (版本 >= 16.0.0)"
    exit 1
fi

echo "✅ Node.js 版本: $node_version"

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 前端依赖安装失败"
        exit 1
    fi
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd ../backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 后端依赖安装失败"
        exit 1
    fi
fi

# 创建环境变量文件
echo "⚙️  配置环境变量..."
cat > .env << EOF
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/quiz-lottery
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
EOF

# 启动后端服务
echo "🎯 启动后端服务..."
npm run dev &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 检查后端是否启动成功
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo "⚠️  后端服务启动可能有问题，但继续启动前端..."
fi

# 启动前端服务
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
echo "⚠️  注意：由于没有 MongoDB，部分功能可能无法正常工作"
echo "   建议安装 MongoDB 或使用 MongoDB Atlas 云数据库"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
