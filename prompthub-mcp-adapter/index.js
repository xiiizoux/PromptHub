#!/usr/bin/env node

/**
 * PromptHub MCP Adapter
 * Adapter connecting AI clients (Cursor, Claude Desktop) to PromptHub MCP server
 * 
 * Usage:
 * 1. Add to AI client configuration:
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
 * 2. Restart AI client to use 24 PromptHub tools
 */

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ PromptHub MCP adapter requires Node.js 18+');
  console.error(`   Current version: ${nodeVersion}`);
  console.error('   Please upgrade Node.js version');
  process.exit(1);
}

// Dynamically import fetch (built-in for Node.js 18+)
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  try {
    // For older Node.js versions, try using node-fetch
    fetch = require('node-fetch');
  } catch (e) {
    console.error('❌ Unable to load fetch, please upgrade to Node.js 18+');
    process.exit(1);
  }
} else {
  fetch = globalThis.fetch;
}

/**
 * PromptHub MCP Adapter class
 * Communicates with PromptHub server using REST API
 */
class PromptHubMCPAdapter {
  constructor() {
    this.serverUrl = process.env.MCP_SERVER_URL || 'https://mcp.prompt-hub.cc';
    this.apiKey = process.env.API_KEY || '';
    this.initialized = false;
    this.tools = [];
    this.nextId = 1;
    
    console.log('[PromptHub MCP] Initializing...');
    console.log(`[PromptHub MCP] Server: ${this.serverUrl}`);
    console.log(`[PromptHub MCP] API Key: ${this.apiKey ? 'Set' : 'Not set'}`);
  }

  /**
   * Initialize adapter
   */
  async initialize() {
    try {
      // 1. Check server health status
      await this.checkServerHealth();
      
      // 2. Load tool list (using predefined list due to GET /tools authentication issues)
      this.loadPredefinedTools();
      
      this.initialized = true;
      console.log(`[PromptHub MCP] Initialization complete, loaded ${this.tools.length} tools`);
      
    } catch (error) {
      console.error('[PromptHub MCP] Initialization failed:', error.message);
      // Still mark as initialized, use predefined tool list
      this.loadPredefinedTools();
      this.initialized = true;
    }
  }

