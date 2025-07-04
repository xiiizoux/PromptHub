#!/usr/bin/env node

/**
 * 验证user_template字段重命名为user是否成功
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRename() {
  console.log('🔍 验证user_template字段重命名为user...\n');
  
  try {
    // 检查所有分类的模板结构
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, optimization_template')
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    let userFieldCount = 0;
    let userTemplateFieldCount = 0;
    let totalWithTemplate = 0;
    
    console.log('📊 检查字段重命名结果:\n');
    
    for (const category of categories) {
      if (!category.optimization_template) {
        continue;
      }
      
      totalWithTemplate++;
      const template = category.optimization_template;
      
      console.log(`🔍 分类: ${category.name}`);
      
      if (template.user) {
        console.log('  ✅ 包含user字段');
        console.log(`  📝 长度: ${template.user.length} 字符`);
        userFieldCount++;
      }
      
      if (template.user_template) {
        console.log('  ⚠️  仍包含user_template字段');
        userTemplateFieldCount++;
      }
      
      if (!template.user && !template.user_template) {
        console.log('  ❓ 未找到user或user_template字段');
        console.log(`  📄 内容: ${JSON.stringify(template).substring(0, 100)}...`);
      }
      
      console.log('');
    }
    
    // 统计结果
    console.log('📊 重命名验证统计:');
    console.log(`📁 总分类数: ${categories.length}`);
    console.log(`📋 有模板的分类: ${totalWithTemplate}`);
    console.log(`✅ 包含user字段: ${userFieldCount}`);
    console.log(`⚠️  仍包含user_template字段: ${userTemplateFieldCount}`);
    
    // 评估结果
    console.log('\n🎯 重命名评估:');
    if (userTemplateFieldCount === 0 && userFieldCount > 0) {
      console.log('🎉 重命名成功！所有模板都使用user字段');
    } else if (userTemplateFieldCount > 0) {
      console.log('⚠️  重命名未完成，仍有user_template字段存在');
      console.log('💡 建议：重新运行重命名脚本');
    } else {
      console.log('❓ 未找到预期的字段结构');
      console.log('🔧 建议：检查数据库结构和迁移脚本');
    }
    
    // 功能测试
    console.log('\n🧪 功能测试:');
    if (userFieldCount > 0) {
      const testCategory = categories.find(c => c.optimization_template?.user);
      if (testCategory) {
        console.log(`🔬 测试分类: ${testCategory.name}`);
        
        // 模拟extractSystemUserTemplate函数
        const templateObj = testCategory.optimization_template;
        let userTemplate = '';
        
        if (templateObj.user) {
          userTemplate = templateObj.user;
          console.log('✅ user字段提取成功');
        } else if (templateObj.user_template) {
          userTemplate = templateObj.user_template;
          console.log('🔄 user_template字段提取成功（兼容模式）');
        }
        
        if (userTemplate) {
          console.log(`📝 提取的模板长度: ${userTemplate.length} 字符`);
          console.log(`📄 模板预览: ${userTemplate.substring(0, 100)}...`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

// 运行验证
verifyRename().catch(console.error);
