import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import querystring from 'querystring';

// 获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 生产环境配置
const PRODUCTION_CONFIG = {
    port: process.env.PORT || 3000, // 使用环境变量或默认3000端口
    recordDir: process.env.RECORD_DIR || '/var/www/record',
    host: '0.0.0.0' // 监听所有网络接口
};

// 确保记录目录存在
const recordDir = PRODUCTION_CONFIG.recordDir;
if (!fs.existsSync(recordDir)) {
    fs.mkdirSync(recordDir, { recursive: true });
}

const server = http.createServer((req, res) => {
    // 添加请求日志
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        console.log('处理 OPTIONS 请求');
        res.writeHead(200);
        res.end();
        return;
    }

    // 只处理表单提交的POST请求
    if (req.method === 'POST' && req.url === '/') {
        console.log('收到表单提交请求');
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

    // 其他请求返回404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: false,
        error: 'API端点不存在'
    }));
});

server.listen(PRODUCTION_CONFIG.port, PRODUCTION_CONFIG.host, () => {
    console.log(`✅ 生产服务器启动成功！`);
    console.log(`📡 监听地址: ${PRODUCTION_CONFIG.host}:${PRODUCTION_CONFIG.port}`);
    console.log(`💾 数据保存路径: ${recordDir}`);
    console.log(`🔄 按 Ctrl+C 停止服务器`);
    console.log('');
    console.log(`🌐 表单提交地址: http://${PRODUCTION_CONFIG.host}:${PRODUCTION_CONFIG.port}/`);
}); 