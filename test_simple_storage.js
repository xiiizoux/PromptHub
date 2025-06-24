#!/usr/bin/env node

console.log('开始简单存储测试...');

const https = require('https');

const testData = {
  content: '这是一个简单的测试提示词',
  title: '简单测试-' + Date.now(),
  category: '测试',
  tags: ['测试', '修复'],
  description: '测试数据库修复后的存储功能',
  auto_analyze: false
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'mcp.prompt-hub.cc',
  port: 443,
  path: '/tools/unified_store/invoke',
  method: 'POST',
  headers: {
    'X-Api-Key': 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653',
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  console.log('响应状态码:', res.statusCode);
  console.log('响应头:', JSON.stringify(res.headers, null, 2));
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== 响应内容 ===');
    try {
      const parsedResponse = JSON.parse(responseData);
      console.log(JSON.stringify(parsedResponse, null, 2));
      
      if (parsedResponse.error) {
        console.log('\n❌ 存储失败:', parsedResponse.error.message);
      } else {
        console.log('\n✅ 存储成功!');
        
        // 继续搜索测试
        console.log('\n开始搜索测试...');
        testSearch();
      }
    } catch (e) {
      console.log('响应解析失败:', e.message);
      console.log('原始响应:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error('请求出错:', e.message);
});

req.write(postData);
req.end();

function testSearch() {
  const searchOptions = {
    hostname: 'mcp.prompt-hub.cc',
    port: 443,
    path: '/tools/unified_search/invoke',
    method: 'POST',
    headers: {
      'X-Api-Key': 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653',
      'Content-Type': 'application/json'
    }
  };

  const searchData = JSON.stringify({
    query: '简单测试',
    max_results: 5
  });

  const searchReq = https.request(searchOptions, (res) => {
    let searchResponseData = '';
    
    res.on('data', (chunk) => {
      searchResponseData += chunk;
    });
    
    res.on('end', () => {
      console.log('\n=== 搜索结果 ===');
      try {
        const searchResult = JSON.parse(searchResponseData);
        console.log(JSON.stringify(searchResult, null, 2));
        
        if (searchResult.data && searchResult.data.length > 0) {
          console.log(`\n✅ 搜索到 ${searchResult.data.length} 个结果`);
        } else {
          console.log('\n⚠️ 未搜索到结果');
        }
      } catch (e) {
        console.log('搜索结果解析失败:', e.message);
        console.log('原始响应:', searchResponseData);
      }
    });
  });

  searchReq.on('error', (e) => {
    console.error('搜索请求出错:', e.message);
  });

  searchReq.write(searchData);
  searchReq.end();
}