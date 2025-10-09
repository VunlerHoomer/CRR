# Vercel 前端部署指南

## 📋 准备工作

### 1. 确保代码已推送到 GitHub
```bash
cd /Users/vunler/web_develop
git add .
git commit -m "feat: 配置Vercel前端部署"
git push origin main
```

---

## 🚀 Vercel 部署步骤

### 方式一：通过 Vercel Dashboard（推荐）

#### 1. 登录 Vercel
访问：https://vercel.com
使用 GitHub 账号登录

#### 2. 导入项目
1. 点击 "Add New Project"
2. 选择 "Import Git Repository"
3. 找到并选择 `VunlerHoomer/CRR` 仓库
4. 点击 "Import"

#### 3. 配置项目

**Root Directory (根目录):**
```
frontend
```

**Framework Preset:**
```
Vite
```

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

#### 4. 环境变量设置

点击 "Environment Variables"，添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `VITE_API_BASE_URL` | `https://crr-five.vercel.app/api` | Production |
| `NODE_ENV` | `production` | Production |

#### 5. 部署
1. 点击 "Deploy" 按钮
2. 等待构建完成（通常需要 2-5 分钟）
3. 部署成功后会显示预览链接

---

### 方式二：使用 Vercel CLI

#### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 2. 登录
```bash
vercel login
```

#### 3. 部署
```bash
cd frontend
vercel --prod
```

按照提示完成配置：
- Set up and deploy? Yes
- Which scope? 选择您的账号
- Link to existing project? No
- What's your project's name? crr-frontend
- In which directory is your code located? ./
- Want to override the settings? Yes
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Development Command: `npm run dev`

---

## 🔧 配置说明

### vercel.json 配置
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/images/(.*)",
      "dest": "/images/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 环境变量
- `VITE_API_BASE_URL`: 后端API地址
- `NODE_ENV`: 环境标识

---

## 🌐 域名配置

### 使用 Vercel 默认域名
部署成功后，Vercel 会自动分配一个域名：
```
https://your-project-name.vercel.app
```

### 绑定自定义域名

#### 1. 在 Vercel 项目设置中
1. 进入项目 Settings
2. 选择 Domains
3. 点击 "Add Domain"
4. 输入您的域名（如：szcityrunride.com）

#### 2. DNS 配置（在域名提供商）

**方式 A：使用 A 记录**
```
Type: A
Name: @
Value: 76.76.21.21
```

**方式 B：使用 CNAME（推荐）**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

#### 3. 等待 DNS 生效
通常需要几分钟到几小时

#### 4. Vercel 自动配置 SSL
Vercel 会自动为您的域名配置 SSL 证书

---

## ✅ 验证部署

### 1. 检查构建状态
在 Vercel Dashboard 中查看：
- ✅ Build Logs 无错误
- ✅ Deployment 状态为 "Ready"

### 2. 访问网站
```
https://your-project.vercel.app
```

### 3. 测试功能
- [ ] 首页加载正常
- [ ] 登录功能正常
- [ ] 活动中心显示正常
- [ ] 报名功能正常
- [ ] 管理后台可访问

### 4. 检查 API 连接
打开浏览器控制台 (F12)：
- Network 标签查看 API 请求
- 确保请求指向 `https://crr-five.vercel.app/api`

---

## 🔄 自动部署

### GitHub 集成
配置完成后，每次推送代码到 GitHub main 分支，Vercel 会自动：
1. 检测代码变更
2. 触发构建
3. 自动部署到生产环境

### 手动触发部署
1. 访问 Vercel Dashboard
2. 选择项目
3. 点击 "Redeploy"

---

## 🐛 常见问题

### 1. 构建失败
**问题**: Build 阶段出错
**解决**:
```bash
# 本地测试构建
cd frontend
npm install
npm run build

# 查看错误信息并修复
```

### 2. 页面空白
**问题**: 部署成功但页面显示空白
**检查**:
- 浏览器控制台是否有错误
- 检查 `dist/index.html` 是否正确生成
- 检查 API 地址是否正确配置

### 3. API 请求失败
**问题**: 前端无法连接后端 API
**解决**:
- 检查环境变量 `VITE_API_BASE_URL` 是否正确
- 检查后端 CORS 配置
- 确保后端已部署并运行

### 4. 路由 404 错误
**问题**: 刷新页面出现 404
**解决**: 已在 `vercel.json` 中配置路由重写规则

### 5. 静态资源加载失败
**问题**: 图片、CSS 等资源 404
**检查**:
- `public` 目录下的文件是否正确
- `vercel.json` 中的路由配置是否包含静态资源路径

---

## 📊 性能优化

### 已配置的优化
- ✅ Gzip 压缩
- ✅ 代码分割
- ✅ 图片懒加载
- ✅ CDN 加速（Vercel 自带）
- ✅ HTTP/2 支持
- ✅ 自动 SSL

### Vercel 提供的性能特性
- **全球 CDN**: 自动分发到全球节点
- **边缘缓存**: 静态资源缓存
- **自动压缩**: Gzip/Brotli
- **图片优化**: 自动优化图片格式

---

## 📝 部署清单

部署前检查：
- [ ] 代码已推送到 GitHub
- [ ] `frontend/vercel.json` 已配置
- [ ] `frontend/.env.production` 已配置
- [ ] `package.json` 中有 `vercel-build` 脚本
- [ ] 本地构建测试通过
- [ ] 后端 API 已部署并可访问

部署后检查：
- [ ] Vercel 构建成功
- [ ] 前端页面可访问
- [ ] API 连接正常
- [ ] 所有功能测试通过
- [ ] 性能测试通过

---

## 🔗 相关链接

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel 文档: https://vercel.com/docs
- 项目仓库: https://github.com/VunlerHoomer/CRR
- 后端 API: https://crr-five.vercel.app/api

---

## 💡 提示

1. **首次部署**建议使用 Dashboard 方式，更直观
2. **后续更新**可以直接通过 Git 推送自动部署
3. **环境变量**修改后需要重新部署才能生效
4. **域名绑定**后，旧域名仍然可以访问
5. **部署历史**可以在 Vercel Dashboard 中查看和回滚

---

祝部署顺利！🎉

