# 部署指南

## 腾讯EdgeOne Pages 部署

### 前置准备

1. **域名注册与备案**
   - 在腾讯云注册域名
   - 完成ICP备案（国内服务器必需）
   - 备案周期：7-20个工作日

2. **EdgeOne Pages 账号配置**
   - 注册腾讯云账号
   - 开通EdgeOne Pages服务
   - 完成实名认证

### 部署步骤

#### 1. 项目代码准备

确保项目结构正确：
```
quiz-lottery/
├── frontend/          # 前端代码
├── backend/           # 后端代码
├── deploy/            # 部署配置
└── README.md
```

#### 2. 前端构建配置

在 `frontend` 目录下创建 `vite.config.js`：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          element: ['element-plus']
        }
      }
    }
  }
})
```

#### 3. 环境变量配置

创建 `frontend/.env.production`：
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

#### 4. 构建命令

```bash
# 前端构建
cd frontend
npm install
npm run build

# 后端构建（如果需要）
cd backend
npm install
npm run build
```

#### 5. EdgeOne Pages 部署

1. **连接代码仓库**
   - 将代码推送到 GitHub/Gitee
   - 在 EdgeOne Pages 中连接仓库
   - 选择分支（通常是 main 或 master）

2. **构建配置**
   - 构建命令：`cd frontend && npm install && npm run build`
   - 输出目录：`frontend/dist`
   - Node.js 版本：18.x

3. **环境变量设置**
   ```
   VITE_API_BASE_URL=https://your-api-domain.com/api
   ```

4. **域名绑定**
   - 在 EdgeOne Pages 中添加自定义域名
   - 配置 DNS 解析
   - 启用 HTTPS（自动申请 SSL 证书）

#### 6. 后端部署（腾讯云 SCF）

1. **创建云函数**
   - 在腾讯云 SCF 控制台创建函数
   - 选择 Node.js 18 运行时
   - 上传后端代码包

2. **配置环境变量**
   ```
   MONGODB_URI=mongodb://your-mongodb-connection
   JWT_SECRET=your-jwt-secret
   ALIYUN_ACCESS_KEY_ID=your-access-key
   ALIYUN_ACCESS_KEY_SECRET=your-secret
   ```

3. **配置 API 网关**
   - 创建 API 网关服务
   - 配置路由规则
   - 绑定云函数

### 数据库配置

#### MongoDB Atlas（推荐）

1. 注册 MongoDB Atlas 账号
2. 创建免费集群
3. 配置网络访问白名单
4. 获取连接字符串

#### 腾讯云 MongoDB

1. 在腾讯云控制台购买 MongoDB 实例
2. 配置安全组规则
3. 获取连接信息

### 第三方服务配置

#### 阿里云短信服务

1. 开通短信服务
2. 申请签名和模板
3. 获取 AccessKey 和 SecretKey
4. 配置环境变量

#### 腾讯云 COS（文件存储）

1. 开通 COS 服务
2. 创建存储桶
3. 配置 CORS 规则
4. 获取访问密钥

### 部署验证

1. **前端验证**
   - 访问部署的域名
   - 检查页面加载是否正常
   - 测试用户注册/登录功能

2. **后端验证**
   - 测试 API 接口响应
   - 检查数据库连接
   - 验证第三方服务集成

3. **功能测试**
   - 答题功能测试
   - 抽签功能测试
   - 实时功能测试

### 监控与维护

1. **性能监控**
   - 使用腾讯云监控服务
   - 设置告警规则
   - 定期检查性能指标

2. **日志管理**
   - 配置日志收集
   - 设置日志轮转
   - 定期清理旧日志

3. **备份策略**
   - 数据库定期备份
   - 代码版本管理
   - 配置文件备份

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本
   - 确认依赖包安装
   - 查看构建日志

2. **API 调用失败**
   - 检查 CORS 配置
   - 验证环境变量
   - 确认网络连接

3. **数据库连接失败**
   - 检查连接字符串
   - 确认网络访问权限
   - 验证认证信息

### 成本优化

1. **使用免费额度**
   - EdgeOne Pages 免费额度
   - MongoDB Atlas 免费集群
   - 腾讯云 SCF 免费额度

2. **资源优化**
   - 启用 CDN 加速
   - 压缩静态资源
   - 优化数据库查询

3. **监控成本**
   - 设置费用告警
   - 定期检查账单
   - 优化资源配置
