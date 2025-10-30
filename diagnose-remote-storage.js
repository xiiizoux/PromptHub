#!/usr/bin/env node

/**
 * 远程Supabase Storage诊断脚本
 * 通过API诊断远程Storage服务问题
 */

const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://supabase.prompt-hub.cc';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ 缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

console.log('🔍 开始远程Storage诊断...\n');
console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

// HTTP请求辅助函数
function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      },
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = lib.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          contentType: res.headers['content-type'],
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// 测试函数
async function testStorageHealth() {
  console.log('1️⃣ 测试Storage服务健康状态...');
  try {
    const res = await makeRequest('/storage/v1/');
    console.log(`   状态码: ${res.status}`);
    console.log(`   响应: ${res.body.substring(0, 200)}`);
    console.log('   ✅ Storage API可访问\n');
  } catch (error) {
    console.log(`   ❌ Storage API不可访问: ${error.message}\n`);
  }
}

async function listBuckets() {
  console.log('2️⃣ 列出所有存储桶...');
  try {
    const res = await makeRequest('/storage/v1/bucket');
    if (res.status === 200) {
      const buckets = JSON.parse(res.body);
      console.log(`   找到 ${buckets.length} 个存储桶:`);
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`);
      });
      console.log('   ✅ 成功\n');
      return buckets;
    } else {
      console.log(`   ❌ 失败 (${res.status}): ${res.body}\n`);
      return [];
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}\n`);
    return [];
  }
}

async function listFiles(bucket) {
  console.log(`3️⃣ 列出 "${bucket}" 桶中的文件...`);
  try {
    const res = await makeRequest(`/storage/v1/object/list/${bucket}`, 'POST', {
      prefix: '',
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });
    
    if (res.status === 200) {
      const files = JSON.parse(res.body);
      console.log(`   找到 ${files.length} 个文件:`);
      files.slice(0, 5).forEach(file => {
        console.log(`   - ${file.name} (${(file.metadata?.size || 0) / 1024} KB)`);
      });
      if (files.length > 5) {
        console.log(`   ... 还有 ${files.length - 5} 个文件`);
      }
      console.log('   ✅ 成功\n');
      return files;
    } else {
      console.log(`   ❌ 失败 (${res.status}): ${res.body}\n`);
      return [];
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}\n`);
    return [];
  }
}

async function testFileDownload(bucket, fileName) {
  console.log(`4️⃣ 测试下载文件: ${bucket}/${fileName}`);
  
  // 测试1: Public URL
  console.log('   测试 Public URL...');
  try {
    const res = await makeRequest(`/storage/v1/object/public/${bucket}/${fileName}`);
    console.log(`   状态码: ${res.status}`);
    console.log(`   Content-Type: ${res.contentType}`);
    
    if (res.status === 200 && res.contentType && res.contentType.startsWith('image/')) {
      console.log(`   ✅ Public URL 工作正常 (文件大小: ${res.body.length} bytes)`);
    } else {
      console.log(`   ❌ Public URL 失败`);
      console.log(`   响应: ${res.body.substring(0, 500)}`);
    }
  } catch (error) {
    console.log(`   ❌ Public URL 错误: ${error.message}`);
  }
  
  // 测试2: Authenticated URL
  console.log('\n   测试 Authenticated URL...');
  try {
    const res = await makeRequest(`/storage/v1/object/authenticated/${bucket}/${fileName}`);
    console.log(`   状态码: ${res.status}`);
    console.log(`   Content-Type: ${res.contentType}`);
    
    if (res.status === 200 && res.contentType && res.contentType.startsWith('image/')) {
      console.log(`   ✅ Authenticated URL 工作正常 (文件大小: ${res.body.length} bytes)`);
    } else {
      console.log(`   ❌ Authenticated URL 失败`);
      console.log(`   响应: ${res.body.substring(0, 500)}`);
    }
  } catch (error) {
    console.log(`   ❌ Authenticated URL 错误: ${error.message}`);
  }
  
  console.log();
}

async function testSignedURL(bucket, fileName) {
  console.log(`5️⃣ 测试签名URL: ${bucket}/${fileName}`);
  try {
    const res = await makeRequest(
      `/storage/v1/object/sign/${bucket}/${fileName}`,
      'POST',
      { expiresIn: 3600 }
    );
    
    console.log(`   状态码: ${res.status}`);
    
    if (res.status === 200) {
      const data = JSON.parse(res.body);
      console.log(`   ✅ 签名URL创建成功`);
      console.log(`   签名路径: ${data.signedURL || data.signedUrl || '未知'}`);
      
      // 尝试访问签名URL
      if (data.signedURL || data.signedUrl) {
        const signedPath = data.signedURL || data.signedUrl;
        console.log('\n   测试访问签名URL...');
        const downloadRes = await makeRequest(signedPath);
        console.log(`   状态码: ${downloadRes.status}`);
        console.log(`   Content-Type: ${downloadRes.contentType}`);
        
        if (downloadRes.status === 200) {
          console.log(`   ✅ 签名URL可以访问 (文件大小: ${downloadRes.body.length} bytes)`);
        } else {
          console.log(`   ❌ 签名URL不能访问`);
          console.log(`   响应: ${downloadRes.body.substring(0, 500)}`);
        }
      }
    } else {
      console.log(`   ❌ 签名URL创建失败: ${res.body}`);
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }
  
  console.log();
}

async function checkStorageConfig() {
  console.log('6️⃣ 检查Storage配置 (通过REST API)...');
  try {
    // 尝试获取Storage设置 - 使用storage schema
    const res = await makeRequest('/rest/v1/rpc/storage_get_buckets', 'POST', {});
    console.log(`   状态码: ${res.status}`);
    if (res.status === 200) {
      const buckets = JSON.parse(res.body);
      console.log(`   存储桶配置:`);
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name}:`);
        console.log(`     Public: ${bucket.public}`);
        console.log(`     File Size Limit: ${bucket.file_size_limit || '未设置'}`);
        console.log(`     Allowed MIME Types: ${bucket.allowed_mime_types?.join(', ') || '所有'}`);
      });
      console.log('   ✅ 成功\n');
    } else {
      console.log(`   ⚠️  无法直接查询buckets表 (${res.status})`);
      console.log(`   这是正常的，通过Storage API已经可以访问buckets\n`);
    }
  } catch (error) {
    console.log(`   ⚠️  无法直接查询: ${error.message}`);
    console.log(`   这是正常的，通过Storage API已经可以访问buckets\n`);
  }
}

