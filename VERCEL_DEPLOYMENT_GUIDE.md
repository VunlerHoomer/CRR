# 🚀 Vercel 后端部署完整指南

## 🎯 目标

将您的 Node.js 后端部署到 Vercel，解决 405 错误问题。

---

## 📋 准备工作（已完成）

✅ Vercel 配置文件已创建：`backend/vercel.json`  
✅ 忽略文件已创建：`backend/.vercelignore`  
✅ GitHub 仓库已推送

---

## 🚀 部署步骤（图文教程）

### 第 1 步：注册并登录 Vercel

#### 1.1 访问 Vercel

打开浏览器，访问：**https://vercel.com**

#### 1.2 注册账号

1. 点击右上角 **"Sign Up"**（注册）
2. 选择 **"Continue with GitHub"**（使用 GitHub 登录）
3. 授权 Vercel 访问您的 GitHub 账号
4. 完成注册

#### 1.3 登录成功

注册成功后会自动登录到 Vercel 控制台。

---

### 第 2 步：创建新项目

#### 2.1 添加新项目

1. 在 Vercel 控制台首页
2. 点击 **"Add New..."** 按钮
3. 选择 **"Project"**（项目）

#### 2.2 导入 GitHub 仓库

1. 在"Import Git Repository"页面
2. 找到您的仓库：**VunlerHoomer/CRR**
3. 点击旁边的 **"Import"**（导入）按钮

---

### 第 3 步：配置项目（重要！）

#### 3.1 基本配置

**一键复制以下配置：**

```
项目名称: crr-backend
```

#### 3.2 构建配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Framework Preset** | `Other` | 选择其他 |
| **Root Directory** | `backend` | ⚠️ 重要！ |
| **Build Command** | (留空) | 无需构建 |
| **Output Directory** | (留空) | 无需输出 |
| **Install Command** | `npm install` | 安装依赖 |

**复制粘贴用（Root Directory）：**

```
backend
```

#### 3.3 环境变量配置（重要！）

点击 **"Environment Variables"**（环境变量），添加以下变量：

##### 变量 1：MONGODB_URI

**变量名（复制）：**
```
MONGODB_URI
```

**变量值（暂时使用本地 MongoDB）：**
```
mongodb://localhost:27017/quiz-lottery
```

> ⚠️ 注意：Vercel 无法连接到您的本地 MongoDB！  
> 下一步我会教您使用 MongoDB Atlas（免费云数据库）

##### 变量 2：JWT_SECRET

**变量名（复制）：**
```
JWT_SECRET
```

**变量值（复制）：**
```
quiz-lottery-super-secret-jwt-key-2025
```

##### 变量 3：NODE_ENV

**变量名（复制）：**
```
NODE_ENV
```

**变量值（复制）：**
```
production
```

##### 变量 4：FRONTEND_URL

**变量名（复制）：**
```
FRONTEND_URL
```

**变量值（替换成您的 EdgeOne Pages 地址）：**
```
https://你的EdgeOne地址.edgeone.app
```

---

### 第 4 步：开始部署

1. 检查所有配置无误
2. 点击 **"Deploy"**（部署）按钮
3. 等待 2-5 分钟

#### 部署过程

您会看到：
- 📦 克隆代码
- 📥 安装依赖（npm install）
- 🚀 部署到 Vercel

---

### 第 5 步：获取后端 API 地址

部署成功后，Vercel 会分配一个域名，类似：

```
https://crr-backend.vercel.app
```

或：

```
https://crr-backend-vunlerhoomer.vercel.app
```

**复制这个地址！** 稍后会用到。

---

### 第 6 步：配置 MongoDB Atlas（免费云数据库）

#### 6.1 注册 MongoDB Atlas

1. 访问：**https://www.mongodb.com/cloud/atlas**
2. 点击 **"Try Free"**（免费试用）
3. 使用 Google 账号或邮箱注册

#### 6.2 创建免费集群

1. 登录后，点击 **"Build a Database"**
2. 选择 **"M0 FREE"**（免费方案）
3. 选择云服务商：**AWS**
4. 选择地区：**Singapore (ap-southeast-1)**（亚洲最近）
5. Cluster Name：`CRR-Cluster`
6. 点击 **"Create"**

#### 6.3 创建数据库用户

1. 在弹出的 Security Quickstart 中
2. 创建数据库用户：
   - Username: `crr_admin`
   - Password: `点击自动生成` 或自己设置
   - **记住密码！**
3. 点击 **"Create User"**

#### 6.4 配置网络访问

1. 在 Network Access 中
2. 点击 **"Add IP Address"**
3. 选择 **"Allow Access from Anywhere"**（允许任何地方访问）
4. 点击 **"Confirm"**

#### 6.5 获取连接字符串

