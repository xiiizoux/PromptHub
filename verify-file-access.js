#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.prompt-hub.cc';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTA5NTM2MDAsImV4cCI6MTkwODcyMDAwMH0.7cxw7HfQUrQMFc0pTue6F0X-a6cZe7kF16TjNaZcLm0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 测试URL是否可访问
async function testUrlAccess(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return {
      accessible: false,
      status: 0,
      statusText: error.message
    };
  }
}

async function verifyFileAccess() {
  console.log('=== 验证文件访问 ===\n');

  // 获取所有包含媒体文件的prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, name, preview_asset_url, parameters, category_type')
    .not('preview_asset_url', 'is', null);

  if (error) {
    console.error('查询错误:', error);
    return;
  }

  console.log(`测试 ${prompts.length} 个提示词的媒体文件访问\n`);

  let accessibleCount = 0;
  let inaccessibleCount = 0;
  const inaccessibleFiles = [];

  for (const prompt of prompts) {
    console.log(`\n📄 ${prompt.name} (${prompt.category_type})`);
    
    // 测试preview_asset_url
    if (prompt.preview_asset_url) {
      const result = await testUrlAccess(prompt.preview_asset_url);
      if (result.accessible) {
        console.log(`  ✓ 预览URL可访问: ${result.status}`);
        accessibleCount++;
      } else {
        console.log(`  ✗ 预览URL不可访问: ${result.status} ${result.statusText}`);
        inaccessibleCount++;
        inaccessibleFiles.push({
          prompt: prompt.name,
          url: prompt.preview_asset_url,
          type: 'preview_asset_url'
        });
      }
    }

    // 测试media_files
    if (prompt.parameters?.media_files && Array.isArray(prompt.parameters.media_files)) {
      for (let i = 0; i < prompt.parameters.media_files.length; i++) {
        const file = prompt.parameters.media_files[i];
        if (file.url) {
          const result = await testUrlAccess(file.url);
          if (result.accessible) {
            console.log(`  ✓ 媒体文件${i + 1}可访问: ${result.status}`);
            accessibleCount++;
          } else {
            console.log(`  ✗ 媒体文件${i + 1}不可访问: ${result.status} ${result.statusText}`);
            console.log(`    URL: ${file.url}`);
            inaccessibleCount++;
            inaccessibleFiles.push({
              prompt: prompt.name,
              url: file.url,
              type: 'media_file'
            });
          }
        }
      }
    }
  }

  console.log('\n\n=== 验证总结 ===');
  console.log(`可访问文件: ${accessibleCount}`);
  console.log(`不可访问文件: ${inaccessibleCount}`);

  if (inaccessibleFiles.length > 0) {
    console.log('\n=== 不可访问的文件列表 ===');
    inaccessibleFiles.forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.prompt} (${file.type})`);
      console.log(`   URL: ${file.url}`);
      
      // 提取文件名
      const filename = file.url.split('/').pop();
      console.log(`   文件名: ${filename}`);
    });

    // 列出存储桶中实际存在的文件
    console.log('\n\n=== 存储桶中实际文件 ===');
    for (const bucket of ['images', 'videos']) {
      const { data: files } = await supabase.storage.from(bucket).list('', { limit: 100 });
      if (files && files.length > 0) {
        console.log(`\n${bucket} 桶:`);
        files.forEach(file => console.log(`  - ${file.name}`));
      }
    }
  }
}

verifyFileAccess().catch(console.error);

