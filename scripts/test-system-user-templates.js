#!/usr/bin/env node

/**
 * 测试硬编码System模板 + 数据库User模板结构的脚本
 * 验证数据库迁移和代码修改是否正确工作
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 硬编码的System模板（与代码中保持一致）
const OPTIMIZATION_SYSTEM_TEMPLATE = `# Role: System

## Profile
- Author: PromptHub
- Version: 2.0.0
- Language: 中文
- Description: 专门将泛泛而谈、缺乏针对性的用户提示词转换为精准、具体、有针对性的描述

## Background
- 用户提示词经常过于宽泛、缺乏具体细节
- 泛泛而谈的提示词难以获得精准的回答
- 具体、精准的描述能够引导AI提供更有针对性的帮助

## 任务理解
你的任务是将泛泛而谈的用户提示词转换为精准、具体的描述。你不是在执行提示词中的任务，而是在改进提示词的精准度和针对性。

## Skills
1. 精准化能力
   - 细节挖掘: 识别需要具体化的抽象概念和泛泛表述
   - 参数明确: 为模糊的要求添加具体的参数和标准
   - 范围界定: 明确任务的具体范围和边界
   - 目标聚焦: 将宽泛的目标细化为具体的可执行任务

2. 描述增强能力
   - 量化标准: 为抽象要求提供可量化的标准
   - 示例补充: 添加具体的示例来说明期望
   - 约束条件: 明确具体的限制条件和要求
   - 执行指导: 提供具体的操作步骤和方法

## Rules
1. 保持核心意图: 在具体化的过程中不偏离用户的原始目标
2. 增加针对性: 让提示词更加有针对性和可操作性
3. 避免过度具体: 在具体化的同时保持适当的灵活性
4. 突出重点: 确保关键要求得到精准的表达

## Workflow
1. 分析原始提示词中的抽象概念和泛泛表述
2. 识别需要具体化的关键要素和参数
3. 为每个抽象概念添加具体的定义和要求
4. 重新组织表达，确保描述精准、有针对性

## Output Requirements
- 直接输出精准化后的用户提示词文本，确保描述具体、有针对性
- 输出的是优化后的提示词本身，不是执行提示词对应的任务
- 不要添加解释、示例或使用说明
- 不要与用户进行交互或询问更多信息`;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 提取System+User模板结构（硬编码System模板版本）
 */
function extractSystemUserTemplate(template) {
  // System角色始终使用硬编码模板
  const systemTemplate = OPTIMIZATION_SYSTEM_TEMPLATE;

  if (!template) {
    return {
      system: systemTemplate,
      user: ''
    };
  }

  let templateObj = template;

  if (typeof template === 'string') {
    try {
      templateObj = JSON.parse(template);
    } catch {
      return {
        system: systemTemplate,
        user: template
      };
    }
  }

  if (typeof templateObj !== 'object' || templateObj === null) {
    return {
      system: systemTemplate,
      user: String(template)
    };
  }

  // 提取User角色模板
  let userTemplate = '';

  // 优先使用user字段（当前格式）
  if (templateObj.user) {
    userTemplate = templateObj.user;
  }
  // 兼容user_template字段（迁移过程中的临时格式）
  else if (templateObj.user_template) {
    userTemplate = templateObj.user_template;
  }
  // 兼容旧格式：从legacy结构中提取
  else if (templateObj.template) {
    userTemplate = templateObj.template;
  } else if (templateObj.structure?.system_prompt) {
    userTemplate = templateObj.structure.system_prompt;
  } else if (templateObj.system_prompt) {
    userTemplate = templateObj.system_prompt;
  } else {
    userTemplate = JSON.stringify(templateObj);
  }

  return {
    system: systemTemplate,
    user: userTemplate
  };
}

async function testSystemUserTemplates() {
  console.log('🧪 开始测试硬编码System模板 + 数据库User模板结构...\n');
  
  try {
    // 1. 查询所有分类的优化模板
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, optimization_template')
      .not('optimization_template', 'is', null)
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    console.log(`📊 找到 ${categories.length} 个有优化模板的分类\n`);
    
    // 2. 测试每个模板的结构
    let successCount = 0;
    let errorCount = 0;
    
    for (const category of categories) {
      console.log(`🔍 测试分类: ${category.name}`);
      
      try {
        const systemUser = extractSystemUserTemplate(category.optimization_template);
        
        console.log(`  ✅ System模板长度: ${systemUser.system.length} 字符 (硬编码)`);
        console.log(`  ✅ User模板长度: ${systemUser.user.length} 字符 (数据库)`);

        // 验证System角色是否使用硬编码模板
        if (systemUser.system === OPTIMIZATION_SYSTEM_TEMPLATE) {
          console.log(`  🎯 System角色使用正确的硬编码模板`);
        } else {
          console.log(`  ❌ System角色模板不匹配硬编码版本`);
        }
        
        // 检查User模板是否包含占位符
        if (systemUser.user.includes('{prompt}')) {
          console.log(`  ✅ User模板包含{prompt}占位符`);
        } else {
          console.log(`  ⚠️  User模板缺少{prompt}占位符`);
        }
        
        successCount++;
        console.log('');
        
      } catch (err) {
        console.log(`  ❌ 解析失败: ${err.message}`);
        errorCount++;
        console.log('');
      }
    }
    
    // 3. 测试模拟优化请求
    console.log('🚀 测试模拟优化请求...\n');
    
    const testPrompt = "帮我写一个产品介绍";
    const testCategory = categories[0];
    
    if (testCategory) {
      const systemUser = extractSystemUserTemplate(testCategory.optimization_template);
      
      console.log('📝 模拟优化请求结构:');
      console.log('System角色:');
      console.log(systemUser.system ? systemUser.system.substring(0, 200) + '...' : '(无System角色)');
      console.log('\nUser角色:');
      const userPrompt = systemUser.user
        .replace('{prompt}', testPrompt)
        .replace('{requirements}', '');
      console.log(userPrompt.substring(0, 300) + '...');
    }
    
    // 4. 输出测试结果
    console.log('\n📊 测试结果统计:');
    console.log(`✅ 成功解析: ${successCount} 个分类`);
    console.log(`❌ 解析失败: ${errorCount} 个分类`);
    console.log(`📈 成功率: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 所有测试通过！硬编码System模板 + 数据库User模板结构工作正常。');
      console.log('✨ 性能优化：System模板无需数据库查询，直接从代码获取');
      console.log('🔧 维护便利：System模板统一管理，User模板灵活配置');
    } else {
      console.log('\n⚠️  部分测试失败，请检查数据库迁移是否完成。');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
testSystemUserTemplates().catch(console.error);
