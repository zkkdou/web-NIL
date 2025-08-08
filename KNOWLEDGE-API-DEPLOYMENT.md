# 知识库API部署说明

## 问题描述
当前知识库页面访问生产服务器 `http://124.220.134.33/pages/knowledge-base.html` 时，API请求失败，因为生产服务器上没有运行知识库API服务。

## 解决方案
在生产服务器上部署独立的知识库API服务，使用端口3001。

## 部署步骤

### 1. 上传文件到生产服务器
```bash
# 上传API文件
scp knowledge-api.js ubuntu@124.220.134.33:~/work/website/

# 上传启动和停止脚本
scp start-knowledge-api.sh ubuntu@124.220.134.33:~/work/website/
scp stop-knowledge-api.sh ubuntu@124.220.134.33:~/work/website/

# 上传示例文件（如果还没有）
scp -r knowledgehub ubuntu@124.220.134.33:~/work/website/
```

### 2. 在服务器上设置权限
```bash
ssh ubuntu@124.220.134.33
cd ~/work/website
chmod +x start-knowledge-api.sh
chmod +x stop-knowledge-api.sh
```

### 3. 启动知识库API服务
```bash
# 启动服务
./start-knowledge-api.sh

# 或者后台运行
nohup node knowledge-api.js > knowledge-api.log 2>&1 &
```

### 4. 配置防火墙
确保端口3001已开放：
```bash
sudo ufw allow 3001
sudo ufw status
```

### 5. 测试API
```bash
# 测试文件列表API
curl http://124.220.134.33:3001/api/files

# 应该返回JSON格式的文件列表
```

## 文件说明

- `knowledge-api.js` - 知识库API服务器
- `start-knowledge-api.sh` - 启动脚本
- `stop-knowledge-api.sh` - 停止脚本
- `knowledgehub/` - 知识库文件目录

## 端口配置

- 主网站服务器：端口8000
- 联系表单API：端口3000
- 知识库API：端口3001

## 前端修改

知识库页面已修改为自动检测服务器类型：
- 本地开发：使用相对路径 `/api/files`
- 生产服务器：使用完整URL `http://124.220.134.33:3001/api/files`

## 故障排除

### 端口被占用
```bash
# 查看占用端口的进程
netstat -tulpn | grep 3001

# 停止进程
pkill -f "knowledge-api.js"
```

### 权限问题
```bash
# 确保文件有执行权限
chmod +x start-knowledge-api.sh
chmod +x stop-knowledge-api.sh
```

### 防火墙问题
```bash
# 检查防火墙状态
sudo ufw status

# 开放端口
sudo ufw allow 3001
```

## 验证部署

1. 启动API服务
2. 访问 `http://124.220.134.33/pages/knowledge-base.html`
3. 检查浏览器控制台，应该看到：
   - 当前页面URL: `http://124.220.134.33/pages/knowledge-base.html`
   - 最终API地址: `http://124.220.134.33:3001/api/files`
4. 页面应该能正常加载文件列表 