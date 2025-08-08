import http from 'http';
import querystring from 'querystring';

// 测试数据
const testData = {
    name: '测试用户',
    phone: '123456789',
    email: 'test@example.com',
    subject: 'API测试',
    message: '这是一个测试消息'
};

// 发送POST请求
const postData = querystring.stringify(testData);

const options = {
    hostname: '124.220.134.33',
    port: 80, // 临时使用80端口
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🔍 测试API连接...');
console.log('目标地址:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('测试数据:', testData);

const req = http.request(options, (res) => {
    console.log('📡 响应状态码:', res.statusCode);
    console.log('📡 响应头:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📄 响应内容:', data);
        console.log('✅ 测试完成');
    });
});

req.on('error', (e) => {
    console.error('❌ 请求错误:', e.message);
    console.log('💡 可能的原因:');
    console.log('   1. 服务器没有启动');
    console.log('   2. 防火墙阻止了3000端口');
    console.log('   3. 网络连接问题');
});

req.write(postData);
req.end(); 