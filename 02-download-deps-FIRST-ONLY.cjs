const https = require('https');
const fs = require('fs');
const path = require('path');

const dependencies = [
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        path: 'assets/vendor/bootstrap/bootstrap.min.css'
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        path: 'assets/vendor/bootstrap/bootstrap.bundle.min.js'
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
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
        path: 'assets/vendor/animate.css/animate.min.css'
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css',
        path: 'assets/vendor/github-markdown-css/github-markdown.min.css'
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
            reject(new Error('请求超时'));
        });

        request.on('error', (err) => {
            file.close();
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
}

async function downloadWithRetry(url, filePath) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await downloadFile(url, filePath, attempt);
            return;
        } catch (error) {
            console.log(`下载失败 (尝试 ${attempt}/${MAX_RETRIES}): ${filePath}`);
            console.log(`错误: ${error.message}`);
            
            if (attempt < MAX_RETRIES) {
                console.log(`等待 ${attempt * 2} 秒后重试...`);
                await sleep(attempt * 2000);
            } else {
                throw error;
            }
        }
    }
}

async function downloadAll() {
    console.log('🚀 开始下载依赖文件...');
    console.log('=====================================');
    
    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;
    
    for (const dep of dependencies) {
        try {
            console.log(`📥 下载: ${dep.path}`);
            await downloadWithRetry(dep.url, dep.path);
            successCount++;
        } catch (error) {
            console.log(`❌ 下载失败: ${dep.path}`);
            console.log(`   错误: ${error.message}`);
            failCount++;
        }
        console.log('');
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('=====================================');
    console.log(`🎉 下载完成！用时: ${duration} 秒`);
    console.log(`✅ 成功: ${successCount} 个文件`);
    console.log(`❌ 失败: ${failCount} 个文件`);
    
    if (failCount > 0) {
        console.log('');
        console.log('⚠️  部分文件下载失败，但网站仍可正常运行');
        console.log('💡 建议检查网络连接后重新运行此脚本');
    }
    
    console.log('');
    console.log('📁 文件位置: assets/vendor/');
    console.log('🌐 网站可以正常访问了！');
}

// 运行下载
downloadAll().catch(console.error); 