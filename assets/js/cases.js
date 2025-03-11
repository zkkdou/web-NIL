// 配置
const CONFIG = {
    casesPerPage: 6,
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

// 状态管理
const state = {
    allCases: [],
    currentFilter: 'all',
    currentSort: 'date-desc',
    currentPage: 1,
    loadedContents: new Map() // 用于缓存已加载的内容
};

// DOM 元素缓存
const elements = {
    casesList: document.getElementById('casesList'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    buttonGroup: document.querySelector('.btn-group'),
    sortSelect: document.getElementById('sortSelect')
};

// 加载案例数据
async function loadCasesData() {
    try {
        const response = await fetch('../docs/cases.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        state.allCases = data.cases;
        
        initializeFilterButtons(data.categories || []);
        loadCases();
        initializeEventListeners();
        
    } catch (error) {
        console.error('加载案例数据失败:', error);
        showError('无法加载案例数据');
    }
}

// 初始化分类按钮
function initializeFilterButtons(categories) {
    elements.buttonGroup.innerHTML = `
        <button type="button" class="btn btn-outline-primary active" data-filter="all">全部</button>
        ${categories.map(category => `
            <button type="button" class="btn btn-outline-primary" data-filter="${category}">
                ${category}
            </button>
        `).join('')}
    `;
}

// 初始化事件监听器
function initializeEventListeners() {
    // 筛选按钮点击事件
    elements.buttonGroup.addEventListener('click', (e) => {
        if (!e.target.matches('.btn')) return;
        
        elements.buttonGroup.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        state.currentFilter = e.target.dataset.filter;
        state.currentPage = 1;
        loadCases();
    });

    // 排序下拉菜单变化事件
    elements.sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        state.currentPage = 1;
        loadCases();
    });

    // 加载更多按钮点击事件
    elements.loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        loadCases(true);
    });
}

// 延迟加载案例内容
async function loadCaseContent(case_) {
    // 如果已经加载过，直接返回缓存的内容
    if (state.loadedContents.has(case_.id)) {
        return state.loadedContents.get(case_.id);
    }

    try {
        const contentResponse = await fetch(`../docs/${case_.folder}/content.md`);
        if (!contentResponse.ok) throw new Error('无法加载案例内容');
        const content = await contentResponse.text();
        // 缓存加载的内容
        state.loadedContents.set(case_.id, content);
        return content;
    } catch (error) {
        console.error(`加载案例 ${case_.id} 内容失败:`, error);
        return case_.summary || '内容加载失败';
    }
}

// 创建案例卡片元素
async function createCaseElement(case_) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    // 先创建卡片基本结构
    col.innerHTML = `
        <div class="card h-100 border-0 shadow-sm case-card">
            <div class="card-img-wrapper">
                <img src="../docs/${case_.folder}/${case_.cover}" 
                     class="card-img-top" 
                     alt="${case_.title}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/400x250?text=${encodeURIComponent(case_.title)}'">
            </div>
            <div class="card-body">
                <h3 class="h5 card-title">${case_.title}</h3>
                <div class="card-text text-muted markdown-body">
                    <div class="placeholder-glow">
                        <span class="placeholder col-7"></span>
                        <span class="placeholder col-4"></span>
                        <span class="placeholder col-4"></span>
                        <span class="placeholder col-6"></span>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <small class="text-muted">${formatDate(case_.date)}</small>
                    <a href="case-detail.html?id=${encodeURIComponent(case_.id)}" class="btn btn-outline-primary btn-sm" onclick="console.log('Clicked case:', '${case_.id}')">查看详情</a>
                </div>
            </div>
        </div>
    `;

    // 异步加载内容
    const content = await loadCaseContent(case_);
    const summary = content ? marked.parse(content.split('\n\n')[0]) : case_.summary;
    
    // 更新摘要内容
    const summaryElement = col.querySelector('.card-text');
    if (summaryElement) {
        summaryElement.innerHTML = summary;
    }

    return col;
}

// 加载案例列表
async function loadCases(isAppend = false) {
    const filteredCases = filterCases();
    const sortedCases = sortCases(filteredCases);
    const casesToShow = sortedCases.slice(0, state.currentPage * CONFIG.casesPerPage);
    
    if (!isAppend) {
        elements.casesList.innerHTML = '';
    }

    const newCases = casesToShow.slice((state.currentPage - 1) * CONFIG.casesPerPage);
    
    // 显示加载状态
    if (!isAppend) {
        elements.casesList.innerHTML = `
            <div class="col-12 text-center mb-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
        `;
    }

    // 并行加载所有案例
    const caseElements = await Promise.all(newCases.map(createCaseElement));
    
    if (!isAppend) {
        elements.casesList.innerHTML = '';
    }
    
    const fragment = document.createDocumentFragment();
    caseElements.forEach(element => fragment.appendChild(element));
    elements.casesList.appendChild(fragment);
    
    updateLoadMoreButton(casesToShow.length < sortedCases.length);
    
    if (filteredCases.length === 0) {
        showEmptyState();
    }
}

// 过滤案例
function filterCases() {
    return state.currentFilter === 'all' 
        ? state.allCases 
        : state.allCases.filter(case_ => case_.category === state.currentFilter);
}

// 排序案例
function sortCases(cases) {
    return [...cases].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return state.currentSort === 'date-desc' ? dateB - dateA : dateA - dateB;
    });
}

// 更新加载更多按钮状态
function updateLoadMoreButton(show) {
    elements.loadMoreBtn.style.display = show ? 'block' : 'none';
}

// 显示空状态
function showEmptyState() {
    elements.casesList.innerHTML = `
        <div class="col-12">
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <h3>暂无案例</h3>
                <p>当前分类下还没有案例，请尝试其他分类。</p>
            </div>
        </div>
    `;
}

// 显示错误信息
function showError(message) {
    elements.casesList.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">加载失败</h4>
                <p>${message}</p>
            </div>
        </div>
    `;
}

// 格式化日期
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('zh-CN', CONFIG.dateFormat);
}

// 初始化
document.addEventListener('DOMContentLoaded', loadCasesData); 