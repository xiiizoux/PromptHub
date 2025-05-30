import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { createPrompt, getCategories, getTags } from '@/lib/api';
import { PromptDetails } from '@/types';
import Link from 'next/link';
import { 
  ChevronLeftIcon, 
  XMarkIcon, 
  PlusCircleIcon, 
  ArrowRightIcon,
  SparklesIcon,
  CodeBracketIcon,
  TagIcon,
  DocumentTextIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { useAuth, withAuth } from '@/contexts/AuthContext';

// 预设模型选项
const MODEL_OPTIONS = ['GPT-4', 'GPT-3.5', 'Claude-2', 'Claude-Instant', 'Gemini-Pro', 'Llama-2', 'Mistral-7B'];

// 扩展类型，添加messages字段和其他数据库中的字段
type PromptFormData = Omit<PromptDetails, 'created_at' | 'updated_at'> & {
  messages?: Array<{role: string; content: string}>; // 添加messages字段
  allow_collaboration?: boolean;  // 添加allow_collaboration字段
  edit_permission?: 'owner_only' | 'collaborators' | 'public'; // 添加edit_permission字段
};

function CreatePromptPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);
  const [variableInput, setVariableInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  
  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('获取分类失败:', err);
        setCategories(['通用', '创意写作', '代码辅助', '数据分析', '营销', '学术研究', '教育']);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);
  
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
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PromptFormData>({
    defaultValues: {
      name: '',
      description: '',
      content: '',  // 会被转换为messages JSONB格式
      category: '通用', // 与数据库默认值保持一致
      version: 1,  // 改为整数类型，与数据库保持一致
      is_public: false, // 默认非公开，与数据库默认值保持一致
      allow_collaboration: false, // 默认不允许协作编辑
      edit_permission: 'owner_only', // 默认仅所有者可编辑
      template_format: 'text',
      input_variables: [],
      tags: [],
      compatible_models: [],
    }
  });

  // 监听提示词内容以提取变量
  const promptContent = watch('content');

  // 自动检测变量
  const detectVariables = () => {
    if (!promptContent) return;
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const matches = promptContent.match(regex);
    
    if (matches) {
      const detectedVars = Array.from(new Set(matches.map(match => match.slice(2, -2))));
      if (detectedVars.length > 0 && !variables.includes(detectedVars[0])) {
        setVariables(prev => Array.from(new Set([...prev, ...detectedVars])));
        setValue('input_variables', Array.from(new Set([...variables, ...detectedVars])));
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

  // 表单提交
  const onSubmit = async (data: PromptFormData) => {
    // 设置超时处理，避免无限期等待
    let submissionTimeout: NodeJS.Timeout | null = null;
    const timeout = 15000; // 15秒超时
    
    setIsSubmitting(true);
    
    // 设置超时处理
    submissionTimeout = setTimeout(() => {
      console.error('创建提示词操作超时');
      alert('创建操作超时，请检查网络连接或稍后重试');
      setIsSubmitting(false);
    }, timeout);
    
    try {
      // 添加必要的字段
      data.input_variables = variables;
      data.tags = tags;
      data.compatible_models = models;
      
      // 确保设置用户ID
      if (!user?.id) {
        alert('用户未登录或ID不可用，请刷新页面后重试');
        if (submissionTimeout) clearTimeout(submissionTimeout);
        setIsSubmitting(false);
        return;
      }
      
      // 添加用户ID
      data.user_id = user.id;
      
      // 确保版本是整数
      data.version = 1; // 版本必须是整数类型
      
      // 将content字段转换为messages格式
      if (data.content && !data.messages) {
        data.messages = [
          {
            role: 'system',
            content: data.content
          }
        ];
        // 删除原始content字段，因为数据库中不存在该字段
        delete (data as any).content;
      }
      
      console.log('正在提交提示词数据:', { 
        name: data.name,
        description: data.description, 
        category: data.category,
        user: user.id,
        tags: tags.length,
        is_public: data.is_public,
        version: data.version
      });
      
      let success = false;
      
      // 尝试使用Supabase适配器直接创建
      try {
        const { default: supabaseAdapter } = await import('@/lib/supabase-adapter');
        const newPrompt = await supabaseAdapter.createPrompt(data as any);
        console.log('提示词创建成功:', newPrompt);
        
        // 清除超时处理
        if (submissionTimeout) clearTimeout(submissionTimeout);
        success = true;
        
        // 导航到新提示词页面
        router.push(`/prompts/${newPrompt.name}`);
        return;
      } catch (adapterError) {
        console.error('使用适配器创建提示词失败，尝试API方式:', adapterError);
      }
      
      // 如果适配器方式失败，回退到原来的API调用
      if (!success) {
        const newPrompt = await createPrompt(data as any);
        console.log('提示词创建成功:', newPrompt);
        router.push(`/prompts/${newPrompt.name}`);
      }
    } catch (error: any) {
      console.error('创建提示词失败:', error);
      alert(`创建提示词失败: ${error.message || '请检查您的认证状态或网络连接'}`);
    } finally {
      // 在所有情况下都确保清除超时并重置状态
      if (submissionTimeout) clearTimeout(submissionTimeout);
      setIsSubmitting(false);
    }
  };

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
              href="/prompts" 
              className="inline-flex items-center text-neon-cyan hover:text-neon-purple transition-colors duration-300 group"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              返回提示词列表
            </Link>
          </motion.div>

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
              创建新提示词
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              释放AI的无限潜能，打造专属的智能提示词
            </motion.p>
          </motion.div>
          
          {/* 表单容器 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="glass rounded-3xl border border-neon-cyan/20 shadow-2xl p-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                    {...register('name', { required: '请输入提示词名称' })}
                    type="text"
                    placeholder="为您的提示词起个响亮的名字"
                    className="input-primary w-full"
                  />
                  {errors.name && (
                    <p className="text-neon-red text-sm mt-1">{errors.name.message}</p>
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
                  />
                </div>
              </motion.div>

              {/* 分类和版本 */}
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
                    disabled={categoriesLoading}
                  >
                    <option value="">选择分类</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-neon-red text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <CodeBracketIcon className="h-5 w-5 text-neon-purple mr-2" />
                    版本
                  </label>
                  <input
                    {...register('version')}
                    type="text"
                    defaultValue="1.0"
                    className="input-primary w-full"
                  />
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
                <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                  <SparklesIcon className="h-5 w-5 text-neon-cyan mr-2" />
                  提示词内容 *
                </label>
                <div className="relative">
                  <textarea
                    {...register('content', { required: '请输入提示词内容' })}
                    rows={8}
                    placeholder="在这里输入您的提示词内容。使用 {{变量名}} 来定义可替换的变量..."
                    className="input-primary w-full resize-none font-mono"
                    onChange={detectVariables}
                  />
                  <div className="absolute top-3 right-3 text-xs text-gray-500">
                    使用 {`{{变量名}}`} 定义变量
                  </div>
                </div>
                {errors.content && (
                  <p className="text-neon-red text-sm mt-1">{errors.content.message}</p>
                )}
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
                      {suggestedTags.slice(0, 10).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => !tags.includes(tag) && (setTags([...tags, tag]), setValue('tags', [...tags, tag]))}
                          disabled={tags.includes(tag)}
                          className={`px-3 py-1 rounded-full text-sm border transition-all duration-300 ${
                            tags.includes(tag)
                              ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30 opacity-50'
                              : 'bg-dark-bg-secondary/50 text-gray-400 border-gray-600 hover:border-neon-purple hover:text-neon-purple'
                          }`}
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

              {/* 提交按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="flex justify-end space-x-4 pt-8"
              >
                <Link href="/prompts">
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
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>创建中...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      <span>创建提示词</span>
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

export default withAuth(CreatePromptPage); 