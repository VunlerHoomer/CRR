# 🚀 GitHub 推送完整指南

本指南将手把手教您如何将项目推送到 GitHub。

## 📋 目录

1. [在 GitHub 创建仓库](#1-在-github-创建仓库)
2. [使用自动化脚本推送](#2-使用自动化脚本推送推荐)
3. [手动推送方法](#3-手动推送方法)
4. [常见问题解决](#4-常见问题解决)
5. [后续更新操作](#5-后续更新操作)

---

## 1. 在 GitHub 创建仓库

### 步骤 1：登录 GitHub
1. 打开浏览器，访问 [https://github.com](https://github.com)
2. 登录您的 GitHub 账号

### 步骤 2：创建新仓库
1. 点击右上角的 **"+"** 号
2. 选择 **"New repository"**

### 步骤 3：填写仓库信息

| 字段 | 建议值 | 说明 |
|------|--------|------|
| **Repository name** | `quiz-lottery-website` | 仓库名称（可自定义） |
| **Description** | `答题抽签互动网站 - 基于 Vue.js + Node.js + MongoDB` | 项目描述 |
| **Public/Private** | `Public` 或 `Private` | 公开或私有 |

### ⚠️ 重要：不要勾选以下选项

- ❌ **Initialize this repository with a README**
- ❌ **Add .gitignore**
- ❌ **Add a license**

> 因为我们本地已经有这些文件了

### 步骤 4：创建仓库
1. 点击 **"Create repository"** 按钮
2. 创建成功后，会显示仓库页面
3. **复制仓库 URL**，格式如下：
   ```
   https://github.com/your-username/quiz-lottery-website.git
   ```

---

## 2. 使用自动化脚本推送（推荐）

我们已经为您准备了一键推送脚本，非常简单！

### 使用方法

在项目根目录执行：

```bash
./push-to-github.sh https://github.com/your-username/quiz-lottery-website.git
```

> 将 `your-username` 替换为您的 GitHub 用户名

### 带自定义提交信息

```bash
./push-to-github.sh https://github.com/your-username/quiz-lottery-website.git "Initial commit"
```

### 脚本会自动完成：

1. ✅ 检查 Git 配置（如未配置会提示输入）
2. ✅ 初始化 Git 仓库
3. ✅ 添加所有文件到暂存区
4. ✅ 创建提交
5. ✅ 连接远程仓库
6. ✅ 推送到 GitHub

---

## 3. 手动推送方法

如果您想手动操作，可以按以下步骤进行：

### 步骤 1：配置 Git 用户信息（首次使用）

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### 步骤 2：初始化 Git 仓库

```bash
git init
```

### 步骤 3：添加文件到暂存区

```bash
git add .
```

### 步骤 4：创建提交

```bash
git commit -m "Initial commit: 答题抽签互动网站完整项目"
```

### 步骤 5：连接远程仓库

```bash
git remote add origin https://github.com/your-username/quiz-lottery-website.git
```

> 将 `your-username` 替换为您的 GitHub 用户名

### 步骤 6：推送到 GitHub

```bash
git branch -M main
git push -u origin main
```

---

## 4. 常见问题解决

### ❌ 问题 1：推送时要求输入用户名和密码

**原因**：GitHub 已不支持密码认证，需要使用 Personal Access Token

**解决方法**：

#### 方案 A：使用 Personal Access Token（推荐）

1. 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成 token 并复制
5. 推送时，用户名输入 GitHub 用户名，密码输入 token

#### 方案 B：使用 SSH（更方便）

1. 生成 SSH 密钥：
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   ```

2. 查看公钥：
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

3. 复制公钥内容，添加到 GitHub：
   Settings → SSH and GPG keys → New SSH key

4. 修改远程仓库 URL 为 SSH 格式：
   ```bash
   git remote set-url origin git@github.com:your-username/quiz-lottery-website.git
   ```

### ❌ 问题 2：推送失败，提示 "remote: Repository not found"

**原因**：仓库 URL 错误或没有权限

**解决方法**：
1. 检查仓库 URL 是否正确
2. 确保已在 GitHub 创建该仓库
3. 确认您有该仓库的访问权限

### ❌ 问题 3：推送失败，提示 "Updates were rejected"

**原因**：远程仓库有本地没有的提交

**解决方法**：
```bash
git pull origin main --rebase
git push origin main
```

### ❌ 问题 4：提示 Git 用户名/邮箱未配置

**解决方法**：
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

## 5. 后续更新操作

当您修改代码后，想要更新到 GitHub：

### 方法 1：快速更新

```bash
git add .
git commit -m "更新说明"
git push
```

### 方法 2：查看修改后再提交

```bash
# 查看修改了哪些文件
git status

# 查看具体修改内容
git diff

# 添加特定文件
git add file1.js file2.js

# 或添加所有文件
git add .

# 提交
git commit -m "更新说明"

# 推送
git push
```

---

## 📝 Git 常用命令速查

| 命令 | 说明 |
|------|------|
| `git status` | 查看当前状态 |
| `git log` | 查看提交历史 |
| `git diff` | 查看修改内容 |
| `git add .` | 添加所有修改 |
| `git commit -m "msg"` | 创建提交 |
| `git push` | 推送到远程 |
| `git pull` | 拉取远程更新 |
| `git branch` | 查看分支 |
| `git checkout -b dev` | 创建并切换到 dev 分支 |
| `git remote -v` | 查看远程仓库 |

---

## 🎯 最佳实践

1. **频繁提交**：每完成一个小功能就提交一次
2. **清晰的提交信息**：描述清楚这次修改了什么
3. **使用分支**：新功能在新分支开发，完成后合并
4. **.gitignore**：不要上传敏感信息（密码、密钥）和不必要的文件（node_modules）
5. **README.md**：保持项目说明文档的更新

---

## 🔐 安全提示

### ⚠️ 不要上传的内容：

- ❌ `.env` 文件（包含敏感信息）
- ❌ `node_modules/` 目录（依赖包）
- ❌ 数据库文件
- ❌ API 密钥、密码
- ❌ 用户上传的文件

### ✅ 已配置的 .gitignore 会自动忽略：

- `node_modules/`
- `.env`
- `*.log`
- `dist/`
- 等等...

---

## 📚 相关资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 官方文档](https://docs.github.com)
- [Git 简明指南](https://rogerdudler.github.io/git-guide/index.zh.html)
- [GitHub SSH 配置指南](https://docs.github.com/zh/authentication/connecting-to-github-with-ssh)

---

## 🆘 需要帮助？

如果遇到问题：
1. 查看本文档的"常见问题解决"部分
2. 搜索错误信息
3. 访问 [GitHub Community](https://github.community/)
4. 提交 Issue

---

**祝您使用愉快！🚀**

