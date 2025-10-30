#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.prompt-hub.cc';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTA5NTM2MDAsImV4cCI6MTkwODcyMDAwMH0.7cxw7HfQUrQMFc0pTue6F0X-a6cZe7kF16TjNaZcLm0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageObjects() {
  console.log('=== 检查存储桶中的文件 ===\n');

  // 使用API获取存储桶文件列表
  for (const bucket of ['images', 'videos', 'thumbnails']) {
    console.log(`\n--- ${bucket} 桶 ---`);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error(`  错误: ${error.message}`);
        continue;
      }

      if (!data || data.length === 0) {
        console.log('  📭 空桶 - 没有文件');
        continue;
      }

      console.log(`  📦 找到 ${data.length} 个文件/文件夹:\n`);
      data.slice(0, 10).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.name}`);
        console.log(`     ID: ${item.id || '无'}`);
        console.log(`     大小: ${item.metadata?.size || 0} bytes`);
        console.log(`     创建: ${item.created_at}`);
      });

      if (data.length > 10) {
        console.log(`  ... 还有 ${data.length - 10} 个文件`);
      }
    } catch (err) {
      console.error(`  异常: ${err.message}`);
    }
  }

  // 尝试列出所有用户文件夹
  console.log('\n=== 检查用户文件夹 ===\n');
  try {
    const { data: imageFiles } = await supabase.storage
      .from('images')
      .list('', { limit: 1000 });
    
    if (imageFiles) {
      const folders = imageFiles.filter(item => !item.name.includes('.'));
      console.log(`Images桶中的用户文件夹: ${folders.length}`);
      folders.slice(0, 5).forEach(folder => {
        console.log(`  - ${folder.name}`);
      });
    }
  } catch (err) {
    console.error('检查文件夹失败:', err.message);
  }
}

checkStorageObjects().catch(console.error);

