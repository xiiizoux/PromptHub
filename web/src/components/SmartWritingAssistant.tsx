import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LightBulbIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  BeakerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AIAnalyzeButton, AIAnalysisResultDisplay } from './AIAnalyzeButton';
import { PromptOptimizer } from './PromptOptimizer';
import { AIAnalysisResult } from '@/lib/ai-analyzer';

interface SmartWritingAssistantProps {
  content: string;
  onContentChange: (content: string) => void;
  onAnalysisComplete?: (result: Partial<AIAnalysisResult>) => void;
  onApplyAnalysisResults?: (data: Partial<AIAnalysisResult>) => void;
  pendingAIAnalysis?: Partial<AIAnalysisResult> | null;
  className?: string;
  category?: string;
  tags?: string[];
}

interface WritingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  suggestions: string[];
}

const SmartWritingAssistant: React.FC<SmartWritingAssistantProps> = ({
  content,
  onContentChange,
  onAnalysisComplete,
  onApplyAnalysisResults,
  pendingAIAnalysis,
  className = '',
  category,
  tags,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'analysis' | 'templates' | 'optimizer'>('guide');
  

  const [writingSteps, setWritingSteps] = useState<WritingStep[]>([]);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState<any>(null);
  
  // AI分析结果状态管理
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showAiAnalysisResult, setShowAiAnalysisResult] = useState(false);

  // 初始化写作指导步骤
  useEffect(() => {
    const steps: WritingStep[] = [
      {
        id: 'role',
        title: '1. 定义AI角色',
        description: '明确告诉AI它应该扮演什么角色',
        completed: checkRoleDefinition(content),
        suggestions: [
          '你是一位专业的[领域]专家',
          '作为经验丰富的[职业]',
          '假设你是[具体角色]',
        ],
      },
      {
        id: 'context',
        title: '2. 提供背景信息',
        description: '给AI足够的上下文来理解任务',
        completed: checkContext(content),
        suggestions: [
          '背景：[描述情况]',
          '目标：[说明目的]',
          '约束：[限制条件]',
        ],
      },
      {
        id: 'task',
        title: '3. 明确具体任务',
        description: '用清晰的动词描述需要完成的任务',
        completed: checkTaskDescription(content),
        suggestions: [
          '请帮我分析...',
          '请为我生成...',
          '请协助我创建...',
        ],
      },
      {
        id: 'format',
        title: '4. 指定输出格式',
        description: '告诉AI你希望得到什么样的回答',
        completed: checkOutputFormat(content),
        suggestions: [
          '请按以下格式输出：',
          '回答应包含：1. ... 2. ... 3. ...',
          '以[格式]形式提供结果',
        ],
      },
    ];
    setWritingSteps(steps);
  }, [content]);

  // 实时质量评估
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length > 20) {
        analyzeContentQuality(content);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content]);

  // 处理从URL参数传递来的待应用AI分析结果
  useEffect(() => {
    if (pendingAIAnalysis) {
      console.log('收到待应用的AI分析结果:', pendingAIAnalysis);
      setAiAnalysisResult({
        category: pendingAIAnalysis.category || '',
        ...pendingAIAnalysis,
      } as any);
      setShowAiAnalysisResult(true);
      setActiveTab('analysis'); // 自动切换到分析标签页
    }
  }, [pendingAIAnalysis]);

  const analyzeContentQuality = async (text: string) => {
    try {
      const score = calculateBasicScore(text);
      setQualityScore(score);
      
      const analysis = {
        hasRole: checkRoleDefinition(text),
        hasTask: checkTaskDescription(text),
        hasFormat: checkOutputFormat(text),
        hasContext: checkContext(text),
        wordCount: text.length,
        suggestions: generateRealTimeSuggestions(text),
      };
      setRealTimeAnalysis(analysis);
    } catch (error) {
      console.error('实时分析失败:', error);
    }
  };

  const generateRealTimeSuggestions = (text: string): string[] => {
    const suggestions: string[] = [];

    if (!checkRoleDefinition(text)) {
      suggestions.push('💡 建议添加AI角色定义，如"你是一位..."');
    }
    if (!checkTaskDescription(text)) {
      suggestions.push('🎯 任务描述可以更具体，使用"请帮我..."等明确指令');
    }
    if (!checkOutputFormat(text)) {
      suggestions.push('📋 指定输出格式会大大提升回答质量');
    }
    if (text.length < 50) {
      suggestions.push('📝 提示词略短，可以添加更多细节和要求');
    }
    if (text.length > 1000) {
      suggestions.push('✂️ 提示词较长，考虑精简核心要求');
    }

    return suggestions;
  };

  const applyTemplate = (template: string) => {
    onContentChange(template);
  };

  const handleOptimizationComplete = (optimizedContent: string) => {
    onContentChange(optimizedContent);
  };

  // 处理AI分析完成
  const handleAIAnalysisComplete = (result: Partial<AIAnalysisResult>) => {
    console.log('SmartWritingAssistant 收到AI分析结果:', result);
    
    if (result as AIAnalysisResult) {
      setAiAnalysisResult(result as AIAnalysisResult);
      setShowAiAnalysisResult(true);
      
      // 自动切换到智能分析标签页显示结果
      setActiveTab('analysis');
      
      // 如果父组件有回调，也调用它
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    }
  };

  // 应用AI分析结果（传递给父组件处理）
  const handleApplyAIResults = (data: Partial<AIAnalysisResult>) => {
    console.log('应用AI分析结果:', data);
    
    // 使用专门的应用回调，而不是分析完成回调
    if (onApplyAnalysisResults) {
      onApplyAnalysisResults(data);
    }
    
    // 隐藏分析结果
    setShowAiAnalysisResult(false);
  };

  const tabs = [
    { id: 'guide', label: '写作指南', icon: LightBulbIcon },
    { id: 'analysis', label: '智能分析', icon: BeakerIcon },
    { id: 'templates', label: '快速模板', icon: ClipboardDocumentIcon },
    { id: 'optimizer', label: '智能优化', icon: SparklesIcon },
  ];

  return (
    <div className={`smart-writing-assistant ${className}`}>
      {/* 质量指示器 */}
      {qualityScore !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getQualityColor(qualityScore)}`} />
              <span className="text-sm font-medium text-white">
                写作质量: {qualityScore}分
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {getQualityText(qualityScore)}
            </div>
          </div>
          
          {realTimeAnalysis?.suggestions && realTimeAnalysis.suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {realTimeAnalysis.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
                <div key={index} className="text-xs text-blue-300 flex items-center gap-1">
                  <ArrowRightIcon className="h-3 w-3" />
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* 标签导航 */}
      <div className="flex space-x-1 p-1 bg-dark-bg-secondary/50 rounded-lg mb-6">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        {activeTab === 'guide' && (
          <motion.div
            key="guide"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <h3 className="text-base font-semibold text-white mb-4">📝 写作步骤指导</h3>
            {writingSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border transition-all ${
                  step.completed
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-gray-600/30 bg-gray-800/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${step.completed ? 'text-green-400' : 'text-gray-400'}`}>
                    {step.completed ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium mb-1 ${step.completed ? 'text-green-300' : 'text-white'}`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-400 mb-3">{step.description}</p>
                    
                    {!step.completed && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">建议表达：</p>
                        {step.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const newContent = content + (content ? '\n' : '') + suggestion;
                              onContentChange(newContent);
                            }}
                            className="block text-left text-xs text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'analysis' && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">🔍 智能分析</h3>
              <AIAnalyzeButton
                content={content}
                onAnalysisComplete={handleAIAnalysisComplete}
                variant="full"
                className="text-sm"
              />
            </div>
            
            <div className="bg-dark-bg-secondary/30 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-white">实时分析结果</h4>
              {realTimeAnalysis ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${realTimeAnalysis.hasRole ? 'text-green-400' : 'text-gray-400'}`}>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="text-sm">角色定义</span>
                    </div>
                    <div className={`flex items-center gap-2 ${realTimeAnalysis.hasTask ? 'text-green-400' : 'text-gray-400'}`}>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="text-sm">任务描述</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${realTimeAnalysis.hasFormat ? 'text-green-400' : 'text-gray-400'}`}>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="text-sm">输出格式</span>
                    </div>
                    <div className={`flex items-center gap-2 ${realTimeAnalysis.hasContext ? 'text-green-400' : 'text-gray-400'}`}>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="text-sm">背景信息</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">开始输入内容以获得实时分析...</p>
              )}
            </div>
            
            {/* AI智能分析结果显示 */}
            <AnimatePresence>
              {showAiAnalysisResult && aiAnalysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">🤖 AI分析结果</h4>
                    <button
                      type="button"
                      onClick={() => setShowAiAnalysisResult(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="关闭AI分析结果"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <AIAnalysisResultDisplay
                    result={aiAnalysisResult}
                    onApplyResults={handleApplyAIResults}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <h3 className="text-base font-semibold text-white mb-4">📋 快速模板</h3>
            <QuickTemplates onApplyTemplate={applyTemplate} category={category} />
          </motion.div>
        )}

        {activeTab === 'optimizer' && (
          <motion.div
            key="optimizer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <h3 className="text-base font-semibold text-white mb-4">✨ 智能优化</h3>
            {content ? (
              <PromptOptimizer
                initialPrompt={content}
                onOptimizedPrompt={handleOptimizationComplete}
                className="bg-dark-bg-secondary/30 rounded-lg p-4"
              />
            ) : (
              <p className="text-gray-400 text-sm">请先输入提示词内容...</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 快速模板组件
const QuickTemplates: React.FC<{
  onApplyTemplate: (template: string) => void;
  category?: string;
}> = ({ onApplyTemplate, category }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    fetchTemplates();
  }, [category]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, allTemplates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // 获取更多模板用于搜索
      const params = new URLSearchParams({
        featured: 'true',
        limit: searchQuery ? '20' : '4',  // 如果有搜索词，获取更多模板
      });

      const url = `/api/templates?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const formattedTemplates = result.data.map((template: any) => ({
          name: template.title,
          category: template.category_info?.display_name || template.category,
          template: template.content,
          tags: template.tags || [],
          description: template.description || '',
        }));
        
        setAllTemplates(formattedTemplates);
        if (!searchQuery) {
          setTemplates(formattedTemplates.slice(0, 4)); // 默认显示4个
        }
        
      } else {
        console.warn('QuickTemplates: API返回空数据或格式不正确:', {
          hasData: !!result.data,
          dataType: typeof result.data,
          isArray: Array.isArray(result.data),
          length: result.data?.length,
          result,
        });
        
        // 设置默认模板作为后备
        const fallbackTemplates = [
          {
            name: '专业分析师',
            category: '分析研究',
            template: `你是一位专业的{{领域}}分析师，拥有丰富的行业经验和敏锐的洞察力。

请对以下内容进行深入分析：
{{分析对象}}

分析要求：
1. 从多个角度进行全面分析
2. 提供具体的数据和事实支撑
3. 给出可行的建议和解决方案`,
            tags: ['分析', '专业', '研究'],
            description: '专业的分析师模板，适用于各种分析场景',
          },
        ];
        
        setAllTemplates(fallbackTemplates);
        setTemplates(fallbackTemplates);
      }
    } catch (error) {
      console.error('QuickTemplates: 获取模板失败:', error);
      
      // 设置默认模板作为后备
      const fallbackTemplates = [
        {
          name: '专业分析师',
          category: '分析研究',
          template: `你是一位专业的{{领域}}分析师，拥有丰富的行业经验和敏锐的洞察力。

请对以下内容进行深入分析：
{{分析对象}}

分析要求：
1. 从多个角度进行全面分析
2. 提供具体的数据和事实支撑
3. 给出可行的建议和解决方案`,
          tags: ['分析', '专业', '研究'],
          description: '专业的分析师模板，适用于各种分析场景',
        },
      ];
      
      setAllTemplates(fallbackTemplates);
      setTemplates(fallbackTemplates);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // 如果搜索词为空，显示默认的精选模板
      setTemplates(allTemplates.slice(0, 4));
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // 调用API进行搜索
      const params = new URLSearchParams({
        search: searchQuery,
        limit: '12',
      });

      const url = `/api/templates?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        const formattedTemplates = result.data.map((template: any) => ({
          name: template.title,
          category: template.category_info?.display_name || template.category,
          template: template.content,
          tags: template.tags || [],
          description: template.description || '',
        }));
        
        setTemplates(formattedTemplates);
      } else {
        // 本地搜索作为后备
        const filtered = allTemplates.filter(template =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
        );
        setTemplates(filtered);
      }
    } catch (error) {
      console.error('QuickTemplates: 搜索失败:', error);
      // 使用本地搜索作为后备
      const filtered = allTemplates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      );
      setTemplates(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-600/30 rounded-lg animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="p-4 bg-gradient-to-r from-dark-bg-secondary/40 to-dark-bg-secondary/20 rounded-xl border border-gray-600/30 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-3">
                  <div className="h-4 bg-gray-600 rounded w-2/3 mb-1"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                </div>
                <div className="h-5 bg-neon-cyan/20 rounded-full w-16"></div>
              </div>
              <div className="mb-3">
                <div className="h-3 bg-gray-600 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-600 rounded w-4/5"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <div className="h-5 bg-gray-600 rounded w-12"></div>
                  <div className="h-5 bg-gray-600 rounded w-10"></div>
                </div>
                <div className="h-3 bg-neon-cyan/20 rounded w-8"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          id="writing-assistant-search"
          name="writingAssistantSearch"
          type="search"
          placeholder="搜索模板..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          aria-label="搜索写作模板"
          className="w-full pl-10 pr-10 py-2 bg-dark-bg-secondary/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan/50 transition-all text-sm"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {isSearching && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-cyan"></div>
          </div>
        )}
      </div>

      {/* 模板计数和状态 */}
      <div className="flex items-center justify-between">
        <div className="text-white text-sm">
          {searchQuery ? (
            <span>搜索结果 ({templates.length}个)</span>
          ) : (
            <span>快速模板 ({templates.length}个)</span>
          )}
        </div>
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
          >
            清除搜索
          </button>
        )}
      </div>

      {/* 模板网格 */}
      {templates.length === 0 && !loading ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            {searchQuery ? '未找到匹配的模板' : '暂无可用模板'}
          </div>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors"
            >
              查看所有模板
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template, index) => (
            <motion.div
              key={`${template.name}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-r from-dark-bg-secondary/40 to-dark-bg-secondary/20 rounded-xl border border-gray-600/30 hover:border-neon-cyan/50 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                onClick={() => onApplyTemplate(template.template)}
              >
                {/* 顶部标题行 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-3">
                    <h4 className="text-sm font-semibold text-white group-hover:text-neon-cyan transition-colors mb-1">
                      {template.name}
                    </h4>
                    {template.description && (
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-neon-cyan/20 text-neon-cyan rounded-full font-medium whitespace-nowrap">
                    {template.category}
                  </span>
                </div>
                
                {/* 内容预览 */}
                <div className="mb-3">
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2 leading-relaxed">
                    {template.template.substring(0, 120)}...
                  </p>
                </div>
                
                {/* 标签和操作区域 */}
                <div className="flex items-center justify-between">
                  {template.tags && template.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 flex-1">
                      {template.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                        <span
                          key={tagIndex}
                          className="text-xs px-2 py-1 bg-gray-700/60 text-gray-300 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{template.tags.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1"></div>
                  )}
                  
                  <div className="flex items-center text-xs text-neon-cyan group-hover:text-neon-cyan/80 transition-colors ml-3">
                    <span className="mr-1">应用</span>
                    <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                {/* 悬停效果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// 辅助函数
const checkRoleDefinition = (content: string): boolean => {
  const roleKeywords = ['你是', '作为', '扮演', '角色', '专家', '助手'];
  return roleKeywords.some(keyword => content.includes(keyword));
};

const checkContext = (content: string): boolean => {
  const contextKeywords = ['背景', '情况', '目标', '要求', '约束', '条件'];
  return contextKeywords.some(keyword => content.includes(keyword));
};

const checkTaskDescription = (content: string): boolean => {
  const taskKeywords = ['请', '帮我', '协助', '分析', '生成', '创建', '完成'];
  return taskKeywords.some(keyword => content.includes(keyword));
};

const checkOutputFormat = (content: string): boolean => {
  const formatKeywords = ['格式', '输出', '按照', '结构', '形式', '包含'];
  return formatKeywords.some(keyword => content.includes(keyword));
};

const calculateBasicScore = (content: string): number => {
  let score = 50; // 基础分
  
  if (checkRoleDefinition(content)) {score += 15;}
  if (checkContext(content)) {score += 10;}
  if (checkTaskDescription(content)) {score += 15;}
  if (checkOutputFormat(content)) {score += 10;}
  
  // 长度调整
  if (content.length > 100) {score += 5;}
  if (content.length > 200) {score += 5;}
  if (content.length > 500) {score -= 5;} // 太长扣分
  
  return Math.min(100, Math.max(0, score));
};

const getQualityColor = (score: number): string => {
  if (score >= 80) {return 'bg-green-400';}
  if (score >= 60) {return 'bg-yellow-400';}
  return 'bg-red-400';
};

const getQualityText = (score: number): string => {
  if (score >= 80) {return '优秀';}
  if (score >= 60) {return '良好';}
  return '需要改进';
};

export default SmartWritingAssistant; 