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
 * 2. 重启AI客户端即可使用24个PromptHub工具
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
      // ============= 🚀 统一搜索工具 (唯一推荐的搜索入口) =============
      {
        name: 'unified_search',
        description: '🚀 统一搜索 - 语义理解，智能搜索提示词，完美结果展示 (⭐⭐⭐⭐⭐ 唯一推荐)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索查询，支持自然语言描述，例如："写商务邮件"、"分析代码问题"、"创意文案"等' },
            category: { type: 'string', description: '分类筛选（可选）' },
            category_type: { type: 'string', enum: ['chat', 'image', 'video'], description: '按分类类型筛选：chat(对话) | image(图像) | video(视频)' },
            tags: { type: 'array', items: { type: 'string' }, description: '标签筛选（可选）' },
            max_results: { type: 'number', description: '最大结果数，默认5个，最多20个' },
            include_content: { type: 'boolean', description: '是否包含完整内容预览，默认true' },
            sort_by: { type: 'string', description: '排序方式：relevance(相关性) | name(名称) | created_at(创建时间) | updated_at(更新时间)，默认relevance' }
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
            auto_analyze: { type: 'boolean', description: '是否启用AI自动分析，默认true' },
            // 媒体相关参数
            preview_asset_url: { type: 'string', description: '预览资源URL（图像或视频提示词必须提供）' },
            category_type: { type: 'string', enum: ['chat', 'image', 'video'], description: '分类类型：chat(对话) | image(图像) | video(视频)' }
          },
          required: ['content']
        }
      },
      
      // ============= 🎯 提示词优化工具 =============
      {
        name: 'prompt_optimizer',
        description: '🎯 提示词优化器 - 为第三方AI客户端提供结构化的提示词优化指导和分析（⚠️ 仅分析优化，不会自动保存，需明确的保存指令才能调用unified_store保存）',
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
            content: { type: 'string', description: '提示词内容' }
          },
          required: ['name', 'description', 'content']
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
            content: { type: 'string', description: '提示词内容' },
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

      
      // ============= 智能AI工具 =============

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
      
      // 文件上传工具（支持图像和视频资源）
      {
        name: 'upload_asset',
        description: '上传示例资源文件（图像或视频），用于图像/视频提示词',
        inputSchema: {
          type: 'object',
          properties: {
            file_data: { type: 'string', description: 'Base64编码的文件数据' },
            filename: { type: 'string', description: '文件名，包含扩展名' },
            category_type: { type: 'string', enum: ['image', 'video'], description: '资源类型：image(图像) | video(视频)' },
            description: { type: 'string', description: '资源描述（可选）' }
          },
          required: ['file_data', 'filename', 'category_type']
        }
      },

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
      let response;
      
      // 特殊处理文件上传工具
      if (name === 'upload_asset') {
        response = await this.handleAssetUpload(parameters);
      } else {
        // 使用REST API调用工具
        response = await this.makeHttpRequest(`/tools/${name}/invoke`, 'POST', parameters);
      }
      
      // 🎯 修复响应解析逻辑 - 优先使用已格式化的文本
      let displayText;

      // 1. 优先使用response.content.text（这通常是已经格式化好的对话式文本）
      if (response.content?.text) {
        // 🐛 关键修复：不要尝试解析已经格式化好的文本为JSON
        // MCP服务器的unified_search已经返回了完整格式化的文本，包含提示词内容
        displayText = response.content.text;

        // 🔧 特殊处理：确保搜索和优化工具的内容能够完整显示
        if ((name === 'unified_search' || name === 'mcp_optimization') && displayText) {
          // 不再需要处理代码块符号，因为服务端已经移除了这些符号
          // 只需要确保内容完整显示即可
          console.log(`[PromptHub MCP] ${name} 工具响应已优化，内容长度: ${displayText.length}`);
        }
      }
      // 2. 检查是否有专门的对话式格式化文本
      else if (response.data?.conversation_display) {
        displayText = response.data.conversation_display;
      }
      // 3. 直接的搜索结果格式（需要格式化）
      else if (response.data?.results && Array.isArray(response.data.results)) {
        displayText = this.formatSearchResults({
          data: response.data,
          query: parameters.query || ''
        });
      }
      // 4. 最后回退到JSON格式
      else {
        displayText = JSON.stringify(response, null, 2);
      }
      
      // 为搜索结果添加简单的防格式化指令
      if (name === 'unified_search') {
        displayText = `🚨 **请完整显示以下内容，不要总结** 🚨\n\n` + displayText;
        displayText += `\n\n🚨 **以上内容应完整显示** 🚨`;
      }

      return {
        content: [
          {
            type: 'text',
            text: displayText
          }
        ],
        // 添加基本的元数据指令
        _meta: {
          preserveFormatting: true,
          doNotReformat: true,
          displayInstructions: "Display content as provided"
        }
      };
    } catch (error) {
      console.error(`[PromptHub MCP] 工具调用失败 (${name}):`, error.message);
      throw error;
    }
  }

  /**
   * 处理资源文件上传
   */
  async handleAssetUpload(parameters) {
    const { file_data, filename, category_type, description } = parameters;
    
    if (!file_data || !filename || !category_type) {
      throw new Error('缺少必需参数：file_data, filename, category_type');
    }
    
    try {
      // 将Base64数据转换为Buffer
      const buffer = Buffer.from(file_data, 'base64');
      
      // 创建FormData以支持文件上传
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('file', buffer, {
        filename: filename,
        contentType: this.getMimeType(filename)
      });
      
      if (description) {
        form.append('description', description);
      }
      
      form.append('category_type', category_type);
      
      // 发送文件上传请求
      const url = new URL('/api/assets/upload', this.serverUrl);
      
      const options = {
        method: 'POST',
        headers: {
          'User-Agent': 'PromptHub-MCP-Adapter/2.5.0',
          ...form.getHeaders()
        },
        body: form
      };
      
      // 添加认证
      if (this.apiKey) {
        options.headers['X-Api-Key'] = this.apiKey;
      }
      
      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`文件上传失败 (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        data: result,
        content: {
          type: 'text',
          text: `✅ 文件上传成功！\n\n📁 **文件名：** ${filename}\n🔗 **访问链接：** ${result.url}\n📂 **文件类型：** ${category_type}\n\n您现在可以在创建${category_type === 'image' ? '图像' : '视频'}提示词时使用此URL作为preview_asset_url参数。`
        }
      };
    } catch (error) {
      console.error('[PromptHub MCP] 文件上传失败:', error);
      throw new Error(`文件上传失败: ${error.message}`);
    }
  }
  
  /**
   * 根据文件名获取MIME类型
   */
  getMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      // 图像格式
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      // 视频格式
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/avi',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 🎨 格式化搜索结果为对话式文本
   * 确保用户能够看到完整的提示词内容，而不只是元数据
   */
  formatSearchResults(response) {
    // 兼容两种数据格式：直接的response.data 和 解析后的数据
    const responseData = response.data || response;
    const { results = [], query = '', search_metadata = {} } = responseData;
    
    if (results.length === 0) {
      return `😔 抱歉，没有找到与"${query}"相关的提示词。

🔍 建议：
• 尝试使用更简单的关键词
• 检查是否有拼写错误
• 或者浏览我们的分类目录`;
    }

    // 在响应开头添加明确指令，要求AI客户端不要重新格式化
    let output = `⚠️ **重要提示：请严格按照以下格式显示，不要重新格式化或总结内容！**\n\n`;
    output += `🎯 为您找到 ${results.length} 个与"${query}"相关的提示词：\n\n`;

    results.forEach((result, index) => {
      const emoji = this.getEmojiForCategory(result.category || '通用');
      
      // 🎯 核心：标题、描述、内容是必要的
      output += `**${index + 1}. ${emoji} ${result.name || '未命名提示词'}**\n`;
      
      if (result.description) {
        output += `📝 **描述：** ${result.description}\n`;
      }
      
      // 处理预览资源URL显示
      if (result.preview_asset_url) {
        if (result.category_type === 'image') {
          output += `🖼️ **示例图片：** ![${result.name} - 示例图片](${result.preview_asset_url})\n\n`;
        } else if (result.category_type === 'video') {
          output += `📺 **示例视频：** [点击观看视频](${result.preview_asset_url})\n\n`;
        }
      }
      
      // 🚀 最重要：显示实际内容 - 添加强制指令防止重新格式化
      let content = this.extractPromptContent(result);
      if (content && content.trim()) {
        output += `📄 **提示词内容：**\n\n`;
        output += `🚨 **请完整显示以下内容，不要省略、总结或重新格式化！** 🚨\n\n`;
        output += `⬇️ 以下是完整的提示词内容，可直接复制使用 ⬇️\n\n`;
        output += `═══════════════════════════════════════\n`;
        output += `${content}\n`;
        output += `═══════════════════════════════════════\n\n`;
        output += `🔺 **以上是完整内容，请确保全部显示给用户！** 🔺\n\n`;
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
    output += `您可以直接复制使用这些内容，或者根据需要进行调整。\n\n`;

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

    output += `🔄 **需要更精确的结果？** 尝试：\n`;
    output += `• 使用更具体的关键词\n`;
    output += `• 添加分类或标签筛选\n`;
    output += `• 调整搜索结果数量\n\n`;

    // 在结尾添加强制指令
    output += `🚨 **最终提醒：以上所有提示词内容都应该完整显示，不要被省略或重新格式化！** 🚨`;

    return output;
  }

  /**
   * 📄 从提示词对象中提取实际内容
   */
  extractPromptContent(prompt) {
    // 使用content字段
    if (prompt.content && prompt.content.trim()) {
      return prompt.content;
    }

    // 优先从preview字段获取（如果已经格式化过）
    if (prompt.preview && prompt.preview.trim() && prompt.preview !== '暂无内容预览') {
      return prompt.preview;
    }

    // 如果还是没有内容，使用description作为备选
    const content = prompt.description || '';


    return content;
    
    // 4. 清理可能的角色前缀（避免AI客户端显示"用户:"或"系统:"）
    content = content.trim();

    // 移除常见的角色前缀
    const rolePrefixes = [
      /^用户:\s*/,
      /^系统:\s*/,
      /^User:\s*/i,
      /^System:\s*/i,
      /^Assistant:\s*/i,
      /^助手:\s*/
    ];

    for (const prefix of rolePrefixes) {
      content = content.replace(prefix, '');
    }

    // 5. 如果内容太长，智能截断（保持完整句子）
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
   * 🎨 获取分类对应的表情符号 - 动态生成
   */
  getEmojiForCategory(category) {
    // 基于分类名称关键词智能匹配emoji
    const keywordEmojiRules = [
      // 对话交流类
      { keywords: ['对话', '交流', '聊天', '沟通'], emoji: '💬' },

      // 学术研究类
      { keywords: ['学术', '研究', '论文', '科研'], emoji: '🎓' },

      // 编程开发类
      { keywords: ['编程', '开发', '代码', '程序'], emoji: '💻' },

      // 文案写作类
      { keywords: ['文案', '写作', '创作', '文字'], emoji: '✍️' },

      // 翻译语言类
      { keywords: ['翻译', '语言', '多语言'], emoji: '🌐' },

      // 设计艺术类
      { keywords: ['设计', '艺术', '绘画', '美术'], emoji: '🎨' },

      // 摄影图像类
      { keywords: ['摄影', '拍摄', '照片'], emoji: '📷' },

      // 视频制作类
      { keywords: ['视频', '影像', '动画'], emoji: '📹' },

      // 商业金融类
      { keywords: ['商业', '金融', '投资', '财务'], emoji: '💰' },

      // 教育学习类
      { keywords: ['教育', '学习', '培训'], emoji: '📚' },

      // 健康医疗类
      { keywords: ['健康', '医疗', '养生'], emoji: '💊' },

      // 科技创新类
      { keywords: ['科技', '技术', '创新'], emoji: '🔬' },

      // 音乐音频类
      { keywords: ['音乐', '音频', '播客'], emoji: '🎵' },

      // 游戏娱乐类
      { keywords: ['游戏', '娱乐', '趣味'], emoji: '🎮' },

      // 生活日常类
      { keywords: ['生活', '日常', '家庭'], emoji: '🏠' },
    ];

    // 查找匹配的规则
    for (const rule of keywordEmojiRules) {
      if (rule.keywords.some(keyword => category.includes(keyword))) {
        return rule.emoji;
      }
    }

    // 默认图标
    return '📄';
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
        'User-Agent': 'PromptHub-MCP-Adapter/2.5.0'
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
        console.error(`[PromptHub MCP] HTTP错误详情 - 状态: ${response.status}, 响应文本:`, errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        console.error(`[PromptHub MCP] 解析后的错误数据:`, errorData);

        // 更好的错误信息格式化
        let errorMessage;
        if (typeof errorData === 'object' && errorData !== null) {
          errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        } else {
          errorMessage = String(errorData);
        }

        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
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

// 全局适配器实例
let adapter = null;

/**
 * 处理MCP消息
 */
async function handleMessage(message) {
  let request = null;
  try {
    request = JSON.parse(message);

    // 确保适配器实例存在
    if (!adapter) {
      adapter = new PromptHubMCPAdapter();
    }

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
              version: '2.5.0'
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
  adapter = new PromptHubMCPAdapter();
  
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