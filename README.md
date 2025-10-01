# 答题抽签互动网站

## 项目简介
一个集答题、抽签、实时互动于一体的Web应用

## 技术栈
- 前端：Vue.js 3 + Element Plus + Pinia + Axios
- 后端：Node.js + Express + MongoDB + Socket.io
- 部署：腾讯EdgeOne Pages

## 功能模块
1. 用户系统（注册/登录/个人中心）
2. 答题系统（题库管理/限时答题/自动判分）
3. 抽签系统（随机抽取/结果展示）
4. 实时专栏（排名/进度/消息）
5. 互动功能（评论/点赞/分享）

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4
- Git

### 安装依赖
```bash
# 前端
cd frontend
npm install

# 后端
cd backend
npm install
```

### 启动开发服务器
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

## 部署说明
详见 `deploy/` 目录下的部署文档。

## 开发计划
- [x] 项目架构设计
- [x] 用户系统开发
- [x] 答题系统开发
- [x] 抽签系统开发
- [x] 实时功能开发
- [x] 部署配置

## 快速开始

### 一键启动（推荐）
```bash
# 克隆项目
git clone <repository-url>
cd quiz-lottery

# 一键启动所有服务
./start.sh
```

### 手动启动
```bash
# 1. 启动 MongoDB（如果使用 Docker）
docker run -d --name mongodb -p 27017:27017 mongo:6.0

# 2. 安装依赖并启动后端
cd backend
npm install
npm run init  # 初始化数据
npm run dev

# 3. 安装依赖并启动前端（新终端）
cd frontend
npm install
npm run dev
```

## 功能特性

### 🎯 核心功能
- **智能答题系统**：海量题库，智能出题，自动判分
- **趣味抽签功能**：公平随机算法，多种奖品设置
- **实时互动社区**：实时排名，在线聊天，消息推送
- **积分等级系统**：答题获得积分，等级提升，奖励兑换

### 🔧 技术特性
- **响应式设计**：支持桌面端和移动端
- **实时通信**：WebSocket 实时数据更新
- **安全认证**：JWT 令牌认证，手机号验证
- **性能优化**：代码分割，懒加载，缓存策略

### 📱 用户界面
- **现代化 UI**：基于 Element Plus 的优雅界面
- **交互友好**：直观的操作流程，流畅的用户体验
- **主题适配**：支持明暗主题切换
- **多语言支持**：中文界面，易于理解

## 项目结构

```
quiz-lottery/
├── frontend/                 # 前端代码
│   ├── src/
│   │   ├── components/      # 公共组件
│   │   ├── views/          # 页面组件
│   │   ├── router/         # 路由配置
│   │   ├── store/          # 状态管理
│   │   ├── api/            # API 接口
│   │   └── utils/          # 工具函数
│   ├── public/             # 静态资源
│   └── package.json
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── middleware/     # 中间件
│   │   ├── services/       # 业务服务
│   │   └── utils/          # 工具函数
│   └── package.json
├── deploy/                  # 部署配置
│   ├── docker-compose.yml  # Docker 配置
│   └── README.md           # 部署指南
├── docs/                   # 文档
│   └── DEVELOPMENT.md      # 开发指南
├── start.sh                # 快速启动脚本
└── README.md
```

## 环境配置

### 开发环境
- Node.js >= 16.0.0
- MongoDB >= 4.4
- Git

### 生产环境
- 腾讯云 EdgeOne Pages（前端）
- 腾讯云 SCF（后端）
- MongoDB Atlas 或腾讯云 MongoDB

## 第三方服务

### 短信服务
- **阿里云短信服务**：手机验证码发送
- **配置项**：AccessKey ID、AccessKey Secret、签名、模板

### 文件存储
- **腾讯云 COS**：用户头像、图片存储
- **配置项**：Secret ID、Secret Key、存储桶、地域

### 数据库
- **MongoDB Atlas**：免费云数据库
- **腾讯云 MongoDB**：国内云数据库

## 部署方案

### 方案一：腾讯云部署（推荐）
1. 前端：EdgeOne Pages + CDN 加速
2. 后端：云函数 SCF + API 网关
3. 数据库：MongoDB Atlas 或腾讯云 MongoDB
4. 存储：腾讯云 COS

### 方案二：Docker 部署
1. 使用 Docker Compose 一键部署
2. 支持本地开发和测试环境
3. 包含 Nginx 反向代理

### 方案三：传统服务器部署
1. 购买云服务器
2. 安装 Node.js 和 MongoDB
3. 使用 PM2 管理进程
4. 配置 Nginx 反向代理

## 开发指南

详细的开发指南请参考 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

## 部署指南

详细的部署指南请参考 [deploy/README.md](deploy/README.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 微信群讨论


