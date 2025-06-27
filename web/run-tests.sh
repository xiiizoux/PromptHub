#!/bin/bash

# PromptHub Web 测试运行脚本

echo "🚀 开始运行 PromptHub Web 页面测试"
echo "=================================="

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查开发服务器是否运行
if ! curl -s http://localhost:9011 > /dev/null; then
    echo "🔧 启动开发服务器..."
    npm run dev &
    DEV_SERVER_PID=$!
    echo "等待服务器启动..."
    sleep 10
else
    echo "✅ 开发服务器已运行"
fi

# 运行不同类型的测试
echo ""
echo "🧪 运行测试套件"
echo "=================="

# 1. 运行修复后的关键测试
echo "1️⃣ 运行关键功能测试..."
npx playwright test fixed-critical-tests.spec.ts --project=chromium --reporter=line

# 2. 运行基本功能测试
echo ""
echo "2️⃣ 运行基本功能测试..."
npx playwright test basic-functionality.spec.ts --project=chromium --reporter=line

# 3. 可选：运行所有测试（如果需要）
read -p "是否运行所有测试？(y/N): " run_all
if [[ $run_all =~ ^[Yy]$ ]]; then
    echo ""
    echo "3️⃣ 运行所有测试..."
    npx playwright test --project=chromium --reporter=line
fi

# 生成测试报告
echo ""
echo "📊 生成测试报告..."
npx playwright show-report &

echo ""
echo "✅ 测试完成！"
echo "📋 查看详细报告："
echo "   - 浏览器报告: http://localhost:9323"
echo "   - 文本报告: web/test-results/final-test-summary.md"
echo ""

# 清理（如果我们启动了开发服务器）
if [ ! -z "$DEV_SERVER_PID" ]; then
    echo "🧹 清理开发服务器..."
    kill $DEV_SERVER_PID 2>/dev/null
fi

echo "🎉 测试流程完成！"
