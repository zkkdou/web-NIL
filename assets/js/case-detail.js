// 配置
const CONFIG = {
    dateFormat: {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
};

// marked 配置
marked.use({
    mangle: false,
    headerIds: false,
    breaks: true,
    gfm: true
});

// DOM 元素缓存
const elements = {
    loadingSpinner: document.getElementById('loadingSpinner'),
    caseContent: document.getElementById('caseContent'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    caseTitle: document.getElementById('caseTitle'),
    caseDate: document.getElementById('caseDate'),
    caseCategory: document.getElementById('caseCategory'),
    caseTechnology: document.getElementById('caseTechnology'),
    caseIndustry: document.getElementById('caseIndustry'),
    caseTechnologyDetail: document.getElementById('caseTechnologyDetail'),
    caseTags: document.getElementById('caseTags'),
    mainMedia: document.getElementById('mainMedia'),
    caseDetailContent: document.getElementById('caseDetailContent'),
    mediaThumbnails: document.getElementById('mediaThumbnails')
};

// 获取URL参数
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 格式化日期
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('zh-CN', CONFIG.dateFormat);
}

// 显示错误信息
function showError(message) {
    elements.loadingSpinner.style.display = 'none';
    elements.caseContent.style.display = 'none';
    elements.errorMessage.style.display = 'block';
    elements.errorText.textContent = message;
}

// 创建标签元素
function createTagElements(tags) {
    return tags.map(tag => 
        `<span class="badge bg-primary bg-opacity-10 text-primary">${tag}</span>`
    ).join('');
}

// 创建媒体缩略图
function createMediaThumbnail(media, index) {
    const isVideo = media.type === 'video';
    return `
        <div class="media-item ${isVideo ? 'video' : ''} ${index === 0 ? 'active' : ''}" 
             data-media-index="${index}">
            ${isVideo 
                ? `<video src="../docs/${media.url}" preload="metadata"></video>`
                : `<img src="../docs/${media.url}" alt="${media.caption || ''}">`
            }
        </div>
    `;
}

// 更新主媒体区域
function updateMainMedia(media) {
    const isVideo = media.type === 'video';
    elements.mainMedia.innerHTML = isVideo
        ? `<video src="../docs/${media.url}" controls class="w-100"></video>`
        : `<img src="../docs/${media.url}" alt="${media.caption || ''}" class="w-100">`;
}

// 加载案例数据
async function loadCaseData() {
    const caseId = getUrlParameter('id');
    console.log('Case ID from URL:', caseId);
    
    if (!caseId) {
        showError('未指定案例ID');
        return;
    }

    try {
        // 加载案例列表数据
        const response = await fetch('../docs/cases.json');
        console.log('Fetching cases from:', '../docs/cases.json'); // 调试：打印请求URL
        
        if (!response.ok) {
            console.error('Failed to load cases.json:', response.status, response.statusText);
            throw new Error('无法加载案例数据');
        }
        
        const data = await response.json();
        console.log('Loaded cases:', data.cases);
        
        const caseData = data.cases.find(c => c.id === caseId);
        console.log('Found case data:', caseData);
        
        if (!caseData) {
            showError('未找到指定案例');
            return;
        }

        // 加载案例详细内容
        const contentUrl = `../docs/${caseData.folder}/content.md`;
        console.log('Fetching content from:', contentUrl); // 调试：打印内容URL
        
        const contentResponse = await fetch(contentUrl);
        if (!contentResponse.ok) {
            console.error('Failed to load content:', contentResponse.status, contentResponse.statusText);
            throw new Error('无法加载案例内容');
        }
        
        const content = await contentResponse.text();

        // 更新页面内容
        document.title = `${caseData.title} - 微纳科技`;
        elements.caseTitle.textContent = caseData.title;
        elements.caseDate.textContent = formatDate(caseData.date);
        elements.caseCategory.textContent = caseData.category;
        elements.caseTechnology.textContent = caseData.technology;
        elements.caseIndustry.textContent = caseData.industry;
        elements.caseTechnologyDetail.textContent = caseData.technologyDetail;
        elements.caseTags.innerHTML = createTagElements(caseData.tags || []);
        elements.caseDetailContent.innerHTML = marked.parse(content);

        // 处理媒体内容
        if (caseData.media && caseData.media.length > 0) {
            updateMainMedia(caseData.media[0]);
            elements.mediaThumbnails.innerHTML = caseData.media
                .map((media, index) => createMediaThumbnail(media, index))
                .join('');

            // 添加缩略图点击事件
            elements.mediaThumbnails.querySelectorAll('.media-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.mediaIndex);
                    updateMainMedia(caseData.media[index]);
                    
                    // 更新活动状态
                    elements.mediaThumbnails.querySelectorAll('.media-item').forEach(i => 
                        i.classList.remove('active'));
                    item.classList.add('active');
                });
            });
        }

        // 显示内容
        elements.loadingSpinner.style.display = 'none';
        elements.caseContent.style.display = 'block';

    } catch (error) {
        console.error('加载案例数据失败:', error);
        showError('加载案例数据失败，请稍后重试');
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', loadCaseData); 