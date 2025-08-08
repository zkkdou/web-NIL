# HTTPS 安全下载设置指南

## 问题说明
当用户通过HTTP链接下载文件时，现代浏览器（如Chrome、Firefox）会显示"不安全下载"警告。这是因为HTTP协议不加密，存在安全风险。

## 解决方案

### 方案1：使用HTTPS（推荐）

#### 1. 自动生成SSL证书
```bash
# 运行启动脚本，自动生成SSL证书
node start-with-ssl.js
```

#### 2. 手动生成SSL证书
```bash
# 生成自签名SSL证书
node generate-ssl-cert.js
```

#### 3. 启动HTTPS服务器
```bash
# 启动支持HTTPS的服务器
node 06-server.js
```

#### 4. 访问HTTPS地址
- HTTP: http://localhost:8000
- HTTPS: https://localhost:8443

### 方案2：使用Let's Encrypt证书（生产环境推荐）

#### 1. 安装certbot
```bash
# Ubuntu/Debian
sudo apt-get install certbot

# CentOS/RHEL
sudo yum install certbot
```

#### 2. 获取证书
```bash
# 为您的域名获取证书
sudo certbot certonly --standalone -d yourdomain.com
```

#### 3. 配置证书路径
将证书文件复制到项目的ssl目录：
```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/private.key
sudo cp /etc/letsencrypt/live/yourdomain.com/cert.pem ssl/certificate.crt
```

### 方案3：使用反向代理（Nginx）

#### 1. 安装Nginx
```bash
sudo apt-get install nginx
```

#### 2. 配置Nginx
创建配置文件 `/etc/nginx/sites-available/weinan-tech`：
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/cert.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/weinan-tech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 注意事项

1. **自签名证书**：会导致浏览器显示安全警告，用户需要手动信任证书
2. **Let's Encrypt证书**：免费且受浏览器信任，但需要域名和公网访问
3. **证书续期**：Let's Encrypt证书有效期为90天，需要定期续期
4. **防火墙设置**：确保HTTPS端口（443或8443）已开放

## 测试

1. 启动HTTPS服务器后，访问 https://localhost:8443
2. 下载文件时，浏览器应该不再显示安全警告
3. 复制的下载链接应该以 `https://` 开头

## 故障排除

### 证书生成失败
- 确保系统已安装OpenSSL
- 检查ssl目录权限
- 查看错误日志

### HTTPS服务器启动失败
- 检查端口是否被占用
- 确认证书文件存在且格式正确
- 查看服务器错误日志

### 浏览器仍然显示不安全
- 确认访问的是HTTPS地址
- 检查证书是否正确加载
- 清除浏览器缓存 