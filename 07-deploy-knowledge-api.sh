#!/bin/bash

# 知识库API部署脚本
echo "=== 部署知识库API到生产服务器 ==="

# 服务器信息
SERVER_IP="124.220.134.33"
SERVER_USER="ubuntu"
PROJECT_DIR="~/work/website"

# 创建知识库API文件
echo "创建知识库API文件..."
cat > knowledge-api.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001; // 使用不同的端口避免冲突

// 扫描知识库文件夹
function scanKnowledgeHub() {
    const knowledgeHubPath = path.join(__dirname, 'knowledgehub');
    const files = [];
    
    if (!fs.existsSync(knowledgeHubPath)) {
        console.log('knowledgehub 文件夹不存在，创建中...');
        fs.mkdirSync(knowledgeHubPath, { recursive: true });
        return files;
    }
    
    function scanDirectory(dirPath, relativePath = '') {
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const itemRelativePath = relativePath ? path.join(relativePath, item) : item;
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDirectory(fullPath, itemRelativePath);
            } else {
                const fileId = Buffer.from(fullPath).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
                files.push({
                    id: fileId,
                    name: item,
                    fileName: item,
                    size: stat.size,
                    uploadTime: stat.mtime.toISOString(),
                    type: path.extname(item).toLowerCase(),
                    path: itemRelativePath,
                    fullPath: fullPath
                });
            }
        });
    }
    
    scanDirectory(knowledgeHubPath);
    return files;
}

// 处理文件API请求
function handleFilesAPI(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method === 'GET') {
        if (pathname === '/api/files') {
            // 获取文件列表
            try {
                const files = scanKnowledgeHub();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(files));
            } catch (error) {
                console.error('Error scanning files:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to scan files' }));
            }
        } else if (pathname.startsWith('/api/files/') && pathname.includes('/download')) {
            // 下载文件
            const fileId = pathname.split('/')[3];
            const files = scanKnowledgeHub();
            const file = files.find(f => f.id === fileId);
            
            if (!file) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'File not found' }));
                return;
            }
            
            try {
                const fileStream = fs.createReadStream(file.fullPath);
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
                    'Content-Length': file.size
                });
                fileStream.pipe(res);
            } catch (error) {
                console.error('Error downloading file:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to download file' }));
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
}

// 创建服务器
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    if (req.url.startsWith('/api/files')) {
        handleFilesAPI(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// 错误处理
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`端口 ${PORT} 已被占用，请检查是否有其他服务正在运行`);
        console.log(`您可以尝试以下命令停止占用端口的进程：`);
        console.log(`  pkill -f "node.*${PORT}"`);
        console.log(`  或者使用其他端口: PORT=${PORT + 1} node knowledge-api.js`);
    } else {
        console.error('服务器错误:', err);
    }
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
    console.log(`知识库API服务器启动成功，监听端口 ${PORT}...`);
    console.log(`按 Ctrl+C 停止服务器`);
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log(`API地址: http://localhost:${PORT}/api/files`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
EOF

# 创建package.json
echo "创建package.json..."
cat > package-knowledge.json << 'EOF'
{
  "name": "knowledge-api",
  "version": "1.0.0",
  "description": "Knowledge Base API Server",
  "main": "knowledge-api.js",
  "scripts": {
    "start": "node knowledge-api.js"
  },
  "dependencies": {},
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF

# 创建启动脚本
echo "创建启动脚本..."
cat > start-knowledge-api.sh << 'EOF'
#!/bin/bash
echo "启动知识库API服务..."
cd ~/work/website
node knowledge-api.js
EOF

chmod +x start-knowledge-api.sh

# 创建停止脚本
echo "创建停止脚本..."
cat > stop-knowledge-api.sh << 'EOF'
#!/bin/bash
echo "停止知识库API服务..."
pkill -f "knowledge-api.js"
echo "知识库API服务已停止"
EOF

chmod +x stop-knowledge-api.sh

# 创建示例文件
echo "创建示例文件..."
mkdir -p knowledgehub/2024-12
mkdir -p knowledgehub/2025-01
mkdir -p knowledgehub/2025-08

# 创建示例文件
echo "纳米压印技术报告" > knowledgehub/2024-12/纳米压印技术报告.pdf
echo "微纳加工工艺手册" > knowledgehub/2024-12/微纳加工工艺手册.docx
echo "超材料设计指南" > knowledgehub/2025-01/超材料设计指南.txt
echo "刻蚀工艺参数" > knowledgehub/2025-01/刻蚀工艺参数.xlsx
echo "最新技术资料" > knowledgehub/2025-08/最新技术资料.zip
echo "产品规格说明书" > knowledgehub/2025-08/产品规格说明书.pdf

echo "=== 部署完成 ==="
echo "文件已创建："
echo "- knowledge-api.js (知识库API服务器)"
echo "- package-knowledge.json (依赖配置)"
echo "- start-knowledge-api.sh (启动脚本)"
echo "- stop-knowledge-api.sh (停止脚本)"
echo "- knowledgehub/ (示例文件目录)"
echo ""
echo "下一步操作："
echo "1. 将文件上传到服务器："
echo "   scp knowledge-api.js package-knowledge.json start-knowledge-api.sh stop-knowledge-api.sh ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/"
echo "   scp -r knowledgehub ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/"
echo ""
echo "2. 在服务器上启动API："
echo "   ssh ${SERVER_USER}@${SERVER_IP}"
echo "   cd ${PROJECT_DIR}"
echo "   ./start-knowledge-api.sh"
echo ""
echo "3. 测试API："
echo "   curl http://${SERVER_IP}:3001/api/files" 