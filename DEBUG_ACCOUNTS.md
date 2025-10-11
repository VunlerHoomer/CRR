# 调试账号信息

## 管理员账号
- **账号**: admin
- **密码**: admin123456
- **用途**: 后台管理系统登录

## 测试用户账号
- **账号**: 13032103211
- **密码**: Vunlershi123
- **用途**: 前端用户功能测试

## 使用说明

### 管理员登录
```bash
curl -X POST "https://crr-five.vercel.app/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

### 用户登录
```bash
curl -X POST "https://crr-five.vercel.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginType":"password","phone":"13032103211","password":"Vunlershi123"}'
```

### 任务API测试（需要用户认证）
```bash
# 获取区域列表
curl -H "Authorization: Bearer <TOKEN>" \
  "https://crr-five.vercel.app/api/task/areas/68e65f6b93917ac95df6a897"

# 获取区域任务
curl -H "Authorization: Bearer <TOKEN>" \
  "https://crr-five.vercel.app/api/task/area/68e81442c2de63f9e6bde880/tasks"

# 提交答案
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"answer":"4 七星池"}' \
  "https://crr-five.vercel.app/api/task/68e9e09c314f872dcb714182/submit"
```

## 注意事项
- 所有任务相关的API都需要用户认证
- 使用Bearer Token进行身份验证
- Token有效期为7天
- 请妥善保管账号密码信息

---
*创建时间: 2025-10-11*
*用途: 系统调试和测试*
