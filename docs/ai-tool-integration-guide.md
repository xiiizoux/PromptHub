# MCP Prompt Server AI工具集成指南

本指南将帮助您将AI工具与MCP Prompt Server集成，实现提示词搜索和保存功能。

## 前提条件

1. MCP Prompt Server已启动并正常运行
2. 您的AI工具能够发送HTTP请求
3. 您了解AI工具的API或扩展机制

## 连接到MCP Prompt Server

### 方法1：通过MCP配置

如果您的AI工具支持MCP协议，可以使用以下配置连接到Prompt Server：

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
        "STORAGE_TYPE": "file",
        "FORCE_LOCAL_STORAGE": "true"
      }
    }
  }
}
```

### 方法2：通过HTTP API

如果您的AI工具不支持MCP协议，可以直接通过HTTP API进行集成。

#### 基础URL

```
http://localhost:9010/api
```

#### 身份验证

在请求头中添加API密钥：

```
x-api-key: your-api-key
```

## 实现提示词搜索功能

当用户输入"搜索提示词[关键词]"时，您的AI工具应该：

1. 提取关键词
2. 调用MCP Prompt Server的搜索API
3. 将结果展示给用户

### 示例代码（JavaScript）

```javascript
async function searchPrompts(query) {
  const response = await fetch(`http://localhost:9010/api/prompts/search/${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      'x-api-key': 'your-api-key'
    }
  });
  
  const data = await response.json();
  
  if (data.success && data.data.prompts.length > 0) {
    return data.data.prompts;
  } else {
    return [];
  }
}

// 当用户输入消息时调用
function handleUserMessage(message) {
  // 检查是否是搜索请求
  const searchMatch = message.match(/搜索提示词\s*[：:]\s*(.+)/i) || 
                      message.match(/搜索提示词\s+(.+)/i);
  
  if (searchMatch) {
    const query = searchMatch[1].trim();
    
    searchPrompts(query).then(prompts => {
      if (prompts.length > 0) {
        // 显示搜索结果
        displaySearchResults(prompts);
        
        // 提供插入选项
        promptUser("您想插入哪个提示词？请输入编号");
      } else {
        // 没有找到匹配的提示词
        displayMessage("没有找到匹配的提示词");
      }
    }).catch(error => {
      console.error("搜索提示词出错:", error);
      displayMessage("搜索提示词时发生错误");
    });
  }
}

// 显示搜索结果
function displaySearchResults(prompts) {
  let message = "找到以下提示词:\n\n";
  
  prompts.forEach((prompt, index) => {
    message += `${index + 1}. ${prompt.name} - ${prompt.description}\n`;
    message += `   分类: ${prompt.category}, 标签: ${prompt.tags.join(', ')}\n\n`;
  });
  
  displayMessage(message);
}

// 处理用户选择提示词
function handlePromptSelection(selection, prompts) {
  const index = parseInt(selection) - 1;
  
  if (index >= 0 && index < prompts.length) {
    const selectedPrompt = prompts[index];
    
    // 将提示词内容插入到对话框
    const promptContent = selectedPrompt.messages
      .map(msg => msg.content.text)
      .join('\n\n');
      
    insertToInputBox(promptContent);
    
    displayMessage(`已插入提示词: ${selectedPrompt.name}`);
  } else {
    displayMessage("无效的选择");
  }
}
```

## 实现提示词保存功能

当用户输入"保存提示词[名称][内容]"时，您的AI工具应该：

1. 提取提示词名称和内容
2. 格式化提示词为标准结构
3. 调用MCP Prompt Server的创建API保存提示词

### 获取提示词模板

首先获取标准模板结构：

```javascript
async function getPromptTemplate() {
  const response = await fetch('http://localhost:9010/api/template', {
    method: 'GET',
    headers: {
      'x-api-key': 'your-api-key'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data.template;
  } else {
    throw new Error('Failed to get prompt template');
  }
}
```

### 保存提示词示例代码

```javascript
async function savePrompt(name, content, category = 'General', tags = []) {
  // 将内容格式化为messages数组
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
    description: `Prompt for ${name}`,
    category,
    tags,
    messages
  };
  
  const response = await fetch('http://localhost:9010/api/prompts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key'
    },
    body: JSON.stringify(promptData)
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data.prompt;
  } else {
    throw new Error(data.error || 'Failed to save prompt');
  }
}

// 当用户输入消息时调用
function handleUserMessage(message) {
  // 检查是否是保存请求
  const saveMatch = message.match(/保存提示词\s*[：:]\s*(.+?)\s*[：:]\s*(.+)/i) || 
                    message.match(/保存提示词\s+(.+?)\s+(.+)/i);
  
  if (saveMatch) {
    const name = saveMatch[1].trim();
    const content = saveMatch[2].trim();
    
    // 提示用户输入可选信息
    promptForAdditionalInfo(name, content);
  }
}

// 提示用户输入额外信息
function promptForAdditionalInfo(name, content) {
  displayMessage(`准备保存提示词"${name}"。\n请输入分类（可选）：`);
  
  // 假设有一个方法来获取用户的下一个输入
  getNextUserInput().then(category => {
    displayMessage(`请输入标签，用逗号分隔（可选）：`);
    
    return getNextUserInput().then(tagsInput => {
      const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
      
      // 保存提示词
      return savePrompt(name, content, category || 'General', tags);
    });
  }).then(prompt => {
    displayMessage(`提示词"${name}"已成功保存`);
  }).catch(error => {
    console.error("保存提示词出错:", error);
    displayMessage("保存提示词时发生错误");
  });
}
```

## 自动识别对话中的优质提示词

AI工具可以自动识别对话中可能是高质量提示词的内容，并询问用户是否保存：

```javascript
function analyzeConversation(conversation) {
  // 这里可以实现提示词质量评估逻辑
  // 例如：检查长度、结构、关键词等
  
  // 如果发现潜在的高质量提示词
  if (isPotentialPrompt(conversation)) {
    displayMessage("我注意到这段对话可能包含有价值的提示词。您想保存它吗？");
    
    // 提供保存选项
    displayOptions(["是", "否"]);
  }
}

// 处理用户的保存决定
function handleSaveDecision(decision, conversation) {
  if (decision.toLowerCase() === "是") {
    displayMessage("请为这个提示词命名：");
    
    getNextUserInput().then(name => {
      if (name) {
        // 提取提示词内容
        const content = extractPromptContent(conversation);
        
        // 保存提示词
        promptForAdditionalInfo(name, content);
      }
    });
  }
}
```

## 完整集成流程

1. 在AI工具启动时，建立与MCP Prompt Server的连接
2. 监听用户输入，识别特定的指令模式
3. 根据指令调用相应的API，获取或保存提示词
4. 将结果呈现给用户

## 常见问题排查

1. **无法连接到服务器**：检查MCP Prompt Server是否正在运行，端口是否正确
2. **身份验证失败**：确认API密钥是否正确设置
3. **提示词格式错误**：确保提示词结构符合模板要求

## 扩展功能

除了基本的搜索和保存功能外，您还可以实现以下扩展功能：

1. **提示词分类浏览**：按类别浏览提示词
2. **提示词编辑**：允许用户编辑已有提示词
3. **提示词删除**：允许用户删除不需要的提示词
4. **提示词评分**：添加评分系统，帮助用户找到高质量提示词
