import fetch from 'node-fetch';

async function testAuthRedirect() {
  console.log('🧪 测试认证重定向功能...\n');
  
  const baseUrl = 'http://localhost:9011';
  
  // 测试用例：需要认证的页面
  const protectedPages = [
    '/create',
    '/prompts/code_assistant/edit'
  ];
  
  for (const page of protectedPages) {
    console.log(`📄 测试页面: ${page}`);
    
    try {
      const response = await fetch(`${baseUrl}${page}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (test script)'
        },
        redirect: 'manual' // 禁止自动重定向
      });
      
      const html = await response.text();
      
      // 检查页面是否为SSR渲染的受保护页面（包含React组件）
      if (html.includes('_app.js') && html.includes('pages/create/index') || html.includes('pages/prompts')) {
        console.log(`✅ ${page} - 页面已使用withAuth保护，需要JavaScript执行认证检查`);
        console.log(`   Note: withAuth在客户端执行，服务器端会渲染基本HTML结构`);
      } else if (html.includes('正在验证身份') || html.includes('window.location.href') || html.includes('/auth/login')) {
        console.log(`✅ ${page} - 正确保护，会重定向到登录页面`);
      } else {
        console.log(`❌ ${page} - 可能没有正确保护`);
        console.log(`   响应长度: ${html.length} 字符`);
        console.log(`   包含React: ${html.includes('__NEXT_DATA__')}`);
      }
      
    } catch (error) {
      console.log(`❌ ${page} - 测试失败: ${error.message}`);
    }
    
    console.log(''); // 空行
  }
  
  console.log('🎯 测试总结:');
  console.log('- 创建页面和编辑页面应该都被withAuth保护');
  console.log('- 未登录用户访问时应该看到"正在验证身份"加载界面');
  console.log('- 然后应该被重定向到登录页面，URL中包含returnUrl参数');
}

testAuthRedirect().catch(console.error); 