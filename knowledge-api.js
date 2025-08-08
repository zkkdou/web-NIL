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