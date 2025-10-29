const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkCategoryId() {
  console.log('\n=== 检查 category_id 字段情况 ===\n');

  // 1. 检查 category_id 的分布
  console.log('📊 1. category_id 字段分布:\n');
  
  const { data: allPrompts, error } = await supabase
    .from('prompts')
    .select('id, name, category, category_id, category_type, is_public')
    .eq('is_public', true);

  if (error) {
    console.error('   ❌ 查询失败:', error);
    return;
  }

  const withCategoryId = allPrompts.filter(p => p.category_id !== null).length;
  const withoutCategoryId = allPrompts.filter(p => p.category_id === null).length;

  console.log(`   总计: ${allPrompts.length} 条`);
  console.log(`   有 category_id: ${withCategoryId} 条`);
  console.log(`   无 category_id (null): ${withoutCategoryId} 条`);

  // 2. 检查 category_id 是否能关联到 categories 表
  console.log('\n📊 2. 验证 category_id 外键关系:\n');
  
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, type');

  if (catError) {
    console.error('   ❌ 查询失败:', catError);
    return;
  }

  const categoryIds = new Set(categories.map(c => c.id));
  
  const validCategoryId = allPrompts.filter(p => 
    p.category_id && categoryIds.has(p.category_id)
  ).length;
  
  const invalidCategoryId = allPrompts.filter(p => 
    p.category_id && !categoryIds.has(p.category_id)
  ).length;

  console.log(`   有效的 category_id: ${validCategoryId} 条`);
  console.log(`   无效的 category_id (孤立): ${invalidCategoryId} 条`);
  console.log(`   null category_id: ${withoutCategoryId} 条`);

  // 3. 测试实际的查询
  console.log('\n📊 3. 测试 INNER JOIN 查询:\n');
  
  const { data: joinResult, error: joinError, count } = await supabase
    .from('prompts')
    .select(`
      *,
      categories!inner(type)
    `, { count: 'exact' })
    .eq('categories.type', 'chat')
    .eq('is_public', true)
    .limit(5);

  if (joinError) {
    console.error('   ❌ 查询失败:', joinError);
  } else {
    console.log(`   INNER JOIN 返回: ${count} 条记录`);
    console.log(`   实际获取: ${joinResult?.length || 0} 条`);
    
    if (joinResult && joinResult.length > 0) {
      console.log('\n   示例数据:');
      joinResult.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (category_id: ${item.category_id})`);
      });
    }
  }

  // 4. 测试直接按 category_type 字段过滤
  console.log('\n📊 4. 测试直接按 category_type 字段过滤:\n');
  
  const { data: directResult, error: directError, count: directCount } = await supabase
    .from('prompts')
    .select('*', { count: 'exact' })
    .eq('category_type', 'chat')
    .eq('is_public', true)
    .limit(5);

  if (directError) {
    console.error('   ❌ 查询失败:', directError);
  } else {
    console.log(`   直接过滤返回: ${directCount} 条记录`);
    console.log(`   实际获取: ${directResult?.length || 0} 条`);
    
    if (directResult && directResult.length > 0) {
      console.log('\n   示例数据:');
      directResult.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name}`);
        console.log(`      category_id: ${item.category_id || 'null'}`);
        console.log(`      category_type: ${item.category_type}`);
      });
    }
  }

  console.log('\n=== 检查完成 ===\n');
  console.log('💡 结论：应该使用 category_type 字段过滤，而不是 INNER JOIN categories 表\n');
}

checkCategoryId();

