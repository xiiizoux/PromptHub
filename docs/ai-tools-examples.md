# AI工具集成示例

本文档提供了将MCP Prompt Server与各种流行AI工具集成的具体示例，帮助您实现提示词搜索和保存功能。

## 1. 与ChatGPT插件集成

如果您使用ChatGPT并希望添加提示词管理功能，可以创建一个自定义ChatGPT插件。

### 插件清单示例 (manifest.json)

```json
{
  "schema_version": "v1",
  "name_for_human": "提示词管理器",
  "name_for_model": "prompt_manager",
  "description_for_human": "管理和使用提示词库，可以搜索、保存和获取提示词。",
  "description_for_model": "This plugin helps users manage their prompt library. It can search, save, and retrieve prompts from a MCP Prompt Server.",
  "auth": {
    "type": "user_http",
    "authorization_type": "bearer"
  },
  "api": {
    "type": "openapi",
    "url": "http://localhost:9010/openapi.yaml"
  },
  "logo_url": "http://localhost:9010/logo.png",
  "contact_email": "support@example.com",
  "legal_info_url": "http://example.com/legal"
}
```

### 使用方式

用户可以直接在ChatGPT中使用自然语言来操作提示词：

```
用户: 搜索关于文案写作的提示词
ChatGPT: 我将为您搜索文案写作相关的提示词...

[调用插件API搜索]

我找到了以下相关提示词:
1. copywriting_expert - 专业文案写作指南
2. ad_copy_template - 广告文案模板
3. sales_pitch - 销售推广文案

您想使用哪一个提示词？请提供序号。

用户: 使用第2个
ChatGPT: [获取并插入提示词内容]

以下是广告文案模板提示词:
作为一名资深广告文案专家，请帮我为[产品]创作一份吸引人的广告文案。文案应包含以下要素：
...
```

## 2. 与Claude集成

Claude AI通过API支持JavaScript代码执行，可以直接调用MCP Prompt Client。

### 集成代码示例

将以下代码片段提供给Claude：

```javascript
// 提示词管理功能
const API_URL = 'http://localhost:9010/api';
const API_KEY = 'your-api-key';

// 搜索提示词
async function searchPrompts(query) {
  const response = await fetch(`${API_URL}/prompts/search/${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: { 'x-api-key': API_KEY }
  });
  
  return response.json();
}

// 获取提示词
async function getPrompt(name) {
  const response = await fetch(`${API_URL}/prompts/${encodeURIComponent(name)}`, {
    method: 'GET',
    headers: { 'x-api-key': API_KEY }
  });
  
  return response.json();
}

