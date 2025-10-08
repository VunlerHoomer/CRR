# Vercel 自定义域名配置指南

## 🎯 目标
将网站部署到自定义域名：**szcityrunride.com**

---

## 📋 配置步骤

### 步骤 1: Vercel 前端域名配置

#### 1.1 登录 Vercel
访问：https://vercel.com/dashboard

#### 1.2 配置主域名
1. 找到前端项目（可能叫 crr-frontend 或 web_develop）
2. 点击项目 → **Settings** → **Domains**
3. 输入 `szcityrunride.com` → 点击 **Add**
4. 输入 `www.szcityrunride.com` → 点击 **Add**

---

### 步骤 2: Vercel 后端域名配置

#### 2.1 配置 API 域名
1. 找到后端项目（可能叫 crr-five）
2. 点击项目 → **Settings** → **Domains**
3. 输入 `api.szcityrunride.com` → 点击 **Add**

---

### 步骤 3: DNS 配置

在您的域名注册商（阿里云/腾讯云/其他）管理后台配置以下 DNS 记录：

#### 3.1 主域名配置
```
类型: A
主机记录: @
记录值: 76.76.21.21
TTL: 600
```

#### 3.2 WWW 子域名配置
```
类型: CNAME
主机记录: www
记录值: cname.vercel-dns.com
TTL: 600
```

#### 3.3 API 子域名配置
```
类型: CNAME
主机记录: api
记录值: cname.vercel-dns.com
TTL: 600
```

---

### 步骤 4: 更新前端环境变量

#### 4.1 在 Vercel 前端项目中
1. 进入 **Settings** → **Environment Variables**
2. 找到 `VITE_API_BASE_URL`（如果没有则创建）
3. 设置值为：`https://api.szcityrunride.com/api`
4. 确保选择 **Production** 环境
5. 点击 **Save**

#### 4.2 重新部署
1. 进入 **Deployments** 标签
2. 点击最新部署旁的 `...` → **Redeploy**
3. 确认重新部署

---

### 步骤 5: 验证配置

#### 5.1 等待 DNS 传播
DNS 传播通常需要 **5-30 分钟**，请耐心等待。

#### 5.2 检查 DNS
在命令行运行：
```bash
nslookup szcityrunride.com
nslookup api.szcityrunride.com
```

#### 5.3 访问测试
1. **主站**: https://szcityrunride.com
2. **API**: https://api.szcityrunride.com/api/health

#### 5.4 SSL 证书
Vercel 会自动申请和配置 SSL 证书，通常在 DNS 配置后 10-20 分钟内完成。

---

## 🔧 配置示例

### 阿里云 DNS 配置示例

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |
| CNAME | api | cname.vercel-dns.com | 600 |

### 腾讯云 DNS 配置示例

| 记录类型 | 主机记录 | 记录值 | 线路类型 | TTL |
|---------|---------|--------|---------|-----|
| A | @ | 76.76.21.21 | 默认 | 600 |
| CNAME | www | cname.vercel-dns.com | 默认 | 600 |
| CNAME | api | cname.vercel-dns.com | 默认 | 600 |

---

## ⚠️ 重要注意事项

### 1. ICP 备案
- ✅ 您的域名已在国内注册
- ⚠️ Vercel 是海外服务，**无需 ICP 备案**即可使用
- ℹ️ 但国内访问速度可能比国内服务器慢

### 2. 访问速度
- **海外访问**: 快速（Vercel 全球 CDN）
- **国内访问**: 可能较慢（建议使用国内 CDN 加速或迁移到国内服务）

### 3. 替代方案（如需国内加速）
- 使用腾讯云 EdgeOne Pages（需要 ICP 备案）
- 使用阿里云 OSS + CDN（需要 ICP 备案）
- 使用腾讯云 COS + CDN（需要 ICP 备案）

---

## 📞 技术支持

### Vercel 相关问题
- 官方文档: https://vercel.com/docs/concepts/projects/domains
- 支持邮箱: support@vercel.com

### DNS 相关问题
- 联系您的域名注册商客服
- 使用 DNS 检查工具: https://dnschecker.org

---

## ✅ 配置检查清单

完成以下所有步骤后，您的网站将在自定义域名上运行：

- [ ] Vercel 前端添加 szcityrunride.com
- [ ] Vercel 前端添加 www.szcityrunride.com  
- [ ] Vercel 后端添加 api.szcityrunride.com
- [ ] DNS 配置 A 记录 (@ → 76.76.21.21)
- [ ] DNS 配置 CNAME (www → cname.vercel-dns.com)
- [ ] DNS 配置 CNAME (api → cname.vercel-dns.com)
- [ ] 更新 Vercel 环境变量 VITE_API_BASE_URL
- [ ] 重新部署前端
- [ ] 等待 DNS 传播（5-30 分钟）
- [ ] 测试主域名访问
- [ ] 测试 API 访问
- [ ] 确认 SSL 证书已签发

---

**配置时间**: 预计 30-60 分钟（包括 DNS 传播）
**技术难度**: ⭐⭐☆☆☆（中等偏易）