  /**
   * Check server health status
   */
  async checkServerHealth() {
    try {
      const response = await this.makeHttpRequest('/api/health', 'GET');
      if (response.status === 'healthy') {
        console.log('[PromptHub MCP] Server connection OK (status: healthy)');
        return true;
      } else {
        throw new Error(`Server health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[PromptHub MCP] Server health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Load predefined tool list
   * Using predefined list due to GET /tools endpoint authentication issues
   */
  loadPredefinedTools() {
    this.tools = [
      // ============= 🚀 Unified Search Tool (Only recommended search entry) =============
      {
        name: 'unified_search',
        description: '🚀 Unified Search - Semantic understanding, intelligent prompt search, perfect result display (⭐⭐⭐⭐⭐ Only recommended)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query, supports natural language description, e.g.: "write business email", "analyze code issues", "creative copywriting", etc.' },
            category: { type: 'string', description: 'Category filter (optional)' },
            category_type: { type: 'string', enum: ['chat', 'image', 'video'], description: 'Filter by category type: chat(dialogue) | image(image) | video(video)' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tag filter (optional)' },
            max_results: { type: 'number', description: 'Maximum number of results, default 5, max 20' },
            include_content: { type: 'boolean', description: 'Whether to include full content preview, default true' },
            sort_by: { type: 'string', description: 'Sort method: relevance(relevance) | name(name) | created_at(created time) | updated_at(updated time), default relevance' }
          },
          required: ['query']
        }
      },
      
      {
        name: 'unified_store',
        description: '🤖 Intelligent Storage - AI analyzes prompt content, auto-completes parameters and saves to database (⭐⭐⭐⭐⭐ Ultimate recommendation)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Prompt content to save' },
            instruction: { type: 'string', description: 'User storage instruction, e.g. "save this prompt with xxx title, store to education category" and other natural language instructions' },
            title: { type: 'string', description: 'Prompt title (prioritized when user specified)' },
            category: { type: 'string', description: 'Category (prioritized when user specified)' },
            description: { type: 'string', description: 'Description (prioritized when user specified)' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tag list (prioritized when user specified)' },
            is_public: { type: 'boolean', description: 'Whether to make public, default true (prioritized when user specified)' },
            allow_collaboration: { type: 'boolean', description: 'Whether to allow collaborative editing, default true (prioritized when user specified)' },
            collaborative_level: { type: 'string', description: 'Collaboration level: creator_only(default)|invite_only|public_edit (prioritized when user specified)' },
            auto_analyze: { type: 'boolean', description: 'Whether to enable AI auto-analysis, default true' },
            // Media-related parameters
            preview_asset_url: { type: 'string', description: 'Preview asset URL (required for image or video prompts)' },
            category_type: { type: 'string', enum: ['chat', 'image', 'video'], description: 'Category type: chat(dialogue) | image(image) | video(video)' }
          },
          required: ['content']
        }
      },
      
      // ============= 🎯 Prompt Optimization Tool =============
      {
        name: 'prompt_optimizer',
        description: '🎯 Prompt Optimizer - Provides structured prompt optimization guidance and analysis for third-party AI clients (⚠️ Only analyzes and optimizes, does not auto-save, requires explicit save instruction to call unified_store for saving)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Prompt content to optimize' },
            optimization_type: { 
              type: 'string', 
              description: 'Optimization type: general(general) | creative(creative) | technical(technical) | business(business) | educational(educational) | drawing(drawing) | analysis(analysis) | iteration(iteration)',
              enum: ['general', 'creative', 'technical', 'business', 'educational', 'drawing', 'analysis', 'iteration']
            },
            requirements: { type: 'string', description: 'Special requirements or constraints' },
            context: { type: 'string', description: 'Usage scenario and context' },
            complexity: { 
              type: 'string', 
              description: 'Complexity level: simple(simple) | medium(medium) | complex(complex)',
              enum: ['simple', 'medium', 'complex']
            },
            include_analysis: { type: 'boolean', description: 'Whether to include detailed analysis, default true' },
            language: { 
              type: 'string', 
              description: 'Output language: zh(Chinese) | en(English)',
              enum: ['zh', 'en']
            },
            // Parameters specific to iterative optimization
            original_prompt: { type: 'string', description: 'Original prompt (for iterative optimization)' },
            current_prompt: { type: 'string', description: 'Current prompt (for iterative optimization)' },
            iteration_type: { type: 'string', description: 'Iteration type (for iterative optimization)' }
          },
          required: ['content']
        }
      },




      // ============= Core Prompt Management Tools =============
      {
        name: 'get_categories',
        description: 'Get all prompt categories',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_tags',
        description: 'Get all prompt tags',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_prompt_names',
        description: 'Get all available prompt names',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by category' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            page: { type: 'number', description: 'Page number' },
            pageSize: { type: 'number', description: 'Items per page' }
          },
          required: []
        }
      },
      {
        name: 'get_prompt_details',
        description: 'Get detailed information of a specific prompt',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Prompt name' }
          },
          required: ['name']
        }
      },
      {
        name: 'create_prompt',
        description: 'Create a new prompt',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Prompt name' },
            description: { type: 'string', description: 'Prompt description' },
            category: { type: 'string', description: 'Prompt category' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Prompt tags' },
            content: { type: 'string', description: 'Prompt content' }
          },
          required: ['name', 'description', 'content']
        }
      },
      {
        name: 'update_prompt',
        description: 'Update existing prompt',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Prompt name' },
            description: { type: 'string', description: 'Prompt description' },
            category: { type: 'string', description: 'Prompt category' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Prompt tags' },
            content: { type: 'string', description: 'Prompt content' },
            is_public: { type: 'boolean', description: 'Whether to make public' },
            allow_collaboration: { type: 'boolean', description: 'Whether to allow collaborative editing' }
          },
          required: ['name']
        }
      },


      {
        name: 'get_prompt_template',
        description: 'Get prompt template',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },

      
      // ============= Intelligent AI Tools =============

      {
        name: 'intelligent_prompt_storage',
        description: 'Intelligent prompt storage',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Prompt content' },
            context: { type: 'string', description: 'Usage scenario' },
            auto_categorize: { type: 'boolean', description: 'Auto categorize' }
          },
          required: ['content']
        }
      },
      {
        name: 'analyze_prompt_with_external_ai',
        description: 'Analyze prompt quality using external AI',
        inputSchema: {
          type: 'object',
          properties: {
            prompt_content: { type: 'string', description: 'Prompt content' },
            analysis_type: { type: 'string', description: 'Analysis type' }
          },
          required: ['prompt_content']
        }
      },
      // ============= 📦 Other Storage Options (Recommended: unified_store) =============
      {
        name: 'quick_store',
        description: 'Quick store prompt (Recommended: unified_store)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Prompt content' },
            name: { type: 'string', description: 'Prompt name' },
            category: { type: 'string', description: 'Category' }
          },
          required: ['content']
        }
      },
      {
        name: 'smart_store',
        description: 'Smart store prompt (Recommended: unified_store)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Prompt content' },
            auto_optimize: { type: 'boolean', description: 'Auto optimize' },
            suggest_tags: { type: 'boolean', description: 'Suggest tags' }
          },
          required: ['content']
        }
      },
      {
        name: 'analyze_and_store',
        description: 'Analyze and store prompt (Recommended: unified_store)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Prompt content' },
            analyze_quality: { type: 'boolean', description: 'Analyze quality' },
            suggest_improvements: { type: 'boolean', description: 'Suggest improvements' }
          },
          required: ['content']
        }
      },

      // Version control tools
      {
        name: 'get_prompt_versions',
        description: 'Get prompt version history',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Prompt name' }
          },
          required: ['name']
        }
      },
      {
        name: 'get_prompt_version',
        description: 'Get specific version of a prompt',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Prompt name' },
            version: { type: 'number', description: 'Version number' }
          },
          required: ['name', 'version']
        }
      },
      {
        name: 'restore_prompt_version',
        description: 'Restore prompt to specific version',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Prompt name' },
            version: { type: 'number', description: 'Version number' }
          },
          required: ['name', 'version']
        }
      },
      // Import/Export tools
      {
        name: 'export_prompts',
        description: 'Export prompts',
        inputSchema: {
          type: 'object',
          properties: {
            ids: { type: 'array', items: { type: 'string' }, description: 'List of prompt IDs to export' }
          },
          required: []
        }
      },
      {
        name: 'import_prompts',
        description: 'Import prompts',
        inputSchema: {
          type: 'object',
          properties: {
            prompts: { type: 'array', description: 'Array of prompts to import' }
          },
          required: ['prompts']
        }
      },
      
      // File upload tool (supports image and video assets)
      {
        name: 'upload_asset',
        description: 'Upload example asset file (image or video) for image/video prompts',
        inputSchema: {
          type: 'object',
          properties: {
            file_data: { type: 'string', description: 'Base64 encoded file data' },
            filename: { type: 'string', description: 'Filename with extension' },
            category_type: { type: 'string', enum: ['image', 'video'], description: 'Asset type: image(image) | video(video)' },
            description: { type: 'string', description: 'Asset description (optional)' }
          },
          required: ['file_data', 'filename', 'category_type']
        }
      },

      // ============= 🧠 Context Engineering Tools =============
      {
        name: 'context_engineering',
        description: '🧠 Context Engineering intelligent context processing - Dynamically adjust prompt content based on user input (⚠️ Only for prompt creators)',
        inputSchema: {
          type: 'object',
          properties: {
            promptId: { type: 'string', description: 'Prompt ID or name' },
            input: { type: 'string', description: 'User input content' },
            sessionId: { type: 'string', description: 'Session ID (optional, for maintaining context state)' },
            pipeline: { type: 'string', enum: ['default', 'fast', 'deep'], description: 'Processing pipeline type: default(standard) | fast(fast) | deep(deep analysis)' },
            requiredContext: { type: 'array', items: { type: 'string' }, description: 'List of required context types (optional)' },
            preferences: { type: 'object', description: 'User preference settings (optional)' }
          },
          required: ['promptId', 'input']
        }
      },
      {
        name: 'context_state',
        description: '📊 Context Engineering state query - Get user context state and session information (⚠️ Only for prompt creators)',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID (optional)' },
            includeHistory: { type: 'boolean', description: 'Whether to include history, default false' },
            historyLimit: { type: 'number', description: 'History record limit (default 10)' }
          },
          required: []
        }
      },
      {
        name: 'context_config',
        description: '⚙️ Context Engineering configuration management - Manage user preferences, adaptation rules and experiment settings (⚠️ Only for prompt creators)',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['get', 'set', 'update', 'delete', 'list'], description: 'Action type' },
            configType: { type: 'string', enum: ['preferences', 'adaptationRules', 'experiments'], description: 'Configuration type' },
            configData: { type: 'object', description: 'Configuration data (required for set/update operations)' },
            configId: { type: 'string', description: 'Configuration ID (required for update/delete operations)' }
          },
          required: ['action', 'configType']
        }
      },
      {
        name: 'context_pipeline',
        description: '🔧 Context Engineering pipeline management - Configure and manage processing pipelines (⚠️ Only for prompt creators)',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['list', 'get', 'register', 'update', 'delete'], description: 'Action type' },
            pipelineName: { type: 'string', description: 'Pipeline name' },
            pipelineConfig: { type: 'object', description: 'Pipeline configuration (required for register/update operations)' }
          },
          required: ['action']
        }
      },

    ];

    console.log(`[PromptHub MCP] Loaded ${this.tools.length} predefined tools`);
  }

  /**
   * Handle tool call
   */
  async handleToolCall(name, parameters) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let response;
      
      // Special handling for file upload tool
      if (name === 'upload_asset') {
        response = await this.handleAssetUpload(parameters);
      } else {
        // Use REST API to call tool
        response = await this.makeHttpRequest(`/tools/${name}/invoke`, 'POST', parameters);
      }
      
      // 🎯 Fix response parsing logic - prioritize formatted text
      let displayText;

      // 1. Prioritize response.content.text (usually already formatted conversational text)
      if (response.content?.text) {
        // 🐛 Critical fix: Don't try to parse already formatted text as JSON
        // MCP server's unified_search already returns fully formatted text including prompt content
        displayText = response.content.text;

        // 🔧 Special handling: Ensure search and optimization tool content can be fully displayed
        if ((name === 'unified_search' || name === 'mcp_optimization') && displayText) {
          // No longer need to handle code block symbols, as server has removed them
          // Just ensure content is fully displayed
          console.log(`[PromptHub MCP] ${name} tool response optimized, content length: ${displayText.length}`);
        }
      }
      // 2. Check for dedicated conversational formatted text
      else if (response.data?.conversation_display) {
        displayText = response.data.conversation_display;
      }
      // 3. Direct search result format (needs formatting)
      else if (response.data?.results && Array.isArray(response.data.results)) {
        displayText = this.formatSearchResults({
          data: response.data,
          query: parameters.query || ''
        });
      }
      // 4. Fallback to JSON format
      else {
        displayText = JSON.stringify(response, null, 2);
      }
      
      // Add simple anti-formatting instructions for search results
      if (name === 'unified_search') {
        displayText = `🚨 **Please display the following content completely, do not summarize** 🚨\n\n` + displayText;
        displayText += `\n\n🚨 **Above content should be fully displayed** 🚨`;
      }

      return {
        content: [
          {
            type: 'text',
            text: displayText
          }
        ],
        // Add basic metadata instructions
        _meta: {
          preserveFormatting: true,
          doNotReformat: true,
          displayInstructions: "Display content as provided"
        }
      };
    } catch (error) {
      console.error(`[PromptHub MCP] Tool call failed (${name}):`, error.message);
      throw error;
    }
  }

  /**
   * Handle asset file upload
   */
  async handleAssetUpload(parameters) {
    const { file_data, filename, category_type, description } = parameters;
    
    if (!file_data || !filename || !category_type) {
      throw new Error('Missing required parameters: file_data, filename, category_type');
    }
    
    try {
      // Convert Base64 data to Buffer
      const buffer = Buffer.from(file_data, 'base64');
      
      // Create FormData to support file upload
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
      
      // Send file upload request
      const url = new URL('/api/assets/upload', this.serverUrl);
      
      const options = {
        method: 'POST',
        headers: {
          'User-Agent': 'PromptHub-MCP-Adapter/2.5.0',
          ...form.getHeaders()
        },
        body: form
      };
      
      // Add authentication
      if (this.apiKey) {
        options.headers['X-Api-Key'] = this.apiKey;
      }
      
      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        data: result,
        content: {
          type: 'text',
          text: `✅ File upload successful!\n\n📁 **Filename:** ${filename}\n🔗 **Access URL:** ${result.url}\n📂 **File Type:** ${category_type}\n\nYou can now use this URL as the preview_asset_url parameter when creating ${category_type === 'image' ? 'image' : 'video'} prompts.`
        }
      };
    } catch (error) {
      console.error('[PromptHub MCP] File upload failed:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
  
  /**
   * Get MIME type based on filename
   */
  getMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      // Image formats
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      // Video formats
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
   * 🎨 Format search results as conversational text
   * Ensure users can see complete prompt content, not just metadata
   */
  formatSearchResults(response) {
    // Compatible with two data formats: direct response.data and parsed data
    const responseData = response.data || response;
    const { results = [], query = '', search_metadata = {} } = responseData;
    
    if (results.length === 0) {
      return `😔 Sorry, no prompts found related to "${query}".

🔍 Suggestions:
• Try using simpler keywords
• Check for spelling errors
• Or browse our category directory`;
    }

    // Add clear instructions at the beginning of response, requiring AI client not to reformat
    let output = `⚠️ **Important: Please strictly follow the format below, do not reformat or summarize content!**\n\n`;
    output += `🎯 Found ${results.length} prompts related to "${query}":\n\n`;

    results.forEach((result, index) => {
      const emoji = this.getEmojiForCategory(result.category || 'General');
      
      // 🎯 Core: Title, description, content are necessary
      output += `**${index + 1}. ${emoji} ${result.name || 'Unnamed Prompt'}**\n`;
      
      if (result.description) {
        output += `📝 **Description:** ${result.description}\n`;
      }
      
      // Handle preview asset URL display
      if (result.preview_asset_url) {
        if (result.category_type === 'image') {
          output += `🖼️ **Example Image:** ![${result.name} - Example Image](${result.preview_asset_url})\n\n`;
        } else if (result.category_type === 'video') {
          output += `📺 **Example Video:** [Click to watch video](${result.preview_asset_url})\n\n`;
        }
      }
      
      // 🚀 Most important: Display actual content - Add forced instructions to prevent reformatting
      let content = this.extractPromptContent(result);
      if (content && content.trim()) {
        output += `📄 **Prompt Content:**\n\n`;
        output += `🚨 **Please display the following content completely, do not omit, summarize or reformat!** 🚨\n\n`;
        output += `⬇️ Below is the complete prompt content, ready to copy and use ⬇️\n\n`;
        output += `═══════════════════════════════════════\n`;
        output += `${content}\n`;
        output += `═══════════════════════════════════════\n\n`;
        output += `🔺 **Above is complete content, please ensure all is displayed to user!** 🔺\n\n`;
      }
      
      // Relevance score and match reason
      if (result.relevanceScore !== undefined || result.matchReason) {
        output += `🎯 Relevance ${result.relevanceScore || 'N/A'}%`;
        if (result.matchReason) {
          output += ` | ${result.matchReason}`;
        }
        output += '\n';
      }
      
      // Tag information (optional)
      if (result.tags && result.tags.length > 0) {
        output += `🏷️ ${result.tags.slice(0, 3).join(' • ')}\n`;
      }
      
      if (index < results.length - 1) {
        output += '\n---\n\n';
      }
    });

    output += `\n\n💬 **Usage Instructions:**\n`;
    output += `The above prompts are sorted by relevance, each includes complete content preview.\n`;
    output += `You can directly copy and use these contents, or adjust as needed.\n\n`;

    // Add search metadata information
    if (search_metadata.unified_search) {
      const mode = search_metadata.unified_search.selected_mode;
      const modeNames = {
        'semantic': 'Intelligent Semantic Search',
        'advanced': 'Advanced Search',
        'intelligent': 'Intelligent Recommendation',
        'basic': 'Basic Search'
      };
      output += `🔧 **Search Mode:** ${modeNames[mode] || mode}\n`;
    }

    output += `🔄 **Need more precise results?** Try:\n`;
    output += `• Use more specific keywords\n`;
    output += `• Add category or tag filters\n`;
    output += `• Adjust search result count\n\n`;

    // Add forced instructions at the end
    output += `🚨 **Final reminder: All above prompt contents should be fully displayed, do not omit or reformat!** 🚨`;

    return output;
  }

  /**
   * 📄 Extract actual content from prompt object
   */
  extractPromptContent(prompt) {
    // Use content field
    if (prompt.content && prompt.content.trim()) {
      return prompt.content;
    }

    // Prioritize getting from preview field (if already formatted)
    if (prompt.preview && prompt.preview.trim() && prompt.preview !== 'No content preview available') {
      return prompt.preview;
    }

    // If still no content, use description as fallback
    const content = prompt.description || '';

    return content;
    
    // 4. Clean possible role prefixes (avoid AI client displaying "User:" or "System:")
    // content = content.trim();

    // Remove common role prefixes
    // const rolePrefixes = [
    //   /^用户:\s*/,
    //   /^系统:\s*/,
    //   /^User:\s*/i,
    //   /^System:\s*/i,
    //   /^Assistant:\s*/i,
    //   /^助手:\s*/
    // ];

    // for (const prefix of rolePrefixes) {
    //   content = content.replace(prefix, '');
    // }

    // 5. If content is too long, intelligently truncate (maintain complete sentences)
    // if (content.length > 500) {
    //   // Truncate at periods, question marks, exclamation marks
    //   const sentences = content.match(/[^.!?]*[.!?]/g) || [];
    //   let truncated = '';

    //   for (const sentence of sentences) {
    //     if ((truncated + sentence).length <= 500) {
    //       truncated += sentence;
    //     } else {
    //       break;
    //     }
    //   }
      
    //   // If no suitable sentence boundary found, truncate directly
    //   if (truncated.length < 200) {
    //     truncated = content.substring(0, 500);
    //     // Try truncating at word boundary
    //     const lastSpace = truncated.lastIndexOf(' ');
    //     if (lastSpace > 400) {
    //       truncated = truncated.substring(0, lastSpace);
    //     }
    //     truncated += '...';
    //   }
      
    //   content = truncated;
    // }
    
    // return content || 'No content preview available';
  }

  /**
   * 🎨 Get emoji corresponding to category - dynamically generated
   */
  getEmojiForCategory(category) {
    // Intelligently match emoji based on category name keywords
    const keywordEmojiRules = [
      // Dialogue/Communication
      { keywords: ['对话', '交流', '聊天', '沟通', 'dialogue', 'chat', 'communication'], emoji: '💬' },

      // Academic/Research
      { keywords: ['学术', '研究', '论文', '科研', 'academic', 'research', 'paper'], emoji: '🎓' },

      // Programming/Development
      { keywords: ['编程', '开发', '代码', '程序', 'programming', 'development', 'code'], emoji: '💻' },

      // Writing/Copywriting
      { keywords: ['文案', '写作', '创作', '文字', 'writing', 'copywriting', 'creative'], emoji: '✍️' },

      // Translation/Language
      { keywords: ['翻译', '语言', '多语言', 'translation', 'language', 'multilingual'], emoji: '🌐' },

      // Design/Art
      { keywords: ['设计', '艺术', '绘画', '美术', 'design', 'art', 'painting'], emoji: '🎨' },

      // Photography/Image
      { keywords: ['摄影', '拍摄', '照片', 'photography', 'photo', 'image'], emoji: '📷' },

      // Video Production
      { keywords: ['视频', '影像', '动画', 'video', 'animation'], emoji: '📹' },

      // Business/Finance
      { keywords: ['商业', '金融', '投资', '财务', 'business', 'finance', 'investment'], emoji: '💰' },

      // Education/Learning
      { keywords: ['教育', '学习', '培训', 'education', 'learning', 'training'], emoji: '📚' },

      // Health/Medical
      { keywords: ['健康', '医疗', '养生', 'health', 'medical', 'wellness'], emoji: '💊' },

      // Technology/Innovation
      { keywords: ['科技', '技术', '创新', 'technology', 'tech', 'innovation'], emoji: '🔬' },

      // Music/Audio
      { keywords: ['音乐', '音频', '播客', 'music', 'audio', 'podcast'], emoji: '🎵' },

      // Gaming/Entertainment
      { keywords: ['游戏', '娱乐', '趣味', 'gaming', 'game', 'entertainment'], emoji: '🎮' },

      // Daily Life
      { keywords: ['生活', '日常', '家庭', 'life', 'daily', 'family'], emoji: '🏠' },
    ];

    // Find matching rule
    for (const rule of keywordEmojiRules) {
      if (rule.keywords.some(keyword => category.toLowerCase().includes(keyword.toLowerCase()))) {
        return rule.emoji;
      }
    }

    // Default icon
    return '📄';
  }

  /**
   * Send HTTP request
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

    // Add authentication
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
        console.error(`[PromptHub MCP] HTTP error details - Status: ${response.status}, Response text:`, errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        console.error(`[PromptHub MCP] Parsed error data:`, errorData);

        // Better error message formatting
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
        throw new Error(`Network connection failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get available tool list
   */
  getAvailableTools() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }
}

// Global adapter instance
let adapter = null;

/**
 * Handle MCP messages
 */
async function handleMessage(message) {
  let request = null;
  try {
    request = JSON.parse(message);

    // Ensure adapter instance exists
    if (!adapter) {
      adapter = new PromptHubMCPAdapter();
    }

    // Handle different MCP message types
    switch (request.method) {
      case 'initialize':
        // If adapter not yet initialized, initialize now
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
        // Ensure tool list is up to date
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
            message: `Unknown method: ${request.method}`
          }
        });
    }
  } catch (error) {
    console.error('[PromptHub MCP] Message handling error:', error);
    return JSON.stringify({
      jsonrpc: '2.0',
      id: request?.id || null,
      error: {
        code: -32603,
        message: error.message || 'Internal error'
      }
    });
  }
}

/**
 * Main function
 */
async function main() {
  // Create adapter instance
  adapter = new PromptHubMCPAdapter();
  
  // Try to initialize (if fails, will retry in subsequent MCP messages)
  try {
    await adapter.initialize();
  } catch (error) {
    console.error('[PromptHub MCP] Pre-initialization failed, will retry in MCP messages');
  }

  console.log('[PromptHub MCP] Initialization complete, waiting for MCP protocol messages...');

  // Handle MCP messages from standard input
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (data) => {
    const lines = data.toString().trim().split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = await handleMessage(line.trim());
          console.log(response);
        } catch (error) {
          console.error('[PromptHub MCP] Message processing failed:', error);
          const errorResponse = JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32603,
              message: error.message || 'Internal error'
            }
          });
          console.log(errorResponse);
        }
      }
    }
  });

  // Graceful shutdown handling
  process.on('SIGINT', () => {
    console.log('[PromptHub MCP] Shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('[PromptHub MCP] Shutting down...');
    process.exit(0);
  });
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('[PromptHub MCP] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[PromptHub MCP] Unhandled promise rejection:', reason);
  process.exit(1);
});

// If this file is run directly, start main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PromptHubMCPAdapter, handleMessage };