#!/usr/bin/env node

/**
 * 远程认证快速修复脚本
 * 帮助同步本地和远程环境的配置
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 MCP远程认证快速修复工具');
console.log('=' .repeat(50));

// 读取本地.env配置
function readLocalEnv() {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ 本地.env文件不存在');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

// 生成远程环境配置
function generateRemoteConfig() {
  console.log('📋 生成远程环境配置...\n');
  
  const localEnv = readLocalEnv();
  if (!localEnv) {
    return;
  }
  
  // 关键的配置项
  const criticalVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'PORT',
    'STORAGE_TYPE',
    'TRANSPORT_TYPE'
  ];
  
  console.log('🔑 以下是远程服务器需要的关键环境变量：');
  console.log('=' .repeat(50));
  
  const configCommands = [];
  
  criticalVars.forEach(varName => {
    if (localEnv[varName]) {
      const value = localEnv[varName];
      // 对于敏感信息，只显示前几位
      const displayValue = ['SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'].includes(varName) 
        ? value.substring(0, 20) + '...'
        : value;
      
      console.log(`${varName}=${displayValue}`);
      configCommands.push(`export ${varName}="${value}"`);
    } else {
      console.log(`⚠️  ${varName}=未设置`);
    }
  });
  
  // 生成修复命令
  console.log('\n🎯 远程服务器修复步骤：');
  console.log('=' .repeat(50));
  
  console.log('1. 登录远程服务器');
  console.log('2. 进入项目目录');
  console.log('3. 备份现有配置：');
  console.log('   cp .env .env.backup');
  
  console.log('\n4. 更新环境变量（选择以下方法之一）：');
  
  console.log('\n   方法A - 直接编辑.env文件：');
  console.log('   nano .env');
  console.log('   # 然后复制粘贴以下关键配置');
  
  console.log('\n   方法B - 使用命令行设置：');
  configCommands.forEach(cmd => {
    console.log(`   ${cmd}`);
  });
  
  console.log('\n5. 重启MCP服务：');
  console.log('   pm2 restart mcp-server || systemctl restart mcp-server || ./restart.sh');
  
  console.log('\n6. 验证修复：');
  console.log(`   curl -H "X-Api-Key: aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653" https://mcp.prompt-hub.cc/tools`);
  
  // 写入配置文件供远程使用
  const remoteEnvContent = criticalVars
    .filter(varName => localEnv[varName])
    .map(varName => `${varName}=${localEnv[varName]}`)
    .join('\n');
    
  fs.writeFileSync('.env.remote-fix', remoteEnvContent);
  console.log('\n✅ 远程配置已保存到 .env.remote-fix 文件');
  console.log('   可以将此文件上传到远程服务器使用');
  
  return true;
}

// 验证配置
function validateConfig() {
  console.log('\n🔍 配置验证清单：');
  console.log('=' .repeat(30));
  
  const localEnv = readLocalEnv();
  if (!localEnv) return;
  
  const checks = [
    {
      name: 'Supabase URL',
      key: 'SUPABASE_URL',
      validate: (val) => val && val.startsWith('https://') && val.includes('supabase.co')
    },
    {
      name: 'Supabase Anon Key',
      key: 'SUPABASE_ANON_KEY', 
      validate: (val) => val && val.length > 100
    },
    {
      name: 'Supabase Service Key',
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      validate: (val) => val && val.length > 100
    },
    {
      name: 'JWT Secret',
      key: 'JWT_SECRET',
      validate: (val) => val && val.length >= 32
    },
    {
      name: 'Storage Type',
      key: 'STORAGE_TYPE',
      validate: (val) => val === 'supabase'
    }
  ];
  
  checks.forEach(check => {
    const value = localEnv[check.key];
    const isValid = check.validate(value);
    const status = isValid ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${isValid ? '正常' : '需要检查'}`);
  });
}

// 主函数
function main() {
  console.log('🚀 开始分析配置...\n');
  
  generateRemoteConfig();
  validateConfig();
  
  console.log('\n📞 技术支持：');
  console.log('如果问题仍然存在，请检查：');
  console.log('1. 远程服务器的网络连接');
  console.log('2. Supabase数据库的访问权限');
  console.log('3. 防火墙和安全组设置');
  console.log('4. 服务器时间同步');
}

main(); 