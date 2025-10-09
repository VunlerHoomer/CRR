# Vercel 前端快速部署指南

## 🎯 核心问题

**您现在的情况：**
- ✅ GitHub 代码已更新
- ✅ 后端已在 Vercel 部署 (crr 项目)
- ❌ 前端还未部署到 Vercel

**需要做的：**
创建一个新的 Vercel 项目来部署前端

---

## 📋 详细步骤（图文指引）

### 步骤 1: 访问 Vercel Dashboard

1. 打开浏览器，访问：https://vercel.com/dashboard
2. 确保已使用 GitHub 账号登录

---

### 步骤 2: 创建新项目

#### 方法 A: 添加新项目（推荐）
```
1. 点击页面右上角的 "Add New..." 按钮
2. 选择 "Project"
3. 或直接点击 "Add New Project"
```

#### 方法 B: 从项目列表
```
1. 如果已有项目，会看到项目列表
2. 点击 "Import Project" 或 "Add New Project"
```

---

### 步骤 3: 导入 GitHub 仓库

#### 3.1 授权 GitHub（如果首次使用）
```
1. 点击 "Continue with GitHub"
2. 授权 Vercel 访问您的 GitHub 仓库
```

#### 3.2 选择仓库
```
1. 在仓库列表中找到 "VunlerHoomer/CRR"
2. 点击仓库右侧的 "Import" 按钮
```

**注意：**
- 如果看不到仓库，点击 "Adjust GitHub App Permissions"
- 确保 Vercel 有权限访问该仓库

---

### 步骤 4: 配置项目（最重要！）

当看到配置页面时，请按以下设置：

#### 4.1 基本配置
```
Project Name:
  crr-frontend
  (或其他您喜欢的名称)

Framework Preset:
  Vite
  (从下拉菜单选择，Vercel 通常会自动检测)

Root Directory:
  frontend
  ⚠️ 这是最关键的设置！必须是 "frontend"
  
  如何设置：
  1. 点击 "Root Directory" 右边的 "Edit" 或下拉菜单
  2. 选择 "frontend" 文件夹
  3. 或手动输入 "frontend"
```

#### 4.2 构建设置（通常自动检测，但请确认）
```
Build Command:
  npm run build
  
Output Directory:
  dist
  
Install Command:
  npm install
  
Development Command:
  npm run dev
```

#### 4.3 环境变量（Environment Variables）
```
点击 "Environment Variables" 展开

添加：
  Name:  VITE_API_BASE_URL
  Value: https://crr-five.vercel.app/api
  Environment: Production (默认勾选)
  
点击 "Add" 添加
```

---

### 步骤 5: 部署

#### 5.1 开始部署
```
1. 检查所有配置是否正确
2. 点击页面底部的 "Deploy" 按钮
3. 等待构建完成
```

#### 5.2 构建过程
```
您会看到构建日志：
- Installing dependencies...
- Building...
- Uploading...
- Deployment Ready

整个过程约 2-5 分钟
```

#### 5.3 部署成功
```
看到 "Congratulations!" 或类似成功提示
会显示您的项目 URL，例如：
https://crr-frontend-xxx.vercel.app
```

---

## ✅ 验证部署

### 1. 检查部署状态
```
在 Vercel Dashboard：
- 项目状态显示 "Ready"
- 有绿色的勾号 ✓
```

### 2. 访问网站
```
点击项目 URL 或访问分配的域名
应该能看到您的网站首页
```

### 3. 测试功能
```
- 首页加载正常
- 点击导航菜单
- 尝试登录（测试 API 连接）
```

---

## 🔄 配置自动部署

部署成功后，Vercel 会自动配置：

```
GitHub main 分支 → 自动部署到生产环境
GitHub 其他分支 → 自动部署到预览环境
Pull Request   → 自动创建预览部署
```

**测试自动部署：**
```bash
# 在本地修改代码
git add .
git commit -m "test: 测试自动部署"
git push origin main

# 然后访问 Vercel Dashboard
# 会看到新的部署自动开始
```

---

## 🌐 绑定自定义域名（可选）

### 部署成功后绑定 szcityrunride.com

#### 1. 进入项目设置
```
1. 在 Vercel Dashboard 选择您的前端项目
2. 点击 "Settings" 标签
3. 选择左侧的 "Domains"
```

#### 2. 添加域名
```
1. 在输入框中输入: szcityrunride.com
2. 点击 "Add"
```

#### 3. 配置 DNS
```
Vercel 会给您 DNS 配置说明：

方式 A: A 记录
  Type: A
  Name: @
  Value: 76.76.21.21

方式 B: CNAME（推荐）
  Type: CNAME
  Name: @
  Value: cname.vercel-dns.com
```

#### 4. 等待验证
```
DNS 配置后：
- 通常 5-30 分钟生效
- Vercel 会自动配置 SSL 证书
- 完成后域名旁会显示 ✓
```

---

## 🐛 常见问题解决

### 问题 1: 看不到 VunlerHoomer/CRR 仓库

**原因：** Vercel 没有权限访问该仓库

**解决：**
```
1. 在导入页面点击 "Adjust GitHub App Permissions"
2. 找到 Vercel 应用
3. 授权访问 VunlerHoomer/CRR 仓库
4. 返回 Vercel 刷新页面
```

---

### 问题 2: 构建失败（Build Failed）

**检查点：**
```
1. Root Directory 是否设置为 "frontend"
2. 环境变量是否正确配置
3. 查看构建日志中的具体错误
```

**常见错误：**
```
Error: Cannot find package.json
→ Root Directory 设置错误，应该是 "frontend"

Error: Module not found
→ 依赖安装失败，检查 package.json
```

---

### 问题 3: 页面空白或 404

**原因：** 路由配置问题

**检查：**
```
1. vercel.json 文件是否在 frontend 目录
2. 浏览器控制台是否有错误
3. Network 标签查看资源加载情况
```

---

### 问题 4: API 请求失败

**检查：**
```
1. 环境变量 VITE_API_BASE_URL 是否配置
2. 后端 API 是否正常运行
3. CORS 配置是否正确
```

**验证后端：**
```
访问: https://crr-five.vercel.app/api/health
应该返回: {"code":200,"message":"服务运行正常",...}
```

---

## 📞 需要帮助？

### 如果遇到问题，请提供：

1. **Vercel 构建日志**
   ```
   在 Deployments 页面点击失败的部署
   复制 "Building" 阶段的错误信息
   ```

2. **配置截图**
   ```
   项目配置页面的截图
   显示 Root Directory 等设置
   ```

3. **具体错误信息**
   ```
   浏览器控制台的错误
   或部署失败的具体提示
   ```

---

## 🎉 成功指标

完成部署后，您应该能：

- ✅ 访问 Vercel 分配的 URL
- ✅ 看到网站首页
- ✅ 登录功能正常
- ✅ API 请求成功
- ✅ 所有页面都能访问
- ✅ 推送代码后自动部署

---

## 📝 配置清单

部署前确认：
- [ ] 已登录 Vercel
- [ ] 已授权 GitHub 仓库访问
- [ ] Root Directory 设置为 "frontend"
- [ ] Framework Preset 选择 "Vite"
- [ ] 环境变量已添加
- [ ] 点击 Deploy

部署后确认：
- [ ] 构建成功（Ready 状态）
- [ ] 网站可访问
- [ ] API 连接正常
- [ ] 功能测试通过

---

立即开始部署：https://vercel.com/new

祝部署顺利！🚀
