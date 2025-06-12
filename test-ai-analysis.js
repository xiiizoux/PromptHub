#!/usr/bin/env node

/**
 * AI分析功能测试脚本
 * 用于测试不同的AI分析功能和API端点
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:9011';
const API_ENDPOINT = `${BASE_URL}/api/ai-analyze`;

// 测试提示词样本
const TEST_PROMPTS = [
  {
    name: '编程助手',
    content: '请帮我分析以下{{语言}}代码的问题，并提供{{详细程度}}的解决方案。代码内容：{{代码内容}}'
  },
  {
    name: '创意写作',
    content: '写一个关于{{主题}}的{{文体}}，要求{{要求}}，字数大约{{字数}}字。'
  },
  {
    name: '数据分析',
    content: '分析{{数据集}}的数据，重点关注{{关注点}}，生成{{输出格式}}报告。'
  }
];

// 测试函数
async function testAction(action, content = '', config = {}) {
  try {
    const response = await axios.post(API_ENDPOINT, {
      action,
      content,
      config
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || '请求失败');
    }
  } catch (error) {
    console.error(`❌ ${action} 测试失败:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 开始AI分析功能测试\n');

  // 1. 测试配置获取
  console.log('📋 1. 测试配置获取');
  const config = await testAction('get_config');
  if (config) {
    console.log('✅ 配置获取成功:');
    console.log(`   端点: ${config.endpoint}`);
    console.log(`   完整分析模型: ${config.models.fullAnalysis}`);
    console.log(`   快速任务模型: ${config.models.quickTasks}`);
    console.log(`   API密钥状态: ${config.hasApiKey ? '已配置' : '未配置'}`);
    console.log(`   自定义端点: ${config.isCustomEndpoint ? '是' : '否'}`);
  }
  console.log('');

  // 2. 测试健康检查
  console.log('🏥 2. 测试健康检查');
  const health = await testAction('health_check');
  if (health) {
    console.log(`✅ 健康检查完成:`);
    console.log(`   状态: ${health.isHealthy ? '正常' : '异常'}`);
    console.log(`   端点: ${health.endpoint}`);
    if (health.error) {
      console.log(`   错误: ${health.error}`);
    }
  }
  console.log('');

  // 3. 测试变量提取（本地功能）
  console.log('📝 3. 测试变量提取');
  for (const prompt of TEST_PROMPTS) {
    console.log(`   测试: ${prompt.name}`);
    const variables = await testAction('extract_variables', prompt.content);
    if (variables) {
      console.log(`   ✅ 提取变量: ${variables.variables.join(', ')}`);
    }
  }
  console.log('');

  // 只有在配置了API密钥时才测试AI功能
  if (config && config.hasApiKey) {
    // 4. 测试快速分类
    console.log('🏷️ 4. 测试快速分类');
    for (const prompt of TEST_PROMPTS) {
      console.log(`   测试: ${prompt.name}`);
      const classification = await testAction('quick_classify', prompt.content);
      if (classification) {
        console.log(`   ✅ 分类结果: ${classification.category}`);
      }
      // 添加延迟以避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('');

    // 5. 测试标签提取
    console.log('🔖 5. 测试标签提取');
    for (const prompt of TEST_PROMPTS) {
      console.log(`   测试: ${prompt.name}`);
      const tags = await testAction('extract_tags', prompt.content);
      if (tags) {
        console.log(`   ✅ 提取标签: ${tags.tags.join(', ')}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('');

    // 6. 测试完整分析
    console.log('🤖 6. 测试完整分析');
    const testPrompt = TEST_PROMPTS[0]; // 只测试一个以节省时间
    console.log(`   测试: ${testPrompt.name}`);
    const fullAnalysis = await testAction('full_analyze', testPrompt.content, {
      language: 'zh',
      includeImprovements: true,
      includeSuggestions: true
    });
    
    if (fullAnalysis) {
      console.log('   ✅ 完整分析成功:');
      console.log(`      分类: ${fullAnalysis.category}`);
      console.log(`      标签: ${fullAnalysis.tags.join(', ')}`);
      console.log(`      难度: ${fullAnalysis.difficulty}`);
      console.log(`      版本建议: ${fullAnalysis.version}`);
      console.log(`      置信度: ${Math.round(fullAnalysis.confidence * 100)}%`);
      console.log(`      预估Token: ${fullAnalysis.estimatedTokens}`);
      if (fullAnalysis.improvements && fullAnalysis.improvements.length > 0) {
        console.log(`      改进建议: ${fullAnalysis.improvements.slice(0, 2).join('; ')}`);
      }
    }
  } else {
    console.log('⚠️  跳过AI功能测试（未配置API密钥）');
  }

  console.log('\n🎉 测试完成!');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testAction }; 