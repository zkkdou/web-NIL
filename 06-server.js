const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');

// 生成UUID
function generateUUID() {
    return crypto.randomUUID();
}

// 扫描knowledgehub文件夹
function scanKnowledgeHub() {
    const knowledgeHubPath = path.join(__dirname, 'knowledgehub');
    const files = [];
    
    if (!fs.existsSync(knowledgeHubPath)) {
        return files;
    }
    
    function scanDirectory(dirPath, relativePath = '') {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 递归扫描子目录
                const newRelativePath = relativePath ? path.join(relativePath, item) : item;
                scanDirectory(fullPath, newRelativePath);
            } else if (stat.isFile()) {
                // 添加文件信息
                const fileInfo = {
                    id: generateUUID(),
                    name: item,
                    fileName: item,
                    size: stat.size,
                    uploadTime: stat.mtime.toISOString(),
                    type: path.extname(item).toLowerCase(),
                    path: relativePath ? path.join(relativePath, item) : item,
                    fullPath: fullPath
                };
                files.push(fileInfo);
            }
        }
    }
    
    scanDirectory(knowledgeHubPath);
    return files;
}

// 处理文件API
function handleFilesAPI(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    if (req.method === 'GET') {
        if (pathname === '/api/files') {
            // 获取文件列表
            try {
                const files = scanKnowledgeHub();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(files));
            } catch (error) {
                console.error('Error scanning knowledge hub:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to scan files' }));
            }
            return;
        }
        
        // 下载文件
        const downloadMatch = pathname.match(/^\/api\/files\/([^\/]+)\/download$/);
        if (downloadMatch) {
            const fileId = downloadMatch[1];
            const files = scanKnowledgeHub();
            const file = files.find(f => f.id === fileId);
            
            if (!file) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'File not found' }));
                return;
            }
            
            try {
                const filePath = path.join(__dirname, 'knowledgehub', file.path);
                if (!fs.existsSync(filePath)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'File not found' }));
                    return;
                }
                
                const stat = fs.statSync(filePath);
                const fileStream = fs.createReadStream(filePath);
                
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
                    'Content-Length': stat.size
                });
                
                fileStream.pipe(res);
            } catch (error) {
                console.error('Error downloading file:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to download file' }));
            }
            return;
        }
    }
    
    // 不支持的请求
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
}

// 处理文件上传
function handleFileUpload(req, res) {
    const chunks = [];
    
    req.on('data', chunk => {
        chunks.push(chunk);
    });
    
    req.on('end', () => {
        try {
            const buffer = Buffer.concat(chunks);
            const boundary = req.headers['content-type'].split('boundary=')[1];
            
            if (!boundary) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '无效的请求格式' }));
                return;
            }
            
            // 解析multipart/form-data
            const parts = parseMultipartData(buffer, boundary);
            
            if (!parts.file) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '没有找到文件' }));
                return;
            }
            
            const file = parts.file;
            const fileName = file.filename;
            const fileContent = file.data;
            
            // 验证文件类型 - 支持所有文件格式
            const ext = path.extname(fileName).toLowerCase();
            const uniqueFileName = `${Date.now()}_${generateUUID()}${ext}`;
            
            // 生成唯一文件名
            const filePath = path.join(knowledgeBaseDir, uniqueFileName);
            
            // 保存文件
            fs.writeFileSync(filePath, fileContent);
            
            // 创建文件信息
            const fileInfo = {
                id: generateUUID(),
                name: fileName,
                fileName: uniqueFileName,
                size: fileContent.length,
                uploadTime: new Date().toISOString(),
                type: ext.substring(1)
            };
            
            // 添加到文件列表
            filesInfo.unshift(fileInfo);
            saveFilesInfo();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                file: fileInfo
            }));
            
        } catch (error) {
            console.error('文件上传错误:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '文件上传失败' }));
        }
    });
}

// 解析multipart/form-data
function parseMultipartData(buffer, boundary) {
    const parts = {};
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const endBoundaryBuffer = Buffer.from(`--${boundary}--`);
    
    let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length;
    let end = buffer.indexOf(endBoundaryBuffer);
    
    if (start === -1 || end === -1) {
        throw new Error('Invalid multipart data');
    }
    
    const data = buffer.slice(start, end);
    const headersEnd = data.indexOf('\r\n\r\n');
    const headers = data.slice(0, headersEnd).toString();
    const content = data.slice(headersEnd + 4);
    
    // 解析Content-Disposition
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    
    if (nameMatch) {
        const name = nameMatch[1];
        parts[name] = {
            filename: filenameMatch ? filenameMatch[1] : null,
            data: content
        };
    }
    
    return parts;
}

