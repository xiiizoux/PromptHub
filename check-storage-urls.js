#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.prompt-hub.cc';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTA5NTM2MDAsImV4cCI6MTkwODcyMDAwMH0.7cxw7HfQUrQMFc0pTue6F0X-a6cZe7kF16TjNaZcLm0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageUrls() {
  console.log('=== 检查 Prompts 表中的预览资源URL ===\n');

  // 查询包含preview_asset_url的prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, name, preview_asset_url, category_type, parameters')
    .not('preview_asset_url', 'is', null)
    .limit(10);

  if (error) {
    console.error('查询错误:', error);
    return;
  }

  console.log(`找到 ${prompts.length} 个包含预览资源的提示词:\n`);

  prompts.forEach((prompt, index) => {
    console.log(`${index + 1}. ${prompt.name}`);
    console.log(`   ID: ${prompt.id}`);
    console.log(`   类型: ${prompt.category_type || '未知'}`);
    console.log(`   预览URL: ${prompt.preview_asset_url}`);
    
    // 检查URL格式
    if (prompt.preview_asset_url) {
      const url = prompt.preview_asset_url;
      if (url.includes('supabase.co') || url.includes('supabase.in')) {
        console.log('   ⚠️  警告: URL指向Supabase云服务,需要更新!');
      } else if (url.includes('supabase.prompt-hub.cc')) {
        console.log('   ✓ URL格式正确');
      } else {
        console.log('   ⚠️  警告: URL格式未知');
      }
    }
    
    // 检查parameters中的media_files
    if (prompt.parameters?.media_files) {
      console.log(`   媒体文件数量: ${prompt.parameters.media_files.length}`);
      prompt.parameters.media_files.forEach((file, i) => {
        console.log(`     ${i + 1}. ${file.url}`);
        if (file.url && (file.url.includes('supabase.co') || file.url.includes('supabase.in'))) {
          console.log('        ⚠️  需要更新');
        }
      });
    }
    console.log('');
  });

  // 检查storage.objects表中的文件
  console.log('\n=== 检查存储桶中的文件 ===\n');
  
  const { data: objects, error: objectsError } = await supabase
    .from('storage.objects')
    .select('*')
    .limit(10);

  if (objectsError) {
    console.error('查询存储对象错误:', objectsError);
  } else {
    console.log(`存储桶中有 ${objects.length} 个文件 (显示前10个):\n`);
    objects.forEach((obj, index) => {
      console.log(`${index + 1}. ${obj.name}`);
      console.log(`   桶: ${obj.bucket_id}`);
      console.log(`   大小: ${obj.metadata?.size || '未知'} bytes`);
      console.log(`   创建时间: ${obj.created_at}`);
      console.log('');
    });
  }

  // 测试访问一个文件
  console.log('\n=== 测试文件访问 ===\n');
  if (prompts.length > 0 && prompts[0].preview_asset_url) {
    const testUrl = prompts[0].preview_asset_url;
    console.log(`测试URL: ${testUrl}`);
    
    try {
      const response = await fetch(testUrl);
      console.log(`HTTP状态: ${response.status}`);
      if (response.ok) {
        console.log('✓ 文件可访问');
      } else {
        console.log('✗ 文件不可访问');
      }
    } catch (err) {
      console.log('✗ 访问失败:', err.message);
    }
  }
}

checkStorageUrls().catch(console.error);

