#!/bin/bash

echo "🚀 微纳科技网站一键启动脚本"
echo "=============================="
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

echo "📋 执行顺序："
echo "1. 01-deploy-api-FIRST-ONLY.sh - 部署API服务（仅首次）"
echo "2. 02-download-deps-FIRST-ONLY.cjs - 下载依赖文件（仅首次）"
echo "3. 03-replace-cdn-FIRST-ONLY.cjs - 替换CDN链接（仅首次）"
echo "4. 04-start-services.sh - 启动所有服务（包含HTTPS）"
echo ""

# 检查是否需要首次部署
if [ ! -d "record" ] || [ ! -f "record/contact-api.js" ]; then
    echo "🔧 首次部署模式 - 执行完整流程"
    echo ""
    
    # 1. 部署API服务
    echo "📦 步骤1: 部署API服务..."
    if [ -f "01-deploy-api-FIRST-ONLY.sh" ]; then
        chmod +x 01-deploy-api-FIRST-ONLY.sh
        ./01-deploy-api-FIRST-ONLY.sh
        if [ $? -ne 0 ]; then
            echo "❌ API服务部署失败"
            exit 1
        fi
        echo "✅ API服务部署完成"
    else
        echo "❌ 01-deploy-api-FIRST-ONLY.sh 文件不存在"
        exit 1
    fi
    echo ""
    
    # 2. 检查是否需要下载依赖文件
    if [ ! -d "assets/vendor/bootstrap" ] || [ ! -f "assets/vendor/bootstrap/bootstrap.min.css" ]; then
        echo "📥 步骤2: 下载依赖文件..."
        if [ -f "02-download-deps-FIRST-ONLY.cjs" ]; then
            node 02-download-deps-FIRST-ONLY.cjs
            if [ $? -ne 0 ]; then
                echo "❌ 依赖文件下载失败"
                exit 1
            fi
            echo "✅ 依赖文件下载完成"
        else
            echo "❌ 02-download-deps-FIRST-ONLY.cjs 文件不存在"
            exit 1
        fi
    else
        echo "⚡ 步骤2: 跳过依赖文件下载（文件已存在）"
    fi
    echo ""
    
    # 3. 检查是否需要替换CDN链接
    if grep -q "cdn\.jsdelivr\.net\|cdnjs\.cloudflare\.com" *.html pages/*.html pages/*/*.html 2>/dev/null; then
        echo "🔄 步骤3: 替换CDN链接..."
        if [ -f "03-replace-cdn-FIRST-ONLY.cjs" ]; then
            node 03-replace-cdn-FIRST-ONLY.cjs
            if [ $? -ne 0 ]; then
                echo "❌ CDN链接替换失败"
                exit 1
            fi
            echo "✅ CDN链接替换完成"
        else
            echo "❌ 03-replace-cdn-FIRST-ONLY.cjs 文件不存在"
            exit 1
        fi
    else
        echo "⚡ 步骤3: 跳过CDN链接替换（已替换完成）"
    fi
    echo ""
else
    echo "⚡ 快速启动模式 - 跳过首次部署步骤"
    echo ""
fi

# 4. 启动所有服务
echo "🚀 步骤4: 启动所有服务..."
if [ -f "04-start-services.sh" ]; then
    chmod +x 04-start-services.sh
    ./04-start-services.sh
    if [ $? -ne 0 ]; then
        echo "❌ 服务启动失败"
        exit 1
    fi
    echo "✅ 所有服务启动完成"
else
    echo "❌ 04-start-services.sh 文件不存在"
    exit 1
fi

echo ""
echo "🎉 微纳科技网站启动完成！"
echo "📡 API服务: http://localhost:3000"
echo "🌐 HTTP网站: http://localhost:8000"
echo "🔒 HTTPS网站: https://localhost:8443"
echo "📊 数据文件: record/data/contact_forms.csv"
echo ""
echo "💡 停止服务: ./05-stop-services.sh"
echo "🔄 重新启动: ./00-startup-all.sh" 