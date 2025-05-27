import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useForm, Controller } from 'react-hook-form';
import { updatePrompt, getCategories, getTags, getPromptDetails } from '@/lib/api';
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
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
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

// 预设模型选项
const MODEL_OPTIONS = ['GPT-4', 'GPT-3.5', 'Claude-2', 'Claude-Instant', 'Gemini-Pro', 'Llama-2', 'Mistral-7B'];

type PromptFormData = Omit<PromptDetails, 'created_at' | 'updated_at'> & {
  is_public?: boolean;
};

interface EditPromptPageProps {
  prompt: PromptDetails;
}



function EditPromptPage({ prompt }: EditPromptPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variables, setVariables] = useState<string[]>(prompt.input_variables || []);
  const [variableInput, setVariableInput] = useState('');
  const [tags, setTags] = useState<string[]>(prompt.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [models, setModels] = useState<string[]>(prompt.compatible_models || []);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [permissionCheck, setPermissionCheck] = useState<PermissionCheck | null>(null);

  // 权限检查
  useEffect(() => {
    if (user) {
      const permission = checkEditPermission(prompt, user);
      setPermissionCheck(permission);
      
      // 如果没有权限，3秒后重定向到详情页
      if (!permission.canEdit) {
        setTimeout(() => {
          router.push(`/prompts/${prompt.name}`);
        }, 3000);
      }
    }
  }, [user, prompt, router]);
  
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
  
  // 格式化当前版本号
  const currentVersionFormatted = typeof prompt.version === 'number' 
    ? formatVersionFromInt(prompt.version) 
    : prompt.version || '1.0';

  const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm<PromptFormData>({
    defaultValues: {
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      version: currentVersionFormatted,
      author: prompt.author || user?.display_name || user?.username || '',
      template_format: prompt.template_format || 'text',
      input_variables: prompt.input_variables || [],
      tags: prompt.tags || [],
      compatible_models: prompt.compatible_models || [],
      is_public: prompt.is_public || false,
      allow_collaboration: prompt.allow_collaboration || false,
      edit_permission: prompt.edit_permission || 'owner_only',
    }
  });

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
  const detectVariables = () => {
    if (!promptContent) return;
    
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const matches = promptContent.match(regex);
    
    if (matches) {
      const detectedVars = Array.from(new Set(matches.map(match => match.slice(2, -2))));
      
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
      
      await updatePrompt(prompt.name, data);
      
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // 可选：更新成功后跳转到详情页
      // router.push(`/prompts/${prompt.name}`);
    } catch (error) {
      console.error('更新提示词失败:', error);
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
        <div className="container-tight">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Link href={`/prompts/${prompt.name}`} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
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
                href={`/prompts/${prompt.name}`}
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
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href={`/prompts/${prompt.name}`} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回提示词详情
          </Link>
        </div>

        {/* 权限提示 */}
        {permissionCheck && permissionCheck.canEdit && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  编辑权限确认
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {permissionCheck.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 成功提示 */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  提示词已成功更新！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 未保存更改提示 */}
        {hasUnsavedChanges && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  您有未保存的更改
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  请记得保存您的更改，否则离开页面时将丢失。
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* 页面标题 */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">编辑提示词</h1>
            <p className="mt-2 text-gray-600">
              编辑 "{prompt.name}" 的详细信息。所有带 * 的字段为必填项。
            </p>
          </div>
          
          {/* 表单内容 */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 提示词名称 */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      提示词名称 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="input"
                      placeholder="例如：code_assistant"
                      {...register('name', { 
                        required: '提示词名称是必填的',
                        pattern: {
                          value: /^[a-zA-Z0-9_-]+$/,
                          message: '名称只能包含字母、数字、下划线和连字符'
                        }
                      })}
                      disabled // 通常编辑时不允许修改名称
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      提示词的唯一标识符，编辑时无法修改
                    </p>
                  </div>

                  {/* 版本 */}
                  <div>
                    <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
                      版本 *
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        id="version"
                        className="input flex-1"
                        placeholder="例如：1.0"
                        {...register('version', { 
                          required: '版本是必填的',
                          validate: (value) => {
                            if (!value) {
                              return '版本是必填的';
                            }
                            if (!validateVersionFormat(value)) {
                              return '版本号格式错误，应为 X.Y 格式（如：1.0, 2.5）';
                            }
                            if (!canIncrementVersion(currentVersionFormatted, value)) {
                              return `新版本号必须大于当前版本 ${currentVersionFormatted}`;
                            }
                            return true;
                          }
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const currentVersion = watch('version') || currentVersionFormatted;
                          const suggested = suggestNextVersion(currentVersion, 'minor');
                          setValue('version', suggested);
                        }}
                        className="btn-secondary text-sm px-3 py-1"
                        title="建议下一版本"
                      >
                        +0.1
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const suggested = suggestNextVersion(currentVersionFormatted, 'major');
                          setValue('version', suggested);
                        }}
                        className="btn-secondary text-sm px-3 py-1"
                        title="建议主版本"
                      >
                        +1.0
                      </button>
                    </div>
                    {errors.version && (
                      <p className="mt-1 text-sm text-red-600">{errors.version.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      当前版本：{currentVersionFormatted}，新版本必须递增且保留1位小数
                    </p>
                  </div>

                  {/* 作者 */}
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                      作者
                    </label>
                    <input
                      type="text"
                      id="author"
                      className="input"
                      placeholder="作者姓名"
                      {...register('author')}
                      disabled={!checkFieldPermission('author', permissionCheck)}
                    />
                    {!checkFieldPermission('author', permissionCheck) && (
                      <p className="mt-1 text-xs text-gray-500">
                        只有创建者和管理员可以修改作者信息
                      </p>
                    )}
                  </div>

                  {/* 分类 */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      分类 *
                    </label>
                    <select
                      id="category"
                      className="input"
                      {...register('category', { required: '分类是必填的' })}
                      disabled={categoriesLoading}
                    >
                      <option value="">选择分类</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                {/* 描述 */}
                <div className="mt-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    描述 *
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="input"
                    placeholder="简要描述这个提示词的用途和特点"
                    {...register('description', { required: '描述是必填的' })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* 提示词内容 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">提示词内容</h3>
                
                {/* 模板格式 */}
                <div className="mb-4">
                  <label htmlFor="template_format" className="block text-sm font-medium text-gray-700 mb-1">
                    模板格式
                  </label>
                  <select
                    id="template_format"
                    className="input max-w-xs"
                    {...register('template_format')}
                  >
                    <option value="text">纯文本</option>
                    <option value="json">JSON</option>
                    <option value="yaml">YAML</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>

                {/* 提示词内容 */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    提示词内容 *
                  </label>
                  <textarea
                    id="content"
                    rows={12}
                    className="input font-mono text-sm"
                    placeholder="输入您的提示词内容。使用 {{变量名}} 来定义变量。"
                    {...register('content', { required: '提示词内容是必填的' })}
                    onBlur={detectVariables}
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                  )}
                  <div className="mt-2 flex space-x-4">
                    <button
                      type="button"
                      onClick={detectVariables}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      自动检测变量
                    </button>
                  </div>
                </div>
              </div>

              {/* 输入变量 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">输入变量</h3>
                <p className="text-sm text-gray-600 mb-4">
                  定义提示词中使用的变量。变量在提示词中使用 {`{{变量名}}`} 的格式。
                </p>
                
                {/* 添加变量 */}
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    placeholder="变量名"
                    className="input flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                  />
                  <button
                    type="button"
                    onClick={addVariable}
                    className="btn-secondary"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-1" />
                    添加
                  </button>
                </div>

                {/* 变量列表 */}
                {variables.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {variables.map(variable => (
                      <span
                        key={variable}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {variable}
                        <button
                          type="button"
                          onClick={() => removeVariable(variable)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 标签 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">标签</h3>
                <p className="text-sm text-gray-600 mb-4">
                  添加标签以便更好地分类和搜索提示词。
                </p>
                
                {/* 添加标签 */}
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="标签名"
                    className="input flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn-secondary"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-1" />
                    添加
                  </button>
                </div>

                {/* 建议标签 */}
                {!tagsLoading && suggestedTags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">建议标签：</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.filter(tag => !tags.includes(tag)).slice(0, 10).map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const newTags = [...tags, tag];
                            setTags(newTags);
                            setValue('tags', newTags);
                          }}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                        >
                          {tag}
                          <PlusCircleIcon className="ml-1 h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 已选标签 */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 兼容模型 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">兼容模型</h3>
                <p className="text-sm text-gray-600 mb-4">
                  选择与此提示词兼容的AI模型。
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MODEL_OPTIONS.map(model => (
                    <label
                      key={model}
                      className="relative flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={models.includes(model)}
                        onChange={() => toggleModel(model)}
                        className="sr-only"
                      />
                      <div className={`flex-1 ${models.includes(model) ? 'text-primary-700' : 'text-gray-700'}`}>
                        <div className="text-sm font-medium">{model}</div>
                      </div>
                      {models.includes(model) && (
                        <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* 可见性和权限设置 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">可见性和权限设置</h3>
                
                <div className="space-y-4">
                  {/* 公开设置 */}
                  <Controller
                    name="is_public"
                    control={control}
                    render={({ field }) => (
                      <label className="relative flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            disabled={!checkFieldPermission('is_public', permissionCheck)}
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            公开提示词
                          </div>
                          <div className="text-sm text-gray-500">
                            允许其他用户查看和使用这个提示词
                          </div>
                          {!checkFieldPermission('is_public', permissionCheck) && (
                            <div className="text-xs text-orange-600 mt-1">
                              您无权修改提示词的可见性设置
                            </div>
                          )}
                        </div>
                        {!field.value && (
                          <LockClosedIcon className="ml-auto h-5 w-5 text-gray-400" />
                        )}
                      </label>
                    )}
                  />

                  {/* 协作设置 */}
                  <div className="relative flex items-start p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={watch('allow_collaboration') || false}
                        onChange={(e) => setValue('allow_collaboration', e.target.checked)}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        disabled={!checkFieldPermission('allow_collaboration', permissionCheck)}
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        允许协作编辑
                      </div>
                      <div className="text-sm text-gray-500">
                        允许其他贡献者编辑这个提示词（仅在公开时有效）
                      </div>
                      {!checkFieldPermission('allow_collaboration', permissionCheck) && (
                        <div className="text-xs text-orange-600 mt-1">
                          您无权修改协作设置
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 编辑权限级别 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      编辑权限级别
                    </label>
                    <select
                      value={watch('edit_permission') || PERMISSION_LEVELS.OWNER_ONLY}
                      onChange={(e) => setValue('edit_permission', e.target.value as any)}
                      className="input"
                      disabled={!checkFieldPermission('edit_permission', permissionCheck)}
                    >
                      {Object.entries(PERMISSION_LEVEL_DESCRIPTIONS).map(([key, description]) => (
                        <option key={key} value={key}>
                          {description}
                        </option>
                      ))}
                    </select>
                    {!checkFieldPermission('edit_permission', permissionCheck) && (
                      <p className="mt-1 text-xs text-orange-600">
                        您无权修改编辑权限设置
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 表单操作按钮 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    重置
                  </button>
                  <Link
                    href={`/prompts/${prompt.name}`}
                    className="btn-secondary inline-flex items-center"
                  >
                    取消
                  </Link>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !permissionCheck?.canEdit}
                  className="btn-primary inline-flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      保存更改
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
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
export default withAuth(EditPromptPage);

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { name } = context.params!;
  
  try {
    const prompt = await getPromptDetails(name as string);
    
    return {
      props: {
        prompt,
      },
    };
  } catch (error) {
    console.error('获取提示词详情失败:', error);
    
    return {
      notFound: true,
    };
  }
}; 