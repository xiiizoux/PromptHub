#!/usr/bin/env node

/**
 * 本地MCP适配器 - 用于测试本地Docker环境
 * 包含详细的日志输出
 */

const https = require('https');
const http = require('http');

// 配置
const SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:9010';
const API_KEY = process.env.API_KEY || 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

// 日志函数
function log(message) {
  console.error(`[Local-MCP] ${new Date().toISOString()} - ${message}`);
}

// 启动时的检查
function startupChecks() {
  log('=== 本地MCP适配器启动 ===');
  log(`Node.js版本: ${process.version}`);
  log(`工作目录: ${process.cwd()}`);
  log(`服务器URL: ${SERVER_URL}`);
  log(`API密钥: ${API_KEY ? '已设置' : '❌ 未设置'}`);
  
  if (!API_KEY) {
    log('❌ 错误: 未设置API_KEY环境变量');
    process.exit(1);
  }
  
  log(`API密钥长度: ${API_KEY.length} 字符`);
}

// HTTP请求函数
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
        'User-Agent': 'Local-MCP-Adapter/1.0.0'
      },
      timeout: 10000
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    log(`发起请求: ${method} ${url}`);

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        log(`响应状态: ${res.statusCode}`);
        
        try {
          const result = responseData ? JSON.parse(responseData) : {};
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          log(`响应解析失败: ${error.message}`);
          resolve({ status: res.statusCode, data: responseData, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      log(`请求错误: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      log('请求超时');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 获取工具列表
async function getTools() {
  try {
    log('获取工具列表...');
    const result = await makeRequest('/tools');
    
    if (result.status === 200 && result.data.tools) {
      log(`✅ 成功获取 ${result.data.tools.length} 个工具`);
      return result.data.tools;
    } else {
      log(`❌ 获取工具失败: ${result.status} - ${JSON.stringify(result.data)}`);
      return [];
    }
  } catch (error) {
    log(`❌ 获取工具异常: ${error.message}`);
    return [];
  }
}

// MCP消息处理
class LocalMCPAdapter {
  constructor() {
    this.tools = [];
    this.setupStdio();
  }

  async init() {
    startupChecks();
    
    // 测试连接
    try {
      log('测试服务器连接...');
      const healthResult = await makeRequest('/api/health');
      if (healthResult.status === 200) {
        log('✅ 服务器连接正常');
      } else {
        log(`❌ 服务器连接失败: ${healthResult.status}`);
      }
    } catch (error) {
      log(`❌ 服务器连接异常: ${error.message}`);
    }

    // 获取工具列表
    this.tools = await getTools();
    log(`工具列表初始化完成，共 ${this.tools.length} 个工具`);
  }

  setupStdio() {
    let buffer = '';
    
    process.stdin.on('data', (chunk) => {
      buffer += chunk.toString();
      
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line) {
          try {
            const message = JSON.parse(line);
            this.handleMessage(message);
          } catch (error) {
            log(`JSON解析错误: ${error.message}`);
            this.sendError(null, -32700, 'Parse error');
          }
        }
      }
    });

    process.stdin.on('end', () => {
      log('输入流结束');
      process.exit(0);
    });

    log('stdio处理器已设置');
  }

  async handleMessage(message) {
    const { id, method, params } = message;
    log(`收到消息: ${method} (id: ${id})`);

    try {
      switch (method) {
        case 'initialize':
          await this.handleInitialize(id, params);
          break;
          
        case 'tools/list':
          await this.handleToolsList(id);
          break;
          
        case 'tools/call':
          await this.handleToolCall(id, params);
          break;
          
        default:
          log(`未知方法: ${method}`);
          this.sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      log(`处理消息失败: ${error.message}`);
      this.sendError(id, -32603, 'Internal error');
    }
  }

  async handleInitialize(id, params) {
    log('处理初始化请求');
    
    const response = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'PromptHub Local MCP Server',
        version: '1.0.0'
      }
    };
    
    this.sendResponse(id, response);
    log('初始化响应已发送');
  }

  async handleToolsList(id) {
    log('处理工具列表请求');
    
    // 重新获取最新工具列表
    this.tools = await getTools();
    
    const tools = this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: tool.parameters || {},
        required: []
      }
    }));
    
    log(`返回 ${tools.length} 个工具`);
    this.sendResponse(id, { tools });
  }

  async handleToolCall(id, params) {
    const { name, arguments: args } = params;
    log(`调用工具: ${name}`);
    
    try {
      const result = await makeRequest(`/tools/${name}/invoke`, 'POST', args);
      
      const mcpResponse = {
        content: [
          {
            type: 'text',
            text: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)
          }
        ]
      };
      
      this.sendResponse(id, mcpResponse);
      log(`工具调用完成: ${name}`);
    } catch (error) {
      log(`工具调用失败: ${error.message}`);
      this.sendError(id, -32603, `Tool execution failed: ${error.message}`);
    }
  }

  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  sendError(id, code, message) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: { code, message }
    };
    
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}

// 启动适配器
async function main() {
  try {
    const adapter = new LocalMCPAdapter();
    await adapter.init();
    log('本地MCP适配器已启动，等待消息...');
  } catch (error) {
    log(`启动失败: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
