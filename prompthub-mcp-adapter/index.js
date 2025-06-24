#!/usr/bin/env node

/**
 * PromptHub MCP Adapter
 * 连接AI客户端(Cursor, Claude Desktop)与PromptHub MCP服务器的适配器
 * 
 * 使用方法:
 * 1. 在AI客户端配置中添加:
 *    {
 *      "prompthub": {
 *        "command": "npx",
 *        "args": ["-y", "prompthub-mcp@latest"],
 *        "env": {
 *          "API_KEY": "your-api-key-here",
 *          "MCP_SERVER_URL": "https://mcp.prompt-hub.cc"
 *        }
 *      }
 *    }
 * 
 * 2. 重启AI客户端即可使用30+个PromptHub工具
 */

// 检查Node.js版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ PromptHub MCP适配器需要Node.js 18+');
  console.error(`   当前版本: ${nodeVersion}`);
  console.error('   请升级Node.js版本');
  process.exit(1);
}

// 动态导入fetch (Node.js 18+内置)
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  try {
    // 对于较老的Node.js版本，尝试使用node-fetch
    fetch = require('node-fetch');
  } catch (e) {
    console.error('❌ 无法加载fetch，请升级到Node.js 18+');
    process.exit(1);
  }
} else {
  fetch = globalThis.fetch;
}

/**
 * PromptHub MCP适配器类
 * 使用REST API与PromptHub服务器通信
 */
class PromptHubMCPAdapter {
  constructor() {
    this.serverUrl = process.env.MCP_SERVER_URL || 'https://mcp.prompt-hub.cc';
    this.apiKey = process.env.API_KEY || '';
    this.initialized = false;
    this.tools = [];
    this.nextId = 1;
    
    console.log('[PromptHub MCP] 正在初始化...');
    console.log(`[PromptHub MCP] 服务器: ${this.serverUrl}`);
    console.log(`[PromptHub MCP] API密钥: ${this.apiKey ? '已设置' : '未设置'}`);
  }

  /**
   * 初始化适配器
   */
  async initialize() {
    try {
      // 1. 检查服务器健康状态
      await this.checkServerHealth();
      
      // 2. 获取工具列表（使用预定义列表，因为GET /tools认证有问题）
      this.loadPredefinedTools();
      
      this.initialized = true;
      console.log(`[PromptHub MCP] 初始化完成，加载 ${this.tools.length} 个工具`);
      
    } catch (error) {
      console.error('[PromptHub MCP] 初始化失败:', error.message);
      // 仍然标记为已初始化，使用预定义工具列表
      this.loadPredefinedTools();
      this.initialized = true;
    }
  }

  /**
   * 检查服务器健康状态
   */
  async checkServerHealth() {
    try {
      const response = await this.makeHttpRequest('/api/health', 'GET');
      if (response.status === 'healthy') {
        console.log('[PromptHub MCP] 服务器连接正常 (状态: healthy)');
        return true;
      } else {
        throw new Error(`服务器健康检查失败: ${response.status}`);
      }
    } catch (error) {
      console.error('[PromptHub MCP] 服务器健康检查失败:', error.message);
      throw error;
    }
  }

