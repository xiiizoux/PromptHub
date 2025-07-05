/**
 * Context Engineering提示词编辑器
 * 
 * 这是一个革命性的提示词编辑器，支持传统模式和Context Engineering模式之间的无缝切换
 * 为用户提供直观的可视化编辑界面，同时保持对高级用户的强大功能支持
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CodeBracketIcon,
  CogIcon,
  DocumentTextIcon,
  TagIcon,
  BeakerIcon,
  SparklesIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
  ClipboardDocumentIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  LightBulbIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { PromptDetails, PromptContentJsonb } from '@/types';

interface ContextualPromptEditorProps {
  prompt: PromptDetails;
  onSave: (updatedPrompt: Partial<PromptDetails>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const TABS = [
  { id: 'static', name: '静态内容', icon: DocumentTextIcon, description: '提示词的基础模板' },
  { id: 'dynamic', name: '动态上下文', icon: SparklesIcon, description: '智能适应规则和示例' },
  { id: 'variables', name: '变量', icon: TagIcon, description: '输入参数定义' },
  { id: 'settings', name: '设置', icon: CogIcon, description: '元数据和配置' },
  { id: 'preview', name: '预览', icon: EyeIcon, description: '实时效果预览' },
];

export default function ContextualPromptEditor({ 
  prompt, 
  onSave, 
  onCancel, 
  isLoading = false, 
}: ContextualPromptEditorProps) {
  const [isCeEnabled, setIsCeEnabled] = useState(prompt.context_engineering_enabled || false);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [content, setContent] = useState<PromptContentJsonb | string>(
    prompt.content_structure || prompt.content || '',
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // 编辑状态
  const [staticContent, setStaticContent] = useState('');
  const [adaptationRules, setAdaptationRules] = useState<any[]>([]);
  const [examples, setExamples] = useState<any[]>([]);
  const [variables, setVariables] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    version: '1.0',
    isPublic: prompt.is_public || false,
    compatibleModels: prompt.compatible_models || [],
    tags: prompt.tags || [],
  });

  // 初始化编辑器状态
  useEffect(() => {
    if (typeof content === 'object' && content.type === 'context_engineering') {
      setStaticContent(content.static_content || '');
      setAdaptationRules(content.dynamic_context?.adaptation_rules || []);
      setExamples(content.dynamic_context?.examples?.example_pool || []);
    } else if (typeof content === 'string') {
      setStaticContent(content);
    }
    
    setVariables(prompt.input_variables || extractVariables(staticContent));
  }, [content, prompt]);

  // 切换Context Engineering模式
  const handleToggleCe = useCallback((enabled: boolean) => {
    setIsCeEnabled(enabled);
    setHasUnsavedChanges(true);
    
    if (enabled) {
      // 转换为JSONB结构
      const ceContent: PromptContentJsonb = {
        type: 'context_engineering',
        static_content: typeof content === 'string' ? content : staticContent,
        dynamic_context: {
          adaptation_rules: [],
          examples: {
            selection_strategy: 'similarity_based',
            max_examples: 3,
            example_pool: [],
          },
          tools: {
            available_tools: [],
            tool_selection_criteria: 'task_based',
          },
        },
        fallback_content: typeof content === 'string' ? content : staticContent,
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          last_modified: new Date().toISOString(),
        },
      };
      setContent(ceContent);
    } else {
      // 转换回纯文本
      setContent(staticContent || '');
    }
  }, [content, staticContent]);

  // 保存处理
  const handleSave = async () => {
    try {
      // 验证内容
      const errors = validateContent();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      // 构建更新数据
      const updatedPrompt: Partial<PromptDetails> = {
        ...prompt,
        context_engineering_enabled: isCeEnabled,
        input_variables: variables,
        tags: settings.tags,
        is_public: settings.isPublic,
        compatible_models: settings.compatibleModels,
      };

      if (isCeEnabled) {
        // Context Engineering模式
        const ceContent: PromptContentJsonb = {
          type: 'context_engineering',
          static_content: staticContent,
          dynamic_context: {
            adaptation_rules: adaptationRules,
            examples: {
              selection_strategy: 'similarity_based',
              max_examples: 3,
              example_pool: examples,
            },
            tools: {
              available_tools: [],
              tool_selection_criteria: 'task_based',
            },
          },
          fallback_content: staticContent,
          metadata: {
            version: settings.version,
            created_at: new Date().toISOString(),
            last_modified: new Date().toISOString(),
          },
        };
        updatedPrompt.content_structure = ceContent;
        updatedPrompt.content_text = staticContent;
      } else {
        // 传统模式
        updatedPrompt.content_text = staticContent;
        updatedPrompt.content = staticContent;
      }

      await onSave(updatedPrompt);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 内容验证
  const validateContent = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!staticContent.trim()) {
      errors.staticContent = '静态内容不能为空';
    }
    
    if (isCeEnabled && adaptationRules.length === 0) {
      errors.adaptationRules = '启用Context Engineering时建议至少添加一个适应规则';
    }
    
    return errors;
  };

  // 提取变量
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) {return [];}
    return Array.from(new Set(
      matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim()),
    ));
  };

  // 监听内容变化以更新变量
  useEffect(() => {
    const detectedVariables = extractVariables(staticContent);
    setVariables(prev => {
      const combined = [...new Set([...prev, ...detectedVariables])];
      return combined;
    });
  }, [staticContent]);

  return (
    <div className="max-w-6xl mx-auto bg-dark-bg-primary">
      {/* 头部控制栏 */}
      <motion.div 
        className="glass rounded-xl p-6 border border-neon-cyan/20 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white gradient-text flex items-center">
              <PencilSquareIcon className="h-6 w-6 mr-3 text-neon-cyan" />
              编辑提示词
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {isCeEnabled ? 'Context Engineering模式 - 智能化编辑' : '传统模式 - 简单编辑'}
            </p>
          </div>

          {/* Context Engineering切换开关 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-300">启用Context Engineering</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCeEnabled}
                  onChange={(e) => handleToggleCe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  isCeEnabled ? 'bg-neon-cyan' : 'bg-gray-600'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    isCeEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </label>
              {isCeEnabled && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center text-neon-cyan"
                >
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">已启用</span>
                </motion.div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isLoading || !hasUnsavedChanges}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center ${
                  hasUnsavedChanges && !isLoading
                    ? 'bg-neon-cyan text-black hover:bg-cyan-400'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    保存提示词
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 状态指示器 */}
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center"
          >
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2" />
            <span className="text-sm text-yellow-500">您有未保存的更改</span>
          </motion.div>
        )}
      </motion.div>

      {/* 主编辑区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧选项卡导航 */}
        <div className="lg:col-span-1">
          <motion.div 
            className="glass rounded-xl border border-neon-cyan/20 overflow-hidden sticky top-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-4 bg-gradient-to-r from-neon-cyan/10 to-neon-blue/10 border-b border-neon-cyan/20">
              <h3 className="font-semibold text-white">编辑选项</h3>
            </div>
            <nav className="p-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isDisabled = !isCeEnabled && ['dynamic', 'variables'].includes(tab.id);
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 mb-1 ${
                      activeTab === tab.id
                        ? 'bg-neon-cyan text-black'
                        : isDisabled
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-3 ${
                        activeTab === tab.id ? 'text-black' : isDisabled ? 'text-gray-600' : 'text-neon-cyan'
                      }`} />
                      <div>
                        <div className="font-medium">{tab.name}</div>
                        <div className={`text-xs ${
                          activeTab === tab.id ? 'text-black/70' : 'text-gray-500'
                        }`}>
                          {tab.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        </div>

        {/* 右侧内容编辑区 */}
        <div className="lg:col-span-3">
          <motion.div 
            className="glass rounded-xl border border-neon-cyan/20 overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );

  // 渲染选项卡内容
  function renderTabContent() {
    switch (activeTab) {
      case 'static':
        return <StaticContentEditor />;
      case 'dynamic':
        return <DynamicContextEditor />;
      case 'variables':
        return <VariablesEditor />;
      case 'settings':
        return <SettingsEditor />;
      case 'preview':
        return <PreviewPanel />;
      default:
        return null;
    }
  }

  // 静态内容编辑器
  function StaticContentEditor() {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-neon-green" />
            静态内容
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>字符数: {staticContent.length}</span>
            <span>•</span>
            <span>变量: {extractVariables(staticContent).length}</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <textarea
            value={staticContent}
            onChange={(e) => {
              setStaticContent(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="输入您的提示词内容...&#10;&#10;使用 {{变量名}} 来定义可替换的变量&#10;例如: 请帮我{{任务}}，风格要求{{风格}}。"
            className="w-full h-96 px-4 py-3 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white placeholder-gray-500 font-mono text-sm leading-relaxed focus:border-neon-green focus:outline-none resize-none"
          />
          
          {validationErrors.staticContent && (
            <div className="flex items-center text-red-400 text-sm">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              {validationErrors.staticContent}
            </div>
          )}
          
          {/* 实时变量检测 */}
          {staticContent && (
            <div className="p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg">
              <div className="text-sm font-medium text-neon-green mb-2">检测到的变量:</div>
              <div className="flex flex-wrap gap-2">
                {extractVariables(staticContent).map((variable, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 动态上下文编辑器
  function DynamicContextEditor() {
    if (!isCeEnabled) {
      return (
        <div className="p-6 text-center">
          <BeakerIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">需要启用Context Engineering</h3>
          <p className="text-gray-500">请先启用Context Engineering模式以使用高级功能</p>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white flex items-center mb-6">
          <SparklesIcon className="h-5 w-5 mr-2 text-neon-purple" />
          动态上下文配置
        </h3>
        
        <div className="space-y-6">
          {/* 适应规则 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">适应规则</h4>
              <button
                onClick={() => {
                  setAdaptationRules([...adaptationRules, { condition: '', action: '' }]);
                  setHasUnsavedChanges(true);
                }}
                className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded text-sm hover:bg-neon-purple/30 transition-colors"
              >
                添加规则
              </button>
            </div>
            
            {adaptationRules.length > 0 ? (
              <div className="space-y-3">
                {adaptationRules.map((rule, index) => (
                  <div key={index} className="p-4 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">条件</label>
                        <input
                          type="text"
                          value={rule.condition || ''}
                          onChange={(e) => {
                            const newRules = [...adaptationRules];
                            newRules[index] = { ...newRules[index], condition: e.target.value };
                            setAdaptationRules(newRules);
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="例如: user.style === 'formal'"
                          className="w-full px-3 py-2 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">动作</label>
                        <input
                          type="text"
                          value={rule.action || ''}
                          onChange={(e) => {
                            const newRules = [...adaptationRules];
                            newRules[index] = { ...newRules[index], action: e.target.value };
                            setAdaptationRules(newRules);
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="例如: append('请使用正式语言')"
                          className="w-full px-3 py-2 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAdaptationRules(adaptationRules.filter((_, i) => i !== index));
                        setHasUnsavedChanges(true);
                      }}
                      className="mt-2 text-red-400 text-sm hover:text-red-300"
                    >
                      删除规则
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-gray-600 rounded-lg text-center">
                <WrenchScrewdriverIcon className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">暂无适应规则，点击上方按钮添加</p>
              </div>
            )}
          </div>

          {/* 示例池 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">示例池</h4>
              <button
                onClick={() => {
                  setExamples([...examples, { input: '', output: '', description: '' }]);
                  setHasUnsavedChanges(true);
                }}
                className="px-3 py-1 bg-neon-blue/20 text-neon-blue rounded text-sm hover:bg-neon-blue/30 transition-colors"
              >
                添加示例
              </button>
            </div>
            
            {examples.length > 0 ? (
              <div className="space-y-4">
                {examples.map((example, index) => (
                  <div key={index} className="p-4 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg">
                    <input
                      type="text"
                      value={example.description || ''}
                      onChange={(e) => {
                        const newExamples = [...examples];
                        newExamples[index] = { ...newExamples[index], description: e.target.value };
                        setExamples(newExamples);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="示例描述"
                      className="w-full px-3 py-2 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm mb-3"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">输入</label>
                        <textarea
                          value={example.input || ''}
                          onChange={(e) => {
                            const newExamples = [...examples];
                            newExamples[index] = { ...newExamples[index], input: e.target.value };
                            setExamples(newExamples);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm h-20 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">输出</label>
                        <textarea
                          value={example.output || ''}
                          onChange={(e) => {
                            const newExamples = [...examples];
                            newExamples[index] = { ...newExamples[index], output: e.target.value };
                            setExamples(newExamples);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm h-20 resize-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setExamples(examples.filter((_, i) => i !== index));
                        setHasUnsavedChanges(true);
                      }}
                      className="mt-2 text-red-400 text-sm hover:text-red-300"
                    >
                      删除示例
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-gray-600 rounded-lg text-center">
                <AcademicCapIcon className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">暂无示例，点击上方按钮添加</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 变量编辑器
  function VariablesEditor() {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white flex items-center mb-6">
          <TagIcon className="h-5 w-5 mr-2 text-neon-pink" />
          输入变量管理
        </h3>
        
        <div className="space-y-4">
          {variables.length > 0 ? (
            <div className="space-y-3">
              {variables.map((variable, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg">
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 text-neon-pink mr-2" />
                    <span className="font-mono text-white">{variable}</span>
                  </div>
                  <button
                    onClick={() => {
                      setVariables(variables.filter((_, i) => i !== index));
                      setHasUnsavedChanges(true);
                    }}
                    className="text-red-400 text-sm hover:text-red-300"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-gray-600 rounded-lg text-center">
              <TagIcon className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-500">在静态内容中使用 {'{{'} 变量名 {'}}'} 来定义变量</p>
            </div>
          )}
          
          {/* 手动添加变量 */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="手动添加变量名"
              className="flex-1 px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && !variables.includes(value)) {
                    setVariables([...variables, value]);
                    (e.target as HTMLInputElement).value = '';
                    setHasUnsavedChanges(true);
                  }
                }
              }}
            />
            <button className="px-4 py-2 bg-neon-pink/20 text-neon-pink rounded text-sm hover:bg-neon-pink/30 transition-colors">
              添加
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 设置编辑器
  function SettingsEditor() {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white flex items-center mb-6">
          <CogIcon className="h-5 w-5 mr-2 text-neon-yellow" />
          提示词设置
        </h3>
        
        <div className="space-y-6">
          {/* 基本设置 */}
          <div>
            <h4 className="font-medium text-white mb-4">基本设置</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">公开访问</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isPublic}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, isPublic: e.target.checked }));
                      setHasUnsavedChanges(true);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    settings.isPublic ? 'bg-neon-yellow' : 'bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      settings.isPublic ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">版本号</label>
                <input
                  type="text"
                  value={settings.version}
                  onChange={(e) => {
                    setSettings(prev => ({ ...prev, version: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* 标签设置 */}
          <div>
            <h4 className="font-medium text-white mb-4">标签</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {settings.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-neon-yellow/20 text-neon-yellow rounded-full text-sm flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        tags: prev.tags.filter((_, i) => i !== index),
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    className="ml-2 text-neon-yellow/70 hover:text-neon-yellow"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="输入标签后按回车添加"
              className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && !settings.tags.includes(value)) {
                    setSettings(prev => ({ ...prev, tags: [...prev.tags, value] }));
                    (e.target as HTMLInputElement).value = '';
                    setHasUnsavedChanges(true);
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 预览面板
  function PreviewPanel() {
    const previewContent = isCeEnabled ? staticContent : (typeof content === 'string' ? content : staticContent);
    
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white flex items-center mb-6">
          <EyeIcon className="h-5 w-5 mr-2 text-neon-blue" />
          实时预览
        </h3>
        
        <div className="space-y-6">
          {/* 内容预览 */}
          <div>
            <h4 className="font-medium text-white mb-3">内容预览</h4>
            <div className="p-4 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg">
              <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono">
                {previewContent || '暂无内容'}
              </pre>
            </div>
          </div>

          {/* 变量预览 */}
          {variables.length > 0 && (
            <div>
              <h4 className="font-medium text-white mb-3">变量列表</h4>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-neon-blue/20 text-neon-blue rounded-full text-sm"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Context Engineering预览 */}
          {isCeEnabled && (
            <div>
              <h4 className="font-medium text-white mb-3">Context Engineering配置</h4>
              <div className="space-y-3">
                <div className="p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                  <div className="text-sm font-medium text-neon-purple mb-1">适应规则</div>
                  <div className="text-sm text-gray-300">{adaptationRules.length} 个规则</div>
                </div>
                <div className="p-3 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
                  <div className="text-sm font-medium text-neon-blue mb-1">示例池</div>
                  <div className="text-sm text-gray-300">{examples.length} 个示例</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}