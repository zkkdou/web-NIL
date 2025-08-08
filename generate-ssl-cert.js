const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('正在生成自签名SSL证书...');

// 创建ssl目录
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
}

try {
    // 生成私钥
    console.log('生成私钥...');
    execSync('openssl genrsa -out ssl/private.key 2048', { stdio: 'inherit' });
    
    // 生成证书签名请求
    console.log('生成证书签名请求...');
    execSync('openssl req -new -key ssl/private.key -out ssl/certificate.csr -subj "/C=CN/ST=Shanghai/L=Shanghai/O=WeinanTech/CN=localhost"', { stdio: 'inherit' });
    
    // 生成自签名证书
    console.log('生成自签名证书...');
    execSync('openssl x509 -req -days 365 -in ssl/certificate.csr -signkey ssl/private.key -out ssl/certificate.crt', { stdio: 'inherit' });
    
    // 删除CSR文件
    fs.unlinkSync(path.join(sslDir, 'certificate.csr'));
    
    console.log('SSL证书生成成功！');
    console.log('证书文件位置:');
    console.log('  - 私钥: ssl/private.key');
    console.log('  - 证书: ssl/certificate.crt');
    console.log('');
    console.log('注意：自签名证书会导致浏览器显示安全警告，这是正常的。');
    console.log('在生产环境中，建议使用Let\'s Encrypt等权威CA签发的证书。');
    
} catch (error) {
    console.error('生成SSL证书失败:', error.message);
    console.log('');
    console.log('请确保系统已安装OpenSSL：');
    console.log('  - Windows: 下载并安装OpenSSL');
    console.log('  - macOS: brew install openssl');
    console.log('  - Ubuntu/Debian: sudo apt-get install openssl');
} 