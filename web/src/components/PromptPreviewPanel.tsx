import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeIcon, 
  PlayIcon, 
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { AIAnalyzeButton } from './AIAnalyzeButton';
import toast from 'react-hot-toast';

interface PromptPreviewPanelProps {
  content: string;
  variables?: Record<string, string>;
  className?: string;
}

interface PreviewResult {
  success: boolean;
  preview?: string;
  tokensUsed?: number;
  estimatedCost?: number;
  responseTime?: number;
  error?: string;
  warnings?: string[];
}

export const PromptPreviewPanel: React.FC<PromptPreviewPanelProps> = ({
  content,
  variables = {},
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [autoPreview, setAutoPreview] = useState(false);

  // 检测提示词中的变量
  useEffect(() => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variableRegex);
    const detectedVars: Record<string, string> = {};
    
    if (matches) {
      matches.forEach(match => {
        const varName = match.replace(/^\{\{|\}\}$/g, '').trim();
        if (!testVariables[varName]) {
          detectedVars[varName] = `[示例${varName}]`;
        }
      });
      
      if (Object.keys(detectedVars).length > 0) {
        setTestVariables(prev => ({ ...prev, ...detectedVars }));
      }
    }
  }, [content]);

  // 自动预览
  useEffect(() => {
    if (autoPreview && content.length > 50) {
      const timer = setTimeout(() => {
        generatePreview();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content, testVariables, autoPreview]);

  const processPromptWithVariables = (prompt: string, vars: Record<string, string>): string => {
    let processedPrompt = prompt;
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedPrompt = processedPrompt.replace(regex, value);
    });
    return processedPrompt;
  };

  const generatePreview = async () => {
    if (!content.trim()) {
      toast.error('请输入提示词内容');
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();

    try {
      // 处理变量
      const processedPrompt = processPromptWithVariables(content, testVariables);
      
      // 模拟AI响应（实际项目中可以调用真实的API）
      const mockPreview = await simulateAIResponse(processedPrompt);
      
      const responseTime = Date.now() - startTime;
      
      setPreviewResult({
        success: true,
        preview: mockPreview.text,
        tokensUsed: mockPreview.tokens,
        estimatedCost: mockPreview.cost,
        responseTime,
        warnings: generateWarnings(processedPrompt),
      });

    } catch (error: unknown) {
      setPreviewResult({
        success: false,
        error: error instanceof Error ? error.message : '预览生成失败',
        warnings: [],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 模拟AI响应（可以替换为真实的API调用）
  const simulateAIResponse = async (prompt: string): Promise<{text: string, tokens: number, cost: number}> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // 基于提示词类型生成不同的响应
    const promptLower = prompt.toLowerCase();
    let responseText = '';
    
    if (promptLower.includes('分析')) {
      responseText = `# 分析结果

基于您提供的内容，我进行了全面分析：

## 主要发现
1. **核心要点**：[基于输入内容的具体分析]
2. **关键趋势**：[识别出的重要趋势]
3. **潜在机会**：[发现的机会点]

## 详细分析
[这里会是详细的分析内容，基于实际的提示词要求...]

## 建议
1. 优先关注核心要点
2. 持续监控关键趋势
3. 抓住潜在机会`;
    } else if (promptLower.includes('创作') || promptLower.includes('写作')) {
      responseText = `# 创作内容

根据您的要求，我创作了以下内容：

[这里是根据提示词要求创作的具体内容...]

**风格特点**：
- 符合目标受众需求
- 语言流畅自然
- 结构清晰有序

**创作说明**：
本内容严格按照您的要求进行创作，确保满足所有指定条件。`;
    } else if (promptLower.includes('编程') || promptLower.includes('代码')) {
      responseText = `\`\`\`python
# 基于您的要求生成的代码示例
def example_function():
    """
    这是根据您的提示词生成的示例函数
    """
    # 实现具体功能...
    return "Hello, World!"

# 使用示例
result = example_function()
print(result)
\`\`\`

**代码说明**：
- 功能完整，可直接运行
- 遵循最佳实践
- 包含必要的注释`;
    } else {
      responseText = `根据您的提示词，我提供以下回答：

[这里会是AI根据具体提示词内容生成的响应...]

**回答要点**：
1. 直接回应您的问题
2. 提供实用的信息
3. 符合您的具体要求

如果您需要更详细的信息或有其他问题，请随时告诉我。`;
    }
    
    // 计算token和成本
    const tokens = Math.ceil(prompt.length / 4) + Math.ceil(responseText.length / 4);
    const cost = tokens * 0.00002; // 模拟价格
    
    return { text: responseText, tokens, cost };
  };

  const generateWarnings = (prompt: string): string[] => {
    const warnings: string[] = [];
    
    if (prompt.length > 2000) {
      warnings.push('提示词较长，可能影响响应速度');
    }
    
    if (!/你是|作为|扮演/.test(prompt)) {
      warnings.push('建议添加明确的角色定义');
    }
    
    if (!/请|帮我|需要/.test(prompt)) {
      warnings.push('任务指令可以更明确');
    }
    
    if (!/格式|输出|结构/.test(prompt)) {
      warnings.push('建议指定输出格式');
    }
    
    return warnings;
  };

  const updateTestVariable = (key: string, value: string) => {
    setTestVariables(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`prompt-preview-panel ${className}`}>
      {/* 控制面板 */}
      <div className="bg-dark-bg-secondary/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <EyeIcon className="h-5 w-5 text-neon-cyan" />
            <h3 className="text-lg font-semibold text-white">效果预览</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={autoPreview}
                onChange={(e) => setAutoPreview(e.target.checked)}
                className="rounded"
              />
              自动预览
            </label>
            
            <button
              onClick={generatePreview}
              disabled={isGenerating || !content.trim()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isGenerating || !content.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover:shadow-neon'
              }`}
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  生成预览
                </>
              )}
            </button>
          </div>
        </div>

        {/* 变量设置 */}
        {Object.keys(testVariables).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">测试变量设置</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(testVariables).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-20 truncate">{key}:</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateTestVariable(key, e.target.value)}
                    placeholder={`输入${key}的值`}
                    className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 预览结果 */}
      <AnimatePresence>
        {previewResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* 状态信息 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-dark-bg-secondary/30 rounded-lg p-3 text-center">
                <ClockIcon className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">响应时间</div>
                <div className="text-sm font-medium text-white">
                  {previewResult.responseTime ? `${previewResult.responseTime}ms` : '-'}
                </div>
              </div>
              
              <div className="bg-dark-bg-secondary/30 rounded-lg p-3 text-center">
                <SparklesIcon className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Token使用</div>
                <div className="text-sm font-medium text-white">
                  {previewResult.tokensUsed || '-'}
                </div>
              </div>
              
              <div className="bg-dark-bg-secondary/30 rounded-lg p-3 text-center">
                <CurrencyDollarIcon className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">预估成本</div>
                <div className="text-sm font-medium text-white">
                  ${previewResult.estimatedCost?.toFixed(4) || '0.0000'}
                </div>
              </div>
            </div>

            {/* 警告信息 */}
            {previewResult.warnings && previewResult.warnings.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-300">优化建议</span>
                </div>
                <ul className="space-y-1">
                  {previewResult.warnings.map((warning, index) => (
                    <li key={index} className="text-xs text-yellow-200 flex items-center gap-1">
                      <span className="w-1 h-1 bg-yellow-400 rounded-full" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 预览内容 */}
            {previewResult.success ? (
              <div className="bg-dark-bg-secondary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-300">预览结果</span>
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-800/50 rounded p-3 max-h-60 overflow-y-auto">
                  {previewResult.preview}
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-300">预览失败</span>
                </div>
                <div className="text-sm text-red-200">{previewResult.error}</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 空状态 */}
      {!previewResult && !isGenerating && (
        <div className="text-center py-12 text-gray-500">
          <EyeIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">输入提示词内容后，点击"生成预览"查看效果</p>
        </div>
      )}
    </div>
  );
};

export default PromptPreviewPanel; 