// 表单相关的统一类型定义
import { PromptType } from '@/components/prompts/edit/PromptTypeSelector';
import { SimplePermissionType } from '@/lib/permissions';

// 文件接口
export interface AssetFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

// 基础表单数据接口 - 简化并统一类型
export interface BaseFormData {
  name: string;
  description: string;
  content: string;
  category_type: PromptType;
  category: string;
  tags: string[];
  author: string;
  is_public: boolean;
  allow_collaboration: boolean;
  edit_permission: 'owner_only' | 'collaborators' | 'public';
  simple_permission: SimplePermissionType;
  collaborators: string[];
  compatible_models: string[];
  input_variables: string[];
  template_format: string;
  version: string | number;
  // 媒体相关字段
  preview_assets?: AssetFile[];
  preview_asset_url?: string;
  parameters?: Record<string, unknown>;
  // JSONB 内容相关字段
  content_text?: string;
  context_engineering_enabled?: boolean;
}

// 提示词表单数据接口
export interface PromptFormData extends BaseFormData {
  // 继承BaseFormData的所有属性
  additionalData?: Record<string, unknown>;
}

// 提示词编辑表单数据接口
export interface PromptEditFormData extends BaseFormData {
  id?: string;
  preview_assets: AssetFile[];
  image_parameters?: Record<string, unknown>;
  video_parameters?: Record<string, unknown>;
}

// 表单状态接口
export interface FormState {
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  saveSuccess: boolean;
  errors: Record<string, string>;
}

// 表单操作接口
export interface FormActions {
  onSubmit: (data: PromptFormData) => Promise<void>;
  onCancel?: () => void;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

// 内容类型处理工具
export const getContentValue = (content: string | unknown): string => {
  if (typeof content === 'string') {
    return content;
  }
  
  // 处理 JSONB 格式的内容
  if (content && typeof content === 'object') {
    if (content.text) {
      return content.text;
    }
    if (content.content) {
      return content.content;
    }
    if (content.prompt) {
      return content.prompt;
    }
    // 如果是其他格式，尝试序列化
    return JSON.stringify(content);
  }
  
  return '';
};

// 内容转换工具
export const normalizeFormData = (data: Record<string, unknown>): PromptFormData => {
  return {
    ...data,
    content: getContentValue(data.content),
    content_text: getContentValue(data.content_text || data.content),
    version: typeof data.version === 'string' ? data.version : String(data.version || '1.0'),
    tags: Array.isArray(data.tags) ? data.tags : [],
    collaborators: Array.isArray(data.collaborators) ? data.collaborators : [],
    compatible_models: Array.isArray(data.compatible_models) ? data.compatible_models : [],
    input_variables: Array.isArray(data.input_variables) ? data.input_variables : [],
    parameters: data.parameters || {},
  } as PromptFormData;
};