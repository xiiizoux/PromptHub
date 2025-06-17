/**
 * MCP自动提示词存储工具
 * 专为第三方客户端设计的简化存储功能
 * 参考web服务器AI智能分析实现
 */

import { MCPAIAnalysisResult } from '../ai/mcp-ai-analyzer.js';
import { storage, aiAnalyzer } from '../shared/services.js';
import { handleToolError, handleToolSuccess, validateRequiredParams } from '../shared/error-handler.js';
import { ToolDescription, ToolParameter, MCPToolResponse, Prompt, StorageAdapter } from '../types.js';

/**
 * 一键存储工具 - 最简化的存储体验
 */
export const quickStoreTool: ToolDescription = {
  name: 'quick_store',
  description: '一键存储提示词。系统将自动分析并填充所有参数，智能判断公开/私有设置，最大程度减少人工干预。',
  schema_version: 'v1',
  parameters: {
    content: {
      type: 'string',
      description: '要存储的提示词内容',
      required: true,
    } as ToolParameter,
    title: {
      type: 'string',
      description: '自定义标题（可选）。如不提供，系统将自动生成',
      required: false,
    } as ToolParameter,
    make_public: {
      type: 'boolean',
      description: '是否设为公开。如不指定，系统将根据内容中的关键词智能判断（检测"个人"、"私有"等关键词设为私有，否则默认公开）',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 智能存储工具 - 支持AI分析的高级存储
 */
export const smartStoreTool: ToolDescription = {
  name: 'smart_store',
  description: '智能存储提示词。利用第三方客户端AI进行分析，智能判断公开/私有设置，然后自动存储。支持分析结果确认和调整。',
  schema_version: 'v1',
  parameters: {
    content: {
      type: 'string',
      description: '要存储的提示词内容',
      required: true,
    } as ToolParameter,
    auto_analyze: {
      type: 'boolean',
      description: '是否自动进行AI分析（默认true）',
      required: false,
    } as ToolParameter,
    confirm_before_save: {
      type: 'boolean',
      description: '保存前是否需要确认（默认false）',
      required: false,
    } as ToolParameter,
    make_public: {
      type: 'boolean',
      description: '是否设为公开。如不指定，系统将根据内容中的关键词智能判断（检测"个人"、"私有"等关键词设为私有，否则默认公开）',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 分析并存储工具 - 分步式存储流程
 */
export const analyzeAndStoreTool: ToolDescription = {
  name: 'analyze_and_store',
  description: '先分析后存储。首先展示AI分析结果，用户确认后进行存储。适合需要精确控制的场景。',
  schema_version: 'v1',
  parameters: {
    content: {
      type: 'string',
      description: '要分析的提示词内容',
      required: true,
    } as ToolParameter,
    analysis_only: {
      type: 'boolean',
      description: '仅进行分析，不存储（默认false）',
      required: false,
    } as ToolParameter,
    analysis_result: {
      type: 'object',
      description: '如果已有分析结果，直接传入进行存储',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 智能判断存储类型（公开/私有）
 */
function detectPrivacyPreference(content: string, title?: string): boolean {
  const text = `${content} ${title || ''}`.toLowerCase();
  
  // 私有关键词
  const privateKeywords = [
    '个人', '私有', '私人', '私密', '内部', '不公开', '仅自己',
    'private', 'personal', 'internal', 'confidential', 'secret'
  ];
  
  // 公开关键词
  const publicKeywords = [
    '公开', '分享', '共享', '开源', '公共', '团队', '大家',
    'public', 'share', 'open', 'common', 'team', 'everyone'
  ];
  
  // 检查私有关键词
  const hasPrivateKeywords = privateKeywords.some(keyword => text.includes(keyword));
  if (hasPrivateKeywords) {
    return false; // 设为私有
  }
  
  // 检查公开关键词
  const hasPublicKeywords = publicKeywords.some(keyword => text.includes(keyword));
  if (hasPublicKeywords) {
    return true; // 设为公开
  }
  
  // 默认公开，便于分享和发现
  return true;
}

/**
 * 提取隐私相关关键词（用于调试和日志）
 */
function extractPrivacyKeywords(content: string, title?: string): { private: string[], public: string[] } {
  const text = `${content} ${title || ''}`.toLowerCase();
  
  const privateKeywords = [
    '个人', '私有', '私人', '私密', '内部', '不公开', '仅自己',
    'private', 'personal', 'internal', 'confidential', 'secret'
  ];
  
  const publicKeywords = [
    '公开', '分享', '共享', '开源', '公共', '团队', '大家',
    'public', 'share', 'open', 'common', 'team', 'everyone'
  ];
  
  return {
    private: privateKeywords.filter(keyword => text.includes(keyword)),
    public: publicKeywords.filter(keyword => text.includes(keyword))
  };
}

/**
 * 处理一键存储 - 最简化流程
 */
export async function handleQuickStore(params: any): Promise<MCPToolResponse> {
  try {
    const {
      content,
      title,
      make_public
    } = params;

    // 智能判断公开/私有设置
    const isPublic = make_public !== undefined ? make_public : detectPrivacyPreference(content, title);

    console.log('[MCP一键存储] 开始处理:', { 
      contentLength: content.length, 
      hasTitle: !!title, 
      isPublic: isPublic,
      privacySource: make_public !== undefined ? 'user_specified' : 'auto_detected'
    });

    // 1. 快速AI分析
    const existingTags = await storage.getTags();
    const analysisResult = await aiAnalyzer.analyzePrompt(
      content,
      { 
        includeImprovements: false, // 快速存储不需要改进建议
        includeSuggestions: true,
        language: 'zh'
      },
      existingTags,
      undefined,
      true,
      []
    );

    // 2. 构建提示词数据
    const promptData: Prompt = {
      name: title || analysisResult.suggestedTitle || `AI提示词_${new Date().toLocaleDateString()}`,
      description: analysisResult.description || '通过MCP一键存储创建',
      category: analysisResult.category,
      tags: analysisResult.tags,
      messages: convertContentToMessages(content),
      version: 1.0,
      is_public: isPublic,
      allow_collaboration: false, // 默认不允许协作编辑，保护创建者权益
      edit_permission: 'owner_only', // 默认仅创建者可编辑
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 3. 存储到数据库
    const storedPrompt = await storage.createPrompt(promptData);

    // 4. 返回简洁的成功信息
    const result = {
      success: true,
      message: '✅ 提示词已成功存储！',
      prompt: {
        id: storedPrompt.id,
        title: storedPrompt.name,
        category: storedPrompt.category,
        tags: storedPrompt.tags,
        version: storedPrompt.version,
        isPublic: storedPrompt.is_public
      },
      analysis: {
        category: analysisResult.category,
        difficulty: analysisResult.difficulty,
        estimatedTokens: analysisResult.estimatedTokens,
        variables: analysisResult.variables,
        compatibleModels: analysisResult.compatibleModels
      },
      privacy: {
        isPublic: isPublic,
        source: make_public !== undefined ? 'user_specified' : 'auto_detected',
        detectedKeywords: extractPrivacyKeywords(content, title)
      },
      timestamp: new Date().toISOString()
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('[MCP一键存储] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: '存储失败',
          message: error.message,
          suggestion: '请检查提示词内容是否有效，或稍后重试'
        })
      }]
    };
  }
}

/**
 * 处理智能存储 - 支持AI分析的完整流程
 */
export async function handleSmartStore(params: any): Promise<MCPToolResponse> {
  try {
    const {
      content,
      auto_analyze = true,
      confirm_before_save = false,
      make_public
    } = params;

    // 智能判断公开/私有设置
    const isPublic = make_public !== undefined ? make_public : detectPrivacyPreference(content);

    console.log('[MCP智能存储] 开始处理:', { 
      contentLength: content.length, 
      autoAnalyze: auto_analyze,
      confirmBeforeSave: confirm_before_save,
      isPublic: isPublic,
      privacySource: make_public !== undefined ? 'user_specified' : 'auto_detected'
    });

    // 1. AI分析
    let analysisResult: MCPAIAnalysisResult;
    
    if (auto_analyze) {
      const existingTags = await storage.getTags();
      analysisResult = await aiAnalyzer.analyzePrompt(
        content,
        { 
          includeImprovements: true,
          includeSuggestions: true,
          language: 'zh'
        },
        existingTags,
        undefined,
        true,
        []
      );
    } else {
      // 基础分析
      analysisResult = {
        category: '通用',
        tags: ['AI', '提示词'],
        suggestedTitle: `提示词_${Date.now()}`,
        description: '通过MCP智能存储创建',
        difficulty: 'intermediate',
        estimatedTokens: Math.ceil(content.length / 4),
        variables: extractVariables(content),
        improvements: [],
        useCases: [],
        compatibleModels: ['llm-large'],
        version: '1.0',
        confidence: 0.6
      };
    }

    // 2. 如果需要确认，返回分析结果等待确认
    if (confirm_before_save) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            stage: 'analysis_complete',
            message: '🔍 AI分析完成，请确认以下信息：',
            analysis: analysisResult,
            contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            nextStep: '如确认无误，请调用 analyze_and_store 工具并传入此分析结果完成存储',
            instructions: {
              confirm: '调用 analyze_and_store，传入 analysis_result 参数',
              modify: '调用 analyze_and_store，修改分析结果后传入'
            }
          }, null, 2)
        }]
      };
    }

    // 3. 直接存储
    const promptData: Prompt = {
      name: analysisResult.suggestedTitle || `AI提示词_${new Date().toLocaleDateString()}`,
      description: analysisResult.description || '通过MCP智能存储创建',
      category: analysisResult.category,
      tags: analysisResult.tags,
      messages: convertContentToMessages(content),
      version: parseFloat(analysisResult.version) || 1.0,
      is_public: isPublic,
      allow_collaboration: false, // 默认不允许协作编辑，保护创建者权益
      edit_permission: 'owner_only', // 默认仅创建者可编辑
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const storedPrompt = await storage.createPrompt(promptData);

    // 4. 返回详细的成功信息
    const result = {
      success: true,
      message: '✅ 智能存储完成！',
      prompt: {
        id: storedPrompt.id,
        title: storedPrompt.name,
        description: storedPrompt.description,
        category: storedPrompt.category,
        tags: storedPrompt.tags,
        version: storedPrompt.version,
        isPublic: storedPrompt.is_public
      },
      analysis: {
        confidence: analysisResult.confidence,
        difficulty: analysisResult.difficulty,
        estimatedTokens: analysisResult.estimatedTokens,
        variables: analysisResult.variables,
        compatibleModels: analysisResult.compatibleModels,
        improvements: analysisResult.improvements,
        useCases: analysisResult.useCases
      },
      metadata: {
        analysisSource: auto_analyze ? 'ai_analysis' : 'basic_analysis',
        createdAt: new Date().toISOString()
      },
      privacy: {
        isPublic: isPublic,
        source: make_public !== undefined ? 'user_specified' : 'auto_detected',
        detectedKeywords: extractPrivacyKeywords(content)
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('[MCP智能存储] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: '智能存储失败',
          message: error.message,
          fallback: '可尝试使用 quick_store 工具进行简化存储'
        })
      }]
    };
  }
}

