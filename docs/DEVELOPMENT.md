# 开发指南

## 环境搭建

### 系统要求
- Node.js >= 16.0.0
- MongoDB >= 4.4
- Git

### 本地开发环境配置

1. **克隆项目**
```bash
git clone <repository-url>
cd quiz-lottery
```

2. **安装依赖**
```bash
# 前端依赖
cd frontend
npm install

# 后端依赖
cd ../backend
npm install
```

3. **环境变量配置**
```bash
# 复制环境变量模板
cp backend/env.example backend/.env

# 编辑环境变量
vim backend/.env
```

4. **启动 MongoDB**
```bash
# 使用 Docker
docker run -d --name mongodb -p 27017:27017 mongo:6.0

# 或使用本地安装的 MongoDB
mongod --dbpath /path/to/your/db
```

5. **启动开发服务器**
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务（新终端）
cd frontend
npm run dev
```

6. **访问应用**
- 前端：http://localhost:3000
- 后端：http://localhost:5000
- API 文档：http://localhost:5000/api/health

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
├── docs/                   # 文档
└── README.md
```

## 开发规范

### 代码规范

1. **命名规范**
   - 变量和函数：camelCase
   - 常量：UPPER_SNAKE_CASE
   - 组件：PascalCase
   - 文件：kebab-case

2. **注释规范**
   - 函数注释：使用 JSDoc 格式
   - 复杂逻辑：添加行内注释
   - 文件头部：添加文件说明

3. **Git 提交规范**
   ```
   feat: 新功能
   fix: 修复 bug
   docs: 文档更新
   style: 代码格式调整
   refactor: 代码重构
   test: 测试相关
   chore: 构建过程或辅助工具的变动
   ```

### API 设计规范

1. **RESTful 设计**
   - GET：获取资源
   - POST：创建资源
   - PUT：更新资源
   - DELETE：删除资源

2. **响应格式**
   ```json
   {
     "code": 200,
     "message": "操作成功",
     "data": {}
   }
   ```

3. **错误处理**
   - 400：客户端错误
   - 401：未授权
   - 403：禁止访问
   - 404：资源不存在
   - 500：服务器错误

### 数据库设计规范

1. **集合命名**
   - 使用复数形式
   - 小写字母
   - 下划线分隔

2. **字段命名**
   - 使用 camelCase
   - 布尔字段以 is 开头
   - 时间字段以 At 结尾

3. **索引设计**
   - 查询频繁的字段建立索引
   - 复合索引考虑查询顺序
   - 避免过多索引影响写入性能

## 功能开发

### 用户系统

1. **注册流程**
   - 手机号验证
   - 短信验证码
   - 用户信息创建

2. **登录流程**
   - 手机号 + 验证码
   - JWT 令牌生成
   - 用户状态管理

3. **权限控制**
   - 路由守卫
   - API 权限验证
   - 角色权限管理

### 答题系统

1. **题库管理**
   - 题目分类
   - 难度等级
   - 题目审核

2. **答题流程**
   - 题目随机生成
   - 答案提交
   - 自动判分

3. **积分系统**
   - 答题积分计算
   - 等级系统
   - 积分记录

### 抽签系统

1. **抽签配置**
   - 奖品设置
   - 概率配置
   - 限制规则

2. **抽签算法**
   - 随机数生成
   - 概率计算
   - 结果验证

3. **记录管理**
   - 抽签记录
   - 中奖统计
   - 防刷机制

### 实时功能

1. **WebSocket 连接**
   - 用户认证
   - 房间管理
   - 消息广播

2. **实时数据**
   - 排行榜更新
   - 在线人数
   - 活动通知

3. **消息系统**
   - 聊天功能
   - 系统通知
   - 消息推送

## 测试

### 单元测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

### 集成测试

```bash
# 启动测试环境
docker-compose -f docker-compose.test.yml up

# 运行集成测试
npm run test:integration
```

### 端到端测试

```bash
# 安装 Cypress
npm install cypress --save-dev

# 运行 E2E 测试
npm run test:e2e
```

## 性能优化

### 前端优化

1. **代码分割**
   - 路由懒加载
   - 组件按需加载
   - 第三方库分离

2. **资源优化**
   - 图片压缩
   - 代码压缩
   - Gzip 压缩

3. **缓存策略**
   - 静态资源缓存
   - API 数据缓存
   - 浏览器缓存

### 后端优化

1. **数据库优化**
   - 查询优化
   - 索引优化
   - 连接池配置

2. **缓存策略**
   - Redis 缓存
   - 内存缓存
   - CDN 加速

3. **并发处理**
   - 连接池
   - 队列处理
   - 负载均衡

## 部署

### 开发环境

```bash
# 使用 Docker Compose
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 生产环境

```bash
# 构建镜像
docker-compose -f docker-compose.prod.yml build

# 部署服务
docker-compose -f docker-compose.prod.yml up -d
```

## 监控与日志

### 应用监控

1. **性能监控**
   - 响应时间
   - 吞吐量
   - 错误率

2. **业务监控**
   - 用户活跃度
   - 功能使用率
   - 转化率

### 日志管理

1. **日志级别**
   - ERROR：错误信息
   - WARN：警告信息
   - INFO：一般信息
   - DEBUG：调试信息

2. **日志格式**
   ```json
   {
     "timestamp": "2023-12-01T10:00:00.000Z",
     "level": "INFO",
     "message": "User login success",
     "userId": "123456",
     "ip": "192.168.1.1"
   }
   ```

## 常见问题

### 开发问题

1. **端口冲突**
   - 检查端口占用
   - 修改配置文件
   - 重启服务

2. **依赖安装失败**
   - 清除缓存
   - 使用国内镜像
   - 检查网络连接

3. **数据库连接失败**
   - 检查连接字符串
   - 确认服务状态
   - 验证权限配置

### 部署问题

1. **构建失败**
   - 检查环境变量
   - 确认依赖版本
   - 查看构建日志

2. **服务启动失败**
   - 检查配置文件
   - 确认端口占用
   - 查看错误日志

3. **性能问题**
   - 检查资源使用
   - 优化数据库查询
   - 调整缓存策略
