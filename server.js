import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import querystring from 'querystring';

// 获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
                const formData = querystring.parse(body);
                console.log('解析的表单数据:', formData);
                
                // 验证必填字段
                if (!formData.name || !formData.phone) {
                    console.log('验证失败: 缺少必填字段');
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: '姓名和电话是必填项'
                    }));
                    return;
                }

                // 准备数据行
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

                // 如果文件不存在，先写入表头
                if (!fs.existsSync(csvFile)) {
                    fs.writeFileSync(csvFile, '\ufeff' + header, 'utf8');
                }

                // 追加数据
                fs.appendFileSync(csvFile, data + '\n', 'utf8');
                console.log('数据已保存到:', csvFile);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                const response = JSON.stringify({
                    success: true,
                    message: '数据已保存'
                });
                console.log('发送响应:', response);
                res.end(response);
            } catch (error) {
                console.error('处理 POST 请求时出错:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: '服务器内部错误'
                }));
            }
        });
        return;
    }

    // 其他请求方法
    console.log('不支持的请求方法:', req.method);
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: false,
        error: '不支持的请求方法'
    }));
});

const PORT = 8000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器启动成功，监听端口 ${PORT}...`);
    console.log('按 Ctrl+C 停止服务器');
    console.log(`访问地址: http://localhost:${PORT}`);
}); 
