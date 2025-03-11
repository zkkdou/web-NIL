# 部署指南

## 系统要求
- Node.js (v14.0.0 或更高版本)
- PHP 7.4 或更高版本
- Web服务器 (Apache 或 Nginx)

## 部署步骤

### 1. 安装依赖
```bash
# 安装 Node.js 依赖
npm install

# 下载第三方库文件
node download-deps.js
```

### 2. 配置 Web 服务器

#### Apache 配置示例
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html/your-website
    
    <Directory /var/www/html/your-website>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 配置
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>
</VirtualHost>
```

#### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/your-website;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }
}
```

### 3. 文件权限设置
```bash
# 设置适当的文件权限
chmod -R 755 /var/www/html/your-website
chown -R www-data:www-data /var/www/html/your-website

# 确保表单提交目录可写
chmod 777 forms/submissions
```

### 4. 环境检查清单
- [ ] 确保 Node.js 已安装并版本正确
- [ ] 确保 PHP 已安装并配置正确
- [ ] 确保 Web 服务器已正确配置
- [ ] 确保所有依赖项已安装
- [ ] 确保文件权限设置正确
- [ ] 确保表单提交目录可写
- [ ] 测试所有页面是否正常访问
- [ ] 测试表单提交功能是否正常工作

### 5. 注意事项
1. 确保服务器防火墙允许 HTTP/HTTPS 流量
2. 建议配置 SSL 证书以启用 HTTPS
3. 定期备份网站数据
4. 监控服务器日志以排查潜在问题 