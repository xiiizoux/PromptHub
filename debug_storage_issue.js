// 临时调试脚本 - 测试存储功能的详细信息
const { execSync } = require('child_process');

console.log('🔍 开始调试存储功能...\n');

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
const BASE_URL = 'https://mcp.prompt-hub.cc';

// 执行存储测试
console.log('📝 测试存储功能...');
try {
  const result = execSync(`curl -X POST ${BASE_URL}/tools/unified_store/invoke \\
    -H "X-Api-Key: ${API_KEY}" \\
    -H "Content-Type: application/json" \\
    -d '{"content": "测试提示词内容", "title": "调试测试${Date.now()}", "auto_analyze": false}' \\
    2>/dev/null`, { encoding: 'utf8' });
  
  console.log('存储响应:', result);
} catch (error) {
  console.error('存储失败:', error.stdout || error.message);
}

console.log('\n' + '='.repeat(50));

// 测试搜索功能作为对比
console.log('\n✅ 测试搜索功能作为对比...');
try {
  const searchResult = execSync(`curl -X POST ${BASE_URL}/tools/unified_search/invoke \\
    -H "X-Api-Key: ${API_KEY}" \\
    -H "Content-Type: application/json" \\
    -d '{"query": "测试", "max_results": 1}' \\
    2>/dev/null`, { encoding: 'utf8' });
  
  const parsed = JSON.parse(searchResult);
  if (parsed.content && parsed.content.text) {
    const searchData = JSON.parse(parsed.content.text);
    console.log('搜索成功! 结果数量:', searchData.results?.length || 0);
    if (searchData.results && searchData.results.length > 0) {
      console.log('第一个结果的用户ID:', searchData.results[0].user_id);
    }
  }
} catch (error) {
  console.error('搜索失败:', error.stdout || error.message);
}

console.log('\n调试完成!');