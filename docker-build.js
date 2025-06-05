#!/usr/bin/env node

/**
 * PromptHub项目Docker统一构建脚本
 * 用于在项目根目录构建mcp服务和web服务
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('======== PromptHub Docker统一构建脚本 ========');

// 确保存在必要的目录
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`创建目录: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 为日志创建目录
ensureDir('./logs');

try {
  // 步骤1: 构建MCP服务
  console.log('\n🔧 步骤1: 构建MCP服务...');
  try {
    execSync('node ./mcp/docker-build.cjs', { stdio: 'inherit' });
    console.log('✅ MCP服务构建完成');
  } catch (error) {
    console.error('❌ MCP服务构建失败:', error.message);
    process.exit(1);
  }

  // 步骤2: 构建Web服务
  console.log('\n🔧 步骤2: 准备Web服务...');
  try {
    const webDir = path.resolve('./web');
    
    // 确保web/dist目录存在
    ensureDir('./web/dist');
    
    // 创建web服务的package.json副本
    const webPkg = JSON.parse(fs.readFileSync('./web/package.json', 'utf8'));
    fs.writeFileSync('./web/dist/package.json', JSON.stringify(webPkg, null, 2));
    
    console.log('✅ Web服务准备完成');
  } catch (error) {
    console.error('❌ Web服务准备失败:', error.message);
    process.exit(1);
  }
  
  // 步骤3: 复制其他必要文件
  console.log('\n🔧 步骤3: 准备Docker配置文件...');
  try {
    // 确保Docker目录存在
    ensureDir('./docker');
    
    // 复制Docker启动脚本
    if (fs.existsSync('./docker-start.sh')) {
      fs.copyFileSync('./docker-start.sh', './docker/docker-start.sh');
      // 确保启动脚本具有执行权限
      execSync('chmod +x ./docker/docker-start.sh');
      console.log('✅ Docker启动脚本已准备');
    }
    
    // 复制其他必要的配置文件
    console.log('✅ Docker配置文件准备完成');
  } catch (error) {
    console.error('❌ Docker配置文件准备失败:', error.message);
    process.exit(1);
  }

  console.log('\n✅✅✅ Docker构建过程全部完成!');
  console.log('\n可以使用以下命令构建和运行Docker容器:');
  console.log('  docker build -t prompthub .');
  console.log('  docker run -p 9010:9010 -p 9011:9011 prompthub');
  
} catch (err) {
  console.error('构建过程中发生错误:', err);
  process.exit(1);
}
