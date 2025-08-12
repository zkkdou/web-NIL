#!/bin/bash

# Linux服务器HTTPS部署脚本
echo "=========================================="
echo "Linux服务器HTTPS部署脚本"
echo "=========================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js"
    echo "请先安装Node.js"
    exit 1
fi

# 检查openssl是否安装
if ! command -v openssl &> /dev/null; then
    echo "安装openssl..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y openssl
    elif command -v yum &> /dev/null; then
        sudo yum install -y openssl
    else
        echo "错误: 无法安装openssl，请手动安装"
        exit 1
    fi
fi

# 生成SSL证书
echo "生成SSL证书..."
chmod +x generate-ssl.sh
./generate-ssl.sh

if [ $? -ne 0 ]; then
    echo "SSL证书生成失败"
    exit 1
fi

# 检查防火墙设置
echo "检查防火墙设置..."
if command -v ufw &> /dev/null; then
    echo "配置UFW防火墙..."
    sudo ufw allow 8000/tcp
    sudo ufw allow 8443/tcp
    echo "防火墙规则已添加"
elif command -v firewall-cmd &> /dev/null; then
    echo "配置firewalld防火墙..."
    sudo firewall-cmd --permanent --add-port=8000/tcp
    sudo firewall-cmd --permanent --add-port=8443/tcp
    sudo firewall-cmd --reload
    echo "防火墙规则已添加"
else
    echo "警告: 未检测到防火墙，请手动确保端口8000和8443已开放"
fi

echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo "HTTP访问地址: http://124.220.134.33:8000"
echo "HTTPS访问地址: https://124.220.134.33:8443"
echo ""
echo "知识库页面:"
echo "  HTTP: http://124.220.134.33:8000/pages/knowledge-base.html"
echo "  HTTPS: https://124.220.134.33:8443/pages/knowledge-base.html"
echo ""
echo "启动服务器: node 06-server.js" 