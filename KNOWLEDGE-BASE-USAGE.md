# 知识库使用说明

## 路径配置

**知识库文件夹路径配置**：
- 服务器端：`06-server.js` 中的 `KNOWLEDGE_HUB_PATH` 变量（文件系统路径）
- 服务器端：`06-server.js` 中的 `KNOWLEDGE_HUB_URL_PATH` 变量（URL路径）
- 前端页面：`pages/knowledge-base.html` 中的 `KNOWLEDGE_HUB_PATH` 变量
- 当前配置：
  - 文件系统路径：`knowledgehub/` 文件夹（项目内部，相对于项目根目录）
  - URL路径：`/knowledgehub/`（用于Web访问）

如需修改路径，请同时更新以上两个文件中的配置。

## HTTPS配置

**解决不安全下载警告**：
服务器支持HTTPS协议，可以解决浏览器的不安全下载警告。

### Linux服务器部署步骤：

1. **快速部署**（推荐）：
   ```bash
   chmod +x deploy-https.sh
   ./deploy-https.sh
   ```

2. **手动部署**：
   ```bash
   # 生成SSL证书
   chmod +x generate-ssl.sh
   ./generate-ssl.sh
   
   # 启动服务器
   chmod +x start-server.sh
   ./start-server.sh
   ```

3. **后台运行**：
   ```bash
   nohup node 06-server.js > server.log 2>&1 &
   ```

### 启用HTTPS步骤：
1. 生成SSL证书：
   ```bash
   chmod +x generate-ssl.sh
   ./generate-ssl.sh
   ```
   或者手动生成：
   ```bash
   mkdir ssl
   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=CN/ST=Shanghai/L=Shanghai/O=WeiNaTech/OU=IT/CN=124.220.134.33"
   ```

2. 重启服务器：
   ```bash
   node 06-server.js
   ```

3. 访问HTTPS地址：
   - 本地开发：`https://localhost:8443`
   - 生产服务器：`https://124.220.134.33:8443`

### 端口配置：
- HTTP端口：8000（默认）
- HTTPS端口：8443（默认）
- 可通过环境变量修改：
  ```bash
  PORT=8000 HTTPS_PORT=8443 node 06-server.js
  ```

### 防火墙配置：
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 8000/tcp
sudo ufw allow 8443/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=8443/tcp
sudo firewall-cmd --reload
```

## 功能概述

知识库系统提供以下功能：

1. **文件存储**：所有文件存储在 `knowledgehub/` 文件夹中，按日期分类
2. **文件上传**：支持多种文件格式，自动按月份分类存储
3. **文件下载**：提供直接下载链接
4. **文件管理**：支持文件删除（需要密码验证）
5. **搜索功能**：按文件名搜索
6. **分类浏览**：按文件夹分类显示

## 工作原理
1. **文件存储**：所有文件存储在 `KNOWLEDGE_HUB_PATH` 配置的文件夹中，按日期分类
2. **文件列表生成**：服务器自动扫描文件夹并生成文件列表
3. **直接下载**：点击下载按钮直接通过文件链接下载

## 使用方法

### 1. 添加新文件
1. 将文件放入 `KNOWLEDGE_HUB_PATH` 配置的文件夹的相应子文件夹中（如 `2024-12/`、`2025-01/` 等）
2. 通过网页界面上传文件（需要密码：`fjfjfjfj`）
3. 或者手动将文件放入对应文件夹

### 2. 更新文件列表
文件列表会自动更新，无需手动操作。

### 3. 访问知识库
- 本地开发：`http://localhost:8000/pages/knowledge-base.html`
- 生产服务器：`http://124.220.134.33/pages/knowledge-base.html`

## 文件结构
```
KNOWLEDGE_HUB_PATH/
├── 2024-12/
│   ├── 纳米压印技术报告.pdf
│   └── 微纳加工工艺手册.docx
├── 2025-01/
│   ├── 超材料设计指南.txt
│   └── 刻蚀工艺参数.xlsx
└── 2025-08/
    ├── 最新技术资料.zip
    └── 产品规格说明书.pdf
```

## 功能特性
- ✅ 按文件夹分组显示文件
- ✅ 搜索文件名
- ✅ 直接下载文件
- ✅ 复制下载链接
- ✅ 显示文件大小和修改时间
- ✅ 支持多种文件格式
- ✅ 响应式设计

## 优势
1. **简单**：无需额外的API服务
2. **快速**：直接文件下载，无中间层
3. **可靠**：不依赖网络API调用
4. **易维护**：只需要定期更新文件列表

## 注意事项
- 文件大小显示的是实际文件大小
- 下载链接是相对路径，确保文件路径正确
- 建议定期备份 `KNOWLEDGE_HUB_PATH` 配置的文件夹
- 文件名支持中文，但建议避免特殊字符

## 故障排除
如果下载失败，检查：
1. 文件路径是否正确
2. 文件是否存在
3. 服务器是否正确配置了静态文件服务
4. `KNOWLEDGE_HUB_PATH` 配置是否正确 