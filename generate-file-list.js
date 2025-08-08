const fs = require('fs');
const path = require('path');

// 扫描knowledgehub文件夹并生成文件列表
function scanKnowledgeHub() {
    const knowledgeHubPath = path.join(__dirname, 'knowledgehub');
    const files = [];
    
    if (!fs.existsSync(knowledgeHubPath)) {
        console.log('knowledgehub 文件夹不存在，创建中...');
        fs.mkdirSync(knowledgeHubPath, { recursive: true });
        return files;
    }
    
    function scanDirectory(dirPath, relativePath = '') {
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const itemRelativePath = relativePath ? path.join(relativePath, item) : item;
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDirectory(fullPath, itemRelativePath);
            } else {
                const fileId = Buffer.from(fullPath).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
                files.push({
                    id: fileId,
                    name: item,
                    fileName: item,
                    size: stat.size,
                    uploadTime: stat.mtime.toISOString(),
                    type: path.extname(item).toLowerCase(),
                    path: itemRelativePath.split(path.sep)[0], // 获取第一级目录名
                    downloadUrl: `../knowledgehub/${itemRelativePath.replace(/\\/g, '/')}`
                });
            }
        });
    }
    
    scanDirectory(knowledgeHubPath);
    return files;
}

// 生成JavaScript代码
function generateFileListCode(files) {
    const fileListJson = JSON.stringify(files, null, 2);
    
    return `// 自动生成的文件列表 - 运行 generate-file-list.js 更新
function getFileList() {
    return ${fileListJson};
}`;
}

// 主函数
function main() {
    console.log('开始扫描 knowledgehub 文件夹...');
    const files = scanKnowledgeHub();
    
    if (files.length === 0) {
        console.log('没有找到文件');
        return;
    }
    
    console.log(`找到 ${files.length} 个文件:`);
    files.forEach(file => {
        console.log(`- ${file.path}/${file.name} (${file.size} bytes)`);
    });
    
    // 生成JavaScript代码
    const jsCode = generateFileListCode(files);
    
    // 写入文件
    const outputPath = path.join(__dirname, 'file-list.js');
    fs.writeFileSync(outputPath, jsCode);
    
    console.log(`\n文件列表已生成: ${outputPath}`);
    console.log('\n使用方法:');
    console.log('1. 将 file-list.js 的内容复制到 knowledge-base.html 中的 getFileList() 函数');
    console.log('2. 或者直接在 knowledge-base.html 中引入 file-list.js');
}

// 运行脚本
if (require.main === module) {
    main();
}

module.exports = { scanKnowledgeHub, generateFileListCode }; 