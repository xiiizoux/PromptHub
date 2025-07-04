#!/usr/bin/env node

/**
 * PromptHub MCP Adapter 测试脚本
 * 测试 MCP 适配器的各种功能，特别是 Context Engineering 功能
 */

const { spawn } = require('child_process');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  API_KEY: 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653',
  MCP_SERVER_URL: 'https://mcp.prompt-hub.cc',
  TEST_USER: {
    email: 'zouguojunx@gmail.com',
    password: 'putvip$9fynhu@Kokmuk'
  },
  TIMEOUT: 30000 // 30秒超时
};

class MCPTester {
  constructor() {
    this.mcpProcess = null;
    this.messageId = 1;
    this.responses = new Map();
    this.testResults = [];
  }

  /**
   * 启动 MCP 适配器进程
   */
  async startMCPAdapter() {
    console.log('🚀 启动 MCP 适配器...');
    
    const adapterPath = path.join(__dirname, 'index.js');
    this.mcpProcess = spawn('node', [adapterPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        API_KEY: TEST_CONFIG.API_KEY,
        MCP_SERVER_URL: TEST_CONFIG.MCP_SERVER_URL
      }
    });

    // 监听输出
    this.mcpProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.id) {
            this.responses.set(response.id, response);
          }
        } catch (e) {
          // 忽略非JSON输出
        }
      }
    });

    this.mcpProcess.stderr.on('data', (data) => {
      console.log(`[MCP Adapter] ${data.toString().trim()}`);
    });

    // 等待适配器启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ MCP 适配器已启动');
  }

  /**
   * 发送 MCP 消息
   */
  async sendMessage(method, params = {}) {
    const id = this.messageId++;
    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    console.log(`📤 发送消息: ${method}`);
    this.mcpProcess.stdin.write(JSON.stringify(message) + '\n');

    // 等待响应
    const startTime = Date.now();
    while (Date.now() - startTime < TEST_CONFIG.TIMEOUT) {
      if (this.responses.has(id)) {
        const response = this.responses.get(id);
        this.responses.delete(id);
        return response;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`消息 ${method} 超时`);
  }

  /**
   * 测试 MCP 初始化
   */
  async testInitialize() {
    console.log('\n🧪 测试 MCP 初始化...');
    try {
      const response = await this.sendMessage('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        },
        clientInfo: {
          name: 'PromptHub-Test-Client',
          version: '1.0.0'
        }
      });

      if (response.result && response.result.capabilities) {
        console.log('✅ MCP 初始化成功');
        console.log(`   服务器名称: ${response.result.serverInfo?.name || 'Unknown'}`);
        console.log(`   协议版本: ${response.result.protocolVersion || 'Unknown'}`);
        this.testResults.push({ test: 'initialize', success: true });
        return true;
      } else {
        throw new Error('初始化响应格式错误');
      }
    } catch (error) {
      console.log(`❌ MCP 初始化失败: ${error.message}`);
      this.testResults.push({ test: 'initialize', success: false, error: error.message });
      return false;
    }
  }

  /**
   * 测试工具列表
   */
  async testToolsList() {
    console.log('\n🧪 测试工具列表...');
    try {
      const response = await this.sendMessage('tools/list');
      
      if (response.result && response.result.tools && Array.isArray(response.result.tools)) {
        const tools = response.result.tools;
        console.log(`✅ 获取到 ${tools.length} 个工具`);
        
        // 检查关键工具是否存在
        const keyTools = ['unified_search', 'prompt_optimizer', 'context_engineering', 'context_state'];
        const foundTools = tools.map(t => t.name);

        for (const tool of keyTools) {
          if (foundTools.includes(tool)) {
            console.log(`   ✅ ${tool} - 已找到`);
          } else {
            console.log(`   ❌ ${tool} - 未找到`);
          }
        }
        
        this.testResults.push({ test: 'tools_list', success: true, toolCount: tools.length });
        return tools;
      } else {
        throw new Error('工具列表响应格式错误');
      }
    } catch (error) {
      console.log(`❌ 获取工具列表失败: ${error.message}`);
      this.testResults.push({ test: 'tools_list', success: false, error: error.message });
      return [];
    }
  }

  /**
   * 测试统一搜索工具
   */
  async testUnifiedSearch() {
    console.log('\n🧪 测试统一搜索工具...');
    try {
      const response = await this.sendMessage('tools/call', {
        name: 'unified_search',
        arguments: {
          query: '写作助手',
          limit: 3
        }
      });

      if (response.result && response.result.content) {
        console.log('✅ 统一搜索测试成功');
        console.log(`   响应长度: ${response.result.content.length} 字符`);
        this.testResults.push({ test: 'unified_search', success: true });
        return true;
      } else {
        throw new Error('搜索响应格式错误');
      }
    } catch (error) {
      console.log(`❌ 统一搜索测试失败: ${error.message}`);
      this.testResults.push({ test: 'unified_search', success: false, error: error.message });
      return false;
    }
  }

  /**
   * 测试提示词优化工具
   */
  async testPromptOptimization() {
    console.log('\n🧪 测试提示词优化工具...');
    try {
      const response = await this.sendMessage('tools/call', {
        name: 'prompt_optimizer',
        arguments: {
          content: '请帮我写一篇文章',
          type: 'chat',
          language: 'zh',
          complexity: 'medium'
        }
      });

      if (response.result && response.result.content) {
        console.log('✅ 提示词优化测试成功');
        console.log(`   响应长度: ${response.result.content.length} 字符`);
        this.testResults.push({ test: 'prompt_optimizer', success: true });
        return true;
      } else {
        throw new Error('优化响应格式错误');
      }
    } catch (error) {
      console.log(`❌ 提示词优化测试失败: ${error.message}`);
      this.testResults.push({ test: 'prompt_optimizer', success: false, error: error.message });
      return false;
    }
  }

  /**
   * 测试 Context Engineering 核心功能
   */
  async testContextEngineering() {
    console.log('\n🧪 测试 Context Engineering 核心功能...');
    try {
      const response = await this.sendMessage('tools/call', {
        name: 'context_engineering',
        arguments: {
          promptId: 'test-prompt-001',
          input: '请帮我写一个关于AI发展的技术文章',
          sessionId: `test-session-${Date.now()}`,
          preferences: {
            responseStyle: 'professional',
            language: 'zh-CN',
            complexity: 'medium'
          },
          pipeline: 'default'
        }
      });

      if (response.result) {
        console.log('✅ Context Engineering 测试成功');
        if (response.result.content) {
          console.log(`   响应长度: ${response.result.content.length} 字符`);
        }
        if (response.result.data) {
          console.log(`   处理时间: ${response.result.data.metadata?.processingTime || 'N/A'}ms`);
          console.log(`   上下文来源: ${response.result.data.metadata?.contextSources?.length || 0} 个`);
        }
        this.testResults.push({ test: 'context_engineering', success: true });
        return true;
      } else {
        throw new Error('Context Engineering 响应格式错误');
      }
    } catch (error) {
      console.log(`❌ Context Engineering 测试失败: ${error.message}`);
      this.testResults.push({ test: 'context_engineering', success: false, error: error.message });
      return false;
    }
  }

  /**
   * 测试上下文状态查询
   */
  async testContextState() {
    console.log('\n🧪 测试上下文状态查询...');
    try {
      const response = await this.sendMessage('tools/call', {
        name: 'context_state',
        arguments: {
          userId: 'test-user-001'
        }
      });

      if (response.result) {
        console.log('✅ 上下文状态查询测试成功');
        if (response.result.data) {
          console.log(`   用户ID: ${response.result.data.userId || 'N/A'}`);
          console.log(`   活跃会话: ${response.result.data.activeSessions?.length || 0} 个`);
        }
        this.testResults.push({ test: 'context_state', success: true });
        return true;
      } else {
        throw new Error('上下文状态响应格式错误');
      }
    } catch (error) {
      console.log(`❌ 上下文状态查询测试失败: ${error.message}`);
      this.testResults.push({ test: 'context_state', success: false, error: error.message });
      return false;
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🎯 开始 PromptHub MCP Adapter 功能测试');
    console.log(`📋 测试配置:`);
    console.log(`   API Key: ${TEST_CONFIG.API_KEY.substring(0, 20)}...`);
    console.log(`   MCP Server: ${TEST_CONFIG.MCP_SERVER_URL}`);
    console.log(`   测试用户: ${TEST_CONFIG.TEST_USER.email}`);

    try {
      // 启动适配器
      await this.startMCPAdapter();

      // 运行测试
      await this.testInitialize();
      await this.testToolsList();
      await this.testUnifiedSearch();
      await this.testPromptOptimization();
      await this.testContextEngineering();
      await this.testContextState();

      // 输出测试结果
      this.printTestResults();

    } catch (error) {
      console.error(`❌ 测试过程中发生错误: ${error.message}`);
    } finally {
      // 清理
      if (this.mcpProcess) {
        this.mcpProcess.kill();
        console.log('🧹 已清理 MCP 适配器进程');
      }
    }
  }

  /**
   * 打印测试结果
   */
  printTestResults() {
    console.log('\n📊 测试结果汇总:');
    console.log('═'.repeat(50));
    
    let successCount = 0;
    let totalCount = this.testResults.length;

    for (const result of this.testResults) {
      const status = result.success ? '✅' : '❌';
      const details = result.success 
        ? (result.toolCount ? `(${result.toolCount} 工具)` : '')
        : `(${result.error})`;
      
      console.log(`${status} ${result.test.padEnd(20)} ${details}`);
      if (result.success) successCount++;
    }

    console.log('═'.repeat(50));
    console.log(`📈 成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    if (successCount === totalCount) {
      console.log('🎉 所有测试通过！MCP 适配器工作正常');
    } else {
      console.log('⚠️  部分测试失败，请检查错误信息');
    }
  }
}

// 运行测试
async function main() {
  const tester = new MCPTester();
  await tester.runAllTests();
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MCPTester, TEST_CONFIG };
