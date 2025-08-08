#!/bin/bash

echo "🚀 启动微纳科技网站服务"
echo "=========================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查record目录是否存在
if [ ! -d "record" ]; then
    echo "❌ record目录不存在，请先运行 ./01-deploy-api-FIRST-ONLY.sh"
    exit 1
fi

# 检查contact-api.js是否存在
if [ ! -f "record/contact-api.js" ]; then
    echo "❌ contact-api.js不存在，请先运行 ./01-deploy-api-FIRST-ONLY.sh"
    exit 1
fi

echo "✅ 检查完成，开始启动服务..."

# 启动API服务（后台运行）
echo "📡 启动API服务（端口3000）..."
cd record
node contact-api.js &
API_PID=$!
cd ..

# 等待API服务启动
sleep 2

# 检查API服务是否启动成功
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ API服务启动成功！"
else
    echo "⚠️  API服务可能未完全启动，请稍等..."
fi

# 启动主服务器
echo "🌐 启动主服务器（端口8000）..."
node 06-server.js &
SERVER_PID=$!

# 等待主服务器启动
sleep 2

# 检查主服务器是否启动成功
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ 主服务器启动成功！"
else
    echo "⚠️  主服务器可能未完全启动，请稍等..."
fi

echo ""
echo "🎉 所有服务启动完成！"
echo "📡 API服务: http://localhost:3000"
echo "🌐 主网站: http://localhost:8000"
echo "📊 数据文件: record/data/contact_forms.csv"
echo ""
echo "💡 停止服务:"
echo "   pkill -f contact-api.js"
echo "   pkill -f 06-server.js"
echo ""
echo "🔍 检查服务状态:"
echo "   netstat -tlnp | grep :3000"
echo "   netstat -tlnp | grep :8000"
echo ""
echo "🧪 测试API:"
echo "   curl -X POST http://localhost:3000/ -d \"name=测试&phone=123456\""
echo ""

# 保存进程ID到文件，方便后续停止
echo $API_PID > .api.pid
echo $SERVER_PID > .server.pid

echo "📝 进程ID已保存到 .api.pid 和 .server.pid"
echo "🔄 服务正在运行中..." 