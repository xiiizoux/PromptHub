#!/usr/bin/env node

/**
 * 调试API密钥数据库查询
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

async function debugApiKey() {
  console.log('🔍 开始调试API密钥...');
  console.log(`API密钥: ${API_KEY.substring(0, 8)}...`);
  
  // 创建Supabase客户端
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
  
  try {
    // 计算密钥哈希
    const keyHash = crypto.createHash('sha256').update(API_KEY).digest('hex');
    console.log(`密钥哈希: ${keyHash.substring(0, 16)}...`);
    
    // 查询API密钥表
    console.log('\n📋 查询API密钥表...');
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash);
    
    if (apiKeyError) {
      console.error('❌ API密钥查询失败:', apiKeyError.message);
    } else {
      console.log(`✅ API密钥查询结果: 找到 ${apiKeyData.length} 条记录`);
      if (apiKeyData.length > 0) {
        console.log('API密钥详情:', JSON.stringify(apiKeyData[0], null, 2));
        
        // 查询对应的用户信息
        const userId = apiKeyData[0].user_id;
        console.log('\n📋 查询用户信息...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId);
        
        if (userError) {
          console.error('❌ 用户查询失败:', userError.message);
        } else {
          console.log(`✅ 用户查询结果: 找到 ${userData.length} 条记录`);
          if (userData.length > 0) {
            console.log('用户详情:', JSON.stringify(userData[0], null, 2));
          }
        }
      }
    }
    
    // 查看所有API密钥（仅前5条）
    console.log('\n📋 查看数据库中的API密钥（前5条）...');
    const { data: allKeys, error: allKeysError } = await supabase
      .from('api_keys')
      .select('user_id, name, created_at, expires_at')
      .limit(5);
    
    if (allKeysError) {
      console.error('❌ 查询所有API密钥失败:', allKeysError.message);
    } else {
      console.log(`✅ 数据库中共有API密钥记录:`, allKeys.length);
      allKeys.forEach((key, index) => {
        console.log(`${index + 1}. 用户ID: ${key.user_id}, 名称: ${key.name}, 创建时间: ${key.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('调试过程中发生错误:', error.message);
  }
}

// 运行调试
debugApiKey();