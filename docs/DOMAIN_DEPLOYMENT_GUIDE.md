# 自定义域名部署指南

## 域名信息
- **域名**: szcityrunride.com
- **注册商**: 国内域名注册商
- **前端部署**: Vercel
- **后端部署**: Vercel

---

## 部署步骤

### 一、Vercel 前端域名配置

#### 1. 访问 Vercel 项目设置
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到您的前端项目（crr-frontend 或类似名称）
3. 点击项目进入详情页

#### 2. 添加自定义域名
1. 点击顶部 **Settings** 标签
2. 在左侧菜单选择 **Domains**
3. 在输入框中输入：`szcityrunride.com`
4. 点击 **Add** 按钮

#### 3. 配置 www 子域名（可选但推荐）
1. 同样在 Domains 页面
2. 添加：`www.szcityrunride.com`
3. 点击 **Add** 按钮

---

### 二、DNS 记录配置

Vercel 会提供 DNS 配置信息，您需要在域名注册商处添加以下记录：

#### 方案 A：使用 A 记录（推荐）

在您的域名 DNS 管理面板添加以下记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

#### 方案 B：使用 CNAME 记录

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| CNAME | @ | cname.vercel-dns.com | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

**注意**：部分域名注册商不支持根域名（@）使用 CNAME，此时请使用方案 A。

---

### 三、Vercel 后端域名配置

#### 1. 后端 API 域名配置
1. 在 Vercel Dashboard 找到您的后端项目（crr-five 或类似名称）
2. 进入 **Settings** > **Domains**
3. 添加：`api.szcityrunride.com`

#### 2. 添加 DNS 记录

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| CNAME | api | cname.vercel-dns.com | 600 |

---

### 四、更新前端环境变量

#### 1. 在 Vercel 前端项目中更新环境变量
1. 进入前端项目 **Settings** > **Environment Variables**
2. 找到 `VITE_API_BASE_URL` 变量
3. 更新值为：`https://api.szcityrunride.com/api`
4. 点击 **Save**

#### 2. 重新部署前端
1. 进入 **Deployments** 标签
2. 点击最新部署右侧的三个点 `...`
3. 选择 **Redeploy**
4. 勾选 **Use existing Build Cache**（可选）
5. 点击 **Redeploy**

---

### 五、SSL 证书配置

Vercel 会自动为您的域名申请和配置 Let's Encrypt SSL 证书：

1. **自动配置**：DNS 配置正确后，Vercel 会在几分钟内自动申请证书
2. **验证状态**：在 Domains 页面查看证书状态
3. **HTTPS 强制**：Vercel 默认强制 HTTPS，无需额外配置

---

### 六、ICP 备案（中国大陆必需）

由于您的域名是国内注册的，如果网站需要在中国大陆访问，需要完成 ICP 备案：

#### 1. 备案准备
- **域名**: szcityrunride.com
- **服务器**: Vercel（海外服务器）
- **主体信息**: 个人或企业信息

#### 2. 备案说明
**重要**：Vercel 是海外服务，如果您希望在中国大陆获得最佳访问速度，建议考虑以下方案：

**方案 A：继续使用 Vercel（无需备案）**
- ✅ 优点：部署简单，全球 CDN
- ❌ 缺点：国内访问可能较慢

**方案 B：使用国内 CDN + Vercel**
- ✅ 优点：国内访问快速
- ❌ 缺点：需要 ICP 备案，配置复杂

**方案 C：完全迁移到国内云服务**
- ✅ 优点：最佳国内访问速度
- ❌ 缺点：需要 ICP 备案，部署较复杂

#### 3. 备案流程（如需要）
1. 前往域名注册商的备案平台
2. 提交备案申请
3. 填写网站信息
4. 等待审核（通常 7-20 个工作日）
5. 备案成功后，在网站底部添加备案号

---

### 七、域名 DNS 配置完整示例

假设您在阿里云/腾讯云注册域名，DNS 配置如下：

```
记录类型: A
主机记录: @
记录值: 76.76.21.21
TTL: 600
说明: 主域名指向 Vercel

记录类型: CNAME
主机记录: www
记录值: cname.vercel-dns.com
TTL: 600
说明: www 子域名

记录类型: CNAME
主机记录: api
记录值: cname.vercel-dns.com
TTL: 600
说明: API 后端域名
```

---

### 八、验证部署

#### 1. DNS 传播检查
等待 DNS 传播（通常需要 5-30 分钟），可以使用以下工具检查：
- [DNS Checker](https://dnschecker.org/)
- 命令行：`nslookup szcityrunride.com`

#### 2. 访问测试
1. **主域名**: https://szcityrunride.com
2. **WWW 域名**: https://www.szcityrunride.com
3. **API 域名**: https://api.szcityrunride.com/api/health

#### 3. SSL 证书验证
1. 浏览器地址栏应显示 🔒 锁图标
2. 点击锁图标查看证书详情
3. 证书应为 Let's Encrypt 签发

---

### 九、常见问题

#### Q1: DNS 配置后网站无法访问
**A**: DNS 传播需要时间，请等待 5-30 分钟。可以使用 `nslookup szcityrunride.com` 检查 DNS 是否生效。

#### Q2: SSL 证书未自动签发
**A**: 
1. 确认 DNS 记录配置正确
2. 等待 10-20 分钟
3. 在 Vercel Domains 页面点击域名旁的 **Refresh** 按钮

#### Q3: 国内访问速度慢
**A**: 
1. Vercel 服务器在海外，国内访问可能较慢
2. 考虑使用国内 CDN 加速
3. 或完全迁移到国内云服务（需要 ICP 备案）

#### Q4: API 请求失败
**A**: 
1. 确认已更新前端环境变量 `VITE_API_BASE_URL`
2. 确认已重新部署前端
3. 检查 CORS 配置是否包含新域名

---

### 十、后续优化建议

1. **性能优化**
   - 启用 Vercel Analytics
   - 配置图片优化
   - 使用 CDN 加速静态资源

2. **监控告警**
   - 配置 Vercel 日志监控
   - 设置域名到期提醒
   - SSL 证书自动续期检查

3. **SEO 优化**
   - 配置 Google Search Console
   - 提交 sitemap
   - 配置 robots.txt

4. **安全加固**
   - 配置 Security Headers
   - 启用 CSP（Content Security Policy）
   - 定期检查依赖安全

---

## 快速开始检查清单

- [ ] 在 Vercel 前端项目添加 `szcityrunride.com`
- [ ] 在 Vercel 前端项目添加 `www.szcityrunride.com`
- [ ] 在 Vercel 后端项目添加 `api.szcityrunride.com`
- [ ] 在域名 DNS 添加 A 记录：@ -> 76.76.21.21
- [ ] 在域名 DNS 添加 CNAME 记录：www -> cname.vercel-dns.com
- [ ] 在域名 DNS 添加 CNAME 记录：api -> cname.vercel-dns.com
- [ ] 更新前端环境变量 `VITE_API_BASE_URL` 为 `https://api.szcityrunride.com/api`
- [ ] 重新部署前端项目
- [ ] 等待 DNS 传播（5-30 分钟）
- [ ] 验证主域名访问：https://szcityrunride.com
- [ ] 验证 API 访问：https://api.szcityrunride.com/api/health
- [ ] 检查 SSL 证书状态
- [ ] 测试完整用户流程

---

## 联系支持

如遇到问题，可以：
1. 查看 [Vercel 官方文档](https://vercel.com/docs/concepts/projects/domains)
2. 联系域名注册商客服
3. 查看 Vercel Dashboard 的错误提示

---

**最后更新**: 2025-10-08
**文档版本**: 1.0

