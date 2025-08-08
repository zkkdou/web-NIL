const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const crypto = require('crypto');

// 生成UUID的函数
function generateUUID() {
    return crypto.randomUUID ? crypto.randomUUID() : 
           ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
               (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
           );
}

// 确保 record 目录存在
const recordDir = path.join(__dirname, 'record');
if (!fs.existsSync(recordDir)) {
    fs.mkdirSync(recordDir);
}

// 确保知识库目录存在
const knowledgeBaseDir = path.join(__dirname, 'knowledge-base');
if (!fs.existsSync(knowledgeBaseDir)) {
    fs.mkdirSync(knowledgeBaseDir);
}

// 文件信息存储
const filesInfoPath = path.join(knowledgeBaseDir, 'files-info.json');
let filesInfo = [];

// 加载文件信息
function loadFilesInfo() {
    try {
        if (fs.existsSync(filesInfoPath)) {
            filesInfo = JSON.parse(fs.readFileSync(filesInfoPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading files info:', error);
        filesInfo = [];
    }
}

// 保存文件信息
function saveFilesInfo() {
    try {
        fs.writeFileSync(filesInfoPath, JSON.stringify(filesInfo, null, 2));
    } catch (error) {
        console.error('Error saving files info:', error);
    }
}

// 初始化加载文件信息
loadFilesInfo();

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

    // 处理 GET 请求 - 提供静态文件
    if (req.method === 'GET') {
        let filePath = req.url;
        
        // 默认页面
        if (filePath === '/' || filePath === '/index.html') {
            filePath = '/index.html';
        }
        
        // 构建完整的文件路径
        const fullPath = path.join(__dirname, filePath);
        
        // 检查文件是否存在
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const ext = path.extname(fullPath).toLowerCase();
            
            // 设置正确的 Content-Type
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
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
                '.ttf': 'font/ttf',
                '.eot': 'application/vnd.ms-fontobject'
            };
            
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            
            // 读取并发送文件
            const fileStream = fs.createReadStream(fullPath);
            fileStream.pipe(res);
            
            fileStream.on('error', (error) => {
                console.error('文件读取错误:', error);
                res.writeHead(500);
                res.end('服务器内部错误');
            });
        } else {
            // 文件不存在，返回404
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <html>
                <head><title>404 - 页面未找到</title></head>
                <body>
                    <h1>404 - 页面未找到</h1>
                    <p>请求的文件 ${filePath} 不存在</p>
                    <a href="/">返回首页</a>
                </body>
                </html>
            `);
        }
        return;
    }

    // 处理 POST 请求
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

// 处理知识库文件API
function handleFilesAPI(req, res) {
    const url = req.url;
    
    // GET /api/files - 获取文件列表
    if (req.method === 'GET' && url === '/api/files') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(filesInfo));
        return;
    }
    
    // GET /api/files/:id/download - 下载文件
    if (req.method === 'GET' && url.match(/^\/api\/files\/(.+)\/download$/)) {
        const fileId = url.match(/^\/api\/files\/(.+)\/download$/)[1];
        const fileInfo = filesInfo.find(f => f.id === fileId);
        
        if (!fileInfo) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '文件不存在' }));
            return;
        }
        
        const filePath = path.join(knowledgeBaseDir, fileInfo.fileName);
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '文件不存在' }));
            return;
        }
        
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.name)}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        return;
    }
    
    // POST /api/files/upload - 上传文件
    if (req.method === 'POST' && url === '/api/files/upload') {
        handleFileUpload(req, res);
        return;
    }
    
    // 其他API请求
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API端点不存在' }));
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

const PORT = process.env.PORT || 8000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器启动成功，监听端口 ${PORT}...`);
    console.log('按 Ctrl+C 停止服务器');
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log(`知识库地址: http://localhost:${PORT}/pages/knowledge-base.html`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用，请检查是否有其他服务正在运行`);
        console.error('您可以尝试以下命令停止占用端口的进程：');
        console.error(`  pkill -f "node.*${PORT}"`);
        console.error(`  或者使用其他端口: PORT=${PORT + 1} node 06-server.js`);
    } else {
        console.error('服务器启动失败:', error);
    }
    process.exit(1);
}); 