// 保存提示词
async function savePrompt(promptData) {
  const response = await fetch(`${API_URL}/prompts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': API_KEY 
    },
    body: JSON.stringify(promptData)
  });
  
  return response.json();
}

// 示例用法
async function handleUserCommand(command) {
  if (command.startsWith('搜索提示词:')) {
    const query = command.substring('搜索提示词:'.length).trim();
    const result = await searchPrompts(query);
    return formatSearchResults(result);
  }
  else if (command.startsWith('获取提示词:')) {
    const name = command.substring('获取提示词:'.length).trim();
    const result = await getPrompt(name);
    return result.data.prompt.messages[0].content.text;
  }
  else if (command.startsWith('保存提示词:')) {
    // 解析格式: 保存提示词:名称:内容
    const parts = command.split(':');
    if (parts.length >= 3) {
      const name = parts[1].trim();
      const content = parts.slice(2).join(':').trim();
      
      const promptData = {
        name,
        description: `Prompt for ${name}`,
        category: 'General',
        tags: [],
        messages: [{
          role: 'system',
          content: { type: 'text', text: content }
        }]
      };
      
      const result = await savePrompt(promptData);
      return `提示词"${name}"已保存成功`;
    }
  }
  
  return null;
}

// 格式化搜索结果
function formatSearchResults(result) {
  if (!result.success || !result.data.prompts.length) {
    return '没有找到匹配的提示词';
  }
  
  let output = '找到以下提示词:\n\n';
  result.data.prompts.forEach((prompt, i) => {
    output += `${i+1}. ${prompt.name} - ${prompt.description}\n`;
    output += `   分类: ${prompt.category}, 标签: ${prompt.tags.join(', ')}\n\n`;
  });
  
  return output;
}
```

### 使用方式

在Claude对话中：

```
用户: 搜索提示词:写作
Claude: 让我为您搜索相关提示词...

[执行JavaScript代码]

找到以下提示词:

1. writing_assistant - 通用写作助手
2. blog_post_creator - 博客文章创作
3. technical_writer - 技术文档写作

您想使用哪个提示词？

用户: 获取提示词:blog_post_creator
Claude: [执行JavaScript代码获取提示词]

以下是blog_post_creator提示词内容:
...
```

## 3. 与Windsurf/Codeium集成

Windsurf/Codeium提供MCP协议支持，可以直接通过MCP配置文件连接到MCP Prompt Server。

### MCP配置示例

在`~/.codeium/windsurf/mcp_config.json`文件中添加以下配置：

```json
{
  "mcpServers": {
    "prompt-server": {
      "command": "node",
      "args": [
        "/path/to/mcp-prompt-server/dist/src/index.js"
      ],
      "env": {
        "PORT": "9010",
        "API_KEY": "your-api-key",
        "SERVER_KEY": "your-server-key",
        "STORAGE_TYPE": "file",
        "FORCE_LOCAL_STORAGE": "true"
      }
    }
  }
}
```

### 使用方式

在Windsurf/Codeium对话中：

```
用户: 搜索提示词 技术文档
AI: 正在搜索技术文档相关的提示词...

找到以下提示词:
1. technical_documentation - 技术文档写作指南
2. api_documentation - API文档模板
3. code_explanation - 代码解释器

您想使用哪个提示词？请输入序号。

用户: 1
AI: [获取并插入提示词内容]

技术文档写作指南:
...
```

## 4. 与自定义AI应用集成

如果您正在开发自己的AI应用，可以直接使用我们提供的客户端库。

### 安装

```bash
# 将客户端文件复制到您的项目中
cp /path/to/mcp-prompt-server/client/mcp-prompt-client.js /path/to/your-project/
```

### 使用示例

```javascript
// 导入客户端库
const { MCPPromptClient, PromptCommandParser, AIToolPromptHandler } = require('./mcp-prompt-client.js');

// 创建客户端实例
const client = new MCPPromptClient('http://localhost:9010', 'your-api-key');
const parser = new PromptCommandParser();

// 创建处理器
const promptHandler = new AIToolPromptHandler(client, parser, {
  onMessage: (message) => console.log(`AI: ${message}`),
  onError: (error) => console.error(`错误: ${error}`),
  onInsertPrompt: (text) => console.log(`插入提示词: ${text}`),
  onRequestInput: () => {
    // 实现获取用户输入的方法
    return prompt('请输入:');
  }
});

// 处理用户输入
async function handleUserMessage(message) {
  const isPromptCommand = await promptHandler.handleInput(message);
  
  if (!isPromptCommand) {
    // 不是提示词命令，交给常规AI处理
    console.log('处理常规AI请求...');
  }
}

// 示例用法
handleUserMessage('搜索提示词: 数据分析');
```

## 5. 与VSCode扩展集成

如果您正在开发VSCode扩展，可以轻松集成MCP Prompt Server。

### 扩展代码示例

```javascript
const vscode = require('vscode');
const fetch = require('node-fetch');

// 提示词客户端
class PromptClient {
  constructor() {
    this.config = vscode.workspace.getConfiguration('promptManager');
    this.serverUrl = this.config.get('serverUrl') || 'http://localhost:9010';
    this.apiKey = this.config.get('apiKey') || '';
  }
  
  async searchPrompts(query) {
    try {
      const response = await fetch(`${this.serverUrl}/api/prompts/search/${encodeURIComponent(query)}`, {
        headers: { 'x-api-key': this.apiKey }
      });
      
      return await response.json();
    } catch (error) {
      throw new Error(`搜索提示词失败: ${error.message}`);
    }
  }
  
  async getPrompt(name) {
    try {
      const response = await fetch(`${this.serverUrl}/api/prompts/${encodeURIComponent(name)}`, {
        headers: { 'x-api-key': this.apiKey }
      });
      
      return await response.json();
    } catch (error) {
      throw new Error(`获取提示词失败: ${error.message}`);
    }
  }
  
  // 其他方法...
}

// 激活扩展
function activate(context) {
  const client = new PromptClient();
  
  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand('promptManager.search', async () => {
      const query = await vscode.window.showInputBox({ prompt: '输入搜索关键词' });
      
      if (query) {
        try {
          const result = await client.searchPrompts(query);
          
          if (result.success && result.data.prompts.length > 0) {
            const items = result.data.prompts.map(p => ({ 
              label: p.name, 
              description: p.description,
              prompt: p
            }));
            
            const selected = await vscode.window.showQuickPick(items, { 
              placeHolder: '选择提示词' 
            });
            
            if (selected) {
              // 插入提示词内容到编辑器
              const editor = vscode.window.activeTextEditor;
              if (editor) {
                const content = selected.prompt.messages[0].content.text;
                editor.edit(editBuilder => {
                  editBuilder.insert(editor.selection.active, content);
                });
              }
            }
          } else {
            vscode.window.showInformationMessage('没有找到匹配的提示词');
          }
        } catch (error) {
          vscode.window.showErrorMessage(error.message);
        }
      }
    })
  );
}

module.exports = { activate };
```

### 使用方式

在VSCode中：

1. 使用命令面板 (Ctrl+Shift+P) 执行 "搜索提示词" 命令
2. 输入搜索关键词
3. 从搜索结果中选择提示词
4. 选中的提示词内容将被插入到当前编辑器光标位置

## 总结

通过以上示例，您可以根据自己使用的AI工具选择合适的集成方式，实现提示词的快速搜索和保存功能。无论您使用哪种工具，MCP Prompt Server都可以帮助您高效管理提示词库。
