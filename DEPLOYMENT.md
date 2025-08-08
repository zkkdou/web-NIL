# 生产服务器部署指南

## 📋 概述

本指南将帮助您在生产服务器 `124.220.134.33` 上部署表单处理服务，解决"服务端解析JSON失败"的问题。

## 🎯 解决方案

### 方案1：独立API服务（推荐）

部署一个独立的Node.js服务来处理表单提交，避免与现有网站服务冲突。

### 方案2：修改现有服务

如果您的生产服务器支持，可以直接修改现有服务来处理表单提交。

## 🚀 部署步骤

### 步骤1：准备文件

确保以下文件已准备好：
- `server-production.js` - 生产服务器脚本
- `package.json` - 项目依赖
- `pages/contact.html` - 已更新的联系表单

### 步骤2：上传到服务器

将整个项目上传到生产服务器：
```bash
# 使用SCP上传（示例）
scp -r ./* user@124.220.134.33:/var/www/weinan-contact/
```

### 步骤3：安装依赖

在服务器上安装Node.js依赖：
```bash
cd /var/www/weinan-contact/
npm install
```

### 步骤4：启动服务

#### 方法A：直接启动
```bash
node server-production.js
```

#### 方法B：使用PM2（推荐）
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server-production.js --name "weinan-contact-api"

# 设置开机自启
pm2 startup
pm2 save
```

#### 方法C：使用系统服务
```bash
# 创建systemd服务文件
sudo nano /etc/systemd/system/weinan-contact.service
```

服务文件内容：
```ini
[Unit]
Description=Weinan Contact Form API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/weinan-contact
ExecStart=/usr/bin/node server-production.js
Restart=always
Environment=PORT=3000
Environment=RECORD_DIR=/var/www/record

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl enable weinan-contact
sudo systemctl start weinan-contact
sudo systemctl status weinan-contact
```

## 🔧 配置说明

### 端口配置
- **默认端口**: 3000
- **环境变量**: `PORT=3000`
- **避免冲突**: 不与现有80端口服务冲突

### 数据存储
- **存储路径**: `/var/www/record/contact_forms.csv`
- **环境变量**: `RECORD_DIR=/var/www/record`
- **文件格式**: CSV格式，支持中文

### 安全配置
- **CORS**: 允许所有来源（可根据需要限制）
- **验证**: 必填字段验证
- **日志**: 详细请求日志

## 📊 监控和日志

### 查看日志
```bash
# PM2日志
pm2 logs weinan-contact-api

# 系统服务日志
sudo journalctl -u weinan-contact -f

# 直接查看输出
node server-production.js
```

### 查看数据
```bash
# 查看表单数据
cat /var/www/record/contact_forms.csv

# 实时监控
tail -f /var/www/record/contact_forms.csv
```

## 🧪 测试

### 1. 测试API端点
```bash
curl -X POST http://124.220.134.33:3000/ \
  -d "name=测试用户&phone=13800138000&email=test@example.com" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

### 2. 测试网页表单
访问 `http://124.220.134.33/pages/contact.html` 并提交表单

### 3. 验证数据保存
检查 `/var/www/record/contact_forms.csv` 文件是否包含提交的数据

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -tlnp | grep :3000
   
   # 修改端口
   export PORT=3001
   node server-production.js
   ```

2. **权限问题**
   ```bash
   # 创建目录并设置权限
   sudo mkdir -p /var/www/record
   sudo chown www-data:www-data /var/www/record
   sudo chmod 755 /var/www/record
   ```

3. **防火墙问题**
   ```bash
   # 开放端口（Ubuntu/Debian）
   sudo ufw allow 3000
   
   # 开放端口（CentOS/RHEL）
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --reload
   ```

### 日志分析
```bash
# 查看错误日志
pm2 logs weinan-contact-api --err

# 查看访问日志
tail -f /var/www/record/contact_forms.csv
```

## 📈 性能优化

### 1. 使用PM2集群模式
```bash
pm2 start server-production.js --name "weinan-contact-api" -i max
```

### 2. 配置Nginx反向代理
```nginx
server {
    listen 80;
    server_name 124.220.134.33;
    
    # 静态文件
    location / {
        root /var/www/weinan-contact;
        index index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## ✅ 部署检查清单

- [ ] 文件上传完成
- [ ] 依赖安装完成
- [ ] 服务启动成功
- [ ] 端口3000可访问
- [ ] 表单提交测试通过
- [ ] 数据保存正常
- [ ] 日志记录正常
- [ ] 防火墙配置完成

## 📞 技术支持

如果遇到问题，请联系：
- 电话：+86 18701960619
- 邮箱：service@oplasmon.com

---

**部署完成后，表单提交将正常工作，数据会保存到生产服务器的CSV文件中！** 🎉 