#!/bin/bash

echo "🚀 PromptHub 快速优化检测"
echo "=========================="

# 检查开发服务器
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ 开发服务器未运行"
    echo "请先运行: npm run dev"
    exit 1
fi

echo "✅ 开发服务器运行正常"
echo ""

# 安装依赖（如果需要）
if ! npm list @playwright/test &> /dev/null; then
    echo "📦 安装 Playwright..."
    npm install --save-dev @playwright/test
    npx playwright install chromium
fi

# 运行快速检测
echo "🧪 开始快速检测..."
npx playwright test tests/quick-optimization-check.spec.ts --project=chromium --reporter=list

echo ""
echo "✅ 快速检测完成！"
echo ""
echo "💡 提示："
echo "- 如需详细测试: ./run-performance-tests.sh"
echo "- 如需调试模式: npx playwright test --debug"
echo "- 查看测试报告: npx playwright show-report"
