import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { updatePrompt, getCategories, getTags, getPromptDetails, Category } from '@/lib/api';
import { PromptDetails, PermissionCheck } from '@/types';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  XMarkIcon,
  PlusCircleIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  CodeBracketIcon,
  TagIcon,
  DocumentTextIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { AIAnalyzeButton, AIAnalysisResultDisplay } from '@/components/AIAnalyzeButton';
import { AIAnalysisResult } from '@/lib/ai-analyzer';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import { 
  checkEditPermission, 
  checkFieldPermission,
  getPermissionDescription,
  getPermissionColor,
  PERMISSION_LEVELS,
  PERMISSION_LEVEL_DESCRIPTIONS
} from '@/lib/permissions';
import { 
  validateVersionFormat,
  canIncrementVersion,
  suggestNextVersion,
  formatVersionFromInt,
  getVersionValidationMessage
} from '@/lib/version-utils';
// @ts-ignore
import { pinyin } from 'pinyin-pro';

// 预设模型选项
const MODEL_OPTIONS = ['GPT-4', 'GPT-3.5', 'Claude-2', 'Claude-Instant', 'Gemini-Pro', 'Llama-2', 'Mistral-7B'];

type PromptFormData = Omit<PromptDetails, 'created_at' | 'updated_at'> & {
  is_public?: boolean;
  version?: string | number; // 允许版本字段为字符串或数字
};

interface EditPromptPageProps {
  prompt: PromptDetails;
}

