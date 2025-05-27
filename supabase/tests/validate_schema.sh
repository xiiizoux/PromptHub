#!/bin/bash
# validate_schema.sh - 验证schema.sql语法的脚本

echo "正在验证 supabase/schema.sql 的语法..."

# 检查基本的SQL语法错误
echo "1. 检查基本语法..."

# 检查是否有未闭合的括号
OPEN_PARENS=$(grep -o '(' supabase/schema.sql | wc -l)
CLOSE_PARENS=$(grep -o ')' supabase/schema.sql | wc -l)

if [ $OPEN_PARENS -ne $CLOSE_PARENS ]; then
    echo "❌ 错误: 括号不匹配 (开括号: $OPEN_PARENS, 闭括号: $CLOSE_PARENS)"
    exit 1
else
    echo "✅ 括号匹配正确"
fi

# 检查是否有未闭合的引号
SINGLE_QUOTES=$(grep -o "'" supabase/schema.sql | wc -l)
if [ $((SINGLE_QUOTES % 2)) -ne 0 ]; then
    echo "❌ 警告: 单引号可能不匹配"
fi

# 检查关键的表是否都存在
echo "2. 检查必需的表..."

REQUIRED_TABLES=(
    "prompts"
    "prompt_versions"
    "prompt_usage"
    "prompt_feedback"
    "prompt_performance"
    "prompt_collaborators"
    "prompt_audit_logs"
    "api_keys"
    "categories"
)

for table in "${REQUIRED_TABLES[@]}"; do
    if grep -q "CREATE TABLE.*$table" supabase/schema.sql; then
        echo "✅ 表 $table 存在"
    else
        echo "❌ 错误: 表 $table 不存在"
        exit 1
    fi
done

# 检查权限管理字段
echo "3. 检查权限管理字段..."

REQUIRED_FIELDS=(
    "allow_collaboration"
    "edit_permission"
    "created_by"
    "last_modified_by"
)

for field in "${REQUIRED_FIELDS[@]}"; do
    if grep -q "$field" supabase/schema.sql; then
        echo "✅ 字段 $field 存在"
    else
        echo "❌ 错误: 字段 $field 不存在"
        exit 1
    fi
done

# 检查RLS策略
echo "4. 检查RLS策略..."

if grep -q "ALTER TABLE.*ENABLE ROW LEVEL SECURITY" supabase/schema.sql; then
    echo "✅ RLS已启用"
else
    echo "❌ 错误: 未找到RLS启用语句"
    exit 1
fi

if grep -q "CREATE POLICY" supabase/schema.sql; then
    echo "✅ 找到RLS策略"
else
    echo "❌ 错误: 未找到RLS策略"
    exit 1
fi

# 检查索引
echo "5. 检查索引..."

if grep -q "CREATE INDEX.*idx_prompts_allow_collaboration" supabase/schema.sql; then
    echo "✅ 权限管理索引存在"
else
    echo "❌ 错误: 权限管理索引缺失"
    exit 1
fi

# 检查触发器和函数
echo "6. 检查触发器和函数..."

if grep -q "CREATE OR REPLACE FUNCTION.*log_prompt_changes" supabase/schema.sql; then
    echo "✅ 审计日志函数存在"
else
    echo "❌ 错误: 审计日志函数缺失"
    exit 1
fi

if grep -q "CREATE TRIGGER.*prompt_audit_trigger" supabase/schema.sql; then
    echo "✅ 审计日志触发器存在"
else
    echo "❌ 错误: 审计日志触发器缺失"
    exit 1
fi

echo ""
echo "🎉 schema.sql 验证通过！"
echo ""
echo "文件统计:"
echo "- 总行数: $(wc -l < supabase/schema.sql)"
echo "- 表数量: $(grep -c 'CREATE TABLE' supabase/schema.sql)"
echo "- 索引数量: $(grep -c 'CREATE INDEX' supabase/schema.sql)"
echo "- RLS策略数量: $(grep -c 'CREATE POLICY' supabase/schema.sql)"
echo "- 函数数量: $(grep -c 'CREATE OR REPLACE FUNCTION' supabase/schema.sql)"
echo "- 触发器数量: $(grep -c 'CREATE TRIGGER' supabase/schema.sql)" 