  /**
   * 加载预定义的工具列表
   * 由于GET /tools端点有认证问题，我们使用预定义列表
   */
  loadPredefinedTools() {
    this.tools = [
      // ============= 🚀 统一入口工具 (终极推荐) =============
      {
        name: 'unified_search',
        description: '🚀 统一搜索 - 智能路由到最适合的搜索方式，一个工具满足所有搜索需求 (⭐⭐⭐⭐⭐ 终极推荐)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索查询，支持自然语言描述，例如："写商务邮件"、"分析代码问题"等' },
            mode: { type: 'string', description: '搜索模式：auto(自动选择) | semantic(语义) | advanced(高级) | intelligent(智能) | basic(基础)' },
            category: { type: 'string', description: '分类筛选' },
            tags: { type: 'array', items: { type: 'string' }, description: '标签筛选' },
            max_results: { type: 'number', description: '最大结果数，默认5个' },
            sort_by: { type: 'string', description: '排序方式：relevance | name | created_at | category' }
          },
          required: ['query']
        }
      },
      
      {
        name: 'unified_store',
        description: '🤖 智能存储 - AI分析提示词内容，自动补全参数并保存到数据库 (⭐⭐⭐⭐⭐ 终极推荐)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '要保存的提示词内容' },
            instruction: { type: 'string', description: '用户的存储指令，如"保存此提示词，使用xxx标题，存储到教育分类"等自然语言指令' },
            title: { type: 'string', description: '提示词标题（用户指定时优先使用）' },
            category: { type: 'string', description: '分类（用户指定时优先使用）' },
            description: { type: 'string', description: '描述（用户指定时优先使用）' },
            tags: { type: 'array', items: { type: 'string' }, description: '标签列表（用户指定时优先使用）' },
            is_public: { type: 'boolean', description: '是否公开，默认true（用户指定时优先使用）' },
            allow_collaboration: { type: 'boolean', description: '是否允许协作编辑，默认true（用户指定时优先使用）' },
            collaborative_level: { type: 'string', description: '协作级别：creator_only(默认)|invite_only|public_edit（用户指定时优先使用）' },
            auto_analyze: { type: 'boolean', description: '是否启用AI自动分析，默认true' }
          },
          required: ['content']
        }
      },
      
      // ============= 🎯 提示词优化工具 =============
      {
        name: 'prompt_optimizer',
        description: '🎯 提示词优化器 - 为第三方AI客户端提供结构化的提示词优化指导和分析',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '要优化的提示词内容' },
            optimization_type: { 
              type: 'string', 
              description: '优化类型：general(通用) | creative(创意) | technical(技术) | business(商务) | educational(教育) | drawing(绘图) | analysis(分析) | iteration(迭代)',
              enum: ['general', 'creative', 'technical', 'business', 'educational', 'drawing', 'analysis', 'iteration']
            },
            requirements: { type: 'string', description: '特殊要求或限制条件' },
            context: { type: 'string', description: '使用场景和上下文' },
            complexity: { 
              type: 'string', 
              description: '复杂度级别：simple(简单) | medium(中等) | complex(复杂)',
              enum: ['simple', 'medium', 'complex']
            },
            include_analysis: { type: 'boolean', description: '是否包含详细分析，默认true' },
            language: { 
              type: 'string', 
              description: '输出语言：zh(中文) | en(英文)',
              enum: ['zh', 'en']
            },
            // 迭代优化专用参数
            original_prompt: { type: 'string', description: '原始提示词（用于迭代优化）' },
            current_prompt: { type: 'string', description: '当前提示词（用于迭代优化）' },
            iteration_type: { type: 'string', description: '迭代类型（用于迭代优化）' }
          },
          required: ['content']
        }
      },
      
      // ============= 🎯 其他搜索选项 (通过统一搜索自动调用) =============
      {
        name: 'smart_semantic_search',
        description: '🎯 智能语义搜索 - 用自然语言描述需求，返回包含完整内容预览的相关提示词',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '用自然语言描述您的需求，例如："写商务邮件"、"分析代码问题"、"创意文案"等' },
            max_results: { type: 'number', description: '最多返回几个结果，默认5个' }
          },
          required: ['query']
        }
      },
      
      // ============= 核心提示词管理工具 =============
      {
        name: 'get_categories',
        description: '获取所有提示词分类',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_tags',
        description: '获取所有提示词标签',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_prompt_names',
        description: '获取所有可用的提示词名称',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: '按分类筛选' },
            tags: { type: 'array', items: { type: 'string' }, description: '按标签筛选' },
            page: { type: 'number', description: '页码' },
            pageSize: { type: 'number', description: '每页数量' }
          },
          required: []
        }
      },
      {
        name: 'get_prompt_details',
        description: '获取特定提示词的详细信息',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '提示词名称' }
          },
          required: ['name']
        }
      },
      {
        name: 'create_prompt',
        description: '创建新的提示词',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '提示词名称' },
            description: { type: 'string', description: '提示词描述' },
            category: { type: 'string', description: '提示词分类' },
            tags: { type: 'array', items: { type: 'string' }, description: '提示词标签' },
            messages: { type: 'array', description: '提示词消息' }
          },
          required: ['name', 'description', 'messages']
        }
      },
      {
        name: 'update_prompt',
        description: '更新现有提示词',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '提示词名称' },
            description: { type: 'string', description: '提示词描述' },
            category: { type: 'string', description: '提示词分类' },
            tags: { type: 'array', items: { type: 'string' }, description: '提示词标签' },
            messages: { type: 'array', description: '提示词消息' },
            is_public: { type: 'boolean', description: '是否公开可见' },
            allow_collaboration: { type: 'boolean', description: '是否允许协作编辑' }
          },
          required: ['name']
        }
      },


      {
        name: 'get_prompt_template',
        description: '获取提示词模板',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      // ============= 其他搜索选项 =============
      {
        name: 'search_prompts',
        description: '基础关键词搜索 (建议使用unified_search)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索关键词' },
            includePublic: { type: 'boolean', description: '是否包含公开提示词' }
          },
          required: ['query']
        }
      },
      {
        name: 'enhanced_search_prompts',
        description: '高级搜索 - 支持多条件筛选 (建议使用unified_search)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索关键词' },
            category: { type: 'string', description: '分类筛选' },
            tags: { type: 'array', items: { type: 'string' }, description: '标签筛选' },
            difficulty: { type: 'string', description: '难度级别' }
          },
          required: ['query']
        }
      },
      
      // ============= 智能AI工具 =============
      {
        name: 'intelligent_prompt_selection',
        description: '智能提示词选择和推荐 (建议使用unified_search)',
        inputSchema: {
          type: 'object',
          properties: {
            context: { type: 'string', description: '使用场景描述' },
            task_type: { type: 'string', description: '任务类型' },
            preferences: { type: 'object', description: '用户偏好' }
          },
          required: ['context']
        }
      },
      {
        name: 'intelligent_prompt_storage',
        description: '智能提示词存储',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '提示词内容' },
            context: { type: 'string', description: '使用场景' },
            auto_categorize: { type: 'boolean', description: '自动分类' }
          },
          required: ['content']
        }
      },
      {
        name: 'analyze_prompt_with_external_ai',
        description: '使用外部AI分析提示词质量',
        inputSchema: {
          type: 'object',
          properties: {
            prompt_content: { type: 'string', description: '提示词内容' },
            analysis_type: { type: 'string', description: '分析类型' }
          },
          required: ['prompt_content']
        }
      },
      // ============= 📦 其他存储选项 (建议使用unified_store) =============
      {
        name: 'quick_store',
        description: '快速存储提示词 (建议使用unified_store)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '提示词内容' },
            name: { type: 'string', description: '提示词名称' },
            category: { type: 'string', description: '分类' }
          },
          required: ['content']
        }
      },
      {
        name: 'smart_store',
        description: '智能存储提示词 (建议使用unified_store)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '提示词内容' },
            auto_optimize: { type: 'boolean', description: '自动优化' },
            suggest_tags: { type: 'boolean', description: '建议标签' }
          },
          required: ['content']
        }
      },
      {
        name: 'analyze_and_store',
        description: '分析并存储提示词 (建议使用unified_store)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '提示词内容' },
            analyze_quality: { type: 'boolean', description: '分析质量' },
            suggest_improvements: { type: 'boolean', description: '建议改进' }
          },
          required: ['content']
        }
      },

      // 版本控制工具
      {
        name: 'get_prompt_versions',
        description: '获取提示词的版本历史',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '提示词名称' }
          },
          required: ['name']
        }
      },
      {
        name: 'get_prompt_version',
        description: '获取提示词的特定版本',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '提示词名称' },
            version: { type: 'number', description: '版本号' }
          },
          required: ['name', 'version']
        }
      },
      {
        name: 'restore_prompt_version',
        description: '将提示词恢复到特定版本',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '提示词名称' },
            version: { type: 'number', description: '版本号' }
          },
          required: ['name', 'version']
        }
      },
      // 导入导出工具
      {
        name: 'export_prompts',
        description: '导出提示词',
        inputSchema: {
          type: 'object',
          properties: {
            ids: { type: 'array', items: { type: 'string' }, description: '要导出的提示词ID列表' }
          },
          required: []
        }
      },
      {
        name: 'import_prompts',
        description: '导入提示词',
        inputSchema: {
          type: 'object',
          properties: {
            prompts: { type: 'array', description: '要导入的提示词数组' }
          },
          required: ['prompts']
        }
      },
      // 性能分析工具
      {
        name: 'track_prompt_usage',
        description: '记录提示词使用数据',
        inputSchema: {
          type: 'object',
          properties: {
            prompt_id: { type: 'string', description: '提示词ID' },
            prompt_version: { type: 'number', description: '提示词版本' },
            input_tokens: { type: 'number', description: '输入令牌数' },
            output_tokens: { type: 'number', description: '输出令牌数' },
            total_tokens: { type: 'number', description: '总令牌数' },
            latency_ms: { type: 'number', description: '延迟时间（毫秒）' },
            user_id: { type: 'string', description: '用户ID' },
            session_id: { type: 'string', description: '会话ID' },
            metadata: { type: 'object', description: '额外元数据' }
          },
          required: ['prompt_id', 'input_tokens', 'output_tokens', 'total_tokens', 'latency_ms']
        }
      },
      {
        name: 'submit_prompt_feedback',
        description: '提交提示词反馈',
        inputSchema: {
          type: 'object',
          properties: {
            usage_id: { type: 'string', description: '使用记录ID' },
            rating: { type: 'number', description: '评分（1-5）' },
            comments: { type: 'string', description: '评论' },
            user_id: { type: 'string', description: '用户ID' }
          },
          required: ['usage_id', 'rating']
        }
      },
      {
        name: 'get_prompt_performance',
        description: '获取提示词性能数据',
        inputSchema: {
          type: 'object',
          properties: {
            prompt_id: { type: 'string', description: '提示词ID' },
            version: { type: 'number', description: '提示词版本' }
          },
          required: ['prompt_id']
        }
      },
      {
        name: 'generate_performance_report',
        description: '生成提示词性能报告',
        inputSchema: {
          type: 'object',
          properties: {
            prompt_id: { type: 'string', description: '提示词ID' }
          },
          required: ['prompt_id']
        }
      },
      {
        name: 'create_ab_test',
        description: '创建A/B测试',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '测试名称' },
            description: { type: 'string', description: '测试描述' },
            prompt_a: { type: 'string', description: '提示词A的ID' },
            prompt_b: { type: 'string', description: '提示词B的ID' },
            version_a: { type: 'number', description: '提示词A的版本' },
            version_b: { type: 'number', description: '提示词B的版本' },
            traffic_split: { type: 'number', description: '流量分配比例（0-1）' }
          },
          required: ['name', 'prompt_a', 'prompt_b']
        }
      },
      {
        name: 'get_ab_test_results',
        description: '获取A/B测试结果',
        inputSchema: {
          type: 'object',
          properties: {
            test_id: { type: 'string', description: '测试ID' }
          },
          required: ['test_id']
        }
      }
    ];

    console.log(`[PromptHub MCP] 加载了 ${this.tools.length} 个预定义工具`);
  }

  /**
   * 处理工具调用
   */
  async handleToolCall(name, parameters) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 使用REST API调用工具
      const response = await this.makeHttpRequest(`/tools/${name}/invoke`, 'POST', parameters);
      
      // 🎯 优化输出格式：优先使用格式化的对话式文本
      let displayText;
      
      // 1. 首先尝试使用专门的对话式格式化文本
      if (response.data?.conversation_display) {
        displayText = response.data.conversation_display;
      }
      // 2. 其次尝试使用现有的文本内容
      else if (response.content?.text) {
        displayText = response.content.text;
      }
      // 3. 如果是搜索结果且有数据，尝试格式化显示
      else if (response.success && response.data?.results && Array.isArray(response.data.results)) {
        displayText = this.formatSearchResults(response);
      }
      // 4. 最后回退到JSON格式
      else {
        displayText = JSON.stringify(response, null, 2);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: displayText
          }
        ]
      };
    } catch (error) {
      console.error(`[PromptHub MCP] 工具调用失败 (${name}):`, error.message);
      throw error;
    }
  }

  /**
   * 🎨 格式化搜索结果为对话式文本
   * 确保用户能够看到完整的提示词内容，而不只是元数据
   */
  formatSearchResults(response) {
    const { results = [], query = '', search_metadata = {} } = response.data || {};
    
    if (results.length === 0) {
      return `😔 抱歉，没有找到与"${query}"相关的提示词。

🔍 建议：
• 尝试使用更简单的关键词
• 检查是否有拼写错误
• 或者浏览我们的分类目录`;
    }

    let output = `🎯 为您找到 ${results.length} 个与"${query}"相关的提示词：\n\n`;

    results.forEach((result, index) => {
      const emoji = this.getEmojiForCategory(result.category || '通用');
      
      // 🎯 核心：标题、描述、内容是必要的
      output += `**${index + 1}. ${emoji} ${result.name || '未命名提示词'}**\n`;
      
      if (result.description) {
        output += `📝 **描述：** ${result.description}\n`;
      }
      
      // 🚀 最重要：显示实际内容
      let content = this.extractPromptContent(result);
      if (content && content.trim()) {
        output += `📄 **内容：**\n\`\`\`\n${content}\n\`\`\`\n`;
      }
      
      // 相关度和匹配原因
      if (result.relevanceScore !== undefined || result.matchReason) {
        output += `🎯 相关度 ${result.relevanceScore || 'N/A'}%`;
        if (result.matchReason) {
          output += ` | ${result.matchReason}`;
        }
        output += '\n';
      }
      
      // 标签信息（可选）
      if (result.tags && result.tags.length > 0) {
        output += `🏷️ ${result.tags.slice(0, 3).join(' • ')}\n`;
      }
      
      if (index < results.length - 1) {
        output += '\n---\n\n';
      }
    });

    output += `\n\n💬 **使用说明：**\n`;
    output += `上述提示词按相关度排序，每个都包含了完整的内容预览。\n`;
    output += `您可以直接使用这些内容，或者说"我要第X个提示词"获取更多详细信息。\n\n`;
    
    // 添加搜索元数据信息
    if (search_metadata.unified_search) {
      const mode = search_metadata.unified_search.selected_mode;
      const modeNames = {
        'semantic': '智能语义搜索',
        'advanced': '高级搜索',
        'intelligent': '智能推荐',
        'basic': '基础搜索'
      };
      output += `🔧 **搜索模式：** ${modeNames[mode] || mode}\n`;
    }
    
    output += `🔄 **需要更多结果？** 尝试使用不同的搜索关键词或浏览相关分类。`;

    return output;
  }

  /**
   * 📄 从提示词对象中提取实际内容
   */
  extractPromptContent(prompt) {
    let content = '';
    
    // 1. 优先从preview字段获取（如果已经格式化过）
    if (prompt.preview && prompt.preview.trim() && prompt.preview !== '暂无内容预览') {
      return prompt.preview;
    }
    
    // 2. 尝试从messages字段提取
    if (prompt.messages) {
      try {
        if (Array.isArray(prompt.messages)) {
          // 查找包含实际提示词内容的消息
          const contentMsg = prompt.messages.find(msg => {
            if (typeof msg === 'object' && msg !== null && 'content' in msg) {
              const msgContent = msg.content;
              return typeof msgContent === 'string' && msgContent.trim().length > 20;
            }
            return false;
          });
          
          if (contentMsg) {
            content = contentMsg.content;
          } else if (prompt.messages.length > 0) {
            // 如果没找到content字段，尝试获取第一个非空消息
            const firstMsg = prompt.messages[0];
            if (typeof firstMsg === 'string') {
              content = firstMsg;
            } else if (typeof firstMsg === 'object' && firstMsg !== null) {
              // 尝试各种可能的字段名
              const msgObj = firstMsg;
              content = msgObj.content || msgObj.text || msgObj.prompt || msgObj.message || '';
            }
          }
        } else if (typeof prompt.messages === 'string') {
          content = prompt.messages;
        } else if (typeof prompt.messages === 'object' && prompt.messages !== null) {
          // 处理单个消息对象
          const msgObj = prompt.messages;
          content = msgObj.content || msgObj.text || msgObj.prompt || msgObj.message || '';
        }
      } catch (error) {
        console.warn('解析提示词消息内容失败:', error);
      }
    }
    
    // 3. 如果还是没有内容，使用description作为备选
    if (!content || content.trim().length < 20) {
      content = prompt.description || '';
    }
    
    // 4. 如果内容太长，智能截断（保持完整句子）
    content = content.trim();
    if (content.length > 500) {
      // 在句号、问号、感叹号处截断
      const sentences = content.match(/[^.!?]*[.!?]/g) || [];
      let truncated = '';
      
      for (const sentence of sentences) {
        if ((truncated + sentence).length <= 500) {
          truncated += sentence;
        } else {
          break;
        }
      }
      
      // 如果没有找到合适的句子边界，直接截断
      if (truncated.length < 200) {
        truncated = content.substring(0, 500);
        // 尝试在词边界截断
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 400) {
          truncated = truncated.substring(0, lastSpace);
        }
        truncated += '...';
      }
      
      content = truncated;
    }
    
    return content || '暂无内容预览';
  }

  /**
   * 🎨 获取分类对应的表情符号
   */
  getEmojiForCategory(category) {
    // 🎯 完整的20个系统预设分类emoji映射
    const emojiMap = {
      // 核心分类 (1-5)
      '通用': '📄',     // General - 文档图标，表示通用性
      '学术': '📚',     // Academic - 书籍图标，表示学术研究
      '职业': '💼',     // Professional - 公文包图标，表示职业发展
      '文案': '✍️',     // Copywriting - 写作图标，表示文案创作
      '设计': '🎨',     // Design - 调色板图标，表示设计创意
      
      // 创作分类 (6-10)
      '绘画': '🖌️',     // Drawing - 画笔图标，表示绘画艺术
      '教育': '🎓',     // Education - 学士帽图标，表示教育培训
      '情感': '💝',     // Emotional - 心形礼物图标，表示情感表达
      '娱乐': '🎭',     // Entertainment - 戏剧面具图标，表示娱乐内容
      '游戏': '🎮',     // Gaming - 游戏手柄图标，表示游戏相关
      
      // 生活分类 (11-15)
      '生活': '🏠',     // Lifestyle - 房屋图标，表示日常生活
      '商业': '💰',     // Business - 金钱图标，表示商业活动
      '办公': '🗂️',     // Office - 文件夹图标，表示办公工作
      '编程': '💻',     // Programming - 电脑图标，表示编程开发
      '翻译': '🌐',     // Translation - 地球图标，表示语言翻译
      
      // 媒体分类 (16-20)
      '视频': '📹',     // Video - 摄像机图标，表示视频制作
      '播客': '🎙️',     // Podcast - 麦克风图标，表示播客录制
      '音乐': '🎵',     // Music - 音符图标，表示音乐创作
      '健康': '💊',     // Health - 药丸图标，表示健康医疗
      '科技': '🔬'      // Technology - 显微镜图标，表示科技创新
    };
    
    return emojiMap[category] || '📄';
  }

  /**
   * 发送HTTP请求
   */
  async makeHttpRequest(endpoint, method = 'GET', data = null) {
    const url = new URL(endpoint, this.serverUrl);
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PromptHub-MCP-Adapter/1.6.0'
      }
    };

    // 添加认证
    if (this.apiKey) {
      options.headers['X-Api-Key'] = this.apiKey;
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(`HTTP ${response.status}: ${errorData.error || errorData.message || errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`网络连接失败: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 获取可用工具列表
   */
  getAvailableTools() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }
}

