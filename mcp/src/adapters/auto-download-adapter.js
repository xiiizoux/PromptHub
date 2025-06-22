#!/usr/bin/env node

/**
 * 自动下载MCP协议适配器
 * 这个脚本会自动下载最新的适配器并运行
 * 用户无需手动下载和管理适配器文件
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class AutoDownloadAdapter {
  constructor() {
    this.adapterUrl = 'https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/mcp-protocol-adapter.js';
    this.cacheDir = path.join(os.homedir(), '.prompthub-mcp');
    this.adapterPath = path.join(this.cacheDir, 'mcp-protocol-adapter.js');
    this.versionFile = path.join(this.cacheDir, 'version.txt');
    this.maxAge = 24 * 60 * 60 * 1000; // 24小时缓存
    
    this.init();
  }

  async init() {
    try {
      console.error('[Auto-Download] 正在初始化MCP适配器...');
      
      // 确保缓存目录存在
      this.ensureCacheDir();
      
      // 检查是否需要下载或更新适配器
      const needsUpdate = await this.needsUpdate();
      
      if (needsUpdate) {
        console.error('[Auto-Download] 正在下载最新的适配器...');
        await this.downloadAdapter();
        console.error('[Auto-Download] 适配器下载完成');
      } else {
        console.error('[Auto-Download] 使用缓存的适配器');
      }
      
      // 运行适配器
      this.runAdapter();
      
    } catch (error) {
      console.error('[Auto-Download] 初始化失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 确保缓存目录存在
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.error(`[Auto-Download] 创建缓存目录: ${this.cacheDir}`);
    }
  }

  /**
   * 检查是否需要更新适配器
   */
  async needsUpdate() {
    // 如果适配器文件不存在，需要下载
    if (!fs.existsSync(this.adapterPath)) {
      return true;
    }

    // 检查文件年龄
    const stats = fs.statSync(this.adapterPath);
    const age = Date.now() - stats.mtime.getTime();
    
    if (age > this.maxAge) {
      console.error('[Auto-Download] 适配器缓存已过期，需要更新');
      return true;
    }

    // 检查版本（如果有版本文件）
    if (fs.existsSync(this.versionFile)) {
      try {
        const localVersion = fs.readFileSync(this.versionFile, 'utf8').trim();
        const remoteVersion = await this.getRemoteVersion();
        
        if (localVersion !== remoteVersion) {
          console.error('[Auto-Download] 发现新版本，需要更新');
          return true;
        }
      } catch (error) {
        console.error('[Auto-Download] 版本检查失败，使用缓存版本');
      }
    }

    return false;
  }

  /**
   * 获取远程版本信息
   */
  async getRemoteVersion() {
    return new Promise((resolve, reject) => {
      const versionUrl = 'https://api.github.com/repos/xiiizoux/PromptHub/commits/main';
      
      https.get(versionUrl, {
        headers: {
          'User-Agent': 'PromptHub-MCP-Adapter/1.0.0'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const commit = JSON.parse(data);
            resolve(commit.sha.substring(0, 8)); // 使用commit hash的前8位作为版本
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * 下载适配器
   */
  async downloadAdapter() {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(this.adapterPath);
      
      https.get(this.adapterUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`下载失败: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        
        file.on('finish', async () => {
          file.close();
          
          // 验证下载的文件
          if (await this.validateAdapter()) {
            // 保存版本信息
            try {
              const version = await this.getRemoteVersion();
              fs.writeFileSync(this.versionFile, version);
            } catch (error) {
              console.error('[Auto-Download] 保存版本信息失败:', error.message);
            }
            
            resolve();
          } else {
            reject(new Error('下载的适配器文件验证失败'));
          }
        });
        
        file.on('error', (error) => {
          fs.unlink(this.adapterPath, () => {}); // 删除损坏的文件
          reject(error);
        });
      }).on('error', reject);
    });
  }

  /**
   * 验证适配器文件
   */
  async validateAdapter() {
    try {
      const content = fs.readFileSync(this.adapterPath, 'utf8');
      
      // 基本验证：检查是否包含关键代码
      const requiredPatterns = [
        'MCPProtocolAdapter',
        'handleMessage',
        'makeHttpRequest',
        'tools/list',
        'tools/call'
      ];
      
      for (const pattern of requiredPatterns) {
        if (!content.includes(pattern)) {
          console.error(`[Auto-Download] 验证失败: 缺少 ${pattern}`);
          return false;
        }
      }
      
      // 检查文件大小（应该大于5KB）
      const stats = fs.statSync(this.adapterPath);
      if (stats.size < 5000) {
        console.error('[Auto-Download] 验证失败: 文件太小');
        return false;
      }
      
      console.error('[Auto-Download] 适配器文件验证通过');
      return true;
      
    } catch (error) {
      console.error('[Auto-Download] 验证适配器失败:', error.message);
      return false;
    }
  }

  /**
   * 运行适配器
   */
  runAdapter() {
    try {
      console.error('[Auto-Download] 启动MCP协议适配器...');
      
      // 设置环境变量 - 支持正式部署域名
      process.env.MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://mcp.prompt-hub.cc';
      
      // 动态加载并运行适配器
      delete require.cache[this.adapterPath]; // 清除缓存
      require(this.adapterPath);
      
    } catch (error) {
      console.error('[Auto-Download] 运行适配器失败:', error.message);
      
      // 如果运行失败，删除可能损坏的文件，下次会重新下载
      try {
        fs.unlinkSync(this.adapterPath);
        fs.unlinkSync(this.versionFile);
        console.error('[Auto-Download] 已清理损坏的缓存文件');
      } catch (cleanupError) {
        // 忽略清理错误
      }
      
      process.exit(1);
    }
  }

  /**
   * 清理缓存
   */
  static clearCache() {
    const cacheDir = path.join(os.homedir(), '.prompthub-mcp');
    
    try {
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        console.log('缓存已清理');
      } else {
        console.log('没有找到缓存');
      }
    } catch (error) {
      console.error('清理缓存失败:', error.message);
    }
  }
}

// 处理命令行参数
if (process.argv.includes('--clear-cache')) {
  AutoDownloadAdapter.clearCache();
  process.exit(0);
}

// 启动自动下载适配器
if (require.main === module) {
  new AutoDownloadAdapter();
}

module.exports = AutoDownloadAdapter;
