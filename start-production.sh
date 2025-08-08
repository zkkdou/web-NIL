
#!/bin/bash
# 生产服务器启动脚本

# 设置环境变量
export NODE_ENV=production
export PORT=80

# 创建数据目录
mkdir -p /var/www/record

# 启动服务器
node server.js

echo "生产服务器启动在端口 80"
