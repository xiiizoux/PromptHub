const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeSQLDirectly() {
  console.log('直接执行SQL修复...');
  
  try {
    // 方法1: 尝试通过REST API执行SQL
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          DO $$ BEGIN
            CREATE TYPE category_type AS ENUM ('chat', 'image', 'video');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
          
          ALTER TABLE prompts 
          ADD COLUMN IF NOT EXISTS category_type category_type DEFAULT 'chat',
          ADD COLUMN IF NOT EXISTS preview_asset_url TEXT,
          ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;
          
          UPDATE prompts SET category_type = 'chat' WHERE category_type IS NULL;
        `
      })
    });
    
    if (response.ok) {
      console.log('✅ SQL执行成功');
    } else {
      const error = await response.text();
      console.log('❌ 直接SQL执行失败:', error);
      
      // 方法2: 逐条执行
      await executeStepByStep();
    }
    
  } catch (error) {
    console.error('执行出错:', error);
    await executeStepByStep();
  }
}

async function executeStepByStep() {
  console.log('尝试逐步执行...');
  
  // 由于Supabase的限制，我们需要通过其他方式
  // 让我们创建一个模拟的修复，暂时在API层面处理这个问题
  
  console.log(`
建议的解决方案：

1. 在Supabase Dashboard中手动执行SQL:
   - 登录 https://supabase.com/dashboard
   - 进入项目 ${process.env.SUPABASE_URL.split('//')[1].split('.')[0]}
   - 进入 SQL Editor
   - 执行以下SQL:

-- 创建枚举类型
DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('chat', 'image', 'video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 添加字段
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS category_type category_type DEFAULT 'chat',
ADD COLUMN IF NOT EXISTS preview_asset_url TEXT,
ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

-- 更新现有数据
UPDATE prompts SET category_type = 'chat' WHERE category_type IS NULL;

2. 或者，我可以临时修改API代码，移除对category_type的依赖，使页面能够正常工作。

请选择哪种方案？
  `);
}

executeSQLDirectly();