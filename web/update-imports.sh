#!/bin/bash

# 这个脚本会更新所有API路由文件中对旧_middleware模块的引用
# 将其替换为新的api-utils模块

# 文件列表
files=(
  "/home/zou/mcp-prompt-server/frontend/prompt-hub/src/pages/api/prompts/[name].ts"
  "/home/zou/mcp-prompt-server/frontend/prompt-hub/src/pages/api/prompts/index.ts"
  "/home/zou/mcp-prompt-server/frontend/prompt-hub/src/pages/api/auth/me.ts"
  "/home/zou/mcp-prompt-server/frontend/prompt-hub/src/pages/api/performance/[promptId].ts"
  "/home/zou/mcp-prompt-server/frontend/prompt-hub/src/pages/api/performance/track.ts"
  "/home/zou/mcp-prompt-server/frontend/prompt-hub/src/pages/api/performance/feedback.ts"
  "/home/zou/mcp-prompt-server/frontend/prompt-hub/src/pages/api/performance/report/[promptId].ts"
)

# 对每个文件执行替换
for file in "${files[@]}"; do
  echo "Updating $file..."
  # 使用sed替换导入语句
  sed -i 's|from '"'"'../\(_middleware\)'"'"'|from '"'"'../../../lib/api-utils'"'"'|g' "$file"
  sed -i 's|from '"'"'../../\(_middleware\)'"'"'|from '"'"'../../../../lib/api-utils'"'"'|g' "$file"
  sed -i 's|from '"'"'../../../\(_middleware\)'"'"'|from '"'"'../../../../../lib/api-utils'"'"'|g' "$file"
done

echo "All imports have been updated!"
