document.addEventListener('DOMContentLoaded', async function() {
    const aboutContent = document.getElementById('aboutContent');
    if (!aboutContent) {
        console.error('找不到 aboutContent 元素');
        return;
    }
    
    try {
        // 加载 Markdown 文件
        const response = await fetch('../docs/about.md');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const content = await response.text();
        
        // 配置 marked 选项
        marked.use({
            mangle: false,
            headerIds: false,
            breaks: true,
            gfm: true
        });

        // 创建自定义渲染器
        const renderer = {
            image(href, title, text) {
                // 处理相对路径
                if (href && typeof href === 'string') {
                    if (href.startsWith('../docs/')) {
                        href = href.replace('../docs/', '');
                    }
                    // 如果路径不是以 http 或 https 开头，添加 docs 前缀
                    if (!href.startsWith('http://') && !href.startsWith('https://')) {
                        href = `../docs/${href}`;
                    }
                }
                return `<img src="${href}" alt="${text || ''}" title="${title || ''}" class="img-fluid rounded shadow-sm">`;
            }
        };
        
        // 使用自定义渲染器
        marked.use({ renderer });
        
        // 渲染 Markdown 内容
        aboutContent.innerHTML = marked.parse(content);
        
    } catch (error) {
        console.error('加载内容失败:', error);
        aboutContent.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">加载失败</h4>
                <p>抱歉，无法加载页面内容。错误信息：${error.message}</p>
                <hr>
                <p class="mb-0">请检查文件路径是否正确，或稍后再试。</p>
            </div>
        `;
    }
}); 