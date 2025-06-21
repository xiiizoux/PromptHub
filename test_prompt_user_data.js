// 测试提示词用户数据的脚本
// 用于验证修复是否有效

const databaseService = require('./web/src/lib/database-service');

async function testPromptUserData() {
  console.log('🔍 开始测试提示词用户数据...\n');

  try {
    // 1. 获取一个提示词的详情
    console.log('1. 测试获取提示词详情:');
    
    // 这里需要替换为实际的提示词ID
    const promptId = 'your-prompt-id-here'; // 替换为实际的提示词ID
    
    const promptDetails = await databaseService.getPromptByName(promptId);
    
    if (promptDetails) {
      console.log('✅ 成功获取提示词详情:');
      console.log(`  - 名称: ${promptDetails.name}`);
      console.log(`  - 作者: ${promptDetails.author}`);
      console.log(`  - 用户ID: ${promptDetails.user_id}`);
      console.log(`  - 是否公开: ${promptDetails.is_public}`);
      console.log(`  - 创建时间: ${promptDetails.created_at}`);
    } else {
      console.log('❌ 未找到提示词详情');
    }

    // 2. 测试用户查询
    console.log('\n2. 测试用户查询:');
    
    if (promptDetails && promptDetails.user_id) {
      const { createClient } = require('@supabase/supabase-js');
      
      // 从环境变量获取配置
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, display_name, username')
          .eq('id', promptDetails.user_id)
          .maybeSingle();

        if (userError) {
          console.log('❌ 查询用户信息时发生错误:', userError);
        } else if (userData) {
          console.log('✅ 成功查询用户信息:');
          console.log(`  - ID: ${userData.id}`);
          console.log(`  - Email: ${userData.email}`);
          console.log(`  - Display Name: ${userData.display_name || '(空)'}`);
          console.log(`  - Username: ${userData.username || '(空)'}`);
        } else {
          console.log('❌ 用户不存在');
        }
      } else {
        console.log('⚠️  缺少 Supabase 配置');
      }
    }

    // 3. 测试批量查询（模拟浏览页面的逻辑）
    console.log('\n3. 测试批量查询用户信息:');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // 获取前5个公开提示词
      const { data: prompts, error: promptsError } = await supabase
        .from('prompts')
        .select('id, name, user_id, created_by')
        .eq('is_public', true)
        .limit(5);

      if (promptsError) {
        console.log('❌ 查询提示词时发生错误:', promptsError);
      } else if (prompts && prompts.length > 0) {
        console.log(`✅ 找到 ${prompts.length} 个公开提示词`);
        
        // 收集用户ID
        const userIds = Array.from(new Set(
          prompts
            .map(p => p.user_id || p.created_by)
            .filter(Boolean)
        ));
        
        console.log(`需要查询 ${userIds.length} 个用户的信息`);
        
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, display_name, email')
            .in('id', userIds);
          
          if (usersError) {
            console.log('❌ 批量查询用户信息时发生错误:', usersError);
          } else {
            console.log(`✅ 成功查询到 ${users?.length || 0} 个用户信息`);
            
            const userMap = new Map(users?.map(user => [user.id, user]) || []);
            
            prompts.forEach(prompt => {
              const userId = prompt.user_id || prompt.created_by;
              const user = userMap.get(userId);
              const authorName = user && user.display_name ? user.display_name : '未知用户';
              
              console.log(`  - ${prompt.name}: ${authorName} (用户ID: ${userId})`);
            });
          }
        }
      } else {
        console.log('❌ 没有找到公开提示词');
      }
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testPromptUserData().then(() => {
    console.log('\n🎯 测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('💥 测试失败:', error);
    process.exit(1);
  });
}

module.exports = { testPromptUserData };
