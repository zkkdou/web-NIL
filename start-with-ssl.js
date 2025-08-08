const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== 微纳科技网站启动脚本 ===');
console.log('正在检查SSL证书...');

const sslDir = path.join(__dirname, 'ssl');
const privateKeyPath = path.join(sslDir, 'private.key');
const certificatePath = path.join(sslDir, 'certificate.crt');

// 检查SSL证书是否存在
if (!fs.existsSync(privateKeyPath) || !fs.existsSync(certificatePath)) {
    console.log('SSL证书不存在，正在生成...');
    try {
        // 运行证书生成脚本
        require('./generate-ssl-cert.js');
    } catch (error) {
        console.log('SSL证书生成失败，将使用HTTP模式启动');
    }
}

// 启动服务器
console.log('\n正在启动服务器...');
try {
    execSync('node 06-server.js', { stdio: 'inherit' });
} catch (error) {
    console.error('服务器启动失败:', error.message);
} 