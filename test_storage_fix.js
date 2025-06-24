// 存储功能修复测试脚本
const axios = require('axios');

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
const BASE_URL = 'https://mcp.prompt-hub.cc';

async function testStorageFix() {
  console.log('🔧 测试存储功能修复...\n');
  
  try {
    // 1. 测试搜索功能（验证API密钥和用户认证）
    console.log('1️⃣ 验证搜索功能（确保API密钥和用户认证正常）...');
    const searchResponse = await axios.post(`${BASE_URL}/tools/unified_search/invoke`, {
      query: "投资",
      max_results: 1
    }, {
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (searchResponse.status === 200) {
      const searchResult = JSON.parse(searchResponse.data.content.text);
      console.log('✅ 搜索功能正常，用户ID:', searchResult.metadata?.userId);
    }
    
    // 2. 测试存储功能
    console.log('\n2️⃣ 测试存储功能...');
    const testTitle = `存储修复测试-${Date.now()}`;
    const storeResponse = await axios.post(`${BASE_URL}/tools/unified_store/invoke`, {
      content: "这是一个测试存储功能修复的提示词内容。",
      title: testTitle,
      category: "测试",
      tags: ["测试", "修复"],
      description: "用于验证存储功能修复的测试提示词",
      auto_analyze: false
    }, {
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (storeResponse.status === 200 && storeResponse.data.content) {
      const storeResult = JSON.parse(storeResponse.data.content.text);
      if (storeResult.success) {
        console.log('✅ 存储功能修复成功！');
        console.log('📝 创建的提示词:', {
          id: storeResult.result.id,
          name: storeResult.result.name,
          category: storeResult.result.category
        });
        
        // 3. 验证存储的提示词是否可以搜索到
        console.log('\n3️⃣ 验证新创建的提示词是否可以搜索到...');
        const verifyResponse = await axios.post(`${BASE_URL}/tools/unified_search/invoke`, {
          query: testTitle,
          max_results: 1
        }, {
          headers: {
            'X-Api-Key': API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        if (verifyResponse.status === 200) {
          const verifyResult = JSON.parse(verifyResponse.data.content.text);
          if (verifyResult.results && verifyResult.results.length > 0) {
            console.log('✅ 新提示词可以正常搜索到！');
            console.log('🎉 存储功能完全修复成功！');
          } else {
            console.log('⚠️ 新提示词暂时搜索不到（可能需要时间同步）');
          }
        }
        
      } else {
        console.log('❌ 存储功能仍然失败:', storeResult.error);
      }
    } else {
      console.log('❌ 存储请求失败:', storeResponse.data);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.response?.data || error.message);
  }
}

testStorageFix();