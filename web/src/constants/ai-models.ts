/**
 * AI模型分类和标签系统
 * 用于PromptHub的兼容模型选择
 */

// 模型类型枚举
export enum ModelType {
  TEXT = 'text',           // 文本生成
  IMAGE = 'image',         // 图像生成  
  AUDIO = 'audio',         // 音频生成
  VIDEO = 'video',         // 视频生成
  MULTIMODAL = 'multimodal', // 多模态
  CODE = 'code',           // 代码生成
  EMBEDDING = 'embedding', // 向量嵌入
}

// 模型能力枚举
export enum ModelCapability {
  CHAT = 'chat',               // 对话
  COMPLETION = 'completion',   // 文本补全
  GENERATION = 'generation',   // 内容生成
  ANALYSIS = 'analysis',       // 分析理解
  TRANSLATION = 'translation', // 翻译
  REASONING = 'reasoning',     // 推理
  CREATIVE = 'creative',       // 创意创作
  CODING = 'coding',          // 编程
  VISION = 'vision',          // 视觉理解
  AUDIO_TO_TEXT = 'audio_to_text', // 语音转文字
  TEXT_TO_AUDIO = 'text_to_audio', // 文字转语音
}

// 模型规模枚举
export enum ModelScale {
  SMALL = 'small',     // 小型模型 (<7B参数)
  MEDIUM = 'medium',   // 中型模型 (7B-13B参数)
  LARGE = 'large',     // 大型模型 (13B-70B参数)
  XLARGE = 'xlarge',   // 超大型模型 (>70B参数)
}

// 部署方式枚举
export enum DeploymentType {
  API = 'api',           // API调用
  OPEN_SOURCE = 'open_source', // 开源模型
  LOCAL = 'local',       // 本地部署
  CLOUD = 'cloud',       // 云端部署
}

// 模型标签接口
export interface ModelTag {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  capabilities: ModelCapability[];
  scale?: ModelScale;
  deployment?: DeploymentType;
  color: string; // 用于UI显示的颜色
}

// 预定义模型标签
export const MODEL_TAGS: ModelTag[] = [
  // 文本模型类型
  {
    id: 'llm-large',
    name: '大型语言模型',
    description: '70B+参数的大型语言模型，如GPT-4、Claude等',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.CHAT, ModelCapability.REASONING, ModelCapability.CREATIVE],
    scale: ModelScale.XLARGE,
    deployment: DeploymentType.API,
    color: 'text-blue-400',
  },
  {
    id: 'llm-medium',
    name: '中型语言模型',
    description: '7B-70B参数的中型语言模型',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.CHAT, ModelCapability.COMPLETION, ModelCapability.CREATIVE],
    scale: ModelScale.LARGE,
    deployment: DeploymentType.OPEN_SOURCE,
    color: 'text-green-400',
  },
  {
    id: 'llm-small',
    name: '小型语言模型',
    description: '7B以下参数的轻量级模型，适合本地部署',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.CHAT, ModelCapability.COMPLETION],
    scale: ModelScale.SMALL,
    deployment: DeploymentType.LOCAL,
    color: 'text-yellow-400',
  },
  
  // 代码模型
  {
    id: 'code-specialized',
    name: '代码专用模型',
    description: '专门针对编程任务优化的模型',
    type: ModelType.CODE,
    capabilities: [ModelCapability.CODING, ModelCapability.ANALYSIS],
    color: 'text-cyan-400',
  },
  
  // 图像模型
  {
    id: 'image-generation',
    name: '图像生成模型',
    description: '文本转图像生成模型',
    type: ModelType.IMAGE,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-purple-400',
  },
  {
    id: 'image-analysis',
    name: '图像理解模型',
    description: '图像分析和理解模型',
    type: ModelType.IMAGE,
    capabilities: [ModelCapability.VISION, ModelCapability.ANALYSIS],
    color: 'text-pink-400',
  },
  
  // 多模态模型
  {
    id: 'multimodal-vision',
    name: '视觉多模态模型',
    description: '同时处理文本和图像的多模态模型',
    type: ModelType.MULTIMODAL,
    capabilities: [ModelCapability.VISION, ModelCapability.CHAT, ModelCapability.ANALYSIS],
    color: 'text-indigo-400',
  },
  
  // 音频模型
  {
    id: 'audio-stt',
    name: '语音转文字模型',
    description: '语音识别和转录模型',
    type: ModelType.AUDIO,
    capabilities: [ModelCapability.AUDIO_TO_TEXT],
    color: 'text-orange-400',
  },
  {
    id: 'audio-tts',
    name: '文字转语音模型',
    description: '文本转语音合成模型',
    type: ModelType.AUDIO,
    capabilities: [ModelCapability.TEXT_TO_AUDIO],
    color: 'text-red-400',
  },
  {
    id: 'audio-generation',
    name: '音频生成模型',
    description: '音乐和音效生成模型',
    type: ModelType.AUDIO,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-amber-400',
  },
  
  // 视频模型
  {
    id: 'video-generation',
    name: '视频生成模型',
    description: '文本转视频和视频编辑模型',
    type: ModelType.VIDEO,
    capabilities: [ModelCapability.GENERATION, ModelCapability.CREATIVE],
    color: 'text-emerald-400',
  },
  
  // 特殊能力
  {
    id: 'translation-specialized',
    name: '翻译专用模型',
    description: '专门针对翻译任务优化的模型',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.TRANSLATION],
    color: 'text-teal-400',
  },
  {
    id: 'reasoning-specialized',
    name: '推理专用模型',
    description: '专门针对逻辑推理和数学计算的模型',
    type: ModelType.TEXT,
    capabilities: [ModelCapability.REASONING, ModelCapability.ANALYSIS],
    color: 'text-violet-400',
  },
];

// 根据类型获取模型标签
export const getModelTagsByType = (type: ModelType): ModelTag[] => {
  return MODEL_TAGS.filter(tag => tag.type === type);
};

// 根据能力获取模型标签
export const getModelTagsByCapability = (capability: ModelCapability): ModelTag[] => {
  return MODEL_TAGS.filter(tag => tag.capabilities.includes(capability));
};

// 获取所有模型类型的选项
export const getModelTypeOptions = () => {
  return Object.values(ModelType).map(type => ({
    value: type,
    label: getModelTypeLabel(type),
    description: getModelTypeDescription(type),
  }));
};

// 获取模型类型的中文标签
export const getModelTypeLabel = (type: ModelType): string => {
  const labels = {
    [ModelType.TEXT]: '文本模型',
    [ModelType.IMAGE]: '图像模型',
    [ModelType.AUDIO]: '音频模型',
    [ModelType.VIDEO]: '视频模型',
    [ModelType.MULTIMODAL]: '多模态模型',
    [ModelType.CODE]: '代码模型',
    [ModelType.EMBEDDING]: '嵌入模型',
  };
  return labels[type] || type;
};

// 获取模型类型的描述
export const getModelTypeDescription = (type: ModelType): string => {
  const descriptions = {
    [ModelType.TEXT]: '处理文本生成、对话、分析等任务',
    [ModelType.IMAGE]: '处理图像生成、编辑、理解等任务',
    [ModelType.AUDIO]: '处理音频生成、识别、转换等任务',
    [ModelType.VIDEO]: '处理视频生成、编辑、理解等任务',
    [ModelType.MULTIMODAL]: '同时处理多种媒体类型的任务',
    [ModelType.CODE]: '专门处理编程和代码相关任务',
    [ModelType.EMBEDDING]: '生成向量嵌入用于语义搜索',
  };
  return descriptions[type] || '';
}; 