import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dependencies = [
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        path: 'assets/vendor/bootstrap/bootstrap.min.css'
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js',
        path: 'assets/vendor/bootstrap/bootstrap.min.js'
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js',
        path: 'assets/vendor/bootstrap/popper.min.js'
    },
    {
        url: 'https://code.jquery.com/jquery-3.6.0.min.js',
        path: 'assets/vendor/jquery/jquery.min.js'
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
        path: 'assets/vendor/marked/marked.min.js'
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
        path: 'assets/vendor/bootstrap-icons/bootstrap-icons.css'
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/fonts/bootstrap-icons.woff',
        path: 'assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff'
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/fonts/bootstrap-icons.woff2',
        path: 'assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2'
    }
];

const MAX_RETRIES = 3;
const TIMEOUT = 30000; // 30 seconds

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadFile(url, filePath, attempt = 1) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const file = fs.createWriteStream(filePath);
        const request = https.get(url, {
            timeout: TIMEOUT
        }, response => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // 处理重定向
                file.close();
                const redirectUrl = response.headers.location;
                console.log(`重定向到: ${redirectUrl}`);
                downloadFile(redirectUrl, filePath, attempt)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`下载成功: ${filePath}`);
                resolve();
            });

            response.on('error', (err) => {
                file.close();
                fs.unlink(filePath, () => {});
                reject(err);
            });
        });

        request.on('timeout', () => {
            request.destroy();
            file.close();
            fs.unlink(filePath, () => {});
            reject(new Error(`下载超时: ${url}`));
        });

        request.on('error', (err) => {
            file.close();
            fs.unlink(filePath, () => {});
            reject(err);
        });
    }).catch(async (error) => {
        if (attempt < MAX_RETRIES) {
            console.log(`重试下载 (${attempt + 1}/${MAX_RETRIES}): ${url}`);
            await sleep(1000 * attempt); // 指数退避
            return downloadFile(url, filePath, attempt + 1);
        }
        throw error;
    });
}

async function downloadAll() {
    const results = {
        success: [],
        failed: []
    };

    for (const dep of dependencies) {
        try {
            console.log(`开始下载: ${dep.url}`);
            await downloadFile(dep.url, dep.path);
            results.success.push(dep.path);
        } catch (error) {
            console.error(`下载失败 ${dep.url}:`, error.message);
            results.failed.push({
                path: dep.path,
                error: error.message
            });
        }
    }

    // 打印总结
    console.log('\n下载总结:');
    console.log(`成功: ${results.success.length}`);
    console.log(`失败: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
        console.log('\n失败的下载:');
        results.failed.forEach(item => {
            console.log(`- ${item.path}: ${item.error}`);
        });
        process.exit(1);
    }
}

console.log('开始下载依赖文件...\n');
downloadAll(); 