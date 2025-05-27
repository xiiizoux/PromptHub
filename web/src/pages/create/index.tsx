import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import { createPrompt, getCategories, getTags } from '@/lib/api';
import { PromptDetails } from '@/types';
import Link from 'next/link';
import { ChevronLeftIcon, XMarkIcon, PlusCircleIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuth, withAuth } from '@/contexts/AuthContext';

// 预设模型选项
const MODEL_OPTIONS = ['GPT-4', 'GPT-3.5', 'Claude-2', 'Claude-Instant', 'Gemini-Pro', 'Llama-2', 'Mistral-7B'];

type PromptFormData = Omit<PromptDetails, 'created_at' | 'updated_at'>;

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
        // 如果获取失败，设置一些默认分类
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
        // 如果获取失败，设置一些默认标签
        setSuggestedTags(['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色']);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, []);
  
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<PromptFormData>({
    defaultValues: {
      name: '',
      description: '',
      content: '',
      category: '',
      version: '1.0',
      author: '',
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
    
    // 查找格式为 {{variable}} 的变量
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const matches = promptContent.match(regex);
    
    if (matches) {
      // 提取变量名并去重
      const detectedVars = Array.from(new Set(matches.map(match => match.slice(2, -2))));
      
      if (detectedVars.length > 0 && !variables.includes(detectedVars[0])) {
        // 添加新检测到的变量
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
    setIsSubmitting(true);
    
    try {
      // 确保所有数组字段都有值
      data.input_variables = variables;
      data.tags = tags;
      data.compatible_models = models;
      
      // 调用API创建提示词
      const newPrompt = await createPrompt(data);
      
      // 创建成功，跳转到详情页
      router.push(`/prompts/${newPrompt.name}`);
    } catch (error) {
      console.error('创建提示词失败:', error);
      setIsSubmitting(false);
      // 这里可以添加错误处理，如显示错误消息
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/prompts" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回提示词列表
          </Link>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* 页面标题 */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">创建新提示词</h1>
            <p className="mt-2 text-gray-600">
              填写以下表单创建新的提示词。所有带 * 的字段为必填项。
            </p>
          </div>
          
          {/* 表单内容 */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    提示词名称 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    className={`mt-1 input ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name', { required: '提示词名称是必填项' })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    名称应简短、具描述性且唯一，例如 "code-reviewer" 或 "creative-story-generator"
                  </p>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    类别
                  </label>
                  <select
                    id="category"
                    className="mt-1 input"
                    {...register('category')}
                  >
                    <option value="">选择类别</option>
                    {categoriesLoading ? (
                      <option disabled>Loading...</option>
                    ) : (
                      categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    描述 *
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className={`mt-1 input ${errors.description ? 'border-red-500' : ''}`}
                    {...register('description', { required: '描述是必填项' })}
                  ></textarea>
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                    作者
                  </label>
                  <input
                    type="text"
                    id="author"
                    className="mt-1 input"
                    {...register('author')}
                  />
                </div>
                
                <div>
                  <label htmlFor="version" className="block text-sm font-medium text-gray-700">
                    版本
                  </label>
                  <input
                    type="text"
                    id="version"
                    className="mt-1 input"
                    {...register('version')}
                  />
                  <p className="mt-1 text-xs text-gray-500">默认为 "1.0"</p>
                </div>
              </div>
              
              {/* 提示词内容 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  提示词内容 *
                </label>
                <textarea
                  id="content"
                  rows={10}
                  className={`mt-1 input font-mono ${errors.content ? 'border-red-500' : ''}`}
                  {...register('content', { required: '提示词内容是必填项' })}
                  onChange={(e) => {
                    register('content').onChange(e);
                    // 在输入后等待一段时间再检测变量，避免频繁检测
                    setTimeout(detectVariables, 500);
                  }}
                ></textarea>
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  使用 &#123;&#123;variable&#125;&#125; 格式添加变量，例如 "你好，&#123;&#123;name&#125;&#125;！"
                </p>
              </div>
              
              {/* 输入变量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入变量
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    className="input rounded-r-none"
                    placeholder="添加变量名称"
                  />
                  <button
                    type="button"
                    onClick={addVariable}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    添加
                  </button>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {variables.map(variable => (
                    <div
                      key={variable}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                    >
                      {variable}
                      <button
                        type="button"
                        onClick={() => removeVariable(variable)}
                        className="ml-1 text-primary-600 hover:text-primary-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {variables.length === 0 && (
                    <p className="text-sm text-gray-500">尚未添加变量</p>
                  )}
                </div>
              </div>
              
              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="input rounded-r-none"
                    placeholder="添加标签"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    添加
                  </button>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-sm text-gray-500">尚未添加标签</p>
                  )}
                </div>

                {/* 建议标签 */}
                {suggestedTags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">建议标签：</p>
                    <div className="flex flex-wrap gap-2">
                      {tagsLoading ? (
                        <p className="text-sm text-gray-500">加载中...</p>
                      ) : (
                        suggestedTags
                          .filter(tag => !tags.includes(tag))
                          .slice(0, 15) // 最多显示15个建议
                          .map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setTagInput("");
                                const newTags = [...tags, tag];
                                setTags(newTags);
                                setValue('tags', newTags);
                              }}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                              + {tag}
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 兼容模型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  兼容模型
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {MODEL_OPTIONS.map(model => (
                    <div key={model} className="flex items-center">
                      <input
                        id={`model-${model}`}
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={models.includes(model)}
                        onChange={() => toggleModel(model)}
                      />
                      <label
                        htmlFor={`model-${model}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {model}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 提交按钮 */}
              <div className="flex justify-end">
                <Link
                  href="/"
                  className="btn-outline mr-3"
                >
                  取消
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      正在保存...
                    </>
                  ) : '保存提示词'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 使用withAuth包装组件，强制用户登录
export default withAuth(CreatePromptPage);

