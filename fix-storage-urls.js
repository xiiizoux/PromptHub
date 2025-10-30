#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.prompt-hub.cc';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTA5NTM2MDAsImV4cCI6MTkwODcyMDAwMH0.7cxw7HfQUrQMFc0pTue6F0X-a6cZe7kF16TjNaZcLm0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 旧的Supabase云URL模式
const OLD_SUPABASE_PATTERNS = [
  'meyzdumdbjiebtnjifcc.supabase.co',
  'supabase.co/storage',
  'supabase.in/storage'
];

// 新的本地URL
const NEW_SUPABASE_URL = 'supabase.prompt-hub.cc';

async function fixStorageUrls() {
  console.log('=== 开始修复存储URL ===\n');

  // 获取所有包含preview_asset_url的prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, name, preview_asset_url, parameters')
    .not('preview_asset_url', 'is', null);

  if (error) {
    console.error('查询错误:', error);
    return;
  }

  console.log(`找到 ${prompts.length} 个提示词需要检查\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const prompt of prompts) {
    let needsUpdate = false;
    let updates = {};

    // 检查preview_asset_url
    if (prompt.preview_asset_url) {
      const hasOldUrl = OLD_SUPABASE_PATTERNS.some(pattern => 
        prompt.preview_asset_url.includes(pattern)
      );

      if (hasOldUrl) {
        // 提取文件路径部分
        const urlParts = prompt.preview_asset_url.split('/storage/v1/object/public/');
        if (urlParts.length === 2) {
          updates.preview_asset_url = `https://${NEW_SUPABASE_URL}/storage/v1/object/public/${urlParts[1]}`;
          needsUpdate = true;
          console.log(`  - 更新 preview_asset_url: ${prompt.name}`);
        }
      }
    }

    // 检查parameters.media_files
    if (prompt.parameters?.media_files && Array.isArray(prompt.parameters.media_files)) {
      const updatedMediaFiles = prompt.parameters.media_files.map(file => {
        if (file.url) {
          const hasOldUrl = OLD_SUPABASE_PATTERNS.some(pattern => 
            file.url.includes(pattern)
          );

          if (hasOldUrl) {
            const urlParts = file.url.split('/storage/v1/object/public/');
            if (urlParts.length === 2) {
              needsUpdate = true;
              return {
                ...file,
                url: `https://${NEW_SUPABASE_URL}/storage/v1/object/public/${urlParts[1]}`
              };
            }
          }
        }
        return file;
      });

      if (needsUpdate) {
        updates.parameters = {
          ...prompt.parameters,
          media_files: updatedMediaFiles
        };
        console.log(`  - 更新 media_files: ${prompt.name}`);
      }
    }

    // 执行更新
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('prompts')
        .update(updates)
        .eq('id', prompt.id);

      if (updateError) {
        console.error(`  ✗ 更新失败: ${prompt.name}`, updateError.message);
      } else {
        console.log(`  ✓ 更新成功: ${prompt.name}\n`);
        updatedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n=== 修复完成 ===');
  console.log(`总计: ${prompts.length} 个提示词`);
  console.log(`已更新: ${updatedCount} 个`);
  console.log(`跳过: ${skippedCount} 个 (无需更新)`);
}

fixStorageUrls().catch(console.error);