function EditPromptPage({ prompt }: EditPromptPageProps) {
  const router = useRouter();
  const { user, getToken } = useAuth();
  
  // 格式化当前版本号
  const currentVersionFormatted = typeof prompt.version === 'number' 
    ? formatVersionFromInt(prompt.version) 
    : prompt.version || '1.0';

  // 修复edit_permission数据映射
  const mapEditPermission = (serverValue: any): 'owner_only' | 'collaborators' | 'public' => {
    switch (serverValue) {
      case 'owner':
        return 'owner_only';
      case 'collaborators':
      case 'public':
        return serverValue;
      default:
        return 'owner_only';
    }
  };

  // 确保所有数据都有默认值
  const safePromptData = {
    name: prompt.name || '',
    description: prompt.description || '',
    content: prompt.content || prompt.messages?.[0]?.content || '',
    category: prompt.category || '通用',
    tags: Array.isArray(prompt.tags) ? prompt.tags : [],
    input_variables: Array.isArray(prompt.input_variables) ? prompt.input_variables : [],
    compatible_models: Array.isArray(prompt.compatible_models) ? prompt.compatible_models : ['GPT-4', 'GPT-3.5', 'Claude-2'],
    version: currentVersionFormatted as any,
    author: prompt.author || user?.display_name || user?.username || '未知用户',
    template_format: prompt.template_format || 'text',
    is_public: prompt.is_public !== undefined ? prompt.is_public : false,
    allow_collaboration: prompt.allow_collaboration !== undefined ? prompt.allow_collaboration : false,
    edit_permission: mapEditPermission(prompt.edit_permission),
  };
  
  // 添加权限常量调试日志
  console.log('权限常量状态检查:', {
    PERMISSION_LEVELS,
    PERMISSION_LEVEL_DESCRIPTIONS,
    promptEditPermission: prompt.edit_permission,
    mappedEditPermission: safePromptData.edit_permission
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variables, setVariables] = useState<string[]>(safePromptData.input_variables);
  const [variableInput, setVariableInput] = useState('');
  const [tags, setTags] = useState<string[]>(safePromptData.tags);
  const [tagInput, setTagInput] = useState('');
  const [models, setModels] = useState<string[]>(safePromptData.compatible_models);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [permissionCheck, setPermissionCheck] = useState<PermissionCheck | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        console.log('分类数据加载完成:', {
          categories: data,
          currentCategory: safePromptData.category,
          isCurrentCategoryInList: data.some(cat => cat.name === safePromptData.category)
        });
      } catch (err) {
        console.error('获取分类失败:', err);
        setCategories([
          { name: '通用' }, { name: '创意写作' }, { name: '代码辅助' }, { name: '数据分析' }, { name: '营销' }, { name: '学术研究' }, { name: '教育' }
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);
  
  // 分类加载后自动匹配（编辑场景）
  useEffect(() => {
    if (!categoriesLoading && categories.length > 0) {
      const currentCategory = watch('category');
      if (currentCategory) {
        const matched = matchCategory(currentCategory, categories);
        if (matched) setValue('category', matched.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesLoading, categories]);
  
  // 获取标签数据
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await getTags();
        setSuggestedTags(data);
      } catch (err) {
        console.error('获取标签失败:', err);
        setSuggestedTags(['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色']);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, []);

  const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm<PromptFormData>({
    defaultValues: {
      ...(() => { const { version, ...rest } = safePromptData; return rest; })(),
      version: safePromptData.version ? String(safePromptData.version) : '1',
    }
  });

  // 一次性数据初始化：仅在组件挂载时执行
  useEffect(() => {
    // 如果input_variables为空，尝试从content中提取变量
    let finalVariables = safePromptData.input_variables || [];
    if (finalVariables.length === 0 && safePromptData.content) {
      const matches = safePromptData.content.match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        finalVariables = Array.from(new Set(
          matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim())
        )).filter(variable => variable.length > 0);
      }
    }
    
    // 同步状态变量（但不调用setValue避免无限循环）
    setVariables(finalVariables);
    setTags(safePromptData.tags || []);
    setModels(safePromptData.compatible_models || []);
    
    console.log('前端一次性数据初始化完成:', {
      promptName: safePromptData.name,
      category: safePromptData.category,
      extractedVariables: finalVariables,
      originalVariables: safePromptData.input_variables,
      tags: safePromptData.tags,
      models: safePromptData.compatible_models,
      content: safePromptData.content ? safePromptData.content.substring(0, 100) + '...' : 'empty',
      formDefaultValues: {
        name: safePromptData.name,
        category: safePromptData.category,
        description: safePromptData.description
      }
    });
  }, []); // 空依赖数组，仅执行一次

  // 权限检查和作者信息更新
  useEffect(() => {
    if (user) {
      const permission = checkEditPermission(prompt, user);
      setPermissionCheck(permission);
      
      // 更新作者信息如果当前没有作者或作者为未知用户
      if (!prompt.author || prompt.author === '未知用户') {
        const authorName = user.display_name || user.username || user.email.split('@')[0];
        setValue('author', authorName);
      }
      
      // 如果没有权限，3秒后重定向到详情页
      if (!permission.canEdit) {
        setTimeout(() => {
          router.push(`/prompts/${prompt.id}`);
        }, 3000);
      }
    }
  }, [user, prompt, router, setValue]);

  // 监听表单变化以检测未保存的更改
  const watchedValues = watch();
  useEffect(() => {
    const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify({
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      version: prompt.version || '1.0',
      author: prompt.author || user?.display_name || user?.username || '',
      template_format: prompt.template_format || 'text',
      input_variables: prompt.input_variables || [],
      tags: prompt.tags || [],
      compatible_models: prompt.compatible_models || [],
      is_public: prompt.is_public || false,
      allow_collaboration: prompt.allow_collaboration || false,
      edit_permission: prompt.edit_permission || 'owner_only',
    });
    setHasUnsavedChanges(hasChanges);
  }, [watchedValues, prompt, user]);

  // 监听提示词内容以提取变量
  const promptContent = watch('content');

  // 自动检测变量
  const detectVariables = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    if (!content) return;
    
    // 修复正则表达式以正确匹配 {{variable}} 格式
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    
    if (matches) {
      const detectedVars = Array.from(new Set(
        matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim())
      )).filter(variable => variable.length > 0);
      
      if (detectedVars.length > 0) {
        const newVariables = Array.from(new Set([...variables, ...detectedVars]));
        setVariables(newVariables);
        setValue('input_variables', newVariables);
      }
    }
  };

  // 添加变量
  const addVariable = () => {
    if (variableInput && !variables.includes(variableInput)) {
      const newVariables = [...variables, variableInput];
      setVariables(newVariables);
      setValue('input_variables', newVariables);
      setVariableInput('');
    }
  };

  // 删除变量
  const removeVariable = (variable: string) => {
    const newVariables = variables.filter(v => v !== variable);
    setVariables(newVariables);
    setValue('input_variables', newVariables);
  };

  // 添加标签
  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      const newTags = [...tags, tagInput];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  // 删除标签
  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    setValue('tags', newTags);
  };

  // 切换模型选择
  const toggleModel = (model: string) => {
    const newModels = models.includes(model)
      ? models.filter(m => m !== model)
      : [...models, model];
    
    setModels(newModels);
    setValue('compatible_models', newModels);
  };

  // AI分析处理函数
  const handleAIAnalysis = (result: Partial<AIAnalysisResult>) => {
    console.log('收到AI分析结果:', result);
    
    // 将结果设置到状态中
    if (result as AIAnalysisResult) {
      setAiAnalysisResult(result as AIAnalysisResult);
      setShowAiAnalysis(true);
    }
  };

  // 智能分类映射函数
  function matchCategory(aiCategory: string, categories: Category[]): Category | null {
    if (!aiCategory) return null;
    // 1. 精确匹配
    let match = categories.find(cat => cat.name === aiCategory);
    if (match) return match;
    // 2. 忽略大小写
    match = categories.find(cat => cat.name?.toLowerCase() === aiCategory.toLowerCase());
    if (match) return match;
    // 3. 英文名
    match = categories.find(cat => cat.name_en?.toLowerCase() === aiCategory.toLowerCase());
    if (match) return match;
    // 4. 别名
    match = categories.find(cat => cat.alias?.split(',').map(a => a.trim()).includes(aiCategory));
    if (match) return match;
    // 5. 模糊包含
    match = categories.find(cat => aiCategory.includes(cat.name) || cat.name.includes(aiCategory));
    if (match) return match;
    // 6. 拼音首字母/全拼模糊
    const aiPinyin = pinyin(aiCategory, { toneType: 'none', type: 'array' }).join('');
    const aiPinyinFirst = pinyin(aiCategory, { pattern: 'first', type: 'array' }).join('');
    for (const cat of categories) {
      const catPinyin = pinyin(cat.name, { toneType: 'none', type: 'array' }).join('');
      const catPinyinFirst = pinyin(cat.name, { pattern: 'first', type: 'array' }).join('');
      if (aiPinyin === catPinyin || aiPinyinFirst === catPinyinFirst) return cat;
      if (aiPinyin.includes(catPinyin) || catPinyin.includes(aiPinyin)) return cat;
      if (aiPinyinFirst.includes(catPinyinFirst) || catPinyinFirst.includes(aiPinyinFirst)) return cat;
    }
    // 7. 相似度最高（Levenshtein距离）
    let bestScore = 0;
    let bestCat: Category | null = null;
    for (const cat of categories) {
      const score = stringSimilarity(aiCategory, cat.name);
      if (score > bestScore) {
        bestScore = score;
        bestCat = cat;
      }
    }
    if (bestScore > 0.6) return bestCat; // 阈值可调整
    return null;
  }

  // 字符串相似度（简单Levenshtein实现或用第三方包）
  function stringSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 1;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    const longerLength = longer.length;
    if (longerLength === 0) return 1;
    return (longerLength - editDistance(longer, shorter)) / longerLength;
  }
  function editDistance(s1: string, s2: string): number {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) costs[j] = j;
        else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  // 应用AI分析结果
  const applyAIResults = (data: Partial<AIAnalysisResult>) => {
    console.log('应用AI分析结果:', data);
    
    if (data.category) {
      const matched = matchCategory(data.category, categories);
      if (matched) setValue('category', matched.name);
      else {
        setValue('category', '');
        alert('AI未能识别有效分类，请手动选择');
      }
    }
    
    // 应用标签
    if (data.tags && Array.isArray(data.tags)) {
      setTags(data.tags);
      setValue('tags', data.tags);
      setHasUnsavedChanges(true);
    }
    
    // 应用版本
    if (data.version) {
      let versionStr = '';
      if (typeof data.version === 'number') versionStr = String(data.version);
      else if (typeof data.version === 'string') versionStr = data.version;
      setValue('version', versionStr);
      setHasUnsavedChanges(true);
    }
    
    // 应用变量
    if (data.variables && Array.isArray(data.variables)) {
      setVariables(data.variables);
      setValue('input_variables', data.variables);
      setHasUnsavedChanges(true);
    }
    
    // 应用兼容模型
    if (data.compatibleModels && Array.isArray(data.compatibleModels)) {
      setModels(data.compatibleModels);
      setValue('compatible_models', data.compatibleModels);
      setHasUnsavedChanges(true);
    }
  };

  // 表单提交
  const onSubmit = async (data: PromptFormData) => {
    // 再次检查权限
    if (!permissionCheck?.canEdit) {
      alert('您没有编辑此提示词的权限');
      return;
    }

    setIsSubmitting(true);
    
    try {
      data.input_variables = variables;
      data.tags = tags;
      data.compatible_models = models;
      data.version = parseInt(String(data.version), 10) || 1;
      // 获取token
      let token = undefined;
      if (typeof window !== 'undefined' && user && typeof user === 'object') {
        if (typeof getToken === 'function') {
          token = await getToken();
        }
      }
      const result = await updatePrompt(prompt.id, data, token || undefined);
      
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      
      // 显示弹窗成功提示
      alert('✅ 提示词保存成功！');
      
      setTimeout(() => setSaveSuccess(false), 5000); // 延长显示时间
      
      // 名称更改不影响URL，因为我们使用ID
      // 无需重定向，保持在当前页面
    } catch (error) {
      console.error('更新提示词失败:', error);
      alert(`❌ 更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    reset({
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      version: (prompt.version || '1.0') as any,
      author: prompt.author || user?.display_name || user?.username || '',
      template_format: prompt.template_format || 'text',
      input_variables: prompt.input_variables || [],
      tags: prompt.tags || [],
      compatible_models: prompt.compatible_models || [],
      is_public: prompt.is_public || false,
      allow_collaboration: prompt.allow_collaboration || false,
      edit_permission: prompt.edit_permission || 'owner_only',
    });
    setVariables(prompt.input_variables || []);
    setTags(prompt.tags || []);
    setModels(prompt.compatible_models || []);
    setHasUnsavedChanges(false);
  };

  // 页面离开前的确认
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 权限检查失败时显示错误页面
  if (permissionCheck && !permissionCheck.canEdit) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Link href={`/prompts/${prompt.id}`} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              返回提示词详情
            </Link>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <ShieldExclamationIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h1>
            <p className="text-gray-600 mb-6">{permissionCheck.message}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">编辑权限说明：</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>您可以编辑自己创建的提示词</li>
                  <li>管理员可以编辑所有提示词</li>
                  <li>贡献者可以编辑公开的提示词</li>
                  <li>其他用户无法编辑他人的提示词</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Link
                href={`/prompts/${prompt.id}`}
                className="btn-primary"
              >
                查看提示词详情
              </Link>
              <Link
                href="/prompts"
                className="btn-secondary"
              >
                浏览其他提示词
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              3秒后将自动跳转到提示词详情页面...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-16">
        <div className="container-custom">
          {/* 返回按钮 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href={`/prompts/${prompt.id}`}
              className="inline-flex items-center text-neon-cyan hover:text-neon-purple transition-colors duration-300 group"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              返回提示词详情
            </Link>
          </motion.div>

          {/* 权限提示 */}
          {permissionCheck && permissionCheck.canEdit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 glass rounded-xl border border-neon-cyan/20 p-4"
            >
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-neon-cyan" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    编辑权限确认
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {permissionCheck.message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* 成功提示 */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 glass rounded-xl border border-neon-green/20 p-4"
            >
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-neon-green" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    提示词已成功更新！
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 未保存更改提示 */}
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 glass rounded-xl border border-neon-orange/20 p-4"
            >
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-neon-orange" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    您有未保存的更改
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    请记得保存您的更改，否则离开页面时将丢失。
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <motion.h1
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              编辑提示词
            </motion.h1>
            <motion.p
              className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              编辑 "{prompt.name}" 的详细信息。所有带 * 的字段为必填项。
            </motion.p>
          </motion.div>
          
          {/* 表单容器 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="glass rounded-3xl border border-neon-cyan/20 shadow-2xl p-8"
          >
          
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
              {/* 基本信息 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <SparklesIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    提示词名称 *
                  </label>
                  <input
                    {...register('name', {
                      required: '提示词名称是必填的'
                    })}
                    type="text"
                    placeholder="输入提示词名称"
                    className="input-primary w-full"
                  />
                  {errors.name && (
                    <p className="text-neon-red text-sm mt-1">{errors.name.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    提示词显示名称，可以随时修改
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <CodeBracketIcon className="h-5 w-5 text-neon-purple mr-2" />
                    版本 *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      {...register('version')}
                      type="text"
                      value={String(watch('version') ?? '')}
                      onChange={e => setValue('version', e.target.value as any)}
                      className="input-primary w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentVersion = watch('version') || currentVersionFormatted;
                        const suggested = suggestNextVersion(String(currentVersion), 'minor');
                        setValue('version', suggested as any);
                      }}
                      className="btn-secondary text-sm px-3 py-1"
                      title="建议下一版本"
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const suggested = suggestNextVersion(String(currentVersionFormatted), 'major');
                        setValue('version', suggested as any);
                      }}
                      className="btn-secondary text-sm px-3 py-1"
                      title="建议主版本"
                    >
                      +1.0
                    </button>
                  </div>
                  {errors.version && (
                    <p className="text-neon-red text-sm mt-1">{errors.version.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    当前版本：{currentVersionFormatted}，新版本必须递增且保留1位小数
                  </p>
                </div>
              </motion.div>

              {/* 分类和作者 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <TagIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    分类 *
                  </label>
                  <select
                    {...register('category', { required: '请选择分类' })}
                    className="input-primary w-full"
                    value={watch('category') || ''}
                    onChange={e => setValue('category', e.target.value)}
                    disabled={categoriesLoading}
                  >
                    <option value="">选择分类</option>
                    {categories
                      .slice()
                      .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
                      .map((cat) => (
                        <option key={cat.id || cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                  {errors.category && (
                    <p className="text-neon-red text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <UserIcon className="h-5 w-5 text-neon-purple mr-2" />
                    作者
                  </label>
                  <input
                    {...register('author')}
                    type="text"
                    placeholder={user?.username || "您的名字"}
                    className="input-primary w-full"
                    disabled={!checkFieldPermission('author', permissionCheck)}
                  />
                  {!checkFieldPermission('author', permissionCheck) && (
                    <p className="text-xs text-gray-500">
                      只有创建者和管理员可以修改作者信息
                    </p>
                  )}
                </div>
              </motion.div>

              {/* 公开/私有选项 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="flex items-center justify-between p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary"
              >
                <div className="flex items-center">
                  <div className="mr-3 text-neon-cyan">
                    {watch('is_public') ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">{watch('is_public') ? '公开分享' : '私人提示词'}</h3>
                    <p className="text-gray-400 text-sm">{watch('is_public') ? '所有人可以查看和使用您的提示词（访问权限）' : '只有您自己可以访问此提示词'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register('is_public')}
                      disabled={!checkFieldPermission('is_public', permissionCheck)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neon-cyan rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
                  </label>
                </div>
              </motion.div>

              {/* 描述 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="space-y-2"
              >
                <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                  <DocumentTextIcon className="h-5 w-5 text-neon-cyan mr-2" />
                  描述 *
                </label>
                <textarea
                  {...register('description', { required: '请输入描述' })}
                  rows={3}
                  placeholder="简要描述您的提示词的用途和特点..."
                  className="input-primary w-full resize-none"
                />
                {errors.description && (
                  <p className="text-neon-red text-sm mt-1">{errors.description.message}</p>
                )}
              </motion.div>

              {/* 提示词内容 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center text-sm font-medium text-gray-300">
                    <SparklesIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    提示词内容 *
                  </label>
                  
                  {/* AI分析按钮组 */}
                  <div className="flex items-center gap-2">
                    <AIAnalyzeButton
                      content={watch('content') || ''}
                      onAnalysisComplete={(result) => {
                        if (result.suggestedTitle) setValue('name', result.suggestedTitle);
                        if (result.category) setValue('category', result.category);
                        if (result.description) setValue('description', result.description);
                        if (result.tags) setValue('tags', result.tags);
                        if (result.variables) setValue('input_variables', result.variables);
                        setAiAnalysisResult(result as AIAnalysisResult);
                        setShowAiAnalysis(true);
                      }}
                      variant="full"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    {...register('content', { required: '请输入提示词内容' })}
                    rows={8}
                    placeholder="在这里输入您的提示词内容。使用 {{变量名}} 来定义可替换的变量..."
                    className="input-primary w-full resize-none font-mono"
                    onChange={(e) => {
                      detectVariables(e);
                    }}
                  />
                  <div className="absolute top-3 right-3 text-xs text-gray-500">
                    使用 {`{{变量名}}`} 定义变量
                  </div>
                </div>
                {errors.content && (
                  <p className="text-neon-red text-sm mt-1">{errors.content.message}</p>
                )}
                
                {/* AI分析结果显示 */}
                <AnimatePresence>
                  {showAiAnalysis && aiAnalysisResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      className="mt-4"
                    >
                      <div className="relative">
                        <AIAnalysisResultDisplay
                          result={aiAnalysisResult}
                          onApplyResults={applyAIResults}
                        />
                        <button
                          onClick={() => setShowAiAnalysis(false)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                          title="关闭AI分析结果"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 变量管理 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <CodeBracketIcon className="h-5 w-5 text-neon-purple mr-2" />
                  输入变量
                </label>
                
                {/* 添加变量 */}
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    placeholder="输入变量名"
                    className="input-primary flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                  />
                  <motion.button
                    type="button"
                    onClick={addVariable}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* 变量列表 */}
                <AnimatePresence>
                  {variables.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2"
                    >
                      {variables.map((variable) => (
                        <motion.span
                          key={variable}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                        >
                          {variable}
                          <button
                            type="button"
                            onClick={() => removeVariable(variable)}
                            className="ml-2 hover:text-neon-red transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 标签管理 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <TagIcon className="h-5 w-5 text-neon-purple mr-2" />
                  标签
                </label>
                
                {/* 添加标签 */}
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="输入标签"
                    className="input-primary flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <motion.button
                    type="button"
                    onClick={addTag}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* 推荐标签 */}
                {!tagsLoading && suggestedTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">推荐标签：</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.filter(tag => !tags.includes(tag)).slice(0, 10).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const newTags = [...tags, tag];
                            setTags(newTags);
                            setValue('tags', newTags);
                          }}
                          className={`px-3 py-1 rounded-full text-sm border transition-all duration-300 bg-dark-bg-secondary/50 text-gray-400 border-gray-600 hover:border-neon-purple hover:text-neon-purple`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 已选标签 */}
                <AnimatePresence>
                  {tags.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2"
                    >
                      {tags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-neon-red transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 兼容模型 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <CpuChipIcon className="h-5 w-5 text-neon-cyan mr-2" />
                  兼容模型
                </label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MODEL_OPTIONS.map((model) => (
                    <motion.button
                      key={model}
                      type="button"
                      onClick={() => toggleModel(model)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-xl border transition-all duration-300 ${
                        models.includes(model)
                          ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 shadow-neon-sm'
                          : 'bg-dark-bg-secondary/50 text-gray-400 border-gray-600 hover:border-neon-cyan hover:text-neon-cyan'
                      }`}
                    >
                      {model}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* 可见性和权限设置 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.1 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <ShieldExclamationIcon className="h-5 w-5 text-neon-purple mr-2" />
                  协作设置
                </label>
                
                <div className="relative flex items-start p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={watch('allow_collaboration') || false}
                      onChange={(e) => setValue('allow_collaboration', e.target.checked)}
                      className="h-4 w-4 text-neon-cyan border-gray-600 rounded focus:ring-neon-cyan"
                      disabled={!checkFieldPermission('allow_collaboration', permissionCheck)}
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-300">
                      允许协作编辑
                    </div>
                    <div className="text-sm text-gray-400">
                      允许其他贡献者修改这个提示词的内容（编辑权限，仅在公开分享时有效）
                    </div>
                    {!checkFieldPermission('allow_collaboration', permissionCheck) && (
                      <div className="text-xs text-neon-orange mt-1">
                        您无权修改协作设置
                      </div>
                    )}
                  </div>
                </div>

                {/* 编辑权限级别 */}
                <div className="p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    编辑权限级别
                  </label>
                  <select
                    value={watch('edit_permission') || PERMISSION_LEVELS.OWNER_ONLY}
                    onChange={(e) => setValue('edit_permission', e.target.value as any)}
                    className="input-primary w-full"
                    disabled={!checkFieldPermission('edit_permission', permissionCheck)}
                  >
                    {Object.entries(PERMISSION_LEVEL_DESCRIPTIONS).map(([key, description]) => (
                      <option key={key} value={key}>
                        {description}
                      </option>
                    ))}
                  </select>
                  {!checkFieldPermission('edit_permission', permissionCheck) && (
                    <p className="mt-1 text-xs text-neon-orange">
                      您无权修改编辑权限设置
                    </p>
                  )}
                </div>
              </motion.div>

              {/* 提交按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="flex justify-end space-x-4 pt-8"
              >
                <Link href={`/prompts/${prompt.id}`}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                  >
                    取消
                  </motion.button>
                </Link>

                <motion.button
                  type="button"
                  onClick={handleReset}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  重置
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !permissionCheck?.canEdit}
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      <span>保存更改</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// 使用withAuth包装组件，强制用户登录
export default withAuth(EditPromptPage);

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  try {
    // 使用Next.js API路由获取提示词详情，这样可以复用前端的API逻辑
    const baseUrl = `http://localhost:${process.env.FRONTEND_PORT || 9011}`;
    
    // 从 Cookie 获取用户认证信息（如果有的话）
    let authHeaders: Record<string, string> = {};
    if (context.req.headers.cookie) {
      authHeaders['Cookie'] = context.req.headers.cookie;
    }
    
    // 尝试通过API获取提示词详情
    const apiResponse = await fetch(`${baseUrl}/api/prompts/${encodeURIComponent(id as string)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API请求失败: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    
    const result = await apiResponse.json();
    
    if (!result.success || !result.prompt) {
      throw new Error(result.error || '无法获取提示词数据');
    }
    
    const prompt = result.prompt;
    
    // 添加详细的调试输出
    console.log('getServerSideProps - API返回的原始数据:', JSON.stringify(prompt, null, 2));
    console.log('getServerSideProps - 数据字段检查:', {
      id: prompt.id,
      name: prompt.name,
      category: prompt.category,
      tags: prompt.tags,
      input_variables: prompt.input_variables,
      content: prompt.content || 'empty', // 显示完整内容
      messages: prompt.messages,
      contentLength: prompt.content ? prompt.content.length : 0
    });
    
    // 确保数据格式符合PromptDetails类型
    const promptDetails: PromptDetails = {
      id: prompt.id,
      name: prompt.name || id as string,
      description: prompt.description || '',
      content: prompt.content || prompt.messages?.[0]?.content || '', // 尝试从messages中提取content
      category: prompt.category || '通用',
      tags: Array.isArray(prompt.tags) ? prompt.tags : [],
      input_variables: Array.isArray(prompt.input_variables) ? prompt.input_variables : [],
      compatible_models: Array.isArray(prompt.compatible_models) ? prompt.compatible_models : [],
      template_format: prompt.template_format || 'text',
      version: typeof prompt.version === 'number' ? prompt.version : 1,
      author: prompt.author || prompt.user_id || '',
      is_public: Boolean(prompt.is_public),
      allow_collaboration: Boolean(prompt.allow_collaboration),
      edit_permission: prompt.edit_permission === 'owner' ? 'owner_only' as const : 
                      (prompt.edit_permission || 'owner_only' as const),
      user_id: prompt.user_id || '',
      created_at: prompt.created_at || new Date().toISOString(),
      updated_at: prompt.updated_at || new Date().toISOString(),
    };
    
    console.log('getServerSideProps - 处理后的数据:', JSON.stringify(promptDetails, null, 2));
    
    return {
      props: {
        prompt: promptDetails,
      },
    };
  } catch (error) {
    console.error('获取提示词详情失败:', error);
    
    return {
      notFound: true,
    };
  }
}; 