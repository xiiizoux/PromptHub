const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDatabase() {
  console.log('开始修复数据库...');
  
  try {
    // 1. 检查当前表结构
    console.log('检查prompts表结构...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'prompts' })
      .single();
    
    if (columnsError) {
      console.log('无法使用RPC检查表结构，尝试直接查询...');
    }
    
    // 2. 执行SQL修复
    console.log('执行SQL修复...');
    
    // 创建枚举类型（如果不存在）
    const createEnumSQL = `
      DO $$ BEGIN
        CREATE TYPE category_type AS ENUM ('chat', 'image', 'video');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    const { error: enumError } = await supabase.rpc('exec_sql', { 
      sql: createEnumSQL 
    });
    
    if (enumError) {
      console.log('枚举创建结果:', enumError.message);
    } else {
      console.log('✅ 枚举类型创建成功');
    }
    
    // 添加缺失的字段
    const alterTableSQL = `
      ALTER TABLE prompts 
      ADD COLUMN IF NOT EXISTS category_type category_type DEFAULT 'chat',
      ADD COLUMN IF NOT EXISTS preview_asset_url TEXT,
      ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;
    `;
    
    const { error: alterError } = await supabase.rpc('exec_sql', { 
      sql: alterTableSQL 
    });
    
    if (alterError) {
      console.log('表修改结果:', alterError.message);
    } else {
      console.log('✅ 表结构修改成功');
    }
    
    // 3. 验证修改结果
    console.log('验证修改结果...');
    const { data: testData, error: testError } = await supabase
      .from('prompts')
      .select('id, category_type, preview_asset_url, parameters')
      .limit(1);
    
    if (testError) {
      console.error('❌ 验证失败:', testError.message);
    } else {
      console.log('✅ 字段验证成功，字段可正常查询');
      console.log('示例数据:', testData);
    }
    
    console.log('数据库修复完成！');
    
  } catch (error) {
    console.error('修复过程中出错:', error);
  }
}

// 如果Supabase不支持自定义RPC，我们使用备用方案
async function fixDatabaseAlternative() {
  console.log('使用备用方案修复数据库...');
  
  try {
    // 尝试直接查询来测试字段是否存在
    const { data, error } = await supabase
      .from('prompts')
      .select('category_type')
      .limit(1);
    
    if (error && error.message.includes('category_type')) {
      console.log('❌ 确认category_type字段不存在');
      console.log('请手动在Supabase Dashboard中执行以下SQL:');
      console.log(`
-- 1. 创建枚举类型
DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('chat', 'image', 'video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. 添加字段
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS category_type category_type DEFAULT 'chat',
ADD COLUMN IF NOT EXISTS preview_asset_url TEXT,
ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

-- 3. 更新现有数据
UPDATE prompts SET category_type = 'chat' WHERE category_type IS NULL;
      `);
    } else {
      console.log('✅ category_type字段已存在');
    }
    
  } catch (error) {
    console.error('检查过程中出错:', error);
  }
}

// 执行修复
fixDatabaseAlternative();