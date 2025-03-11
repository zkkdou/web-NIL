import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// 启用 CORS
app.use(cors());

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

// 静态文件服务
app.use(express.static(join(__dirname, '..')));

// 路由处理
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../index.html'));
});

// 专门处理 cases.json 的路由
app.get('/docs/cases.json', (req, res) => {
    try {
        res.sendFile(join(__dirname, '../docs/cases.json'));
    } catch (error) {
        console.error('Error serving cases.json:', error);
        res.status(500).json({ error: 'Unable to load cases data' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
    console.log('静态文件目录:', join(__dirname, '..'));
});
