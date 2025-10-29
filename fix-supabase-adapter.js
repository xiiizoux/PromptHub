const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/lib/supabase-adapter.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 查找并替换问题代码
const oldCode = `      // 按分类类型过滤，同时获取作者信息
      let query;
      if (category_type) {
        // 通过关联categories表来按类型过滤，同时获取用户信息
        query = this.supabase.from('prompts').select(\`
          *,
          categories!inner(type),
          users!prompts_user_id_fkey(display_name, email)
        \`, { count: 'exact' }).eq('categories.type', category_type);
      } else {
        // 获取提示词信息和用户信息
        query = this.supabase.from('prompts').select(\`
          *,
          users!prompts_user_id_fkey(display_name, email)
        \`, { count: 'exact' });
      }`;

const newCode = `      // 按分类类型过滤，同时获取作者信息
      // 直接使用 category_type 字段过滤，避免 INNER JOIN 失败
      let query = this.supabase.from('prompts').select(\`
        *,
        users!prompts_user_id_fkey(display_name, email)
      \`, { count: 'exact' });
      
      // 按 category_type 过滤
      if (category_type) {
        query = query.eq('category_type', category_type);
      }`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ 成功修复 supabase-adapter.ts');
  console.log('   - 移除了 INNER JOIN categories 表的查询');
  console.log('   - 改为直接使用 category_type 字段过滤');
} else {
  console.log('❌ 未找到需要替换的代码');
  console.log('   文件可能已经被修改过了');
}

