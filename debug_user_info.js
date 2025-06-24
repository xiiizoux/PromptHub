// 临时调试脚本 - 测试API密钥认证返回的用户信息
const axios = require('axios');

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
const BASE_URL = 'https://mcp.prompt-hub.cc';

async function testUserAuth() {
  console.log('🔍 测试API密钥认证...');
  
  try {
    // 尝试调用一个需要认证的接口
    const response = await axios.post(`${BASE_URL}/tools/unified_search/invoke`, {
      query: "测试",
      max_results: 1
    }, {
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 搜索请求成功');
    console.log('响应状态:', response.status);
    
    // 检查响应中是否有用户信息
    if (response.data && response.data.content && response.data.content.text) {
      const result = JSON.parse(response.data.content.text);
      console.log('搜索结果数量:', result.results ? result.results.length : 0);
      if (result.results && result.results.length > 0) {
        console.log('第一个结果的user_id:', result.results[0].user_id);
      }
    }
    
  } catch (error) {
    console.error('❌ 搜索请求失败:', error.response?.data || error.message);
  }

  try {
    // 现在尝试存储，看看具体的错误信息
    console.log('\n🔍 测试存储功能...');
    const storeResponse = await axios.post(`${BASE_URL}/tools/unified_store/invoke`, {
      content: "测试提示词内容",
      title: "测试提示词" + Date.now(),
      category: "通用",
      tags: ["测试"],
      description: "这是一个测试提示词"
    }, {
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 存储请求成功');
    console.log(storeResponse.data);
    
  } catch (error) {
    console.error('❌ 存储请求失败:');
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误信息:', error.message);
    }
  }
}

testUserAuth().catch(console.error);