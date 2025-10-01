# 🎊 最后配置步骤 - 完成部署

## ✅ 当前状态

- ✅ 前端已部署到 EdgeOne Pages
- ✅ 后端已部署到 Vercel
- ✅ 数据库已连接到 MongoDB Atlas

**所有基础设施已就绪！**

---

## 🎯 最后 2 步

### 第 1 步：连接前端和后端（必做）

#### 更新 EdgeOne Pages 环境变量

1. **访问控制台**：https://console.cloud.tencent.com/edgeone/pages
2. **进入项目**：CRR
3. **进入设置**：Settings → Environment Variables
4. **编辑变量**：找到 `VITE_API_BASE_URL`，点击编辑
5. **修改值为**（一键复制）：

```
https://crr-five.vercel.app/api
```

6. **保存**：点击 Save
7. **重新部署**：点击 Redeploy 或重新部署
8. **等待**：2-5 分钟

---

### 第 2 步：初始化数据库（推荐）

数据库现在是空的，需要创建初始数据。

#### 方法 1：使用 API 手动创建（简单）

##### 1.1 创建管理员账号

在终端执行：

```bash
curl -X POST https://crr-five.vercel.app/api/admin/auth/create-first-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123456",
    "email": "admin@example.com"
  }'
```

##### 1.2 创建测试用户

```bash
curl -X POST https://crr-five.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "code": "123456",
    "nickname": "测试用户",
    "password": "123456"
  }'
```

##### 1.3 创建测试题目

登录管理后台后，在题目管理中手动添加。

##### 1.4 创建抽签活动

登录管理后台后，在抽签管理中手动添加。

#### 方法 2：连接本地 MongoDB（复杂）

1. 本地启动项目
2. 连接到 MongoDB Atlas
3. 运行初始化脚本

---

## 🧪 测试完整系统

### 1. 访问前端网站

访问您的 EdgeOne Pages 网站：
```
https://您的EdgeOne域名.edgeone.app
```

### 2. 测试用户注册

1. 点击"注册"
2. 输入手机号：`13800138000`
3. 输入验证码：`123456`
4. 设置昵称和密码
5. 注册成功！

### 3. 测试用户登录

1. 点击"登录"
2. 选择"用户登录"
3. 输入手机号和验证码（或密码）
4. 登录成功！

### 4. 测试管理员登录

1. 点击"登录"
2. 选择"管理员登录"
3. 用户名：`admin`
4. 密码：`admin123456`
5. 进入管理后台

### 5. 测试答题和抽签

需要先在管理后台添加题目和抽签活动。

---

## 📊 完整架构总览

```
前端：EdgeOne Pages
  ↓
  环境变量：VITE_API_BASE_URL = https://crr-five.vercel.app/api
  ↓
后端：Vercel (https://crr-five.vercel.app)
  ↓
  环境变量：
    - MONGODB_URI = mongodb+srv://...
    - JWT_SECRET = quiz-lottery-super-secret-jwt-key-2025
    - NODE_ENV = production
  ↓
数据库：MongoDB Atlas
  ✅ 已连接
```

---

## 🔄 后续更新流程

### 更新前端

```bash
# 修改前端代码后
git add .
git commit -m "更新前端"
git push
# EdgeOne Pages 自动部署
```

### 更新后端

```bash
# 修改后端代码后
git add .
git commit -m "更新后端"
git push
# Vercel 自动部署
```

---

## 💰 成本说明

### 全部免费！

- **EdgeOne Pages**：每月 100GB 流量（免费）
- **Vercel**：每月 100GB 带宽（免费）
- **MongoDB Atlas**：512MB 存储（免费）

对于个人项目完全够用！

---

## 🎊 恭喜您！

您的答题抽签互动网站已经完全部署到云端了！

**现在请告诉我您的 EdgeOne Pages 域名，我帮您完成最后的前端配置！** 🚀

