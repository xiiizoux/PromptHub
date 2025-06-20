import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ 错误: 需要设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

// 创建Supabase客户端（使用服务角色密钥）
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 开始运行 prompts 表 RLS 修复迁移...');
    
    // 读取迁移文件
    const migrationPath = join(__dirname, 'migrations', '011_fix_prompts_rls.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 迁移文件已读取，长度:', migrationSQL.length, '字符');
    
    // 执行迁移
    console.log('⚡ 执行迁移SQL...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ 迁移执行失败:', error);
      
      // 尝试直接执行（如果rpc不可用）
      console.log('🔄 尝试直接执行SQL...');
      const { data: directData, error: directError } = await supabase
        .from('_migrations')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.error('❌ 数据库连接失败:', directError);
        process.exit(1);
      }
      
      console.log('✅ 数据库连接正常，但无法执行迁移');
      console.log('📝 请手动在Supabase控制台的SQL编辑器中执行以下SQL:');
      console.log('='.repeat(50));
      console.log(migrationSQL);
      console.log('='.repeat(50));
      
    } else {
      console.log('✅ 迁移执行成功!');
      console.log('📊 结果:', data);
    }
    
    // 验证策略是否创建成功
    console.log('🔍 验证 RLS 策略...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'prompts');
    
    if (policyError) {
      console.log('⚠️  无法验证策略:', policyError.message);
    } else {
      console.log('📋 prompts 表的策略:', policies);
    }
    
    // 测试查询
    console.log('🧪 测试公共提示词查询...');
    const { data: testData, error: testError } = await supabase
      .from('prompts')
      .select('id, name, is_public')
      .eq('is_public', true)
      .limit(3);
    
    if (testError) {
      console.error('❌ 测试查询失败:', testError);
    } else {
      console.log('✅ 测试查询成功，返回', testData?.length || 0, '条记录');
      if (testData && testData.length > 0) {
        console.log('📝 示例数据:', testData[0]);
      }
    }
    
  } catch (error) {
    console.error('💥 运行迁移时出错:', error);
    process.exit(1);
  }
}

// 运行迁移
runMigration();
