#!/usr/bin/env node

/**
 * 系统级认证调试脚本
 * 检查MCP服务器的系统级API密钥配置
 */

require('dotenv').config();

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

console.log('🔍 系统级认证调试工具');
console.log('====================');
console.log(`🔑 测试API密钥: ${API_KEY.substring(0, 8)}...${API_KEY.substring(-8)}`);
console.log('');

// 检查环境变量
function checkEnvironmentVariables() {
  console.log('📋 检查环境变量配置:');
  
  const envVars = {
    'API_KEY': process.env.API_KEY,
    'SERVER_KEY': process.env.SERVER_KEY,
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY ? '已设置' : '未设置',
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置',
    'NODE_ENV': process.env.NODE_ENV,
    'STORAGE_TYPE': process.env.STORAGE_TYPE
  };
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (value) {
      if (key.includes('KEY') && value !== '已设置' && value !== '未设置') {
        console.log(`   ${key}: ${value.substring(0, 8)}...${value.substring(-8)}`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    } else {
      console.log(`   ${key}: ❌ 未设置`);
    }
  });
}

// 模拟MCP配置加载
function simulateConfigLoading() {
  console.log('\n📋 模拟MCP配置加载:');
  
  // 模拟config.ts中的逻辑
  function getParamValue(name) {
    return process.env[name.toUpperCase()] || '';
  }
  
  const config = {
    apiKey: getParamValue("api_key") || process.env.API_KEY || '',
    serverKey: getParamValue("server_key") || process.env.SERVER_KEY || '',
    storage: {
      type: (process.env.STORAGE_TYPE || 'supabase').toLowerCase()
    },
    supabase: {
      url: getParamValue("supabase_url") || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: getParamValue("supabase_anon_key") || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    }
  };
  
  console.log('   加载的配置:');
  console.log(`   config.apiKey: ${config.apiKey || '❌ 未设置'}`);
  console.log(`   config.serverKey: ${config.serverKey || '❌ 未设置'}`);
  console.log(`   config.storage.type: ${config.storage.type}`);
  console.log(`   config.supabase.url: ${config.supabase.url || '❌ 未设置'}`);
  console.log(`   config.supabase.anonKey: ${config.supabase.anonKey ? '已设置' : '❌ 未设置'}`);
  console.log(`   config.supabase.serviceKey: ${config.supabase.serviceKey ? '已设置' : '❌ 未设置'}`);
  
  return config;
}

// 模拟认证逻辑
function simulateAuthentication(config) {
  console.log('\n📋 模拟认证逻辑:');
  
  const apiKey = API_KEY;
  const serverKey = config.serverKey;
  
  console.log(`   输入API密钥: ${apiKey.substring(0, 8)}...`);
  console.log(`   系统API密钥: ${config.apiKey || '未设置'}`);
  console.log(`   服务器密钥: ${serverKey || '未设置'}`);
  
  // 模拟系统级API密钥验证
  if (apiKey && (apiKey === config.apiKey || apiKey === serverKey)) {
    console.log('   ✅ 系统级API密钥验证通过');
    return { success: true, method: 'system' };
  } else {
    console.log('   ❌ 系统级API密钥验证失败');
    
    if (!config.apiKey || config.apiKey === 'your-secure-api-key') {
      console.log('   原因: 系统API密钥未正确配置');
    } else if (apiKey !== config.apiKey && apiKey !== serverKey) {
      console.log('   原因: 提供的API密钥与系统密钥不匹配');
    }
    
    return { success: false, method: 'none' };
  }
}

// 检查.env文件
function checkEnvFile() {
  console.log('\n📋 检查.env文件:');
  
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('   ❌ .env文件不存在');
    return;
  }
  
  console.log('   ✅ .env文件存在');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    const relevantLines = lines.filter(line => 
      line.includes('API_KEY') || 
      line.includes('SERVER_KEY') ||
      line.includes('SUPABASE_URL') ||
      line.includes('STORAGE_TYPE')
    );
    
    console.log('   相关配置行:');
    relevantLines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          if (key.includes('KEY') && value !== 'your-secure-api-key') {
            console.log(`   ${key}=${value.substring(0, 8)}...${value.substring(-8)}`);
          } else {
            console.log(`   ${line}`);
          }
        }
      }
    });
  } catch (err) {
    console.log(`   ❌ 读取.env文件失败: ${err.message}`);
  }
}

// 生成建议
function generateRecommendations(config, authResult) {
  console.log('\n💡 建议和解决方案:');
  
  if (authResult.success) {
    console.log('   ✅ 系统级认证应该可以工作');
    console.log('   建议: 确保MCP服务器使用了正确的.env配置');
  } else {
    console.log('   ❌ 系统级认证配置有问题');
    
    if (!config.apiKey || config.apiKey === 'your-secure-api-key') {
      console.log('\n   🔧 解决方案1: 设置系统级API密钥');
      console.log('   1. 编辑.env文件');
      console.log(`   2. 设置 API_KEY=${API_KEY}`);
      console.log(`   3. 设置 SERVER_KEY=${API_KEY}`);
      console.log('   4. 重启MCP服务器');
    }
    
    console.log('\n   🔧 解决方案2: 检查数据库中的用户API密钥');
    console.log('   1. 运行 node debug-database-auth.js');
    console.log('   2. 检查API密钥是否正确存储在数据库中');
    console.log('   3. 如果没有，重新生成API密钥');
    
    console.log('\n   🔧 解决方案3: 检查MCP服务器状态');
    console.log('   1. 确认MCP服务器正在运行');
    console.log('   2. 检查服务器日志是否有错误');
    console.log('   3. 确认服务器使用了正确的配置文件');
  }
}

function main() {
  console.log('🚀 开始系统级认证诊断...\n');
  
  checkEnvironmentVariables();
  checkEnvFile();
  
  const config = simulateConfigLoading();
  const authResult = simulateAuthentication(config);
  
  generateRecommendations(config, authResult);
  
  console.log('\n🎯 系统级认证诊断完成!');
}

// 运行诊断
main();
