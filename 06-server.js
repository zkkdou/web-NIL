const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');

// 生成稳定的文件ID
function generateFileId(filePath, fileName) {
    const idString = `${filePath}/${fileName}`;
    const hash = crypto.createHash('md5').update(idString).digest('hex');
    return hash.substring(0, 8) + '-' + hash.substring(8, 12) + '-' + hash.substring(12, 16) + '-' + hash.substring(16, 20) + '-' + hash.substring(20, 32);
}

// 扫描knowledgehub文件夹
function scanKnowledgeHub() {
    const knowledgeHubPath = path.join(__dirname, 'knowledgehub');
    const files = [];
    
    if (!fs.existsSync(knowledgeHubPath)) {
        return files;
    }
    
    function scanDirectory(dirPath, relativePath = '') {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    const newRelativePath = relativePath ? path.join(relativePath, item) : item;
                    scanDirectory(fullPath, newRelativePath);
                } else if (stat.isFile()) {
                    const fileInfo = {
                        id: generateFileId(relativePath || '根目录', item),
                        name: item,
                        fileName: item,
                        size: stat.size,
                        uploadTime: stat.mtime.toISOString(),
                        type: path.extname(item).toLowerCase(),
                        path: relativePath || '根目录'
                    };
                    files.push(fileInfo);
                }
            }
        } catch (error) {
            console.error('扫描目录时出错:', error);
        }
    }
    
    scanDirectory(knowledgeHubPath);
    return files;
}

// 处理文件API
function handleFilesAPI(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    if (req.method === 'GET' && pathname === '/api/files') {
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
            const contentType = req.headers['content-type'];
            
            if (!contentType || !contentType.includes('multipart/form-data')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '无效的请求格式' }));
                return;
            }
            
            const boundary = contentType.split('boundary=')[1];
            if (!boundary) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '无效的请求格式' }));
                return;
            }
            
            const parts = parseMultipartData(buffer, boundary);
            
            // 验证密码
            if (!parts.password || parts.password.data.toString() !== 'fjfjfjfj') {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '密码错误' }));
                return;
            }
            
            // 验证文件
            if (!parts.file) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '没有找到文件' }));
                return;
            }
            
            // 验证目录
            if (!parts.directory) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: '没有指定目录' }));
                return;
            }
            
            const file = parts.file;
            const fileName = file.filename;
            const fileContent = file.data;
            const directory = parts.directory.data.toString();
            
            // 确保knowledgehub目录存在
            const knowledgeHubPath = path.join(__dirname, 'knowledgehub');
            if (!fs.existsSync(knowledgeHubPath)) {
                fs.mkdirSync(knowledgeHubPath, { recursive: true });
            }
            
            // 创建目标目录
            const targetDir = path.join(knowledgeHubPath, directory);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            
            // 生成唯一文件名（避免重名）
            const ext = path.extname(fileName);
            const baseName = path.basename(fileName, ext);
            
            let uniqueFileName = fileName;
            let counter = 1;
            while (fs.existsSync(path.join(targetDir, uniqueFileName))) {
                uniqueFileName = `${baseName} (${counter})${ext}`;
                counter++;
            }
            
            // 保存文件
            const filePath = path.join(targetDir, uniqueFileName);
            fs.writeFileSync(filePath, fileContent);
            
            // 创建文件信息
            const fileInfo = {
                id: generateFileId(directory, uniqueFileName),
                name: fileName,
                fileName: uniqueFileName,
                size: fileContent.length,
                uploadTime: new Date().toISOString(),
                type: path.extname(fileName).toLowerCase(),
                path: directory,
                downloadUrl: `../knowledgehub/${directory}/${uniqueFileName}`
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                file: fileInfo,
                message: `文件已上传到 ${directory} 目录`
            }));
            
        } catch (error) {
            console.error('文件上传错误:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '文件上传失败' }));
        }
    });
}

// 解析multipart/form-data
function parseMultipartData(buffer, boundary) {
    const parts = {};
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const endBoundaryBuffer = Buffer.from(`--${boundary}--`);
    
    let currentPos = 0;
    
    while (currentPos < buffer.length) {
        const boundaryStart = buffer.indexOf(boundaryBuffer, currentPos);
        if (boundaryStart === -1) break;
        
        const boundaryEnd = buffer.indexOf('\r\n', boundaryStart);
        if (boundaryEnd === -1) break;
        
        const nextBoundaryStart = buffer.indexOf(boundaryBuffer, boundaryEnd);
        if (nextBoundaryStart === -1) {
            const endBoundaryStart = buffer.indexOf(endBoundaryBuffer, boundaryEnd);
            if (endBoundaryStart === -1) break;
            
            const partData = buffer.slice(boundaryEnd + 2, endBoundaryStart - 2);
            const headersEnd = partData.indexOf('\r\n\r\n');
            if (headersEnd !== -1) {
                const headers = partData.slice(0, headersEnd).toString();
                const content = partData.slice(headersEnd + 4);
                
                const nameMatch = headers.match(/name="([^"]+)"/);
                const filenameMatch = headers.match(/filename="([^"]+)"/);
                
                if (nameMatch) {
                    const name = nameMatch[1];
                    parts[name] = {
                        filename: filenameMatch ? filenameMatch[1] : null,
                        data: content
                    };
                }
            }
            break;
        }
        
        const partData = buffer.slice(boundaryEnd + 2, nextBoundaryStart - 2);
        const headersEnd = partData.indexOf('\r\n\r\n');
        if (headersEnd === -1) {
            currentPos = nextBoundaryStart;
            continue;
        }
        
        const headers = partData.slice(0, headersEnd).toString();
        const content = partData.slice(headersEnd + 4);
        
        const nameMatch = headers.match(/name="([^"]+)"/);
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        
        if (nameMatch) {
            const name = nameMatch[1];
            parts[name] = {
                filename: filenameMatch ? filenameMatch[1] : null,
                data: content
            };
        }
        
        currentPos = nextBoundaryStart;
    }
    
    return parts;
}

