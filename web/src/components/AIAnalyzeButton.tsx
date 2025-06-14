import React, { useState } from 'react';
import { AIAnalysisResult } from '../lib/ai-analyzer';

interface AIAnalyzeButtonProps {
  content: string;
  onAnalysisComplete: (result: Partial<AIAnalysisResult>) => void;
  disabled?: boolean;
  variant?: 'full' | 'classify' | 'tags' | 'variables';
  className?: string;
}

export const AIAnalyzeButton: React.FC<AIAnalyzeButtonProps> = ({
  content,
  onAnalysisComplete,
  disabled = false,
  variant = 'full',
  className = ''
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

  const handleAnalyze = async () => {
    if (!content?.trim()) {
      setError('请先输入提示词内容');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          action: config.action,
          config: {
            language: 'zh',
            includeImprovements: variant === 'full',
            includeSuggestions: variant === 'full'
          }
        })
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
        onClick={handleAnalyze}
        disabled={disabled || isAnalyzing || !content?.trim()}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200 min-w-[120px] justify-center
          ${disabled || isAnalyzing || !content?.trim()
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:scale-105'
          }
          ${className}
        `}
        title={config.description}
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>分析中...</span>
          </>
        ) : (
          <>
            <span>{config.text}</span>
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
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🤖 AI分析结果
          <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
            置信度 {Math.round(result.confidence * 100)}%
          </span>
        </h3>
        <button
          onClick={applyAllResults}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          应用全部结果
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 分类 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700">🏷️ 智能分类</h4>
            <button
              onClick={() => applyField('category', result.category)}
              disabled={appliedFields.has('category')}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              {appliedFields.has('category') ? '✅ 已应用' : '应用'}
            </button>
          </div>
          <p className="text-lg font-semibold text-blue-600">{result.category}</p>
        </div>

        {/* 标签 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700">🔖 智能标签</h4>
            <button
              onClick={() => applyField('tags', result.tags)}
              disabled={appliedFields.has('tags')}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              {appliedFields.has('tags') ? '✅ 已应用' : '应用'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 版本建议 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700">📋 版本建议</h4>
            <button
              onClick={() => applyField('version', result.version)}
              disabled={appliedFields.has('version')}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              {appliedFields.has('version') ? '✅ 已应用' : '应用'}
            </button>
          </div>
          <p className="text-lg font-semibold text-purple-600">v{result.version}</p>
          <p className="text-sm text-gray-600 mt-1">难度: {result.difficulty}</p>
        </div>

        {/* 变量 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700">📝 提取变量</h4>
            <button
              onClick={() => applyField('variables', result.variables)}
              disabled={appliedFields.has('variables')}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              {appliedFields.has('variables') ? '✅ 已应用' : '应用'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.variables && result.variables.length > 0 ? (
              result.variables.map((variable, index) => (
                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">
                  {`{{${variable}}}`}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm italic">无变量</span>
            )}
          </div>
        </div>

        {/* 兼容模型 */}
        {result.compatibleModels && result.compatibleModels.length > 0 && (
          <div className="mt-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700">🔧 兼容模型</h4>
                <button
                  onClick={() => applyField('compatibleModels', result.compatibleModels)}
                  disabled={appliedFields.has('compatibleModels')}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  {appliedFields.has('compatibleModels') ? '✅ 已应用' : '应用'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.compatibleModels.map((model, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                    {model}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 详细信息 */}
      {(result.improvements?.length > 0 || result.useCases?.length > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 改进建议 */}
            {result.improvements?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">💡 改进建议</h4>
                <ul className="text-sm space-y-1">
                  {result.improvements.map((improvement, index) => (
                    <li key={index} className="text-gray-600">• {improvement}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 使用场景 */}
            {result.useCases?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🎯 使用场景</h4>
                <ul className="text-sm space-y-1">
                  {result.useCases.map((useCase, index) => (
                    <li key={index} className="text-gray-600">• {useCase}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 预估信息 */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <span>预估Token数: {result.estimatedTokens}</span>
          <span>兼容模型: {result.compatibleModels?.join(', ')}</span>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyzeButton; 