/**
 * 处理MCP消息
 */
async function handleMessage(message) {
  try {
    const request = JSON.parse(message);
    
    // 处理不同的MCP消息类型
    switch (request.method) {
      case 'initialize':
        // 如果适配器还未初始化，现在初始化
        if (!adapter.initialized) {
          await adapter.initialize();
        }
        
        return JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {
                listChanged: false
              }
            },
            serverInfo: {
              name: 'prompthub-mcp-adapter',
              version: '1.3.0'
            }
          }
        });

      case 'tools/list':
        // 确保工具列表是最新的
        if (!adapter.initialized) {
          await adapter.initialize();
        }
        
        const tools = adapter.getAvailableTools();
        return JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: tools
          }
        });

      case 'tools/call':
        const { name, arguments: args } = request.params;
        const result = await adapter.handleToolCall(name, args);
        return JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: result
        });

      default:
        return JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `未知方法: ${request.method}`
          }
        });
    }
  } catch (error) {
    console.error('[PromptHub MCP] 消息处理错误:', error);
    return JSON.stringify({
      jsonrpc: '2.0',
      id: request?.id || null,
      error: {
        code: -32603,
        message: error.message || '内部错误'
      }
    });
  }
}

/**
 * 主函数
 */
async function main() {
  // 创建适配器实例
  global.adapter = new PromptHubMCPAdapter();
  
  // 尝试初始化（如果失败，会在后续MCP消息中重试）
  try {
    await adapter.initialize();
  } catch (error) {
    console.error('[PromptHub MCP] 预初始化失败，将在MCP消息中重试');
  }

  console.log('[PromptHub MCP] 初始化完成，等待MCP协议消息...');

  // 处理标准输入的MCP消息
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (data) => {
    const lines = data.toString().trim().split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = await handleMessage(line.trim());
          console.log(response);
        } catch (error) {
          console.error('[PromptHub MCP] 处理消息失败:', error);
          const errorResponse = JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32603,
              message: error.message || '内部错误'
            }
          });
          console.log(errorResponse);
        }
      }
    }
  });

  // 优雅关闭处理
  process.on('SIGINT', () => {
    console.log('[PromptHub MCP] 正在关闭...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('[PromptHub MCP] 正在关闭...');
    process.exit(0);
  });
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('[PromptHub MCP] 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[PromptHub MCP] 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 如果直接运行此文件，启动主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PromptHubMCPAdapter, handleMessage };