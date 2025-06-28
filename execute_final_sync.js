const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalSync() {
  console.log('=== 最终同步 category_type 数据 ===\n');
  
  try {
    // 1. 首先检查当前状态
    console.log('1. 检查当前状态...');
    const { data: currentState } = await supabase
      .from('prompts')
      .select('category_type')
      .not('category_type', 'is', null);
    
    const typeCount = {};
    currentState.forEach(item => {
      typeCount[item.category_type] = (typeCount[item.category_type] || 0) + 1;
    });
    
    console.log('当前分布:', typeCount);
    
    // 2. 找出所有不一致的记录并修复
    console.log('\n2. 查找并修复不一致记录...');
    
    const { data: inconsistentRecords, error: findError } = await supabase
      .from('prompts')
      .select(`
        id, name, category, category_type, category_id,
        categories!inner(id, name, type)
      `);
    
    if (findError) {
      console.error('查询失败:', findError);
      return;
    }
    
    // 过滤出不一致的记录
    const needsUpdate = inconsistentRecords.filter(record => {
      return record.category_type !== record.categories.type;
    });
    
    console.log(`找到 ${needsUpdate.length} 个需要修复的记录`);
    
    // 逐个修复
    for (const record of needsUpdate) {
      const { error: updateError } = await supabase
        .from('prompts')
        .update({
          category_type: record.categories.type,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);
      
      if (updateError) {
        console.error(`修复 ${record.name} 失败:`, updateError);
      } else {
        console.log(`✅ 修复 ${record.name}: ${record.category_type} -> ${record.categories.type}`);
      }
    }
    
    // 3. 最终验证
    console.log('\n3. 最终验证...');
    
    const { data: finalCheck } = await supabase
      .from('prompts')
      .select(`
        id, name, category_type,
        categories!inner(type)
      `);
    
    const stillInconsistent = finalCheck.filter(record => {
      return record.category_type !== record.categories.type;
    });
    
    if (stillInconsistent.length === 0) {
      console.log('✅ 所有记录现在都一致了！');
    } else {
      console.log(`❌ 仍有 ${stillInconsistent.length} 个不一致记录`);
      stillInconsistent.forEach(record => {
        console.log(`  - ${record.name}: ${record.category_type} vs ${record.categories.type}`);
      });
    }
    
    // 4. 显示最终统计
    console.log('\n4. 最终统计:');
    const { data: finalStats } = await supabase
      .from('prompts')
      .select('category_type, name, category');
    
    const finalTypeCount = {};
    const examples = {};
    
    finalStats.forEach(item => {
      const type = item.category_type;
      finalTypeCount[type] = (finalTypeCount[type] || 0) + 1;
      
      if (!examples[type]) {
        examples[type] = [];
      }
      if (examples[type].length < 3) {
        examples[type].push(`${item.name} (${item.category})`);
      }
    });
    
    Object.entries(finalTypeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} 个`);
      console.log(`    示例: ${examples[type].join(', ')}`);
    });
    
    console.log('\n🎉 数据同步完成！');
    
  } catch (err) {
    console.error('同步过程出错:', err);
  }
}

finalSync();