// 确保 record 目录存在
const recordDir = path.join(__dirname, 'record');
if (!fs.existsSync(recordDir)) {
    fs.mkdirSync(recordDir);
}

const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 处理文件上传API
    if (req.url === '/api/upload' && req.method === 'POST') {
        handleFileUpload(req, res);
        return;
    }

    // 处理文件删除API
    if (req.method === 'POST' && req.url === '/api/delete') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { fileId, password } = data;
                
                // 验证密码
                if (password !== 'fjfjfjfj') {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: '密码错误'
                    }));
                    return;
                }
                
                // 扫描文件列表找到要删除的文件
                const files = scanKnowledgeHub();
                const fileToDelete = files.find(f => f.id === fileId);
                
                if (!fileToDelete) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: '文件不存在'
                    }));
                    return;
                }
                
                // 构建文件路径
                let filePath;
                if (fileToDelete.path === '根目录') {
                    filePath = path.join(__dirname, 'knowledgehub', fileToDelete.name);
                } else {
                    filePath = path.join(__dirname, 'knowledgehub', fileToDelete.path, fileToDelete.name);
                }
                
                // 检查文件是否存在
                if (!fs.existsSync(filePath)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: '文件不存在'
                    }));
                    return;
                }
                
                // 删除文件
                fs.unlinkSync(filePath);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: '文件删除成功'
                }));
                
            } catch (error) {
                console.error('删除文件时出错:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: '服务器内部错误'
                }));
            }
        });
        return;
    }

    // 处理外部文件下载API
    if (req.method === 'POST' && req.url === '/api/download-external') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { url, filename } = data;
                
                if (!url) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: '缺少下载URL'
                    }));
                    return;
                }
                
                // 使用Node.js的http/https模块下载文件
                const http = require('http');
                const https = require('https');
                const urlObj = new URL(url);
                
                const client = urlObj.protocol === 'https:' ? https : http;
                
                const request = client.get(url, (response) => {
                    if (response.statusCode !== 200) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: `下载失败，状态码: ${response.statusCode}`
                        }));
                        return;
                    }
                    
                    // 设置响应头
                    const headers = {
                        'Content-Type': response.headers['content-type'] || 'application/octet-stream',
                        'Content-Length': response.headers['content-length'] || '',
                        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename || 'download')}`,
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    };
                    
                    res.writeHead(200, headers);
                    
                    // 流式传输文件
                    response.pipe(res);
                    
                    response.on('error', (error) => {
                        console.error('下载流错误:', error);
                        if (!res.headersSent) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: '下载过程中出错'
                            }));
                        }
                    });
                });
                
                request.on('error', (error) => {
                    console.error('下载请求错误:', error);
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: '无法连接到下载服务器'
                        }));
                    }
                });
                
                // 设置超时
                request.setTimeout(30000, () => {
                    request.destroy();
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: '下载超时'
                        }));
                    }
                });
                
            } catch (error) {
                console.error('处理外部下载时出错:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: '服务器内部错误'
                }));
            }
        });
        return;
    }

    // 处理知识库API请求
    if (req.url.startsWith('/api/files') && !req.url.startsWith('/api/delete')) {
        handleFilesAPI(req, res);
        return;
    }

    // 处理 POST 请求 - 联系表单
    if (req.method === 'POST' && req.url === '/') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const formData = querystring.parse(body);
                
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
            
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                const ext = path.extname(fullPath).toLowerCase();
                const fileName = path.basename(fullPath);
                const stat = fs.statSync(fullPath);
                
                // 解析URL参数
                const urlObj = url.parse(req.url, true);
                const isDownload = urlObj.query.download === 'true';
                
                // 设置正确的MIME类型和下载头
                const mimeTypes = {
                    '.pdf': 'application/pdf',
                    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    '.doc': 'application/msword',
                    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    '.xls': 'application/vnd.ms-excel',
                    '.txt': 'text/plain',
                    '.zip': 'application/zip',
                    '.rar': 'application/x-rar-compressed',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.mp4': 'video/mp4',
                    '.mp3': 'audio/mpeg'
                };
                
                const contentType = mimeTypes[ext] || 'application/octet-stream';
                
                // 设置响应头
                const headers = {
                    'Content-Type': contentType,
                    'Content-Length': stat.size,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'X-XSS-Protection': '1; mode=block',
                    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
                };
                
                // 如果指定了download参数或者是特定文件类型，强制下载
                if (isDownload || ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.zip', '.rar', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mp3'].includes(ext)) {
                    headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`;
                } else {
                    headers['Content-Disposition'] = `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`;
                }
                
                res.writeHead(200, headers);
                
                const fileStream = fs.createReadStream(fullPath);
                fileStream.pipe(res);
                
                fileStream.on('error', (error) => {
                    console.error('文件读取错误:', error);
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: '文件读取失败' }));
                    }
                });
                
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
    
    // 不支持的请求方法或路径
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: false,
        error: '不支持的请求方法或路径'
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
