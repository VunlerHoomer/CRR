# 🚀 腾讯 EdgeOne Pages 部署完整指南

本指南将手把手教您如何将前端项目部署到腾讯 EdgeOne Pages。

---

## 📋 目录

1. [部署前准备](#1-部署前准备)
2. [配置生产环境](#2-配置生产环境)
3. [EdgeOne Pages 部署](#3-edgeone-pages-部署)
4. [后端 API 部署](#4-后端-api-部署)
5. [域名配置](#5-域名配置)
6. [常见问题](#6-常见问题)

---

## 1. 部署前准备

### 1.1 前置条件

✅ **必需**：
- 腾讯云账号（已注册并实名认证）
- GitHub 仓库（已推送代码）
- 后端 API 地址（如果有）

⚠️ **可选**：
- 自定义域名（已备案，如果使用国内服务器）
- SSL 证书（EdgeOne Pages 可自动申请）

### 1.2 腾讯云账号注册

1. 访问：https://cloud.tencent.com/
2. 点击"免费注册"
3. 完成手机号验证和实名认证

### 1.3 开通 EdgeOne Pages 服务

1. 访问 EdgeOne Pages 控制台：https://console.cloud.tencent.com/edgeone/pages
2. 首次访问会提示开通服务
3. 点击"立即开通"（免费服务）

---

## 2. 配置生产环境

### 2.1 创建生产环境配置文件

在项目根目录创建 `frontend/.env.production`：

```env
# API 基础地址（替换成您的后端 API 地址）
VITE_API_BASE_URL=https://your-backend-api.com/api

# 其他生产环境配置
VITE_APP_TITLE=答题抽签互动网站
```

### 2.2 更新 package.json 构建脚本

确保 `frontend/package.json` 包含构建脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2.3 本地测试构建

在推送到 EdgeOne Pages 前，先本地测试构建：

```bash
cd frontend
npm install
npm run build
```

检查 `frontend/dist` 目录是否生成成功。

---

## 3. EdgeOne Pages 部署

### 3.1 登录 EdgeOne Pages 控制台

访问：https://console.cloud.tencent.com/edgeone/pages

### 3.2 创建新项目

#### 步骤 1：点击"新建项目"

![新建项目]

#### 步骤 2：选择导入方式

选择 **"从 GitHub 导入"**

#### 步骤 3：授权 GitHub

1. 点击"连接 GitHub"
2. 授权腾讯云访问您的 GitHub
3. 选择允许访问的仓库：
   - 可以选择"所有仓库"
   - 或选择"仅选定的仓库"，然后选择 `CRR`

#### 步骤 4：选择仓库和分支

- **仓库**：选择 `VunlerHoomer/CRR`
- **分支**：选择 `main`

#### 步骤 5：配置构建设置

**重要配置项**：

| 配置项 | 值 | 说明 |
|-------|-----|------|
| **项目名称** | `crr-quiz-lottery` | 自定义项目名称 |
| **框架预设** | `Vite` | 选择 Vite 框架 |
| **根目录** | `frontend` | 前端代码目录 |
| **构建命令** | `npm install && npm run build` | 构建命令 |
| **输出目录** | `dist` | 构建输出目录 |
| **Node.js 版本** | `18.x` | Node.js 版本 |

#### 步骤 6：环境变量配置

点击"添加环境变量"，添加：

```
VITE_API_BASE_URL = https://your-backend-api.com/api
```

> ⚠️ 注意：如果暂时没有后端 API，可以先填写临时地址，后续可以修改。

#### 步骤 7：开始部署

点击"部署"按钮，等待构建完成（通常 2-5 分钟）。

### 3.3 查看部署状态

部署过程中，您可以看到：
- 📦 克隆代码
- 📥 安装依赖
- 🔨 执行构建
- 🚀 部署到 CDN

### 3.4 访问部署的网站

部署成功后，会分配一个临时域名，类似：
```
https://crr-quiz-lottery-xxxxx.edgeone.app
```

点击访问，查看您的网站！

---

## 4. 后端 API 部署

EdgeOne Pages 只能部署静态网站（前端），后端需要单独部署。

### 方案 A：腾讯云 SCF（云函数）

#### 4.1 安装 Serverless Framework

```bash
npm install -g serverless
```

#### 4.2 创建 serverless.yml

在 `backend` 目录创建 `serverless.yml`：

```yaml
component: express
name: quiz-lottery-api

inputs:
  src: ./
  region: ap-guangzhou
  runtime: Nodejs18.x
  apigatewayConf:
    protocols:
      - https
    environment: release
  functionConf:
    timeout: 30
    memorySize: 512
    environment:
      variables:
        NODE_ENV: production
        MONGODB_URI: ${env.MONGODB_URI}
        JWT_SECRET: ${env.JWT_SECRET}
```

#### 4.3 部署云函数

```bash
cd backend
serverless deploy
```

部署成功后会返回 API 网关地址，例如：
```
https://service-xxxxx-xxxxxxxx.gz.apigw.tencentcs.com
```

#### 4.4 更新前端环境变量

回到 EdgeOne Pages 控制台：
1. 进入项目设置
2. 找到"环境变量"
3. 修改 `VITE_API_BASE_URL` 为云函数地址
4. 重新部署

### 方案 B：腾讯云服务器（CVM）

如果您有腾讯云服务器，可以直接部署：

```bash
# 1. 连接服务器
ssh root@your-server-ip

# 2. 克隆代码
git clone https://github.com/VunlerHoomer/CRR.git
cd CRR/backend

# 3. 安装依赖
npm install

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 5. 使用 PM2 启动
npm install -g pm2
pm2 start src/app.js --name quiz-lottery-api
pm2 save
pm2 startup
```

### 方案 C：使用 MongoDB Atlas（数据库）

1. 访问 https://www.mongodb.com/cloud/atlas
2. 注册免费账号
3. 创建免费集群
4. 获取连接字符串，更新到后端环境变量

---

## 5. 域名配置

### 5.1 添加自定义域名

在 EdgeOne Pages 控制台：

1. 进入项目详情
2. 点击"域名管理"
3. 点击"添加域名"
4. 输入您的域名：`www.yourdomain.com`

### 5.2 配置 DNS 解析

在您的域名服务商（如腾讯云、阿里云）：

1. 添加 CNAME 记录：
   ```
   记录类型：CNAME
   主机记录：www（或 @）
   记录值：EdgeOne Pages 提供的地址
   ```

2. 等待 DNS 生效（通常 10 分钟内）

### 5.3 启用 HTTPS

EdgeOne Pages 会自动申请和配置 SSL 证书，无需手动操作。

---

## 6. 常见问题

### Q1: 构建失败，提示找不到模块？

**A**: 检查：
1. `package.json` 是否包含所有依赖
2. 根目录配置是否正确（应为 `frontend`）
3. Node.js 版本是否匹配（建议 18.x）

**解决方法**：
```bash
# 本地测试构建
cd frontend
npm install
npm run build
```

### Q2: 部署成功但页面空白？

**A**: 可能的原因：
1. API 地址配置错误
2. 路由配置问题

**解决方法**：
1. 打开浏览器控制台查看错误
2. 检查 `VITE_API_BASE_URL` 是否正确
3. 检查路由是否使用 `createWebHistory`

### Q3: 404 错误，刷新页面失败？

**A**: 需要配置重定向规则。

在 EdgeOne Pages 控制台：
1. 进入项目设置
2. 找到"重定向规则"
3. 添加规则：
   ```
   源路径：/*
   目标路径：/index.html
   状态码：200
   ```

### Q4: API 跨域问题？

**A**: 后端需要配置 CORS：

```javascript
// backend/src/app.js
app.use(cors({
  origin: [
    'https://your-edgeone-domain.edgeone.app',
    'https://www.yourdomain.com'
  ],
  credentials: true
}))
```

### Q5: 如何查看部署日志？

**A**: 在 EdgeOne Pages 控制台：
1. 进入项目详情
2. 点击"部署历史"
3. 点击具体的部署记录
4. 查看详细日志

### Q6: 如何回滚到之前的版本？

**A**: 
1. 进入"部署历史"
2. 找到要回滚的版本
3. 点击"重新部署"

---

## 7. 性能优化建议

### 7.1 启用 CDN 加速

EdgeOne Pages 自动使用 CDN，但您可以：
1. 配置缓存规则
2. 启用 Gzip 压缩
3. 使用图片 CDN

### 7.2 代码分割

确保 `vite.config.js` 配置了代码分割：

```javascript
export default defineConfig({
  build: {
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

### 7.3 懒加载路由

```javascript
// router/index.js
const routes = [
  {
    path: '/quiz',
    component: () => import('@/views/Quiz.vue')  // 懒加载
  }
]
```

---

## 8. 成本说明

### EdgeOne Pages 免费额度

- ✅ 每月 100GB 流量（免费）
- ✅ 每月 100 万次请求（免费）
- ✅ 无限构建次数

超出免费额度后：
- 流量：0.18 元/GB
- 请求：0.01 元/万次

**一般个人项目完全够用！**

---

## 9. 快速部署清单

最后，给您一个快速部署清单：

- [ ] 1. 腾讯云账号已注册并实名
- [ ] 2. EdgeOne Pages 服务已开通
- [ ] 3. GitHub 仓库已创建并推送代码
- [ ] 4. 创建了 `frontend/.env.production` 文件
- [ ] 5. 本地测试构建成功（`npm run build`）
- [ ] 6. 在 EdgeOne Pages 创建项目并连接 GitHub
- [ ] 7. 配置构建参数（根目录、构建命令、输出目录）
- [ ] 8. 设置环境变量
- [ ] 9. 开始部署并等待完成
- [ ] 10. 访问临时域名测试
- [ ] 11. （可选）配置自定义域名
- [ ] 12. （可选）部署后端 API

---

## 10. 相关链接

- [EdgeOne Pages 官方文档](https://cloud.tencent.com/document/product/1552)
- [Vite 官方文档](https://vitejs.dev/)
- [腾讯云 SCF 文档](https://cloud.tencent.com/document/product/583)

---

**祝您部署成功！** 🎉

如有问题，欢迎随时提问！