/**
 * 处理分析并存储 - 分步式流程
 */
export async function handleAnalyzeAndStore(params: any): Promise<MCPToolResponse> {
  try {
    const {
      content,
      analysis_only = false,
      analysis_result
    } = params;

    // 如果提供了分析结果，直接进行存储
    if (analysis_result) {
      console.log('[MCP分析存储] 使用提供的分析结果进行存储');
      
      const promptData: Prompt = {
        name: analysis_result.suggestedTitle || `AI提示词_${new Date().toLocaleDateString()}`,
        description: analysis_result.description || '通过MCP分析存储创建',
        category: analysis_result.category || '通用',
        tags: analysis_result.tags || ['AI', '提示词'],
        messages: convertContentToMessages(content),
        version: parseFloat(analysis_result.version) || 1.0,
        is_public: true, // 默认公开，便于分享和发现
        allow_collaboration: false, // 默认不允许协作编辑，保护创建者权益
        edit_permission: 'owner_only', // 默认仅创建者可编辑
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const storedPrompt = await storage.createPrompt(promptData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: '✅ 基于分析结果存储完成！',
            prompt: {
              id: storedPrompt.id,
              title: storedPrompt.name,
              category: storedPrompt.category,
              tags: storedPrompt.tags,
              version: storedPrompt.version
            },
            appliedAnalysis: analysis_result
          }, null, 2)
        }]
      };
    }

    // 进行AI分析
    console.log('[MCP分析存储] 开始AI分析:', { contentLength: content.length, analysisOnly: analysis_only });
    
    const existingTags = await storage.getTags();
    const analysisResult = await aiAnalyzer.analyzePrompt(
      content,
      { 
        includeImprovements: true,
        includeSuggestions: true,
        language: 'zh'
      },
      existingTags,
      undefined,
      true,
      []
    );

    // 如果仅分析，返回分析结果
    if (analysis_only) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: '🔍 AI分析完成',
            analysis: analysisResult,
            contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            nextSteps: [
              '如要存储，请再次调用此工具，设置 analysis_only 为 false',
              '或调用 analyze_and_store，传入分析结果进行存储',
              '也可以修改分析结果后再进行存储'
            ]
          }, null, 2)
        }]
      };
    }

    // 分析完成后自动存储
    const promptData: Prompt = {
      name: analysisResult.suggestedTitle || `AI提示词_${new Date().toLocaleDateString()}`,
      description: analysisResult.description || '通过MCP分析存储创建',
      category: analysisResult.category,
      tags: analysisResult.tags,
      messages: convertContentToMessages(content),
      version: parseFloat(analysisResult.version) || 1.0,
      is_public: true, // 默认公开，便于分享和发现
      allow_collaboration: false, // 默认不允许协作编辑，保护创建者权益
      edit_permission: 'owner_only', // 默认仅创建者可编辑
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const storedPrompt = await storage.createPrompt(promptData);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: '✅ 分析并存储完成！',
          prompt: {
            id: storedPrompt.id,
            title: storedPrompt.name,
            description: storedPrompt.description,
            category: storedPrompt.category,
            tags: storedPrompt.tags,
            version: storedPrompt.version,
            isPublic: storedPrompt.is_public
          },
          analysis: {
            confidence: analysisResult.confidence,
            difficulty: analysisResult.difficulty,
            estimatedTokens: analysisResult.estimatedTokens,
            variables: analysisResult.variables,
            compatibleModels: analysisResult.compatibleModels,
            improvements: analysisResult.improvements,
            useCases: analysisResult.useCases
          },
          workflow: 'analyze_then_store'
        }, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('[MCP分析存储] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: '分析存储失败',
          message: error.message,
          troubleshooting: [
            '检查提示词内容格式',
            '确认网络连接正常',
            '尝试使用 quick_store 简化存储'
          ]
        })
      }]
    };
  }
}

