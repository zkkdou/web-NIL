# 我的网站项目文档

## 项目结构
```
website/
├── assets/
│   ├── css/          # 样式文件
│   │   └── styles.css
│   └── js/           # JavaScript 文件
│       └── scripts.js
├── docs/             # 文档
│   └── README.md
├── forms/            # 表单处理脚本
│   └── contact.php
├── images/           # 图片资源
├── pages/            # 子页面
│   └── about.html
└── index.html        # 主页
```

## 开发指南

### 添加新页面
1. 在 `pages` 目录下创建新的 HTML 文件
2. 复制现有页面的基本结构
3. 更新导航链接
4. 添加新的内容

### 样式修改
- 所有自定义样式都应该添加到 `assets/css/styles.css`
- 使用 Bootstrap 类进行基本布局
- 需要新的样式时，先检查是否可以使用 Bootstrap 类

### JavaScript
- 所有自定义脚本都应该添加到 `assets/js/scripts.js`
- 使用模块化的方式组织代码
- 保持代码简洁和可维护

### 图片
- 所有图片都应该放在 `images` 目录下
- 使用适当的图片格式和压缩
- 添加有意义的文件名

### 表单处理
- 所有表单处理脚本都应该放在 `forms` 目录下
- 确保进行适当的数据验证
- 添加错误处理和日志记录

## 部署说明
1. 确保所有文件都已更新
2. 检查所有链接是否正确
3. 测试所有功能
4. 上传到服务器

## 维护
- 定期更新依赖
- 检查并修复损坏的链接
- 更新内容
- 备份数据 
<!--stackedit_data:
eyJoaXN0b3J5IjpbMzU2MjU2NjAyXX0=
-->