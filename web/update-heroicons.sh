#!/bin/bash

# 更新所有使用@heroicons/react/24/outline的文件
find /home/zou/mcp-prompt-server/frontend/prompt-hub/src -type f -name "*.tsx" -exec sed -i 's|@heroicons/react/24/outline|@heroicons/react/outline|g' {} \;

echo "所有heroicons导入路径已更新！"
