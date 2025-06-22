#!/usr/bin/env node

/**
 * 检查生产环境配置
 * 模拟生产环境的配置验证逻辑
 */

require('dotenv').config();

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

console.log('🔍 生产环境配置检查');
console.log('==================');

// 模拟config.ts中的配置逻辑
function checkProductionConfig() {
  const config = {
    apiKey: process.env.API_KEY || '',
    serverKey: process.env.SERVER_KEY || '',
    isProduction: process.env.NODE_ENV === 'production',
    nodeEnv: process.env.NODE_ENV || 'development'
  };

  console.log('📋 当前配置:');
  console.log(`   NODE_ENV: ${config.nodeEnv}`);
  console.log(`   isProduction: ${config.isProduction}`);
  console.log(`   API_KEY: ${config.apiKey ? config.apiKey.substring(0, 8) + '...' : '❌ 未设置'}`);
  console.log(`   SERVER_KEY: ${config.serverKey ? config.serverKey.substring(0, 8) + '...' : '❌ 未设置'}`);
  console.log(`   测试API密钥: ${API_KEY.substring(0, 8)}...`);

  const errors = [];
  const warnings = [];

  // 模拟生产环境验证逻辑（config.ts 第169-182行）
  if (config.isProduction) {
    console.log('\n🏭 生产环境验证:');
    
    if (!config.apiKey) {
      errors.push('API_KEY is required in production environment.');
    } else if (config.apiKey.includes('dev-') || config.apiKey.length < 16) {
      warnings.push('API_KEY appears to be a development key. Use a strong production key.');
    }

    if (!config.serverKey) {
      errors.push('SERVER_KEY is required in production environment.');
    } else if (config.serverKey === config.apiKey) {
      warnings.push('SERVER_KEY should be different from API_KEY for better security.');
    }
  } else {
    console.log('\n🛠️  开发环境验证:');
    console.log('   开发环境验证较宽松');
  }

  // 检查用户API密钥是否匹配系统密钥
  console.log('\n🔐 API密钥匹配检查:');
  
  const userApiKey = API_KEY;
  const systemApiKey = config.apiKey;
  const serverKey = config.serverKey;
  
  console.log(`   用户API密钥: ${userApiKey.substring(0, 8)}...`);
  console.log(`   系统API密钥: ${systemApiKey ? systemApiKey.substring(0, 8) + '...' : '未设置'}`);
  console.log(`   服务器密钥: ${serverKey ? serverKey.substring(0, 8) + '...' : '未设置'}`);
  
  // 检查匹配情况
  const matchesApiKey = userApiKey === systemApiKey;
  const matchesServerKey = userApiKey === serverKey;
  
  console.log(`   匹配系统API密钥: ${matchesApiKey ? '✅' : '❌'}`);
  console.log(`   匹配服务器密钥: ${matchesServerKey ? '✅' : '❌'}`);
  
  if (matchesApiKey || matchesServerKey) {
    console.log('   🎉 用户API密钥匹配系统密钥，应该可以通过系统级认证');
  } else {
    console.log('   ❌ 用户API密钥不匹配任何系统密钥');
    console.log('   这意味着需要通过数据库验证');
  }

  // 显示错误和警告
  if (errors.length > 0) {
    console.log('\n❌ 配置错误:');
    errors.forEach(error => console.log(`   - ${error}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  配置警告:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  return { config, errors, warnings, matchesApiKey, matchesServerKey };
}

// 模拟认证流程
function simulateAuthFlow(result) {
  console.log('\n🔄 模拟认证流程:');
  
  const { config, matchesApiKey, matchesServerKey } = result;
  const userApiKey = API_KEY;
  
  // 1. 系统级API密钥验证（auth-middleware.ts 第215-230行）
  console.log('   第1步: 系统级API密钥验证');
  if (userApiKey && (userApiKey === config.apiKey || userApiKey === config.serverKey)) {
    console.log('   ✅ 系统级认证成功');
    return { success: true, method: 'system' };
  } else {
    console.log('   ❌ 系统级认证失败，尝试用户API密钥验证');
  }
  
  // 2. 用户API密钥验证（需要数据库查询）
  console.log('   第2步: 用户API密钥验证（需要数据库）');
  console.log('   这一步需要查询Supabase数据库中的api_keys表');
  
  return { success: false, method: 'none' };
}

// 生成解决方案
function generateSolutions(result) {
  const { config, errors, matchesApiKey, matchesServerKey } = result;
  
  console.log('\n💡 解决方案:');
  
  if (matchesApiKey || matchesServerKey) {
    console.log('   ✅ 配置看起来正确，如果仍有问题，可能是:');
    console.log('   1. MCP服务器没有重新加载配置');
    console.log('   2. 生产环境使用了不同的.env文件');
    console.log('   3. Docker容器没有正确传递环境变量');
  } else {
    console.log('   🔧 需要修复系统级API密钥配置:');
    console.log('   方案1: 设置系统级API密钥');
    console.log(`   - 设置 API_KEY=${API_KEY}`);
    console.log(`   - 设置 SERVER_KEY=${API_KEY}`);
    console.log('   - 重启MCP服务器');
    
    console.log('\n   方案2: 确保数据库中有正确的用户API密钥');
    console.log('   - 检查Supabase中api_keys表');
    console.log('   - 确认API密钥哈希值正确存储');
    console.log('   - 检查API密钥是否过期');
  }
  
  if (errors.length > 0) {
    console.log('\n   🚨 必须修复的错误:');
    errors.forEach(error => console.log(`   - ${error}`));
  }
}

// 主函数
function main() {
  const result = checkProductionConfig();
  const authResult = simulateAuthFlow(result);
  generateSolutions(result);
  
  console.log('\n🎯 检查完成!');
  
  if (authResult.success) {
    console.log('✅ 配置应该可以工作');
  } else {
    console.log('❌ 配置需要修复');
  }
}

main();
