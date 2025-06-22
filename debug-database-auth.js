#!/usr/bin/env node

/**
 * 数据库认证调试脚本
 * 检查API密钥在数据库中的存储状态
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// 从.env文件读取配置
require('dotenv').config();

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 数据库认证调试工具');
console.log('====================');
console.log(`🔑 测试API密钥: ${API_KEY.substring(0, 8)}...${API_KEY.substring(-8)}`);
console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
console.log(`🔐 Service Key: ${SUPABASE_SERVICE_KEY ? '已设置' : '❌ 未设置'}`);
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 缺少Supabase配置，请检查.env文件');
  process.exit(1);
}

// 创建Supabase客户端（使用service key以绕过RLS）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkDatabaseConnection() {
  console.log('📋 第一步: 检查数据库连接');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ 数据库连接失败: ${error.message}`);
      return false;
    }
    
    console.log('✅ 数据库连接正常');
    return true;
  } catch (err) {
    console.log(`❌ 数据库连接异常: ${err.message}`);
    return false;
  }
}

async function checkApiKeysTable() {
  console.log('\n📋 第二步: 检查api_keys表结构');
  
  try {
    // 检查表是否存在
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ api_keys表访问失败: ${error.message}`);
      return false;
    }
    
    console.log('✅ api_keys表存在且可访问');
    
    // 检查表中的记录数量
    const { count, error: countError } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(`⚠️  无法获取记录数量: ${countError.message}`);
    } else {
      console.log(`📊 api_keys表中共有 ${count} 条记录`);
    }
    
    return true;
  } catch (err) {
    console.log(`❌ 检查api_keys表异常: ${err.message}`);
    return false;
  }
}

async function checkSpecificApiKey() {
  console.log('\n📋 第三步: 检查特定API密钥');
  
  // 计算API密钥的哈希值
  const keyHash = crypto.createHash('sha256').update(API_KEY).digest('hex');
  console.log(`🔐 API密钥哈希: ${keyHash.substring(0, 16)}...`);
  
  try {
    // 查找匹配的API密钥
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash);
    
    if (error) {
      console.log(`❌ 查询API密钥失败: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ 未找到匹配的API密钥记录');
      console.log('   可能原因:');
      console.log('   1. API密钥未在数据库中注册');
      console.log('   2. API密钥哈希值不匹配');
      console.log('   3. 记录已被删除');
      return null;
    }
    
    const apiKeyRecord = data[0];
    console.log('✅ 找到API密钥记录:');
    console.log(`   ID: ${apiKeyRecord.id}`);
    console.log(`   名称: ${apiKeyRecord.name}`);
    console.log(`   用户ID: ${apiKeyRecord.user_id}`);
    console.log(`   创建时间: ${apiKeyRecord.created_at}`);
    console.log(`   过期时间: ${apiKeyRecord.expires_at || '永不过期'}`);
    console.log(`   最后使用: ${apiKeyRecord.last_used_at || '从未使用'}`);
    
    // 检查是否过期
    if (apiKeyRecord.expires_at) {
      const expiresAt = new Date(apiKeyRecord.expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        console.log('❌ API密钥已过期');
        return null;
      } else {
        console.log(`✅ API密钥有效，将于 ${expiresAt.toLocaleString()} 过期`);
      }
    } else {
      console.log('✅ API密钥永不过期');
    }
    
    return apiKeyRecord;
  } catch (err) {
    console.log(`❌ 检查API密钥异常: ${err.message}`);
    return null;
  }
}

async function checkUserRecord(userId) {
  console.log('\n📋 第四步: 检查用户记录');
  
  if (!userId) {
    console.log('⚠️  跳过用户检查 - 未提供用户ID');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.log(`❌ 查询用户失败: ${error.message}`);
      return null;
    }
    
    if (!data) {
      console.log('❌ 未找到用户记录');
      return null;
    }
    
    console.log('✅ 找到用户记录:');
    console.log(`   ID: ${data.id}`);
    console.log(`   邮箱: ${data.email}`);
    console.log(`   显示名称: ${data.display_name}`);
    console.log(`   角色: ${data.role}`);
    console.log(`   创建时间: ${data.created_at}`);
    
    return data;
  } catch (err) {
    console.log(`❌ 检查用户记录异常: ${err.message}`);
    return null;
  }
}

async function listAllApiKeys() {
  console.log('\n📋 第五步: 列出所有API密钥（调试用）');
  
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, user_id, created_at, expires_at, last_used_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log(`❌ 获取API密钥列表失败: ${error.message}`);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('📋 数据库中没有API密钥记录');
      return;
    }
    
    console.log(`📋 最近的 ${data.length} 个API密钥:`);
    data.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key.name} (${key.id.substring(0, 8)}...)`);
      console.log(`      用户: ${key.user_id}`);
      console.log(`      创建: ${key.created_at}`);
      console.log(`      过期: ${key.expires_at || '永不过期'}`);
      console.log('');
    });
  } catch (err) {
    console.log(`❌ 列出API密钥异常: ${err.message}`);
  }
}

async function simulateAuthFlow() {
  console.log('\n📋 第六步: 模拟认证流程');
  
  const keyHash = crypto.createHash('sha256').update(API_KEY).digest('hex');
  
  try {
    // 模拟verifyApiKey方法的查询
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_hash', keyHash)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();
    
    if (error) {
      console.log(`❌ 认证查询失败: ${error.message}`);
      console.log(`   错误代码: ${error.code}`);
      console.log(`   错误详情: ${error.details}`);
      return;
    }
    
    if (!data) {
      console.log('❌ 认证失败 - 未找到有效的API密钥');
      return;
    }
    
    console.log(`✅ 第一步认证成功，用户ID: ${data.user_id}`);
    
    // 获取用户信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user_id)
      .single();
    
    if (userError) {
      console.log(`❌ 获取用户信息失败: ${userError.message}`);
      return;
    }
    
    if (!userData) {
      console.log('❌ 用户记录不存在');
      return;
    }
    
    console.log('✅ 完整认证流程成功!');
    console.log(`   用户: ${userData.display_name} (${userData.email})`);
    
  } catch (err) {
    console.log(`❌ 模拟认证流程异常: ${err.message}`);
  }
}

async function main() {
  try {
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) return;
    
    const tableExists = await checkApiKeysTable();
    if (!tableExists) return;
    
    const apiKeyRecord = await checkSpecificApiKey();
    
    if (apiKeyRecord) {
      await checkUserRecord(apiKeyRecord.user_id);
    }
    
    await listAllApiKeys();
    await simulateAuthFlow();
    
    console.log('\n🎯 诊断完成!');
    
    if (!apiKeyRecord) {
      console.log('\n💡 解决建议:');
      console.log('   1. 确认API密钥是否已在PromptHub网站上生成');
      console.log('   2. 检查API密钥是否正确复制（无额外空格或字符）');
      console.log('   3. 尝试重新生成API密钥');
      console.log('   4. 检查数据库同步是否正常');
    }
    
  } catch (error) {
    console.error('\n❌ 诊断过程中发生错误:', error.message);
  }
}

// 运行诊断
main();
