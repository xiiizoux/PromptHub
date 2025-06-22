#!/usr/bin/env node

/**
 * PromptHub MCP适配器
 * 用于第三方AI客户端（如Cursor、Claude Desktop等）连接PromptHub MCP服务器
 * 
 * 使用方法：
 * 1. 下载此文件到本地
 * 2. 在AI客户端中配置MCP服务器：
 *    {
 *      "mcpServers": {
 *        "prompthub": {
 *          "command": "node",
 *          "args": ["/path/to/prompthub-mcp.js"],
 *          "env": {
 *            "MCP_SERVER_URL": "https://mcp.prompt-hub.cc",
 *            "API_KEY": "your-api-key"
 *          }
 *        }
 *      }
 *    }
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class PromptHubMCPAdapter {
  constructor() {
    this.serverUrl = process.env.MCP_SERVER_URL || 'https://mcp.prompt-hub.cc';
    this.apiKey = process.env.API_KEY || process.env.MCP_API_KEY;
    this.timeout = parseInt(process.env.MCP_TIMEOUT || '60000');
    this.tools = new Map();
    
    // 验证配置
    if (!this.apiKey) {
      console.error('[PromptHub MCP] 错误: 未设置API_KEY环境变量');
      process.exit(1);
    }
    
    // 绑定方法
    this.handleMessage = this.handleMessage.bind(this);
    this.sendResponse = this.sendResponse.bind(this);
    this.sendError = this.sendError.bind(this);
    
    // 初始化
    this.init();
  }

  async init() {
    try {
      console.error('[PromptHub MCP] 正在初始化...');
      console.error(`[PromptHub MCP] 服务器: ${this.serverUrl}`);
      console.error(`[PromptHub MCP] API密钥: ${this.apiKey ? '已设置' : '未设置'}`);
      
      // 测试连接
      await this.testConnection();
      
      // 发现可用工具
      await this.discoverTools();
      
      // 设置stdio通信
      this.setupStdioHandlers();
      
      console.error('[PromptHub MCP] 初始化完成，等待MCP协议消息...');
    } catch (error) {
      console.error('[PromptHub MCP] 初始化失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 测试服务器连接
   */
  async testConnection() {
    try {
      console.error('[PromptHub MCP] 测试服务器连接...');
      const health = await this.makeHttpRequest('/api/health', 'GET');
      console.error(`[PromptHub MCP] 服务器连接正常 (状态: ${health.status})`);
      
      // 测试认证
      console.error('[PromptHub MCP] 测试API认证...');
      const info = await this.makeHttpRequest('/info', 'GET');
      console.error(`[PromptHub MCP] 服务器信息获取成功: ${info.name}`);
    } catch (error) {
      console.error('[PromptHub MCP] 服务器连接失败:', error.message);
      throw error;
    }
  }


  /**
   * 发现服务器上的可用工具
   */
  async discoverTools() {
    try {
      const response = await this.makeHttpRequest('/tools', 'GET');
      
      if (response && Array.isArray(response)) {
        // 直接处理工具数组
        response.forEach(tool => {
          this.tools.set(tool.name, tool);
        });
        console.error(`[PromptHub MCP] 发现 ${this.tools.size} 个工具`);
      } else if (response && response.tools && Array.isArray(response.tools)) {
        // 处理包装在tools字段中的工具数组
        response.tools.forEach(tool => {
          this.tools.set(tool.name, tool);
        });
        console.error(`[PromptHub MCP] 发现 ${this.tools.size} 个工具`);
      } else {
        console.error('[PromptHub MCP] 未找到工具列表');
      }
    } catch (error) {
      console.error('[PromptHub MCP] 工具发现失败:', error.message);
      // 继续运行，但工具列表为空
    }
  }


  /**
   * 设置stdio处理器
   */
  setupStdioHandlers() {
    let buffer = '';
    
    process.stdin.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // 处理完整的JSON消息
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line) {
          try {
            const message = JSON.parse(line);
            this.handleMessage(message);
          } catch (error) {
            console.error('[PromptHub MCP] JSON解析错误:', error.message);
            this.sendError(null, -32700, 'Parse error');
          }
        }
      }
    });

    process.stdin.on('end', () => {
      console.error('[PromptHub MCP] 输入流结束');
      process.exit(0);
    });
  }

  /**
   * 处理MCP协议消息
   */
  async handleMessage(message) {
    const { id, method, params } = message;
    console.error(`[PromptHub MCP] 收到消息: ${method} (id: ${id})`);

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
          this.sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      console.error(`[PromptHub MCP] 处理消息失败 (${method}):`, error.message);
      this.sendError(id, -32603, 'Internal error');
    }
  }

  /**
   * 处理初始化请求
   */
  async handleInitialize(id, params) {
    const response = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'PromptHub MCP Server',
        version: '1.0.0'
      }
    };
    
    this.sendResponse(id, response);
    console.error('[PromptHub MCP] 初始化响应已发送');
  }

  /**
   * 处理工具列表请求
   */
  async handleToolsList(id) {
    try {
      // 重新发现工具以获取最新列表
      await this.discoverTools();
      
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object',
          properties: tool.parameters || {},
          required: Object.keys(tool.parameters || {}).filter(key => 
            tool.parameters[key] && tool.parameters[key].required
          )
        }
      }));
      
      console.error(`[PromptHub MCP] 返回 ${tools.length} 个工具`);
      
      // 如果没有工具，记录详细信息
      if (tools.length === 0) {
        console.error('[PromptHub MCP] 警告: 未发现任何工具');
        console.error('[PromptHub MCP] 工具映射大小:', this.tools.size);
        console.error('[PromptHub MCP] 工具映射内容:', Array.from(this.tools.keys()));
      }
      
      this.sendResponse(id, { tools });
    } catch (error) {
      console.error('[PromptHub MCP] 工具列表获取失败:', error.message);
      this.sendError(id, -32603, `Failed to list tools: ${error.message}`);
    }
  }


  /**
   * 处理工具调用请求
   */
  async handleToolCall(id, params) {
    const { name, arguments: args } = params;
    console.error(`[PromptHub MCP] 调用工具: ${name}`);
    
    if (!this.tools.has(name)) {
      this.sendError(id, -32602, `Tool not found: ${name}`);
      return;
    }
  
    try {
      // MCP服务器使用RESTful API，不是JSON-RPC
      const endpoint = `/tools/${name}/invoke`;
      const result = await this.makeHttpRequest(endpoint, 'POST', args);
      
      // 转换为MCP响应格式
      let mcpResponse;
      
      if (result && typeof result === 'object') {
        if (result.success !== undefined) {
          // 处理带有success字段的响应
          if (result.success) {
            mcpResponse = {
              content: [
                {
                  type: 'text',
                  text: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)
                }
              ]
            };
          } else {
            throw new Error(result.error || 'Tool execution failed');
          }
        } else {
          // 直接使用结果数据
          mcpResponse = {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }
            ]
          };
        }
      } else {
        // 处理字符串响应
        mcpResponse = {
          content: [
            {
              type: 'text',
              text: String(result)
            }
          ]
        };
      }
      
      this.sendResponse(id, mcpResponse);
      console.error(`[PromptHub MCP] 工具调用完成: ${name}`);
    } catch (error) {
      console.error(`[PromptHub MCP] 工具调用失败: ${error.message}`);
      this.sendError(id, -32603, `Tool execution failed: ${error.message}`);
    }
  }


  /**
   * 发送成功响应
   */
  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  /**
   * 发送错误响应
   */
  sendError(id, code, message) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
    
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  /**
   * 发起HTTP请求
   */
  async makeHttpRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.serverUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PromptHub-MCP-Adapter/1.0.0'
        },
        timeout: this.timeout
      };
  
      // 添加认证头 - 使用X-Api-Key
      if (this.apiKey) {
        options.headers['X-Api-Key'] = this.apiKey;
      }
  
      // 添加请求体
      let postData = '';
      if (data && (method === 'POST' || method === 'PUT')) {
        postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }
  
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const result = responseData ? JSON.parse(responseData) : {};
              resolve(result);
            } else {
              const errorMsg = responseData || `HTTP ${res.statusCode}`;
              console.error(`[PromptHub MCP] HTTP错误 ${res.statusCode}: ${errorMsg}`);
              reject(new Error(`HTTP ${res.statusCode}: ${errorMsg}`));
            }
          } catch (error) {
            console.error(`[PromptHub MCP] 响应解析错误:`, error.message);
            reject(new Error(`Response parse error: ${error.message}`));
          }
        });
      });
  
      req.on('error', (error) => {
        console.error(`[PromptHub MCP] 请求错误:`, error.message);
        reject(new Error(`Request failed: ${error.message}`));
      });
  
      req.on('timeout', () => {
        req.destroy();
        console.error(`[PromptHub MCP] 请求超时`);
        reject(new Error('Request timeout'));
      });
  
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }

}

// 启动适配器
if (require.main === module) {
  new PromptHubMCPAdapter();
}

module.exports = PromptHubMCPAdapter;