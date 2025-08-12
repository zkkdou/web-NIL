#!/bin/bash

# 生成SSL证书脚本 - Linux版本
echo "=========================================="
echo "正在生成SSL证书..."
echo "=========================================="

# 检查是否安装了openssl
if ! command -v openssl &> /dev/null; then
    echo "错误: 未找到openssl命令"
    echo "请先安装openssl:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  CentOS/RHEL: sudo yum install openssl"
    exit 1
fi

# 创建ssl目录
if [ ! -d "ssl" ]; then
    echo "创建ssl目录..."
    mkdir -p ssl
fi

# 检查是否已存在证书文件
if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
    echo "警告: SSL证书文件已存在"
    read -p "是否要重新生成证书? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消操作"
        exit 0
    fi
    echo "备份现有证书..."
    mv ssl/cert.pem ssl/cert.pem.backup.$(date +%Y%m%d_%H%M%S)
    mv ssl/key.pem ssl/key.pem.backup.$(date +%Y%m%d_%H%M%S)
fi

# 生成自签名证书
echo "生成自签名SSL证书..."
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
    -subj "/C=CN/ST=Shanghai/L=Shanghai/O=WeiNaTech/OU=IT/CN=124.220.134.33" \
    -addext "subjectAltName=DNS:124.220.134.33,IP:124.220.134.33"

# 检查证书生成是否成功
if [ $? -eq 0 ] && [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
    echo "=========================================="
    echo "SSL证书生成成功！"
    echo "=========================================="
    echo "证书文件位置："
    echo "  - ssl/cert.pem (证书文件)"
    echo "  - ssl/key.pem (私钥文件)"
    echo ""
    
    # 设置适当的文件权限
    echo "设置文件权限..."
    chmod 600 ssl/key.pem
    chmod 644 ssl/cert.pem
    
    # 显示证书信息
    echo "证书信息："
    openssl x509 -in ssl/cert.pem -text -noout | grep -E "(Subject:|Not Before|Not After|DNS:|IP Address:)"
    
    echo ""
    echo "现在可以重启服务器以启用HTTPS："
    echo "  node 06-server.js"
    echo ""
    echo "HTTPS访问地址："
    echo "  https://124.220.134.33:8443"
    echo ""
    echo "注意："
    echo "  - 这是自签名证书，浏览器会显示安全警告"
    echo "  - 在生产环境中，建议使用正式的SSL证书"
    echo "  - 确保防火墙开放8443端口"
else
    echo "错误: SSL证书生成失败"
    exit 1
fi 