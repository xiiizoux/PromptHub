/**
 * MCP Prompt Server 客户端库
 * 简化AI工具与MCP Prompt Server的集成
 */

class MCPPromptClient {
  /**
   * 创建一个新的MCP Prompt客户端
   * @param {string} serverUrl - MCP Prompt Server的URL
   * @param {string} apiKey - 用于身份验证的API密钥
   */
  constructor(serverUrl = 'http://localhost:9010', apiKey = 'your-api-key') {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.baseApiUrl = `${serverUrl}/api`;
  }

  /**
   * 发送请求到MCP Prompt Server
   * @param {string} endpoint - API端点
   * @param {string} method - HTTP方法
   * @param {object} body - 请求体内容
   * @returns {Promise<object>} - 响应数据
   */
  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseApiUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('MCP Prompt Client Error:', error);
      throw error;
    }
  }

  /**
   * 获取所有提示词列表
   * @returns {Promise<Array>} - 提示词列表
   */
  async getAllPrompts() {
    const response = await this.request('/prompts');
    return response.data.prompts;
  }

  /**
   * 获取特定提示词详情
   * @param {string} name - 提示词名称
   * @returns {Promise<object>} - 提示词详情
   */
  async getPrompt(name) {
    const response = await this.request(`/prompts/${encodeURIComponent(name)}`);
    return response.data.prompt;
  }

  /**
   * 搜索提示词
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} - 匹配的提示词列表
   */
  async searchPrompts(query) {
    const response = await this.request(`/prompts/search/${encodeURIComponent(query)}`);
    return response.data.prompts;
  }

  /**
   * 创建新提示词
   * @param {object} promptData - 提示词数据
   * @returns {Promise<object>} - 创建的提示词
   */
  async createPrompt(promptData) {
    const response = await this.request('/prompts', 'POST', promptData);
    return response.data.prompt;
  }

  /**
   * 获取提示词模板
   * @returns {Promise<object>} - 提示词模板
   */
  async getTemplate() {
    const response = await this.request('/template');
    return response.data.template;
  }

  /**
   * 从普通文本创建格式化的提示词
   * @param {string} name - 提示词名称
   * @param {string} content - 提示词内容
   * @param {string} description - 提示词描述
   * @param {string} category - 提示词分类
   * @param {Array<string>} tags - 提示词标签
   * @returns {Promise<object>} - 创建的提示词
   */
  async createPromptFromText(name, content, description = '', category = 'General', tags = []) {
    // 格式化提示词内容为messages结构
    const messages = [
      {
        role: 'system',
        content: {
          type: 'text',
          text: content
        }
      }
    ];
    
    const promptData = {
      name,
      description: description || `Prompt for ${name}`,
      category,
      tags,
      messages
    };
    
    return this.createPrompt(promptData);
  }
}

// 命令解析器 - 负责解析用户输入中的提示词相关命令
class PromptCommandParser {
  /**
   * 解析用户输入
   * @param {string} input - 用户输入文本
   * @returns {object|null} - 解析结果，如果不是提示词命令则返回null
   */
  parse(input) {
    // 搜索提示词命令
    const searchMatch = input.match(/搜索提示词\s*[：:]\s*(.+)/i) || 
                        input.match(/搜索提示词\s+(.+)/i) ||
                        input.match(/查找提示词\s*[：:]\s*(.+)/i) ||
                        input.match(/查找提示词\s+(.+)/i);
    
    if (searchMatch) {
      return {
        command: 'search',
        query: searchMatch[1].trim()
      };
    }
    
    // 保存提示词命令
    const saveMatch = input.match(/保存提示词\s*[：:]\s*(.+?)\s*[：:]\s*(.+)/i) || 
                      input.match(/保存提示词\s+(.+?)\s+(.+)/i) ||
                      input.match(/记住提示词\s*[：:]\s*(.+?)\s*[：:]\s*(.+)/i) ||
                      input.match(/记住提示词\s+(.+?)\s+(.+)/i);
    
    if (saveMatch) {
      return {
        command: 'save',
        name: saveMatch[1].trim(),
        content: saveMatch[2].trim()
      };
    }
    
    // 获取提示词命令
    const getMatch = input.match(/获取提示词\s*[：:]\s*(.+)/i) || 
                     input.match(/获取提示词\s+(.+)/i) ||
                     input.match(/使用提示词\s*[：:]\s*(.+)/i) ||
                     input.match(/使用提示词\s+(.+)/i);
    
    if (getMatch) {
      return {
        command: 'get',
        name: getMatch[1].trim()
      };
    }
    
    // 不是提示词相关命令
    return null;
  }
}

// AI工具处理器 - 负责处理提示词命令并与MCP Prompt Server交互
class AIToolPromptHandler {
  /**
   * 创建一个新的提示词处理器
   * @param {MCPPromptClient} client - MCP Prompt客户端
   * @param {PromptCommandParser} parser - 命令解析器
   * @param {object} callbacks - 回调函数集合
   */
  constructor(client, parser, callbacks = {}) {
    this.client = client;
    this.parser = parser;
    this.callbacks = {
      onMessage: callbacks.onMessage || console.log,
      onError: callbacks.onError || console.error,
      onInsertPrompt: callbacks.onInsertPrompt || ((text) => console.log('Insert prompt:', text)),
      onRequestInput: callbacks.onRequestInput || (() => Promise.resolve(''))
    };
  }
  
