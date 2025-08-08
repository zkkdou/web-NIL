#!/bin/bash

echo "🚀 快速部署微纳科技表单处理服务"
echo "=================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 创建项目目录
PROJECT_DIR="/var/www/weinan-contact"
echo "📁 创建项目目录: $PROJECT_DIR"
sudo mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 创建package.json
echo "📦 创建package.json"
cat > package.json << 'EOF'
{
  "name": "weinan-contact-api",
  "version": "1.0.0",
  "type": "module",
  "main": "contact-api.js",
  "scripts": {
    "start": "node contact-api.js"
  }
}
EOF

# 创建表单处理服务
echo "🔧 创建表单处理服务"
cat > contact-api.js << 'EOF'
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import querystring from 'querystring';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保数据目录存在
const recordDir = './record';
if (!fs.existsSync(recordDir)) {
    fs.mkdirSync(recordDir, { recursive: true });
}

const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });

        req.on('end', () => {
            try {
                const formData = querystring.parse(body);
                console.log('收到表单数据:', formData);
                
                if (!formData.name || !formData.phone) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: '姓名和电话是必填项' }));
                    return;
                }

                const data = [
                    new Date().toLocaleString('zh-CN'),
                    formData.name,
                    formData.email || '',
                    formData.phone,
                    formData.subject || '',
                    (formData.message || '').replace(/\r\n|\n/g, ' ')
                ].map(field => `"${field}"`).join(',');

                const csvFile = path.join(recordDir, 'contact_forms.csv');
                const header = '"提交时间","姓名","邮箱","电话","主题","消息内容"\n';

                if (!fs.existsSync(csvFile)) {
                    fs.writeFileSync(csvFile, '\ufeff' + header, 'utf8');
                }

                fs.appendFileSync(csvFile, data + '\n', 'utf8');
                console.log('数据已保存到:', csvFile);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: '数据已保存' }));
            } catch (error) {
                console.error('处理请求时出错:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '服务器内部错误' }));
            }
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'API端点不存在' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 表单处理服务启动成功！`);
    console.log(`📡 监听端口: ${PORT}`);
    console.log(`💾 数据保存: ${recordDir}/contact_forms.csv`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
});
EOF

# 设置权限
echo "🔐 设置文件权限"
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod +x contact-api.js

# 创建数据目录
echo "📂 创建数据目录"
sudo mkdir -p $PROJECT_DIR/record
sudo chown www-data:www-data $PROJECT_DIR/record

# 启动服务
echo "🚀 启动服务"
cd $PROJECT_DIR
sudo -u www-data node contact-api.js &

# 检查服务状态
sleep 2
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ 服务启动成功！"
    echo "🌐 访问地址: http://124.220.134.33:3000/"
    echo "📊 数据文件: $PROJECT_DIR/record/contact_forms.csv"
else
    echo "❌ 服务启动失败，请检查日志"
fi

echo ""
echo "📋 下一步："
echo "1. 开放防火墙端口: sudo ufw allow 3000"
echo "2. 测试API: curl -X POST http://124.220.134.33:3000/ -d 'name=test&phone=123'"
echo "3. 更新表单配置使用3000端口"
echo ""
echo "🧪 测试命令："
echo "curl -X POST http://124.220.134.33:3000/ -d \"name=测试&phone=123456\" -H \"Content-Type: application/x-www-form-urlencoded\""
echo ""
echo "📁 文件位置："
echo "   - 服务文件: $PROJECT_DIR/contact-api.js"
echo "   - 配置文件: $PROJECT_DIR/package.json"
echo "   - 数据文件: $PROJECT_DIR/record/contact_forms.csv"
echo ""
echo "🔄 重启服务："
echo "   cd $PROJECT_DIR && sudo -u www-data node contact-api.js" 