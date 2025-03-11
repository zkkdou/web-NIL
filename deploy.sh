#!/bin/bash

# 确保脚本在错误时停止
set -e

# 显示执行的命令
set -x

# 检查必要的命令是否存在
command -v node >/dev/null 2>&1 || { echo "需要 Node.js 但未安装。请先安装 Node.js。"; exit 1; }
command -v php >/dev/null 2>&1 || { echo "需要 PHP 但未安装。请先安装 PHP。"; exit 1; }

# 安装依赖
echo "安装 Node.js 依赖..."
npm install

# 下载第三方库文件
echo "下载第三方库文件..."
#node download-deps.js

# 设置文件权限
echo "设置文件权限..."
chmod -R 755 .
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

# 确保表单提交目录存在并可写
echo "设置表单提交目录权限..."
mkdir -p forms/submissions
chmod 777 forms/submissions

echo "部署完成！"
echo "请确保已正确配置 Web 服务器（Apache/Nginx）。"
echo "详细说明请参考 DEPLOY.md 文件。" 
