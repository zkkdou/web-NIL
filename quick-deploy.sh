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
  "name": "weinan-contact",
  "version": "1.0.0",
  "type": "module",
  "main": "server-production.js",
  "scripts": {
    "start": "node server-production.js",
    "dev": "node server.js"
  },
  "dependencies": {}
}
EOF

# 创建生产服务器脚本
echo "🔧 创建生产服务器脚本"
cat > server-production.js << 'EOF'
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import querystring from 'querystring';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTION_CONFIG = {
    port: process.env.PORT || 3000,
    recordDir: process.env.RECORD_DIR || '/var/www/record',
    host: '0.0.0.0'
};

const recordDir = PRODUCTION_CONFIG.recordDir;
if (!fs.existsSync(recordDir)) {
    fs.mkdirSync(recordDir, { recursive: true });
}

const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    
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

server.listen(PRODUCTION_CONFIG.port, PRODUCTION_CONFIG.host, () => {
    console.log(`✅ 生产服务器启动成功！`);
    console.log(`📡 监听地址: ${PRODUCTION_CONFIG.host}:${PRODUCTION_CONFIG.port}`);
    console.log(`💾 数据保存路径: ${recordDir}`);
});
EOF

# 设置权限
echo "🔐 设置文件权限"
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod +x server-production.js

# 创建数据目录
echo "📂 创建数据目录"
sudo mkdir -p /var/www/record
sudo chown www-data:www-data /var/www/record

# 启动服务
echo "🚀 启动服务"
cd $PROJECT_DIR
sudo -u www-data node server-production.js &

# 检查服务状态
sleep 2
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ 服务启动成功！"
    echo "🌐 访问地址: http://124.220.134.33:3000/"
    echo "📊 数据文件: /var/www/record/contact_forms.csv"
else
    echo "❌ 服务启动失败，请检查日志"
fi

echo ""
echo "📋 下一步："
echo "1. 开放防火墙端口: sudo ufw allow 3000"
echo "2. 测试API: curl -X POST http://124.220.134.33:3000/ -d 'name=test&phone=123'"
echo "3. 更新表单配置使用3000端口" 