/**
 * 硬编码System模板 + 数据库User模板使用示例
 * 展示新方案的工作原理和优势
 */

// 1. 硬编码的System模板（在实际代码中从constants导入）
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

// 2. 模拟从数据库获取的User模板（不同分类）
const userTemplates = {
  '营销文案': `你是营销文案专家。请将用户的提示词优化为专业的营销文案创作指导，重点关注：

1. 目标受众定位：明确目标用户群体、年龄段、消费习惯
2. 产品卖点提炼：突出核心功能、差异化优势、用户价值
3. 情感触发点：识别用户痛点、需求场景、情感共鸣
4. 行动召唤设计：明确转化目标、引导用户行为
5. 文案结构优化：标题吸引、内容层次、节奏把控

请优化以下营销文案提示词：{prompt}

{requirements}`,

  '技术文档': `你是技术文档专家。请将用户的提示词优化为专业的技术文档编写指导，重点关注：

1. 技术准确性：确保技术概念、术语、流程的准确性
2. 结构清晰性：合理的章节划分、层次结构、导航设计
3. 用户友好性：考虑不同技术水平读者的理解需求
4. 实用性导向：提供具体的操作步骤、代码示例、最佳实践
5. 维护便利性：便于后续更新、版本管理、协作编辑

请优化以下技术文档提示词：{prompt}

{requirements}`,

  '创意设计': `你是创意设计专家。请将用户的提示词优化为专业的设计创作指导，重点关注：

1. 设计目标明确：品牌调性、视觉风格、传达信息
2. 用户体验考量：目标用户、使用场景、交互需求
3. 视觉元素规划：色彩搭配、字体选择、布局构图
4. 技术实现约束：输出格式、尺寸规格、平台适配
5. 创新与实用平衡：创意表达与功能需求的协调

请优化以下创意设计提示词：{prompt}

{requirements}`
};

// 3. 模拟优化处理函数
function optimizePrompt(originalPrompt, category, requirements = '') {
  console.log('🚀 开始优化提示词...\n');
  
  // 获取System模板（硬编码，无需数据库查询）
  const systemTemplate = OPTIMIZATION_SYSTEM_TEMPLATE;
  console.log('✅ System模板已加载（硬编码，0ms）');
  
  // 获取User模板（从数据库模拟获取）
  const userTemplate = userTemplates[category] || '请优化以下提示词：{prompt}\n\n{requirements}';
  console.log('✅ User模板已获取（数据库查询，~50ms）');
  
  // 构建最终的User提示词
  const finalUserPrompt = userTemplate
    .replace('{prompt}', originalPrompt)
    .replace('{requirements}', requirements);
  
  // 构建OpenAI API消息结构
  const messages = [
    {
      role: 'system',
      content: systemTemplate
    },
    {
      role: 'user', 
      content: finalUserPrompt
    }
  ];
  
  console.log('\n📋 优化请求结构:');
  console.log(`System角色长度: ${systemTemplate.length} 字符`);
  console.log(`User角色长度: ${finalUserPrompt.length} 字符`);
  console.log(`总消息数: ${messages.length} 条`);
  
  return {
    messages,
    systemTemplate,
    userTemplate: finalUserPrompt,
    category,
    originalPrompt
  };
}

// 4. 使用示例
console.log('🎯 硬编码System模板 + 数据库User模板优化示例\n');

// 示例1：营销文案优化
const example1 = optimizePrompt(
  '帮我写一个产品介绍',
  '营销文案',
  '产品是智能手表，目标用户是年轻人'
);

console.log('\n📝 营销文案优化结果预览:');
console.log('System角色: 提供统一的优化框架...');
console.log('User角色: 营销文案专业指导 + 具体产品信息');

// 示例2：技术文档优化  
const example2 = optimizePrompt(
  '写个API文档',
  '技术文档',
  'RESTful API，包含用户认证功能'
);

console.log('\n📝 技术文档优化结果预览:');
console.log('System角色: 提供统一的优化框架...');
console.log('User角色: 技术文档专业指导 + 具体API需求');

// 5. 性能对比分析
console.log('\n⚡ 性能优势分析:');
console.log('传统方案: 需要查询System+User模板 (~100ms)');
console.log('新方案: 只需查询User模板 (~50ms)');
console.log('性能提升: 50% 响应时间减少');
console.log('额外优势: 减少数据库负载，提高并发能力');

console.log('\n🔧 维护优势分析:');
console.log('System模板: 代码版本控制，统一更新');
console.log('User模板: 数据库灵活配置，分类独立');
console.log('部署简化: System模板更新无需数据库操作');

console.log('\n🎉 优化方案实施完成！');
