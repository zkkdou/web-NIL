#!/bin/bash

# Linux服务器启动脚本
echo "=========================================="
echo "启动WeiNa Tech Web服务器"
echo "=========================================="

# 检查SSL证书是否存在
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "SSL证书不存在，正在生成..."
    chmod +x generate-ssl.sh
    ./generate-ssl.sh
    if [ $? -ne 0 ]; then
        echo "SSL证书生成失败，仅启动HTTP服务器"
    fi
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js"
    exit 1
fi

# 检查服务器文件是否存在
if [ ! -f "06-server.js" ]; then
    echo "错误: 未找到06-server.js文件"
    exit 1
fi

echo "启动服务器..."
echo "HTTP端口: 8000"
echo "HTTPS端口: 8443"
echo ""
echo "访问地址:"
echo "  HTTP: http://124.220.134.33:8000"
echo "  HTTPS: https://124.220.134.33:8443"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "=========================================="

# 启动服务器
node 06-server.js 