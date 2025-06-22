#!/usr/bin/env node

/**
 * MCP协议适配器
 * 将标准MCP协议调用转换为HTTP API调用
 * 支持通用配置格式，无需为每个工具单独配置
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class MCPProtocolAdapter {
  constructor() {
    this.serverUrl = process.env.MCP_SERVER_URL || 'https://mcp.prompt-hub.cc';
    this.apiKey = process.env.API_KEY || process.env.MCP_API_KEY;
    this.timeout = parseInt(process.env.MCP_TIMEOUT || '60000');
    this.tools = new Map();
    
    // 绑定方法
    this.handleMessage = this.handleMessage.bind(this);
    this.sendResponse = this.sendResponse.bind(this);
    this.sendError = this.sendError.bind(this);
    
    // 初始化
    this.init();
  }

  async init() {
    try {
      // 发现可用工具
      await this.discoverTools();
      
      // 设置stdio通信
      this.setupStdioHandlers();
      
      console.error('[MCP Adapter] 初始化完成，等待MCP协议消息...');
    } catch (error) {
      console.error('[MCP Adapter] 初始化失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 发现服务器上的可用工具
   */
  async discoverTools() {
    try {
      const tools = await this.makeHttpRequest('/tools', 'GET');
      
      if (tools && Array.isArray(tools.tools)) {
        tools.tools.forEach(tool => {
          this.tools.set(tool.name, tool);
        });
        console.error(`[MCP Adapter] 发现 ${this.tools.size} 个工具`);
      }
    } catch (error) {
      console.error('[MCP Adapter] 工具发现失败:', error.message);
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
            console.error('[MCP Adapter] JSON解析错误:', error.message);
            this.sendError(null, -32700, 'Parse error');
          }
        }
      }
    });

    process.stdin.on('end', () => {
      console.error('[MCP Adapter] 输入流结束');
      process.exit(0);
    });
  }

  /**
   * 处理MCP协议消息
   */
  async handleMessage(message) {
    const { id, method, params } = message;

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
      console.error(`[MCP Adapter] 处理消息失败 (${method}):`, error.message);
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
            tool.parameters[key].required
          )
        }
      }));
      
      this.sendResponse(id, { tools });
    } catch (error) {
      this.sendError(id, -32603, `Failed to list tools: ${error.message}`);
    }
  }

  /**
   * 处理工具调用请求
   */
  async handleToolCall(id, params) {
    const { name, arguments: args } = params;
    
    if (!this.tools.has(name)) {
      this.sendError(id, -32602, `Tool not found: ${name}`);
      return;
    }

    try {
      // MCP服务器使用JSON-RPC 2.0协议，需要发送到根路径
      const rpcRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: name,
          arguments: args
        }
      };
      
      const result = await this.makeHttpRequest('/', 'POST', rpcRequest);
      
      // 处理JSON-RPC响应
      let responseData;
      if (result && result.result) {
        // 处理JSON-RPC成功响应
        responseData = result.result;
      } else if (result && result.error) {
        // 处理JSON-RPC错误响应
        throw new Error(result.error.message || 'Tool execution failed');
      } else {
        // 直接响应数据
        responseData = result;
      }
      
      // 转换为MCP响应格式
      const mcpResponse = {
        content: [
          {
            type: 'text',
            text: typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2)
          }
        ]
      };
      
      this.sendResponse(id, mcpResponse);
    } catch (error) {
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
          'User-Agent': 'MCP-Protocol-Adapter/1.0.0'
        },
        timeout: this.timeout
      };

      // 添加认证头
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
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (error) {
            reject(new Error(`Response parse error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
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
  new MCPProtocolAdapter();
}

module.exports = MCPProtocolAdapter;
