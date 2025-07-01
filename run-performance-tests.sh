#!/bin/bash

# PromptHub 性能优化测试运行脚本
echo "🚀 PromptHub 性能优化测试开始..."

# 检查是否安装了必要的依赖
echo "📦 检查依赖..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 安装 Playwright（如果未安装）
echo "🎭 检查 Playwright 安装状态..."
if ! npm list @playwright/test &> /dev/null; then
    echo "📦 安装 Playwright..."
    npm install --save-dev @playwright/test
fi

# 安装 Playwright 浏览器
echo "🌐 安装 Playwright 浏览器..."
npx playwright install

# 检查开发服务器是否运行
echo "🔍 检查开发服务器状态..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️ 开发服务器未运行，正在启动..."
    echo "请在另一个终端运行: npm run dev"
    echo "等待服务器启动..."
    
    # 等待服务器启动
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✅ 服务器已启动"
            break
        fi
        echo "等待中... ($i/30)"
        sleep 2
    done
    
    if ! curl -s http://localhost:3000 > /dev/null; then
        echo "❌ 服务器启动失败，请手动启动开发服务器"
        echo "运行命令: npm run dev"
        exit 1
    fi
fi

echo "✅ 开发服务器运行正常"

# 创建测试结果目录
mkdir -p test-results

# 运行测试
echo ""
echo "🧪 开始运行性能优化测试..."
echo "================================================"

# 运行基础懒加载测试
echo "1️⃣ 运行基础懒加载测试..."
npx playwright test tests/lazy-loading-test.spec.ts --reporter=list

echo ""
echo "2️⃣ 运行详细性能优化测试..."
npx playwright test tests/performance-optimization-test.spec.ts --reporter=list

# 生成测试报告
echo ""
echo "📊 生成测试报告..."
npx playwright show-report

echo ""
echo "================================================"
echo "✅ 测试完成！"
echo ""
echo "📋 测试结果总结："
echo "- 基础懒加载测试: 检查图像、视频页面和账户管理页面的懒加载功能"
echo "- 详细性能测试: 深入分析渐进式加载、Intersection Observer 使用情况"
echo "- 移动端测试: 检查响应式设计和移动端优化"
echo ""
echo "📁 测试报告位置:"
echo "- HTML 报告: playwright-report/index.html"
echo "- JSON 结果: test-results/results.json"
echo ""
echo "🔧 如需重新运行特定测试:"
echo "- 懒加载测试: npx playwright test tests/lazy-loading-test.spec.ts"
echo "- 性能测试: npx playwright test tests/performance-optimization-test.spec.ts"
echo "- 单个浏览器: npx playwright test --project=chromium"
echo "- 调试模式: npx playwright test --debug"
echo ""
echo "📖 查看详细报告: npx playwright show-report"
