#!/bin/bash

echo "🛑 停止微纳科技网站服务"
echo "========================"

# 停止API服务
echo "📡 停止API服务..."
pkill -f contact-api.js

# 停止主服务器
echo "🌐 停止主服务器..."
pkill -f 06-server.js

# 等待进程完全停止
sleep 2

# 检查是否还有相关进程在运行
if pgrep -f contact-api.js > /dev/null; then
    echo "⚠️  API服务可能还在运行，强制停止..."
    pkill -9 -f contact-api.js
fi

if pgrep -f 06-server.js > /dev/null; then
    echo "⚠️  主服务器可能还在运行，强制停止..."
    pkill -9 -f 06-server.js
fi

# 删除PID文件
rm -f .api.pid .server.pid

echo "✅ 所有服务已停止！"
echo ""
echo "🔍 检查端口状态:"
netstat -tlnp | grep -E ":(3000|8000)" || echo "   端口已释放" 