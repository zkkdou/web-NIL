# 微纳科技网站启动脚本顺序

## 脚本数组（按执行顺序）

```javascript
const startupScripts = [
    "00-startup-all.sh",                    // 0. 一键启动所有服务（推荐使用）
    "01-deploy-api-FIRST-ONLY.sh",          // 1. 部署API服务到record目录（仅首次运行）
    "02-download-deps-FIRST-ONLY.cjs",      // 2. 下载依赖文件（仅首次运行）
    "03-replace-cdn-FIRST-ONLY.cjs",        // 3. 替换CDN链接（仅首次运行）
    "04-start-services.sh",                 // 4. 启动所有服务（日常重启）
    "05-stop-services.sh",                  // 5. 停止所有服务
    "06-server.js"                          // 6. 主服务器文件
];
```

## 🎯 推荐使用方式

### 一键启动（推荐）
```bash
./00-startup-all.sh
```

这个脚本会自动检测是否需要首次部署，然后按顺序执行所有必要的步骤。

## 详细说明

### 0. `00-startup-all.sh` ⭐ 一键启动脚本
- **作用**: 一键启动所有服务，自动检测首次部署
- **执行位置**: 项目根目录
- **执行命令**: `./00-startup-all.sh`
- **功能**: 自动执行首次部署（如果需要）+ 启动服务
- **重复运行**: ✅ 每次重启服务器都使用这个

### 1. `01-deploy-api-FIRST-ONLY.sh` ⭐ 仅首次运行
- **作用**: 在服务器上创建record目录，部署API服务文件
- **执行位置**: 项目根目录
- **执行命令**: `./01-deploy-api-FIRST-ONLY.sh`
- **功能**: 创建contact-api.js、package.json和数据目录
- **重复运行**: ❌ 不需要，文件已存在

### 2. `02-download-deps-FIRST-ONLY.cjs` ⭐ 仅首次运行
- **作用**: 下载本地依赖文件
- **执行位置**: 项目根目录
- **执行命令**: `node 02-download-deps-FIRST-ONLY.cjs`
- **功能**: 下载Bootstrap、Bootstrap Icons、Animate.css等
- **重复运行**: ❌ 不需要，文件已下载

### 3. `03-replace-cdn-FIRST-ONLY.cjs` ⭐ 仅首次运行
- **作用**: 替换HTML文件中的CDN链接为本地链接
- **执行位置**: 项目根目录
- **执行命令**: `node 03-replace-cdn-FIRST-ONLY.cjs`
- **功能**: 将所有CDN链接替换为本地文件路径
- **重复运行**: ❌ 不需要，已替换完成

### 4. `04-start-services.sh` ✅ 日常重启使用
- **作用**: 一键启动所有服务
- **执行位置**: 项目根目录
- **执行命令**: `./04-start-services.sh`
- **功能**: 自动启动API服务（3000端口）和主服务器（8000端口）
- **重复运行**: ✅ 每次重启服务器都需要

### 5. `05-stop-services.sh` ✅ 停止服务使用
- **作用**: 一键停止所有服务
- **执行位置**: 项目根目录
- **执行命令**: `./05-stop-services.sh`
- **功能**: 自动停止API服务和主服务器
- **重复运行**: ✅ 需要停止服务时使用

### 6. `06-server.js` ✅ 主服务器文件
- **作用**: 主Web服务器
- **执行位置**: 项目根目录
- **执行命令**: `node 06-server.js`
- **监听端口**: 8000
- **功能**: 提供静态文件服务，处理表单提交

## 完整启动流程

### 首次部署（完整流程）
```bash
# 一键启动（推荐）
./00-startup-all.sh
```

### 日常重启（超简化流程）
```bash
# 一键启动
./00-startup-all.sh
```

### 停止服务
```bash
# 停止所有服务
./05-stop-services.sh
```

## 注意事项

1. **防火墙配置**: 确保端口已开放（仅首次配置）
   ```bash
   sudo ufw allow 3000
   sudo ufw allow 8000
   ```

2. **腾讯云安全组**: 在腾讯云控制台开放相应端口（仅首次配置）

3. **服务状态检查**: 
   ```bash
   netstat -tlnp | grep :3000
   netstat -tlnp | grep :8000
   ```

4. **测试API**: 
   ```bash
   curl -X POST http://localhost:3000/ -d "name=测试&phone=123456"
   ```

## 🎉 现在您只需要记住2个命令：

1. **启动服务**: `./00-startup-all.sh`
2. **停止服务**: `./05-stop-services.sh`

## 脚本执行顺序

```
00-startup-all.sh
├── 检查是否需要首次部署
├── 01-deploy-api-FIRST-ONLY.sh (仅首次)
├── 02-download-deps-FIRST-ONLY.js (仅首次)
├── 03-replace-cdn-FIRST-ONLY.cjs (仅首次)
└── 04-start-services.sh
    ├── 启动API服务 (3000端口)
    └── 启动主服务器 (8000端口)
```

## 文件结构

```
web-NIL/
├── 00-startup-all.sh                    # 一键启动脚本
├── 01-deploy-api-FIRST-ONLY.sh          # 部署API服务（仅首次）
├── 02-download-deps-FIRST-ONLY.cjs      # 下载依赖（仅首次）
├── 03-replace-cdn-FIRST-ONLY.cjs        # 替换CDN链接（仅首次）
├── 04-start-services.sh                 # 启动服务
├── 05-stop-services.sh                  # 停止服务
├── 06-server.js                         # 主服务器
├── record/                              # API服务目录
│   ├── contact-api.js                   # API服务
│   ├── package.json                     # API配置
│   └── data/                            # 数据目录
└── ...                                  # 其他文件
```

## 📋 脚本分类

### 🔴 仅首次运行（FIRST-ONLY标记）
- `01-deploy-api-FIRST-ONLY.sh`
- `02-download-deps-FIRST-ONLY.cjs`
- `03-replace-cdn-FIRST-ONLY.cjs`

### 🟢 日常使用
- `00-startup-all.sh` - 一键启动
- `04-start-services.sh` - 启动服务
- `05-stop-services.sh` - 停止服务
- `06-server.js` - 主服务器 