// 确保 record 目录存在
const recordDir = path.join(__dirname, 'record');
if (!fs.existsSync(recordDir)) {
    fs.mkdirSync(recordDir);
}

const server = http.createServer((req, res) => {
    // 添加请求日志
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24小时

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        console.log('处理 OPTIONS 请求');
        res.writeHead(200);
        res.end();
        return;
    }

    // 处理知识库API请求
    if (req.url.startsWith('/api/files')) {
        handleFilesAPI(req, res);
        return;
    }

    // 处理静态文件请求
    if (req.method === 'GET') {
        let filePath = url.parse(req.url).pathname;
        
        // 默认首页
        if (filePath === '/') {
            filePath = '/index.html';
        }
        
        // 处理knowledgehub文件夹的下载
        if (filePath.startsWith('/knowledgehub/')) {
            const fullPath = path.join(__dirname, filePath);
            
            // 检查文件是否存在
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                const ext = path.extname(fullPath).toLowerCase();
                const fileName = path.basename(fullPath);
                
                // 设置正确的MIME类型和下载头
                const mimeTypes = {
                    '.pdf': 'application/pdf',
                    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    '.doc': 'application/msword',
                    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    '.xls': 'application/vnd.ms-excel',
                    '.txt': 'text/plain',
                    '.zip': 'application/zip',
                    '.rar': 'application/x-rar-compressed'
                };
                
                const contentType = mimeTypes[ext] || 'application/octet-stream';
                
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });
                
                const fileStream = fs.createReadStream(fullPath);
                fileStream.pipe(res);
                return;
            }
        }
        
        // 其他静态文件处理
        const fullPath = path.join(__dirname, filePath);
        
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const ext = path.extname(fullPath);
            const mimeTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
                '.pdf': 'application/pdf',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.doc': 'application/msword',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.xls': 'application/vnd.ms-excel',
                '.txt': 'text/plain',
                '.zip': 'application/zip',
                '.rar': 'application/x-rar-compressed'
            };
            
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            
            const fileStream = fs.createReadStream(fullPath);
            fileStream.pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        }
        return;
    }

    // 处理 POST 请求 - 联系表单
    if (req.method === 'POST') {
        console.log('收到 POST 请求');
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            console.log('POST 请求体:', body);
            
            try {
                // 解析表单数据
                const formData = querystring.parse(body);
                console.log('解析的表单数据:', formData);
                
                // 验证必填字段
                if (!formData.name || !formData.phone) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: '姓名和电话是必填项'
                    }));
                    return;
                }
                
                // 准备CSV数据
                const timestamp = new Date().toISOString();
                const csvLine = `"${timestamp}","${formData.name || ''}","${formData.email || ''}","${formData.phone || ''}","${formData.subject || ''}","${formData.message || ''}"\n`;
                
                // 确保数据目录存在
                const dataDir = path.join(recordDir, 'data');
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }
                
                // 写入CSV文件
                const csvPath = path.join(dataDir, 'contact_forms.csv');
                
                // 如果文件不存在，创建文件并写入表头
                if (!fs.existsSync(csvPath)) {
                    const header = '"时间戳","姓名","邮箱","电话","主题","留言"\n';
                    fs.writeFileSync(csvPath, header);
                }
                
                // 追加数据
                fs.appendFileSync(csvPath, csvLine);
                console.log('数据已保存到:', csvPath);
                
                // 发送成功响应
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: '数据已保存'
                }));
                
            } catch (error) {
                console.error('处理POST请求时出错:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: '服务器内部错误'
                }));
            }
        });
        return;
    }
    
    // 不支持的请求方法
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: false,
        error: '不支持的请求方法'
    }));
});

// 错误处理
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.log('端口 8000 已被占用，请检查是否有其他服务正在运行');
        console.log('您可以尝试以下命令停止占用端口的进程：');
        console.log('  pkill -f "node.*8000"');
        console.log('  或者使用其他端口: PORT=8001 node 06-server.js');
    } else {
        console.error('服务器错误:', error);
    }
});

// 启动服务器
const port = process.env.PORT || 8000;
server.listen(port, '0.0.0.0', () => {
    console.log(`服务器启动成功，监听端口 ${port}...`);
    console.log('按 Ctrl+C 停止服务器');
    console.log(`访问地址: http://localhost:${port}`);
}); 
