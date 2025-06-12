#!/bin/bash

# 验证AI分析功能配置完整性脚本

echo "🔍 验证AI分析功能配置完整性..."
echo "=============================================="

# 颜色输出定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 存在${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 不存在${NC}"
        return 1
    fi
}

check_dependency() {
    local dir=$1
    local package=$2
    if [ -f "$dir/package.json" ] && grep -q "\"$package\"" "$dir/package.json"; then
        echo -e "${GREEN}✅ $package 依赖存在于 $dir${NC}"
        return 0
    else
        echo -e "${RED}❌ $package 依赖缺失于 $dir${NC}"
        return 1
    fi
}

error_count=0

echo -e "${BLUE}1. 检查AI分析相关文件...${NC}"
check_file "web/src/lib/ai-analyzer.ts" || ((error_count++))
check_file "web/src/pages/api/ai-analyze.ts" || ((error_count++))
check_file "web/src/components/AIAnalyzeButton.tsx" || ((error_count++))
check_file "web/src/components/AIConfigPanel.tsx" || ((error_count++))
echo ""

echo -e "${BLUE}2. 检查依赖包配置...${NC}"
check_dependency "." "axios" || ((error_count++))
check_dependency "web" "axios" || ((error_count++))
echo ""

echo -e "${BLUE}3. 检查环境变量配置...${NC}"
check_file ".env.example" || ((error_count++))

# 检查.env.example是否包含AI配置
if grep -q "OPENAI_API_KEY" .env.example; then
    echo -e "${GREEN}✅ .env.example 包含 OPENAI_API_KEY 配置${NC}"
else
    echo -e "${RED}❌ .env.example 缺少 OPENAI_API_KEY 配置${NC}"
    ((error_count++))
fi

if grep -q "OPENAI_API_BASE_URL" .env.example; then
    echo -e "${GREEN}✅ .env.example 包含 OPENAI_API_BASE_URL 配置${NC}"
else
    echo -e "${RED}❌ .env.example 缺少 OPENAI_API_BASE_URL 配置${NC}"
    ((error_count++))
fi

# 检查是否统一使用主目录.env
if [ ! -f "web/.env.example" ]; then
    echo -e "${GREEN}✅ web目录没有独立的.env.example文件（符合统一配置要求）${NC}"
else
    echo -e "${YELLOW}⚠️  web目录仍有.env.example文件，建议删除${NC}"
fi

if [ ! -f "mcp/.env.example" ]; then
    echo -e "${GREEN}✅ mcp目录没有独立的.env.example文件（符合统一配置要求）${NC}"
else
    echo -e "${YELLOW}⚠️  mcp目录仍有.env.example文件，建议删除${NC}"
fi
echo ""

echo -e "${BLUE}4. 检查Docker配置...${NC}"
check_file "Dockerfile" || ((error_count++))
check_file "docker-compose.yml" || ((error_count++))
check_file "docker-start.sh" || ((error_count++))

# 检查docker-compose.yml是否映射.env文件
if grep -q ".env:/app/.env" docker-compose.yml; then
    echo -e "${GREEN}✅ docker-compose.yml 正确映射主目录.env文件${NC}"
else
    echo -e "${RED}❌ docker-compose.yml 未正确映射.env文件${NC}"
    ((error_count++))
fi

# 检查Dockerfile是否包含必要的构建步骤
if grep -q "npm install" Dockerfile; then
    echo -e "${GREEN}✅ Dockerfile 包含依赖安装步骤${NC}"
else
    echo -e "${RED}❌ Dockerfile 缺少依赖安装步骤${NC}"
    ((error_count++))
fi
echo ""

echo -e "${BLUE}5. 检查Next.js配置...${NC}"
check_file "web/next.config.js" || ((error_count++))

# 检查next.config.js是否正确配置环境变量
if grep -q "../.env" web/next.config.js; then
    echo -e "${GREEN}✅ next.config.js 正确配置主目录.env文件读取${NC}"
else
    echo -e "${RED}❌ next.config.js 未正确配置.env文件读取${NC}"
    ((error_count++))
fi
echo ""

echo -e "${BLUE}6. 检查测试文件...${NC}"
check_file "test-ai-analysis.js" || ((error_count++))

if [ -f "test-ai-analysis.js" ] && [ -x "test-ai-analysis.js" ]; then
    echo -e "${GREEN}✅ test-ai-analysis.js 具有执行权限${NC}"
else
    echo -e "${YELLOW}⚠️  test-ai-analysis.js 没有执行权限，将自动修复${NC}"
    chmod +x test-ai-analysis.js 2>/dev/null || true
fi
echo ""

echo -e "${BLUE}7. 检查文档...${NC}"
check_file "docs/AI_ANALYSIS_FEATURE.md" || ((error_count++))
echo ""

# 总结
echo "=============================================="
if [ $error_count -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！AI分析功能配置完整。${NC}"
    echo ""
    echo -e "${BLUE}📋 配置摘要：${NC}"
    echo "• AI分析服务文件：完整"
    echo "• 依赖包配置：正确"
    echo "• 环境变量：统一使用主目录.env文件"
    echo "• Docker配置：正确映射环境变量"
    echo "• Next.js配置：正确读取主目录环境变量"
    echo ""
    echo -e "${BLUE}🚀 下一步：${NC}"
    echo "1. 配置您的.env文件（参考.env.example）"
    echo "2. 添加 OPENAI_API_KEY 或配置自定义API端点"
    echo "3. 运行 ./test-ai-analysis.js 测试功能"
    echo "4. 或使用 docker-compose up 部署完整系统"
else
    echo -e "${RED}❌ 发现 $error_count 个问题，请检查上述错误信息。${NC}"
fi
echo "" 