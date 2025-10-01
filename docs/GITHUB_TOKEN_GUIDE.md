# 🔐 GitHub Personal Access Token 配置指南

## 为什么需要 Personal Access Token？

从 2021 年 8 月 13 日开始，GitHub 不再支持使用密码进行 Git 操作的身份验证。您需要使用 **Personal Access Token (PAT)** 来代替密码。

---

## 📝 创建 Personal Access Token（图文教程）

### 步骤 1：访问 Token 设置页面

**直接访问**：[https://github.com/settings/tokens](https://github.com/settings/tokens)

**或手动导航**：
1. 登录 GitHub
2. 点击右上角头像 → **Settings**
3. 左侧菜单最下方 → **Developer settings**
4. 左侧菜单 → **Personal access tokens** → **Tokens (classic)**

### 步骤 2：生成新 Token

1. 点击右上角 **"Generate new token"** 按钮
2. 选择 **"Generate new token (classic)"**

### 步骤 3：配置 Token

填写以下信息：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Note（备注）** | `CRR Project` | Token 的用途说明 |
| **Expiration（有效期）** | `90 days` 或 `No expiration` | 建议新手选 No expiration |
| **Select scopes（权限）** | ✅ `repo` | 勾选 repo 下的所有权限 |

**重要**：必须勾选 `repo` 权限，这样才能推送代码！

### 步骤 4：生成并复制 Token

1. 滚动到页面底部
2. 点击绿色的 **"Generate token"** 按钮
3. ⚠️ **非常重要**：立即复制生成的 token
   - Token 格式类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **这个 token 只会显示一次！**
   - 复制后保存到安全的地方

---

## 🚀 使用 Token 推送代码

### 方法 1：在推送时输入（推荐）

执行推送命令：

```bash
git push -u origin main
```

系统会提示输入用户名和密码：

```
Username for 'https://github.com': VunlerHoomer
Password for 'https://VunlerHoomer@github.com': [粘贴您的 token]
```

**注意**：
- 用户名：`VunlerHoomer`（您的 GitHub 用户名）
- 密码：**粘贴刚才复制的 token**（不是 GitHub 密码！）
- 输入密码时不会显示任何字符，这是正常的

### 方法 2：配置 Git 凭据管理器（推荐长期使用）

#### macOS 用户（您的情况）：

```bash
# 配置使用 macOS Keychain 存储凭据
git config --global credential.helper osxkeychain
```

之后第一次推送时输入 token，系统会自动保存，以后就不用再输入了。

#### 其他系统：

**Windows**：
```bash
git config --global credential.helper wincred
```

**Linux**：
```bash
git config --global credential.helper store
```

### 方法 3：在 URL 中包含 Token（不推荐，不安全）

```bash
git remote set-url origin https://VunlerHoomer:ghp_your_token_here@github.com/VunlerHoomer/CRR.git
```

⚠️ **不推荐**：Token 会保存在明文中，有安全风险。

---

## 🔄 现在继续推送项目

### 完整推送步骤

1. **确保 Token 已复制**

2. **执行推送命令**：

```bash
cd /Users/vunler/web_develop
git push -u origin main
```

3. **输入凭据**：
   - Username: `VunlerHoomer`
   - Password: `粘贴您的 token`

4. **等待推送完成**

---

## ❓ 常见问题

### Q1: Token 丢失了怎么办？

**A**: Token 只显示一次，如果丢失：
1. 回到 https://github.com/settings/tokens
2. 删除旧 token
3. 重新生成一个新的

### Q2: 推送时提示 "Authentication failed"？

**A**: 可能的原因：
- Token 复制不完整
- Token 权限不足（需要勾选 `repo`）
- Token 已过期
- 用户名输入错误

**解决方法**：
1. 重新生成 token
2. 确保勾选 `repo` 权限
3. 检查用户名是否正确

### Q3: 每次都要输入 token 太麻烦？

**A**: 配置凭据管理器：

```bash
# macOS
git config --global credential.helper osxkeychain

# 然后第一次输入后就会自动保存
git push -u origin main
```

### Q4: Token 有效期应该选多久？

**A**: 
- **新手**：选 `No expiration`（永不过期）
- **安全考虑**：选 `90 days`，到期前 GitHub 会邮件提醒

---

## 🔐 安全提示

### ✅ 安全建议：

1. **不要分享 Token**：Token 等同于密码
2. **不要提交到代码仓库**：.gitignore 已配置忽略 .env
3. **定期更新 Token**：建议每 3-6 个月更换一次
4. **最小权限原则**：只勾选必需的权限
5. **删除不用的 Token**：及时清理旧 token

### ⚠️ 如果 Token 泄露：

1. 立即访问 https://github.com/settings/tokens
2. 找到泄露的 token
3. 点击 **Delete**
4. 生成新的 token

---

## 📚 相关链接

- [GitHub Token 官方文档](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub CLI 工具](https://cli.github.com/)（另一种认证方式）

---

## 🎯 快速开始

**准备好了吗？按照以下步骤操作：**

1. ✅ 访问 https://github.com/settings/tokens
2. ✅ 生成 token 并复制
3. ✅ 执行：`git push -u origin main`
4. ✅ 输入用户名和 token
5. ✅ 完成！🎉

---

**祝您推送成功！** 🚀

