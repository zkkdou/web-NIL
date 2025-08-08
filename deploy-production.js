import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 生产服务器配置
const PRODUCTION_CONFIG = {
    host: '124.220.134.33',
    port: 80,
    // 如果需要其他端口，请修改这里
    // port: 3000, // 或者其他可用端口
};

// 创建生产服务器配置文件
const productionServerConfig = `
// 生产服务器配置
const PRODUCTION_CONFIG = {
    host: '${PRODUCTION_CONFIG.host}',
    port: ${PRODUCTION_CONFIG.port},
    recordDir: '/var/www/record', // 生产服务器数据保存路径
};

export default PRODUCTION_CONFIG;
`;

// 创建生产服务器启动脚本
const productionServerScript = `
#!/bin/bash
# 生产服务器启动脚本

# 设置环境变量
export NODE_ENV=production
export PORT=${PRODUCTION_CONFIG.port}

# 创建数据目录
mkdir -p /var/www/record

# 启动服务器
node server.js

echo "生产服务器启动在端口 ${PRODUCTION_CONFIG.port}"
`;

// 创建PM2配置文件（如果使用PM2管理进程）
const pm2Config = `
module.exports = {
  apps: [{
    name: 'weinan-contact-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: ${PRODUCTION_CONFIG.port}
    }
  }]
};
`;

// 写入文件
try {
    fs.writeFileSync(path.join(__dirname, 'production-config.js'), productionServerConfig);
    fs.writeFileSync(path.join(__dirname, 'start-production.sh'), productionServerScript);
    fs.writeFileSync(path.join(__dirname, 'ecosystem.config.js'), pm2Config);
    
    console.log('✅ 生产服务器配置文件已创建：');
    console.log('  - production-config.js');
    console.log('  - start-production.sh');
    console.log('  - ecosystem.config.js');
    console.log('');
    console.log('📋 部署步骤：');
    console.log('1. 将整个项目上传到生产服务器');
    console.log('2. 在服务器上运行：npm install');
    console.log('3. 启动服务器：');
    console.log('   - 直接启动：node server.js');
    console.log('   - 或使用PM2：pm2 start ecosystem.config.js');
    console.log('');
    console.log('🔧 服务器配置：');
    console.log(`   - 地址：${PRODUCTION_CONFIG.host}`);
    console.log(`   - 端口：${PRODUCTION_CONFIG.port}`);
    console.log('   - 数据保存：/var/www/record/contact_forms.csv');
    
} catch (error) {
    console.error('❌ 创建配置文件失败：', error);
} 