  /**
   * 处理用户输入
   * @param {string} input - 用户输入
   * @returns {Promise<boolean>} - 是否处理了命令
   */
  async handleInput(input) {
    const parsedCommand = this.parser.parse(input);
    
    if (!parsedCommand) {
      return false; // 不是提示词命令
    }
    
    try {
      switch (parsedCommand.command) {
        case 'search':
          await this.handleSearchCommand(parsedCommand.query);
          break;
        case 'save':
          await this.handleSaveCommand(parsedCommand.name, parsedCommand.content);
          break;
        case 'get':
          await this.handleGetCommand(parsedCommand.name);
          break;
      }
      
      return true; // 成功处理了命令
    } catch (error) {
      this.callbacks.onError(`处理提示词命令失败: ${error.message}`);
      return true; // 虽然出错，但确实是个命令
    }
  }
  
  /**
   * 处理搜索命令
   * @param {string} query - 搜索关键词
   */
  async handleSearchCommand(query) {
    this.callbacks.onMessage(`正在搜索提示词: ${query}...`);
    
    const prompts = await this.client.searchPrompts(query);
    
    if (prompts.length === 0) {
      this.callbacks.onMessage('没有找到匹配的提示词');
      return;
    }
    
    // 显示搜索结果
    let message = '找到以下提示词:\n\n';
    
    prompts.forEach((prompt, index) => {
      message += `${index + 1}. ${prompt.name} - ${prompt.description}\n`;
      message += `   分类: ${prompt.category}, 标签: ${prompt.tags.join(', ')}\n\n`;
    });
    
    this.callbacks.onMessage(message);
    
    // 提示用户选择
    this.callbacks.onMessage('请输入要使用的提示词编号，或输入"取消"退出:');
    
    const selection = await this.callbacks.onRequestInput();
    
    if (selection.toLowerCase() === '取消') {
      this.callbacks.onMessage('已取消选择');
      return;
    }
    
    const index = parseInt(selection) - 1;
    
    if (isNaN(index) || index < 0 || index >= prompts.length) {
      this.callbacks.onMessage('无效的选择');
      return;
    }
    
    const selectedPrompt = prompts[index];
    
    // 提取提示词内容
    let promptContent = '';
    if (selectedPrompt.messages && selectedPrompt.messages.length > 0) {
      promptContent = selectedPrompt.messages
        .map(msg => {
          if (msg.content && typeof msg.content === 'object' && msg.content.text) {
            return msg.content.text;
          } else if (typeof msg.content === 'string') {
            return msg.content;
          }
          return '';
        })
        .filter(text => text)
        .join('\n\n');
    }
    
    if (!promptContent) {
      this.callbacks.onMessage('提示词内容为空');
      return;
    }
    
    // 插入提示词内容
    this.callbacks.onInsertPrompt(promptContent);
    this.callbacks.onMessage(`已插入提示词: ${selectedPrompt.name}`);
  }
  
  /**
   * 处理保存命令
   * @param {string} name - 提示词名称
   * @param {string} content - 提示词内容
   */
  async handleSaveCommand(name, content) {
    this.callbacks.onMessage(`准备保存提示词"${name}"...`);
    
    // 请求额外信息
    this.callbacks.onMessage('请输入提示词描述 (可选):');
    const description = await this.callbacks.onRequestInput();
    
    this.callbacks.onMessage('请输入提示词分类 (可选，默认为"General"):');
    const category = await this.callbacks.onRequestInput() || 'General';
    
    this.callbacks.onMessage('请输入提示词标签，用逗号分隔 (可选):');
    const tagsInput = await this.callbacks.onRequestInput();
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    try {
      await this.client.createPromptFromText(name, content, description, category, tags);
      this.callbacks.onMessage(`提示词"${name}"已成功保存`);
    } catch (error) {
      this.callbacks.onError(`保存提示词失败: ${error.message}`);
    }
  }
  
  /**
   * 处理获取命令
   * @param {string} name - 提示词名称
   */
  async handleGetCommand(name) {
    this.callbacks.onMessage(`正在获取提示词: ${name}...`);
    
    try {
      const prompt = await this.client.getPrompt(name);
      
      if (!prompt) {
        this.callbacks.onMessage(`未找到提示词: ${name}`);
        return;
      }
      
      // 提取提示词内容
      let promptContent = '';
      if (prompt.messages && prompt.messages.length > 0) {
        promptContent = prompt.messages
          .map(msg => {
            if (msg.content && typeof msg.content === 'object' && msg.content.text) {
              return msg.content.text;
            } else if (typeof msg.content === 'string') {
              return msg.content;
            }
            return '';
          })
          .filter(text => text)
          .join('\n\n');
      }
      
      if (!promptContent) {
        this.callbacks.onMessage('提示词内容为空');
        return;
      }
      
      // 插入提示词内容
      this.callbacks.onInsertPrompt(promptContent);
      this.callbacks.onMessage(`已插入提示词: ${name}`);
    } catch (error) {
      this.callbacks.onError(`获取提示词失败: ${error.message}`);
    }
  }
}

// 如果在浏览器环境中，将类导出到全局变量
if (typeof window !== 'undefined') {
  window.MCPPromptClient = MCPPromptClient;
  window.PromptCommandParser = PromptCommandParser;
  window.AIToolPromptHandler = AIToolPromptHandler;
}

// 如果在Node.js环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MCPPromptClient,
    PromptCommandParser,
    AIToolPromptHandler
  };
}
