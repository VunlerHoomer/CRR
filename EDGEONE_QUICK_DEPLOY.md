# 🚀 EdgeOne Pages 快速部署参考卡

## 📋 EdgeOne Pages 配置参数

复制以下配置，粘贴到 EdgeOne Pages 控制台：

```
项目名称: crr-quiz-lottery
框架预设: Vite
根目录: frontend
构建命令: npm install && npm run build
输出目录: dist
Node.js 版本: 18.x
```

## 🔧 环境变量

```
VITE_API_BASE_URL = /api
```

> 注意：如果有独立的后端 API，需要修改为实际地址，例如：
> `https://your-backend-api.com/api`

## 🌐 访问控制台

**EdgeOne Pages 控制台**：
https://console.cloud.tencent.com/edgeone/pages

## 📝 部署步骤（5分钟搞定）

### 1️⃣ 登录控制台
访问 EdgeOne Pages 控制台并登录

### 2️⃣ 新建项目
点击"新建项目" → 选择"从 GitHub 导入"

### 3️⃣ 授权 GitHub
连接并授权您的 GitHub 账号

### 4️⃣ 选择仓库
- 仓库：`VunlerHoomer/CRR`
- 分支：`main`

### 5️⃣ 配置构建参数
复制上面的配置参数，填入对应位置

### 6️⃣ 添加环境变量
添加 `VITE_API_BASE_URL`

### 7️⃣ 开始部署
点击"部署"按钮，等待 2-5 分钟

### 8️⃣ 访问网站
部署成功后，访问分配的临时域名

## 🔗 临时域名格式

```
https://crr-quiz-lottery-xxxxx.edgeone.app
```

## 🎯 重定向规则配置（必需）

为了支持 Vue Router 的 history 模式，需要添加重定向规则：

```
源路径: /*
目标路径: /index.html
状态码: 200
```

配置位置：项目设置 → 重定向规则

## 📊 部署后检查清单

- [ ] 网站能正常访问
- [ ] 页面样式正常显示
- [ ] 路由跳转正常（刷新不会 404）
- [ ] API 请求正常（检查控制台）
- [ ] 图片和静态资源加载正常

## 🔄 后续更新

修改代码后，推送到 GitHub：

```bash
git add .
git commit -m "更新说明"
git push
```

EdgeOne Pages 会自动检测并重新部署（约 2-5 分钟）。

## 💡 常见问题快速解决

### 问题 1：页面空白
**检查**：浏览器控制台是否有错误
**解决**：通常是 API 地址配置问题

### 问题 2：刷新页面 404
**检查**：是否配置了重定向规则
**解决**：添加 `/* → /index.html` 重定向规则

### 问题 3：构建失败
**检查**：构建日志中的错误信息
**解决**：通常是依赖或配置问题，先本地测试 `npm run build`

## 📚 相关文档

- 详细部署指南：`docs/EDGEONE_DEPLOYMENT_GUIDE.md`
- 项目 README：`README.md`
- 开发指南：`docs/DEVELOPMENT.md`

---

**预计部署时间：5-10 分钟**

**准备好了吗？现在就开始部署吧！** 🎉

