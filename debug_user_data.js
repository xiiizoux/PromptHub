// 调试用户数据的脚本
// 用于检查数据库中的用户数据和提示词数据的关联问题

const { createClient } = require('@supabase/supabase-js');

// 从环境变量或配置文件中获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserData() {
  console.log('🔍 开始调试用户数据...\n');

  try {
    // 1. 检查 users 表中的数据
    console.log('1. 检查 users 表中的数据:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, display_name, username')
      .limit(10);

    if (usersError) {
      console.error('❌ 获取用户数据失败:', usersError);
    } else {
      console.log(`✅ 找到 ${users.length} 个用户记录:`);
      users.forEach(user => {
        console.log(`  - ID: ${user.id}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Display Name: ${user.display_name || '(空)'}`);
        console.log(`    Username: ${user.username || '(空)'}`);
        console.log('');
      });
    }

    // 2. 检查 prompts 表中的用户ID
    console.log('2. 检查 prompts 表中的用户ID:');
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('id, name, user_id, created_by')
      .limit(10);

    if (promptsError) {
      console.error('❌ 获取提示词数据失败:', promptsError);
    } else {
      console.log(`✅ 找到 ${prompts.length} 个提示词记录:`);
      prompts.forEach(prompt => {
        console.log(`  - 提示词: ${prompt.name}`);
        console.log(`    User ID: ${prompt.user_id || '(空)'}`);
        console.log(`    Created By: ${prompt.created_by || '(空)'}`);
        console.log('');
      });
    }

    // 3. 检查孤立的用户ID（在 prompts 表中存在但在 users 表中不存在）
    console.log('3. 检查孤立的用户ID:');
    const { data: orphanedPrompts, error: orphanedError } = await supabase
      .from('prompts')
      .select(`
        id,
        name,
        user_id,
        users!inner(id, display_name)
      `)
      .is('users.id', null);

    if (orphanedError) {
      console.log('⚠️  无法检查孤立用户ID (这可能是正常的):', orphanedError.message);
    } else {
      if (orphanedPrompts && orphanedPrompts.length > 0) {
        console.log(`❌ 找到 ${orphanedPrompts.length} 个孤立的提示词:`);
        orphanedPrompts.forEach(prompt => {
          console.log(`  - ${prompt.name} (User ID: ${prompt.user_id})`);
        });
      } else {
        console.log('✅ 没有发现孤立的用户ID');
      }
    }

    // 4. 检查没有 display_name 的用户
    console.log('4. 检查没有 display_name 的用户:');
    const { data: usersWithoutDisplayName, error: noDisplayNameError } = await supabase
      .from('users')
      .select('id, email, display_name, username')
      .or('display_name.is.null,display_name.eq.');

    if (noDisplayNameError) {
      console.error('❌ 检查用户显示名称失败:', noDisplayNameError);
    } else {
      if (usersWithoutDisplayName && usersWithoutDisplayName.length > 0) {
        console.log(`⚠️  找到 ${usersWithoutDisplayName.length} 个没有显示名称的用户:`);
        usersWithoutDisplayName.forEach(user => {
          console.log(`  - ID: ${user.id}, Email: ${user.email}`);
        });
      } else {
        console.log('✅ 所有用户都有显示名称');
      }
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  debugUserData().then(() => {
    console.log('🎯 调试完成');
    process.exit(0);
  }).catch(error => {
    console.error('💥 调试失败:', error);
    process.exit(1);
  });
}

module.exports = { debugUserData };
