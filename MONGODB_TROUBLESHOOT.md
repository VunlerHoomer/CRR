# 🔍 MongoDB Atlas 连接问题完整排查指南

## 📋 问题现状

```json
{
  "database": "未连接"
}
```

---

## ✅ 完整排查清单

### 检查项 1：MongoDB Atlas 用户密码

**在 MongoDB Atlas 控制台 → Database Access**

请确认：
- [ ] 用户名是：`crr_admin`
- [ ] 密码记住了（例如：`CRR2025Admin!`）
- [ ] Built-in Role 是：`Atlas admin` 或 `Read and write to any database`

---

### 检查项 2：MongoDB Atlas 网络访问

**在 MongoDB Atlas 控制台 → Network Access**

请确认：
- [ ] 有一个条目：`0.0.0.0/0`
- [ ] Status（状态）是：**Active**（绿色）
- [ ] 如果状态是 Pending，等待变成 Active

---

### 检查项 3：Vercel 环境变量

**在 Vercel 控制台 → Settings → Environment Variables**

请确认 `MONGODB_URI` 的值：

#### 如果密码是 `CRR2025Admin!`（带感叹号）

**必须使用编码后的（! → %21）：**
```
mongodb+srv://crr_admin:CRR2025Admin%21@crr-cluster.uicl6to.mongodb.net/quiz-lottery?retryWrites=true&w=majority&appName=CRR-Cluster
```

#### 如果密码是 `CRR2025Admin`（无感叹号）

**使用原密码即可：**
```
mongodb+srv://crr_admin:CRR2025Admin@crr-cluster.uicl6to.mongodb.net/quiz-lottery?retryWrites=true&w=majority&appName=CRR-Cluster
```

**重点检查**：
- [ ] 密码部分是否正确
- [ ] 是否包含 `/quiz-lottery`
- [ ] 是否选择了 Production 环境
- [ ] 没有多余的空格

---

### 检查项 4：Vercel 重新部署

**在 Vercel 控制台 → Deployments**

请确认：
- [ ] 环境变量修改后，是否点击了 Redeploy？
- [ ] 最新部署的时间是否在环境变量修改之后？
- [ ] 部署状态是否为 Ready（成功）？

---

### 检查项 5：查看 Vercel 函数日志

**在 Vercel 控制台 → 最新部署 → Runtime Logs**

1. 访问一次 `/api/health`
2. 查看日志中的错误信息

**常见错误**：
- `MongoServerError: bad auth` → 用户名或密码错误
- `MongooseServerSelectionError` → 网络访问问题
- `ENOTFOUND` → 集群地址错误

---

## 🔧 解决方案（按顺序尝试）

### 方案 1：使用更简单的密码（推荐）

**最简单的解决办法：重置密码为不含特殊字符的！**

#### 步骤：

1. **在 MongoDB Atlas**：
   - Database Access → 找到 `crr_admin`
   - 点击 "Edit"
   - 点击 "Edit Password"
   - 设置新密码（一键复制）：
     ```
     CRR2025Admin
     ```
   - 点击 "Update User"

2. **更新 Vercel 环境变量**：
   ```
   mongodb+srv://crr_admin:CRR2025Admin@crr-cluster.uicl6to.mongodb.net/quiz-lottery?retryWrites=true&w=majority&appName=CRR-Cluster
   ```

3. **Redeploy Vercel**

4. **测试**

---

### 方案 2：检查连接字符串格式

请仔细对比您在 Vercel 中的 MONGODB_URI 和下面的格式：

**标准格式：**
```
mongodb+srv://[用户名]:[密码]@[集群地址]/[数据库名]?retryWrites=true&w=majority&appName=CRR-Cluster
```

**您的应该是：**
```
mongodb+srv://crr_admin:CRR2025Admin%21@crr-cluster.uicl6to.mongodb.net/quiz-lottery?retryWrites=true&w=majority&appName=CRR-Cluster
```

**检查要点：**
- [ ] 用户名：`crr_admin`
- [ ] 密码：`CRR2025Admin%21` 或 `CRR2025Admin`
- [ ] 集群地址：`crr-cluster.uicl6to.mongodb.net`
- [ ] 数据库名：`/quiz-lottery`（在 .net 后面）
- [ ] 参数：`?retryWrites=true&w=majority&appName=CRR-Cluster`

---

### 方案 3：测试连接字符串

让我帮您在本地测试连接字符串是否正确。

请告诉我：
1. 您在 MongoDB Atlas 设置的实际密码是什么？
2. 您在 Vercel 环境变量中填入的 MONGODB_URI 完整内容是什么？

我可以帮您验证格式是否正确。

---

## 📸 请截图给我看

如果方便，请截图以下内容：

1. **Vercel Environment Variables** 中的 MONGODB_URI（可以隐藏部分密码）
2. **MongoDB Atlas Network Access** 页面
3. **MongoDB Atlas Database Access** 页面
4. **Vercel Runtime Logs** 中的错误信息

---

## 🎯 快速测试方法

我为您准备了一个本地测试脚本：

EOF
