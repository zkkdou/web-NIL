const fs = require('fs');
const path = require('path');

// CDN到本地文件的映射
const cdnToLocal = {
    // Bootstrap CSS
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css': '../assets/vendor/bootstrap/bootstrap.min.css',
    'https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.0/css/bootstrap.min.css': '../assets/vendor/bootstrap/bootstrap.min.css',
    
    // Bootstrap Icons
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.0/font/bootstrap-icons.min.css': '../assets/vendor/bootstrap-icons/bootstrap-icons.css',
    'https://cdn.bootcdn.net/ajax/libs/bootstrap-icons/1.11.0/font/bootstrap-icons.min.css': '../assets/vendor/bootstrap-icons/bootstrap-icons.css',
    
    // Animate.css
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css': '../assets/vendor/animate.css/animate.min.css',
    'https://cdn.bootcdn.net/ajax/libs/animate.css/4.1.1/animate.min.css': '../assets/vendor/animate.css/animate.min.css',
    
    // GitHub Markdown CSS
    'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css': '../assets/vendor/github-markdown-css/github-markdown.min.css',
    
    // Bootstrap JS
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js': '../assets/vendor/bootstrap/bootstrap.bundle.min.js',
    'https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.0/js/bootstrap.bundle.min.js': '../assets/vendor/bootstrap/bootstrap.bundle.min.js',
    
    // Marked.js
    'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js': '../assets/vendor/marked/marked.min.js'
};

// 根目录的映射（用于index.html）
const cdnToLocalRoot = {
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css': 'assets/vendor/bootstrap/bootstrap.min.css',
    'https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.0/css/bootstrap.min.css': 'assets/vendor/bootstrap/bootstrap.min.css',
    
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.0/font/bootstrap-icons.min.css': 'assets/vendor/bootstrap-icons/bootstrap-icons.css',
    'https://cdn.bootcdn.net/ajax/libs/bootstrap-icons/1.11.0/font/bootstrap-icons.min.css': 'assets/vendor/bootstrap-icons/bootstrap-icons.css',
    
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css': 'assets/vendor/animate.css/animate.min.css',
    'https://cdn.bootcdn.net/ajax/libs/animate.css/4.1.1/animate.min.css': 'assets/vendor/animate.css/animate.min.css',
    
    'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css': 'assets/vendor/github-markdown-css/github-markdown.min.css',
    
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js': 'assets/vendor/bootstrap/bootstrap.bundle.min.js',
    'https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.0/js/bootstrap.bundle.min.js': 'assets/vendor/bootstrap/bootstrap.bundle.min.js',
    
    'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js': 'assets/vendor/marked/marked.min.js'
};

function replaceInFile(filePath, isRoot = false) {
    if (!fs.existsSync(filePath)) {
        console.log(`文件不存在: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const mapping = isRoot ? cdnToLocalRoot : cdnToLocal;
    
    let replaced = false;
    for (const [cdn, local] of Object.entries(mapping)) {
        if (content.includes(cdn)) {
            content = content.replace(new RegExp(cdn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), local);
            replaced = true;
            console.log(`替换: ${cdn} -> ${local}`);
        }
    }
    
    if (replaced) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 已更新: ${filePath}`);
    } else {
        console.log(`⏭️  无需更新: ${filePath}`);
    }
}

// 要处理的文件列表
const files = [
    'index.html',
    'pages/contact.html',
    'pages/about.html',
    'pages/cases.html',
    'pages/case-detail.html',
    'pages/servers/nanoimprint-server.html',
    'pages/servers/etching-server.html',
    'pages/servers/metamaterial-server.html',
    'pages/knowledge/nanoimprint-knowledge.html',
    'pages/knowledge/etching-knowledge.html',
    'pages/knowledge/metamaterial-knowledge.html'
];

console.log('开始批量替换CDN链接为本地文件...\n');

files.forEach(file => {
    const isRoot = file === 'index.html';
    replaceInFile(file, isRoot);
});

console.log('\n✅ 批量替换完成！'); 