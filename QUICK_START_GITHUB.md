# 🚀 GitHub 推送快速指南

## ⚡ 最简单的方法（推荐）

### 1️⃣ 在 GitHub 创建仓库
访问 https://github.com → 点击 "+" → "New repository" → 填写信息 → 创建

### 2️⃣ 复制仓库 URL
创建成功后，复制类似这样的 URL：
```
https://github.com/your-username/quiz-lottery-website.git
```

### 3️⃣ 运行推送脚本
在项目根目录执行：
```bash
./push-to-github.sh https://github.com/your-username/quiz-lottery-website.git
```

**就这么简单！** 🎉

---

## 🔧 如果是首次使用 Git

脚本会自动提示您输入 Git 用户信息，按提示操作即可。

---

## ❓ 常见问题

### Q1: 推送时要求输入密码？
**A**: GitHub 已不支持密码认证，需要：
- 使用 **Personal Access Token**（推荐新手）
- 或配置 **SSH 密钥**（推荐熟练用户）

详见：`docs/GITHUB_GUIDE.md` 第 4 节

### Q2: 提示 "Repository not found"？
**A**: 检查：
1. 仓库 URL 是否正确
2. 是否已在 GitHub 创建该仓库
3. 是否有仓库访问权限

### Q3: 推送很慢或失败？
**A**: 可能是网络问题，建议：
1. 使用稳定的网络环境
2. 如果在国内，考虑使用代理或 Gitee

---

## 📝 后续更新代码

修改代码后，推送更新只需 3 步：

```bash
git add .
git commit -m "更新说明"
git push
```

---

## 📚 完整文档

查看详细教程：`docs/GITHUB_GUIDE.md`

---

**祝您使用愉快！** 🎊