/**
 * 辅助函数：将内容转换为消息格式
 */
function convertContentToMessages(content: string) {
  // 检测是否已经是对话格式
  if (content.includes('Human:') || content.includes('Assistant:') || content.includes('用户:') || content.includes('助手:')) {
    // 已经是对话格式，尝试解析
    const lines = content.split('\n').filter(line => line.trim());
    const messages = [];
    let currentRole = '';
    let currentContent = '';
    
    for (const line of lines) {
      if (line.startsWith('Human:') || line.startsWith('用户:')) {
        if (currentContent) {
          messages.push({ role: currentRole, content: currentContent.trim() });
        }
        currentRole = 'user';
        currentContent = line.replace(/^(Human:|用户:)/, '').trim();
      } else if (line.startsWith('Assistant:') || line.startsWith('助手:')) {
        if (currentContent) {
          messages.push({ role: currentRole, content: currentContent.trim() });
        }
        currentRole = 'assistant';
        currentContent = line.replace(/^(Assistant:|助手:)/, '').trim();
      } else {
        currentContent += '\n' + line;
      }
    }
    
    if (currentContent) {
      messages.push({ role: currentRole, content: currentContent.trim() });
    }
    
    return messages.length > 0 ? messages : [{ role: 'user', content }];
  }
  
  // 单一内容，作为用户消息
  return [{ role: 'user', content }];
}

/**
 * 辅助函数：提取变量
 */
function extractVariables(content: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
} 