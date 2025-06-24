#!/usr/bin/env node

/**
 * 测试PromptHub MCP提示词优化功能
 */

const axios = require('axios');

// 配置
const MCP_SERVER_URL = 'http://localhost:9010';
const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

// 测试用例
const testCases = [
  {
    name: '通用优化测试',
    params: {
      content: '写一篇关于AI的文章',
      optimization_type: 'general',
      requirements: '需要包含技术细节和实际应用案例',
      context: '面向技术人员的博客文章',
      complexity: 'medium',
      include_analysis: true,
      language: 'zh'
    }
  },
  {
    name: '创意优化测试',
    params: {
      content: '帮我想一个故事',
      optimization_type: 'creative',
      requirements: '科幻题材，有悬疑元素',
      context: '短篇小说创作',
      complexity: 'simple',
      include_analysis: false,
      language: 'zh'
    }
  },
  {
    name: '技术优化测试',
    params: {
      content: '解释机器学习算法',
      optimization_type: 'technical',
      requirements: '需要代码示例和数学公式',
      context: '技术文档编写',
      complexity: 'complex',
      include_analysis: true,
      language: 'zh'
    }
  },
  {
    name: '商务优化测试',
    params: {
      content: '写一份产品介绍',
      optimization_type: 'business',
      requirements: '突出产品优势和市场定位',
      context: '商业提案',
      complexity: 'medium',
      include_analysis: false,
      language: 'zh'
    }
  },
  {
    name: '教育优化测试',
    params: {
      content: '教学生编程',
      optimization_type: 'educational',
      requirements: '适合初学者，循序渐进',
      context: '在线编程课程',
      complexity: 'simple',
      include_analysis: true,
      language: 'zh'
    }
  }
];

/**
 * 调用MCP工具
 */
async function callMCPTool(toolName, params) {
  try {
    const response = await axios.post(`${MCP_SERVER_URL}/tools/${toolName}/invoke`, params, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    console.error(`❌ 调用工具失败:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * 格式化输出结果
 */
function formatResult(result, testName) {
  console.log(`\n🎯 ${testName} 结果:`);
  console.log('=' .repeat(50));
  
  if (!result || !result.success) {
    console.log('❌ 测试失败:', result?.message || '未知错误');
    return;
  }

  const data = result.data;
  
  console.log(`✅ 优化类型: ${data.optimization_type}`);
  console.log(`📝 复杂度: ${data.complexity}`);
  console.log(`🌐 语言: ${data.language}`);
  
  if (data.optimization_template) {
    console.log('\n📋 优化模板:');
    console.log('系统提示:', data.optimization_template.system.substring(0, 200) + '...');
    console.log('用户提示:', data.optimization_template.user.substring(0, 200) + '...');
  }
  
  if (data.improvement_points && data.improvement_points.length > 0) {
    console.log('\n💡 改进建议:');
    data.improvement_points.forEach((point, index) => {
      console.log(`   ${index + 1}. ${point}`);
    });
  }
  
  if (data.quality_score) {
    console.log('\n📊 质量评分:');
    console.log(`   清晰性: ${data.quality_score.clarity}/10`);
    console.log(`   具体性: ${data.quality_score.specificity}/10`);
    console.log(`   完整性: ${data.quality_score.completeness}/10`);
    console.log(`   结构性: ${data.quality_score.structure}/10`);
    console.log(`   可操作性: ${data.quality_score.operability}/10`);
    console.log(`   总分: ${data.quality_score.overall}/10`);
  }
  
  if (data.analysis) {
    console.log('\n🔍 详细分析:');
    console.log(data.analysis.substring(0, 300) + '...');
  }
  
  console.log('\n✨ 响应消息:');
  console.log(result.message);
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('🚀 开始测试PromptHub MCP提示词优化功能...\n');
  
  // 首先检查服务器状态
  try {
    const healthCheck = await axios.get(`${MCP_SERVER_URL}/api/health`);
    console.log('✅ MCP服务器状态正常:', healthCheck.data);
  } catch (error) {
    console.error('❌ MCP服务器连接失败:', error.message);
    return;
  }
  
  // 运行测试用例
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 正在运行测试 ${i + 1}/${testCases.length}: ${testCase.name}`);
    
    const result = await callMCPTool('prompt_optimizer', testCase.params);
    formatResult(result, testCase.name);
    
    // 添加延迟避免请求过快
    if (i < testCases.length - 1) {
      console.log('\n⏳ 等待2秒后继续下一个测试...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, callMCPTool };