1. 点击 **"Connect"**
2. 选择 **"Connect your application"**
3. 复制连接字符串，类似：
   ```
   mongodb+srv://crr_admin:<password>@crr-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. 将 `<password>` 替换为您的实际密码

---

### 第 7 步：更新 Vercel 环境变量

#### 7.1 访问 Vercel 项目设置

1. 进入 Vercel 控制台
2. 点击您的项目（crr-backend）
3. 点击 **"Settings"**（设置）
4. 点击 **"Environment Variables"**（环境变量）

#### 7.2 更新 MONGODB_URI

1. 找到 `MONGODB_URI` 变量
2. 点击编辑（铅笔图标）
3. 粘贴 MongoDB Atlas 连接字符串
4. 保存

#### 7.3 重新部署

1. 返回 **"Deployments"**（部署）页面
2. 点击最新的部署
3. 点击右上角 **"..."**
4. 选择 **"Redeploy"**（重新部署）
5. 确认重新部署

---

### 第 8 步：更新前端配置

#### 8.1 更新 EdgeOne Pages 环境变量

1. 访问 EdgeOne Pages 控制台
2. 进入您的项目（CRR）
3. 进入 **"设置"** → **"环境变量"**
4. 修改 `VITE_API_BASE_URL`：

**新值（复制并替换成您的 Vercel 地址）：**

```
https://crr-backend.vercel.app/api
```

> 将 `crr-backend.vercel.app` 替换成您实际的 Vercel 域名

5. 保存

#### 8.2 重新部署前端

1. 在 EdgeOne Pages 控制台
2. 点击 **"重新部署"** 或 **"Redeploy"**
3. 等待 2-5 分钟

---

### 第 9 步：测试

#### 9.1 访问网站

访问您的 EdgeOne Pages 网站

#### 9.2 测试登录

1. 点击"登录"
2. 输入手机号：`13800138000`
3. 输入验证码：`123456`
4. 点击登录

如果成功，说明前后端已连接！🎉

---

## 📊 部署后的完整架构

```
┌─────────────────────────────────────────┐
│ 前端（静态网站）                         │
│ EdgeOne Pages                           │
│ https://crr-xxxxx.edgeone.app          │
└─────────────────────────────────────────┘
            ↓ API 请求
┌─────────────────────────────────────────┐
│ 后端（Node.js API）                     │
│ Vercel                                  │
│ https://crr-backend.vercel.app/api     │
└─────────────────────────────────────────┘
            ↓ 数据存储
┌─────────────────────────────────────────┐
│ 数据库（MongoDB）                        │
│ MongoDB Atlas                           │
│ mongodb+srv://...                       │
└─────────────────────────────────────────┘
```

**全部免费！完全够用！** ✨

---

## 🔄 后续更新

### 更新后端代码

修改后端代码后：

```bash
git add .
git commit -m "更新后端 API"
git push
```

Vercel 会自动重新部署后端！

### 更新前端代码

修改前端代码后：

```bash
git add .
git commit -m "更新前端界面"
git push
```

EdgeOne Pages 会自动重新部署前端！

---

## 💰 费用说明

### Vercel 免费额度

- ✅ 每月 100GB 带宽
- ✅ 每天 100GB 构建时间
- ✅ 无限网站和 API
- ✅ 自动 HTTPS

### MongoDB Atlas 免费额度

- ✅ 512MB 存储
- ✅ 共享 RAM
- ✅ 适合个人项目和学习

### EdgeOne Pages 免费额度

- ✅ 每月 100GB 流量
- ✅ 每月 100 万次请求

**对于个人项目，完全免费！** 🎉

---

## ❓ 常见问题

### Q1: Vercel 部署失败？

**A**: 检查：
1. Root Directory 是否设置为 `backend`
2. vercel.json 文件是否已推送到 GitHub
3. 查看部署日志中的错误信息

### Q2: 连接 MongoDB Atlas 失败？

**A**: 检查：
1. 连接字符串中的密码是否正确
2. 网络访问是否设置为"允许任何地方"
3. 数据库用户是否已创建

### Q3: 前端仍然 405 错误？

**A**: 检查：
1. EdgeOne Pages 的 `VITE_API_BASE_URL` 是否更新
2. 是否重新部署了前端
3. 清除浏览器缓存

### Q4: CORS 跨域错误？

**A**: 后端需要配置 CORS，允许 EdgeOne Pages 域名访问。
我已经在代码中配置好了，如果还有问题，告诉我您的 EdgeOne 域名。

---

## 📚 相关文档

- Vercel 官方文档：https://vercel.com/docs
- MongoDB Atlas 文档：https://docs.atlas.mongodb.com/

---

**准备好了吗？现在开始部署！** 🚀