async function checkStorageObjects() {
  console.log('7️⃣ 检查数据库中的文件记录...');
  try {
    // 使用public.storage_objects视图或其他方式
    const res = await makeRequest('/rest/v1/rpc/storage_list_objects', 'POST', { bucket_name: 'images', prefix: '', limit: 10 });
    console.log(`   状态码: ${res.status}`);
    if (res.status === 200) {
      const objects = JSON.parse(res.body);
      console.log(`   找到 ${objects.length} 条记录:`);
      objects.forEach(obj => {
        const size = obj.metadata?.size || 0;
        console.log(`   - ${obj.name} (${(size / 1024).toFixed(2)} KB)`);
      });
      console.log('   ✅ 成功\n');
    } else {
      console.log(`   ⚠️  无法直接查询objects表 (${res.status})`);
      console.log(`   这是正常的，已经通过Storage API列出了文件\n`);
    }
  } catch (error) {
    console.log(`   ⚠️  无法直接查询: ${error.message}`);
    console.log(`   这是正常的，已经通过Storage API列出了文件\n`);
  }
}

// 主函数
async function main() {
  try {
    await testStorageHealth();
    
    const buckets = await listBuckets();
    
    if (buckets.length > 0) {
      // 测试images桶
      const imagesBucket = buckets.find(b => b.name === 'images');
      if (imagesBucket) {
        const files = await listFiles('images');
        if (files.length > 0) {
          await testFileDownload('images', files[0].name);
          await testSignedURL('images', files[0].name);
        }
      }
    }
    
    await checkStorageConfig();
    await checkStorageObjects();
    
    console.log('\n════════════════════════════════════════');
    console.log('📊 诊断总结');
    console.log('════════════════════════════════════════');
    console.log('\n如果文件下载失败(返回500)，可能的原因：');
    console.log('1. Storage后端服务(MinIO/S3)未运行或配置错误');
    console.log('2. Storage服务无法访问文件存储路径');
    console.log('3. 文件权限或存储卷挂载问题');
    console.log('4. Storage服务配置中的存储后端URL错误');
    console.log('\n请提供服务器SSH访问权限以进一步诊断:');
    console.log('- docker logs supabase-storage');
    console.log('- docker compose config');
    console.log('- 环境变量配置');
    console.log('\n或者提供以下信息:');
    console.log('- Supabase部署方式 (Docker/Kubernetes/其他)');
    console.log('- Storage后端类型 (本地文件系统/MinIO/S3)');
    console.log('- Storage服务日志文件');
    
  } catch (error) {
    console.error('\n❌ 诊断过程出错:', error);
  }
}

main();

