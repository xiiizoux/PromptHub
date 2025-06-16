import React, { useState } from 'react';
import { AIAnalysisResult } from '../lib/ai-analyzer';

interface AIAnalyzeButtonProps {
  content: string;
  onAnalysisComplete: (result: Partial<AIAnalysisResult>) => void;
  disabled?: boolean;
  variant?: 'full' | 'classify' | 'tags' | 'variables';
  className?: string;
  currentVersion?: string;
  isNewPrompt?: boolean;
  existingVersions?: string[];
  // 增量分析支持
  originalContent?: string;
  existingCategory?: string;
  existingTags?: string[];
  existingModels?: string[];
}

export const AIAnalyzeButton: React.FC<AIAnalyzeButtonProps> = ({
  content,
  onAnalysisComplete,
  disabled = false,
  variant = 'full',
  className = '',
  currentVersion,
  isNewPrompt,
  existingVersions,
  originalContent,
  existingCategory,
  existingTags,
  existingModels
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonConfig = {
    full: {
      text: '🤖 智能分析',
      action: 'full_analyze',
      description: '完整AI分析：分类、标签、变量、建议等'
    },
    classify: {
      text: '🏷️ 智能分类',
      action: 'quick_classify',
      description: '快速智能分类'
    },
    tags: {
      text: '🔖 提取标签', 
      action: 'extract_tags',
      description: 'AI提取相关标签'
    },
    variables: {
      text: '📝 提取变量',
      action: 'extract_variables',
      description: '提取模板变量'
    }
  };

  const config = buttonConfig[variant];

  // 改进的内容检测逻辑
  const hasValidContent = content && typeof content === 'string' && content.trim().length > 0;
  const isButtonDisabled = disabled || isAnalyzing || !hasValidContent;

  // 调试信息 (仅在开发环境显示)
  if (process.env.NODE_ENV === 'development') {
    console.log('AIAnalyzeButton Debug:', {
      content: content ? `"${content.substring(0, 50)}..."` : 'null/undefined',
      contentLength: content?.length || 0,
      hasValidContent,
      isButtonDisabled,
      disabled,
      isAnalyzing
    });
  }

  const handleAnalyze = async () => {
    if (!hasValidContent) {
      setError('请先输入提示词内容');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // 准备请求体，支持增量分析
      const requestBody: any = {
        content: content.trim(),
        action: config.action,
        config: {
          language: 'zh',
          includeImprovements: variant === 'full',
          includeSuggestions: variant === 'full'
        }
      };

      // 如果是编辑模式，添加增量分析参数
      if (!isNewPrompt && variant === 'full') {
        requestBody.currentVersion = currentVersion;
        requestBody.isNewPrompt = isNewPrompt;
        requestBody.existingVersions = existingVersions;
        
        // 传递现有参数用于增量分析
        requestBody.originalContent = originalContent || '';
        requestBody.existingCategory = existingCategory || '';
        requestBody.existingTags = existingTags || [];
        requestBody.existingModels = existingModels || [];
        
        console.log('🔍 增量分析参数:', {
          原始内容长度: originalContent?.length || 0,
          当前内容长度: content.length,
          现有分类: existingCategory,
          现有标签数量: existingTags?.length || 0,
          现有模型数量: existingModels?.length || 0
        });
      }

      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'AI分析请求失败');
      }

      if (result.success) {
        onAnalysisComplete(result.data);
        
        // 显示成功提示
        if (variant === 'full') {
          console.log('AI分析完成，置信度:', result.data.confidence);
        }
      } else {
        throw new Error(result.error || '分析结果异常');
      }

    } catch (error: any) {
      console.error('AI分析失败:', error);
      setError(error.message || 'AI分析服务暂时不可用');
      
      // 如果是API key问题，提供后备方案
      if (error.message?.includes('API key') || error.message?.includes('未配置')) {
        // 使用本地后备分析
        if (variant === 'variables') {
          const matches = content.match(/\{\{([^}]+)\}\}/g);
          const uniqueVars = new Set(matches ? 
            matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim()) : []);
          const variables = Array.from(uniqueVars).filter(variable => variable.length > 0);
          onAnalysisComplete({ variables });
          setError(null);
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={isButtonDisabled}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200 min-w-[120px] justify-center
          ${isButtonDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:scale-105 border border-blue-500'
          }
          ${className}
        `}
        title={hasValidContent ? config.description : '请先输入提示词内容后再进行分析'}
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>分析中...</span>
          </>
        ) : (
          <>
            <span>{config.text}</span>
            {/* 调试提示 - 仅开发环境 */}
            {process.env.NODE_ENV === 'development' && !hasValidContent && (
              <span className="text-xs text-red-300 ml-1">[无内容]</span>
            )}
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-xs z-10">
          <div className="flex items-start gap-2">
            <span className="text-red-500">⚠️</span>
            <div>
              <p className="font-medium">分析失败</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="absolute top-1 right-1 text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

// 智能分析结果显示组件
interface AIAnalysisResultDisplayProps {
  result: AIAnalysisResult;
  onApplyResults?: (data: Partial<AIAnalysisResult>) => void;
}

export const AIAnalysisResultDisplay: React.FC<AIAnalysisResultDisplayProps> = ({
  result,
  onApplyResults
}) => {
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  const applyField = (fieldName: string, value: any) => {
    if (onApplyResults) {
      onApplyResults({ [fieldName]: value });
      setAppliedFields(prev => new Set(Array.from(prev).concat(fieldName)));
    }
  };

  const applyAllResults = () => {
    if (onApplyResults) {
      // 直接应用全部结果，不显示确认对话框
      onApplyResults({
        category: result.category,
        tags: result.tags,
        version: result.version,
        variables: result.variables,
        compatibleModels: result.compatibleModels,
        suggestedTitle: result.suggestedTitle,
        description: result.description
      });
      setAppliedFields(new Set(['category', 'tags', 'version', 'variables', 'compatibleModels', 'suggestedTitle', 'description']));
    }
  };

  return (
    <div className="bg-gradient-to-br from-dark-bg-primary via-dark-bg-secondary to-dark-bg-primary rounded-lg p-3 border border-neon-cyan/30 shadow-lg backdrop-blur-sm">
      {/* 背景装饰效果 - 简化 */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 via-neon-purple/5 to-neon-cyan/5 rounded-lg"></div>
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink rounded-t-lg"></div>
      
      {/* 标题区域 - 紧凑版 */}
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-6 h-6 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-md flex items-center justify-center shadow-md shadow-neon-cyan/25">
              <span className="text-sm">🤖</span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-md shadow-neon-green/50"></div>
          </div>
          <div>
            <h3 className="text-sm font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              AI 智能分析
            </h3>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">NEURAL ANALYSIS</span>
              <div className="px-1.5 py-0.5 bg-neon-green/20 border border-neon-green/30 rounded-full">
                <span className="text-xs font-mono text-neon-green">
                  置信度 {Math.round(result.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          type="button"
          onClick={applyAllResults}
          className="group relative px-3 py-1.5 bg-gradient-to-r from-neon-purple to-neon-pink rounded-md font-medium text-white shadow-md shadow-neon-purple/25 hover:shadow-neon-purple/40 transition-all duration-300 text-xs border border-neon-purple/30"
        >
          <span className="relative z-10">应用全部建议</span>
        </button>
      </div>

      {/* 使用提示 - 紧凑版 */}
      <div className="relative mb-3 p-2 bg-gradient-to-r from-neon-blue/10 to-neon-cyan/10 border border-neon-cyan/20 rounded-lg backdrop-blur-sm">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-cyan to-neon-blue rounded-l-lg"></div>
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 bg-neon-cyan/20 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-neon-cyan text-xs">💡</span>
          </div>
          <div>
            <p className="text-xs text-gray-300 leading-relaxed">
              <span className="text-neon-cyan font-semibold">智能建议系统：</span>
              以下是AI神经网络分析的优化建议，您可以选择性地应用这些建议到表单中。点击各项的"应用"按钮可单独应用某项建议。
            </p>
          </div>
        </div>
      </div>

      {/* 分析结果 - 紧凑垂直布局 */}
      <div className="space-y-2 mb-3">
        {/* 建议标题 */}
        {result.suggestedTitle && (
          <div className="group relative bg-gradient-to-br from-dark-bg-secondary/80 to-dark-bg-primary/80 rounded-lg p-2 border border-neon-yellow/20 hover:border-neon-yellow/40 transition-all duration-300 backdrop-blur-sm">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-neon-yellow/20 rounded-md flex items-center justify-center">
                    <span className="text-neon-yellow text-xs">💡</span>
                  </div>
                  <h4 className="font-semibold text-gray-200 text-xs">建议标题</h4>
                </div>
                <button
                  type="button"
                  onClick={() => applyField('suggestedTitle', result.suggestedTitle)}
                  disabled={appliedFields.has('suggestedTitle')}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    appliedFields.has('suggestedTitle')
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                      : 'bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30 hover:bg-neon-yellow/30'
                  }`}
                >
                  {appliedFields.has('suggestedTitle') ? '✅ 已应用' : '应用'}
                </button>
              </div>
              <div className="bg-gradient-to-r from-neon-yellow/10 to-neon-orange/10 rounded-md p-2 border border-neon-yellow/10">
                <p className="text-gray-200 font-medium text-xs leading-relaxed">{result.suggestedTitle}</p>
              </div>
            </div>
          </div>
        )}

        {/* 建议描述 */}
        {result.description && (
          <div className="group relative bg-gradient-to-br from-dark-bg-secondary/80 to-dark-bg-primary/80 rounded-lg p-2 border border-neon-orange/20 hover:border-neon-orange/40 transition-all duration-300 backdrop-blur-sm">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-neon-orange/20 rounded-md flex items-center justify-center">
                    <span className="text-neon-orange text-xs">📋</span>
                  </div>
                  <h4 className="font-semibold text-gray-200 text-xs">建议描述</h4>
                </div>
                <button
                  type="button"
                  onClick={() => applyField('description', result.description)}
                  disabled={appliedFields.has('description')}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    appliedFields.has('description')
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                      : 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30 hover:bg-neon-orange/30'
                  }`}
                >
                  {appliedFields.has('description') ? '✅ 已应用' : '应用'}
                </button>
              </div>
              <div className="bg-gradient-to-r from-neon-orange/10 to-neon-red/10 rounded-md p-2 border border-neon-orange/10">
                <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                  {result.description.length > 80 ? result.description.substring(0, 80) + '...' : result.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 版本建议 */}
        <div className="group relative bg-gradient-to-br from-dark-bg-secondary/80 to-dark-bg-primary/80 rounded-lg p-2 border border-neon-pink/20 hover:border-neon-pink/40 transition-all duration-300 backdrop-blur-sm">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-neon-pink/20 rounded-md flex items-center justify-center">
                  <span className="text-neon-pink text-xs">📋</span>
                </div>
                <h4 className="font-semibold text-gray-200 text-xs">版本建议</h4>
              </div>
              <button
                type="button"
                onClick={() => applyField('version', result.version)}
                disabled={appliedFields.has('version')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  appliedFields.has('version')
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/30'
                }`}
              >
                {appliedFields.has('version') ? '✅ 已应用' : '应用'}
              </button>
            </div>
            <div className="bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 rounded-md p-2 border border-neon-pink/10 flex items-center justify-between">
              <p className="text-sm font-bold text-neon-pink font-mono">v{Number(result.version).toFixed(1)}</p>
              <p className="text-xs text-gray-400">难度: <span className="text-neon-yellow">{result.difficulty}</span></p>
            </div>
          </div>
        </div>

        {/* 智能分类 */}
        <div className="group relative bg-gradient-to-br from-dark-bg-secondary/80 to-dark-bg-primary/80 rounded-lg p-2 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 backdrop-blur-sm">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-neon-cyan/20 rounded-md flex items-center justify-center">
                  <span className="text-neon-cyan text-xs">🏷️</span>
                </div>
                <h4 className="font-semibold text-gray-200 text-xs">智能分类</h4>
              </div>
              <button
                type="button"
                onClick={() => applyField('category', result.category)}
                disabled={appliedFields.has('category')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  appliedFields.has('category')
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30'
                }`}
              >
                {appliedFields.has('category') ? '✅ 已应用' : '应用'}
              </button>
            </div>
            <div className="bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 rounded-md p-2 border border-neon-cyan/10">
              <p className="text-sm font-bold text-neon-cyan">{result.category}</p>
            </div>
          </div>
        </div>

        {/* 智能标签 */}
        <div className="group relative bg-gradient-to-br from-dark-bg-secondary/80 to-dark-bg-primary/80 rounded-lg p-2 border border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-300 backdrop-blur-sm">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-neon-purple/20 rounded-md flex items-center justify-center">
                  <span className="text-neon-purple text-xs">🔖</span>
                </div>
                <h4 className="font-semibold text-gray-200 text-xs">智能标签</h4>
              </div>
              <button
                type="button"
                onClick={() => applyField('tags', result.tags)}
                disabled={appliedFields.has('tags')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  appliedFields.has('tags')
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30'
                }`}
              >
                {appliedFields.has('tags') ? '✅ 已应用' : '应用'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {result.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-1.5 py-0.5 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 text-neon-purple border border-neon-purple/20 rounded text-xs font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 提取变量 */}
        <div className="group relative bg-gradient-to-br from-dark-bg-secondary/80 to-dark-bg-primary/80 rounded-lg p-2 border border-neon-green/20 hover:border-neon-green/40 transition-all duration-300 backdrop-blur-sm">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-neon-green/20 rounded-md flex items-center justify-center">
                  <span className="text-neon-green text-xs">📝</span>
                </div>
                <h4 className="font-semibold text-gray-200 text-xs">提取变量</h4>
              </div>
              <button
                type="button"
                onClick={() => applyField('variables', result.variables)}
                disabled={appliedFields.has('variables')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  appliedFields.has('variables')
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30'
                }`}
              >
                {appliedFields.has('variables') ? '✅ 已应用' : '应用'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {result.variables && result.variables.length > 0 ? (
                result.variables.map((variable, index) => (
                  <span 
                    key={index} 
                    className="px-1.5 py-0.5 bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 text-neon-green border border-neon-green/20 rounded text-xs font-mono"
                  >
                    {`{{${variable}}}`}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-xs italic">无变量检测</span>
              )}
            </div>
          </div>
        </div>

        {/* 兼容模型 */}
        {result.compatibleModels && result.compatibleModels.length > 0 && (
          <div className="group relative bg-gradient-to-br from-dark-bg-secondary/80 to-dark-bg-primary/80 rounded-lg p-2 border border-neon-red/20 hover:border-neon-red/40 transition-all duration-300 backdrop-blur-sm">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-neon-red/20 rounded-md flex items-center justify-center">
                    <span className="text-neon-red text-xs">🔧</span>
                  </div>
                  <h4 className="font-semibold text-gray-200 text-xs">兼容模型</h4>
                </div>
                <button
                  type="button"
                  onClick={() => applyField('compatibleModels', result.compatibleModels)}
                  disabled={appliedFields.has('compatibleModels')}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    appliedFields.has('compatibleModels')
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                      : 'bg-neon-red/20 text-neon-red border border-neon-red/30 hover:bg-neon-red/30'
                  }`}
                >
                  {appliedFields.has('compatibleModels') ? '✅ 已应用' : '应用'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {result.compatibleModels.map((model, index) => (
                  <span 
                    key={index} 
                    className="px-1.5 py-0.5 bg-gradient-to-r from-neon-red/20 to-neon-pink/20 text-neon-red border border-neon-red/20 rounded text-xs font-mono"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 详细信息 - 紧凑版 */}
      {(result.improvements?.length > 0 || result.useCases?.length > 0) && (
        <div className="relative mt-3 pt-3">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent"></div>
          <div className="space-y-2">
            {/* 改进建议 */}
            {result.improvements?.length > 0 && (
              <div className="bg-gradient-to-br from-dark-bg-secondary/50 to-dark-bg-primary/50 rounded-lg p-2 border border-neon-blue/20 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-4 h-4 bg-neon-blue/20 rounded-md flex items-center justify-center">
                    <span className="text-neon-blue text-xs">💡</span>
                  </div>
                  <h4 className="text-xs font-semibold text-neon-blue">优化建议</h4>
                </div>
                <ul className="space-y-1">
                  {result.improvements.slice(0, 3).map((improvement, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-xs text-gray-300">
                      <span className="text-neon-blue mt-0.5">▸</span>
                      <span className="line-clamp-2">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 使用场景 */}
            {result.useCases?.length > 0 && (
              <div className="bg-gradient-to-br from-dark-bg-secondary/50 to-dark-bg-primary/50 rounded-lg p-2 border border-neon-green/20 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-4 h-4 bg-neon-green/20 rounded-md flex items-center justify-center">
                    <span className="text-neon-green text-xs">🎯</span>
                  </div>
                  <h4 className="text-xs font-semibold text-neon-green">应用场景</h4>
                </div>
                <ul className="space-y-1">
                  {result.useCases.slice(0, 3).map((useCase, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-xs text-gray-300">
                      <span className="text-neon-green mt-0.5">▸</span>
                      <span className="line-clamp-1">{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalyzeButton; 