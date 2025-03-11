// 通用函数
document.addEventListener('DOMContentLoaded', function() {
    // 导航栏滚动效果
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }

    // 只在首页初始化功能
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        initGallery();
        initContactForm();
    }

    // 初始化平滑滚动
    initSmoothScroll();
});

// 图片轮播功能
function initGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const galleryDots = document.querySelectorAll('.gallery-dot');
    
    // 如果没有找到轮播元素，直接返回
    if (!galleryItems || !galleryDots || galleryItems.length === 0 || galleryDots.length === 0) {
        return;
    }

    let currentSlide = 0;
    let interval;

    function showSlide(index) {
        if (!galleryItems[index] || !galleryDots[index]) return;
        
        galleryItems.forEach(item => item.classList.remove('active'));
        galleryDots.forEach(dot => dot.classList.remove('active'));
        
        galleryItems[index].classList.add('active');
        galleryDots[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % galleryItems.length;
        showSlide(currentSlide);
    }

    // 点击切换
    galleryDots.forEach((dot, index) => {
        if (dot) {
            dot.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
                clearInterval(interval);
                interval = setInterval(nextSlide, 5000);
            });
        }
    });

    // 启动自动轮播
    interval = setInterval(nextSlide, 5000);

    // 初始显示第一张
    showSlide(0);
}

// 平滑滚动
function initSmoothScroll() {
    const anchors = document.querySelectorAll('a[href^="#"]');
    if (!anchors) return;

    anchors.forEach(anchor => {
        if (anchor) {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        }
    });
}

// 表单处理
function initContactForm() {
    const form = document.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const formData = {
            name: this.querySelector('input[type="text"]')?.value || '',
            email: this.querySelector('input[type="email"]')?.value || '',
            message: this.querySelector('textarea')?.value || ''
        };

        // 这里可以添加表单验证和提交逻辑
        console.log('表单数据：', formData);
        
        // 清空表单
        this.reset();
        alert('消息已发送！');
    });
} 